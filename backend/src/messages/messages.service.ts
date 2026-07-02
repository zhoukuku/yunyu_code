import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Message } from '../entities/message.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messagesRepository: Repository<Message>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async sendMessage(senderId: number, receiverId: number, content: string) {
    if (!senderId || !receiverId) {
      throw new BadRequestException('无效的用户信息');
    }

    if (!content || !content.trim()) {
      throw new BadRequestException('消息内容不能为空');
    }

    if (senderId === receiverId) {
      throw new BadRequestException('不能给自己发送消息');
    }

    const receiverUser = await this.usersRepository.findOne({ where: { id: receiverId } });
    if (!receiverUser) {
      throw new BadRequestException('用户不存在');
    }

    const message = this.messagesRepository.create({
      senderId,
      receiverId,
      content,
    });
    return this.messagesRepository.save(message);
  }

  async getConversation(userId1: number, userId2: number, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [messages, total] = await this.messagesRepository
      .createQueryBuilder('message')
      .leftJoin('message.sender', 'sender')
      .leftJoin('message.receiver', 'receiver')
      .select([
        'message.id',
        'message.senderId',
        'message.receiverId',
        'message.content',
        'message.isRead',
        'message.createdAt',
      ])
      .addSelect('sender.id', 'sender_id')
      .addSelect('sender.username', 'sender_username')
      .addSelect('sender.name', 'sender_name')
      .addSelect('sender.nickname', 'sender_nickname')
      .addSelect('sender.avatar', 'sender_avatar')
      .addSelect('receiver.id', 'receiver_id')
      .addSelect('receiver.username', 'receiver_username')
      .addSelect('receiver.name', 'receiver_name')
      .addSelect('receiver.nickname', 'receiver_nickname')
      .addSelect('receiver.avatar', 'receiver_avatar')
      .where('(message.senderId = :userId1 AND message.receiverId = :userId2) OR (message.senderId = :userId2 AND message.receiverId = :userId1)', { userId1, userId2 })
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    // Mark messages as read where userId1 is the receiver
    await this.messagesRepository.update(
      { receiverId: userId1, senderId: userId2, isRead: 0 },
      { isRead: 1 }
    );

    return {
      messages: messages.reverse(),
      total,
      page,
      limit,
    };
  }

  async getConversationsList(userId: number) {
    // 使用子查询获取每个会话的最新消息和未读计数（避免 N+1 查询）
    const conversations = await this.messagesRepository
      .createQueryBuilder('m')
      .select('CASE WHEN m.senderId = :userId THEN m.receiverId ELSE m.senderId END', 'partnerId')
      .addSelect('MAX(m.createdAt)', 'lastMessageTime')
      .addSelect('SUM(CASE WHEN m.receiverId = :userId AND m.isRead = 0 THEN 1 ELSE 0 END)', 'unreadCount')
      .where('m.senderId = :userId OR m.receiverId = :userId', { userId })
      .groupBy('partnerId')
      .orderBy('lastMessageTime', 'DESC')
      .getRawMany();

    if (conversations.length === 0) {
      return [];
    }

    // 批量获取对方用户信息和最后一条消息（避免 N+1 查询）
    const partnerIds = conversations.map(c => c.partnerId);
    if (partnerIds.length === 0) return [];
    const partners = await this.usersRepository.findBy({ id: In(partnerIds) });
    const partnerMap = new Map(partners.map(p => [p.id, p]));

    // 使用子查询获取每个会话的最新消息内容
    const latestMessages = await this.messagesRepository
      .createQueryBuilder('m')
      .where('(m.senderId = :userId AND m.receiverId IN (:...partnerIds)) OR (m.receiverId = :userId AND m.senderId IN (:...partnerIds))', {
        userId,
        partnerIds,
      })
      .andWhere(qb => {
        const subQuery = qb.subQuery()
          .select('MAX(m2.createdAt)')
          .from('messages', 'm2')
          .where('(m2.senderId = m.senderId AND m2.receiverId = m.receiverId) OR (m2.senderId = m.receiverId AND m2.receiverId = m.senderId)')
          .getQuery();
        return `m.createdAt = ${subQuery}`;
      })
      .getMany();

    const latestMsgMap = new Map<number, any>();
    for (const msg of latestMessages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!latestMsgMap.has(partnerId)) {
        latestMsgMap.set(partnerId, msg);
      }
    }

    const result = conversations.map(conv => {
      const partnerId = conv.partnerId;
      const partner = partnerMap.get(partnerId);
      const lastMsg = latestMsgMap.get(partnerId);

      return {
        partnerId,
        partnerUsername: partner?.username || '未知用户',
        partnerName: partner?.name || '',
        partnerAvatar: partner?.avatar || '',
        partnerNickname: partner?.nickname || '',
        lastMessage: lastMsg?.content || '',
        lastMessageTime: lastMsg?.createdAt || conv.lastMessageTime,
        unreadCount: parseInt(conv.unreadCount, 10) || 0,
      };
    });

    return result.sort(
      (a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
    );
  }

  async getUnreadCount(userId: number) {
    return this.messagesRepository.count({
      where: { receiverId: userId, isRead: 0 },
    });
  }

  async markAsRead(userId: number, messageId: number) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId, receiverId: userId },
    });
    if (!message) {
      throw new BadRequestException('消息不存在');
    }
    message.isRead = 1;
    return this.messagesRepository.save(message);
  }

  async markConversationAsRead(userId: number, partnerId: number) {
    await this.messagesRepository.update(
      { receiverId: userId, senderId: partnerId, isRead: 0 },
      { isRead: 1 }
    );
    return { message: '标记已读成功' };
  }

  async deleteMessage(userId: number, messageId: number) {
    const message = await this.messagesRepository.findOne({
      where: { id: messageId, senderId: userId },
    });
    if (!message) {
      throw new BadRequestException('消息不存在或无权删除');
    }
    await this.messagesRepository.remove(message);
    return { message: '删除成功' };
  }
}