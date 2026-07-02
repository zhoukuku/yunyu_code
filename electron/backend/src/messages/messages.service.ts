import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const [messages, total] = await this.messagesRepository.findAndCount({
      where: [
        { senderId: userId1, receiverId: userId2 },
        { senderId: userId2, receiverId: userId1 },
      ],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

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
    // Get all messages involving this user, ordered by most recent
    const messages = await this.messagesRepository.find({
      where: [{ senderId: userId }, { receiverId: userId }],
      relations: ['sender', 'receiver'],
      order: { createdAt: 'DESC' },
    });

    // Group by conversation partner
    const conversationsMap = new Map<number, any>();

    for (const msg of messages) {
      const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
      if (!conversationsMap.has(partnerId)) {
        const partner = msg.senderId === userId ? msg.receiver : msg.sender;
        conversationsMap.set(partnerId, {
          partnerId,
          partnerUsername: partner.username,
          partnerName: partner.name,
          partnerAvatar: partner.avatar,
          partnerNickname: partner.nickname,
          lastMessage: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: 0,
        });
      }
      // Count unread messages
      if (msg.receiverId === userId && msg.isRead === 0) {
        const conv = conversationsMap.get(partnerId);
        conv.unreadCount++;
      }
    }

    // Get unread counts for each conversation
    for (const [partnerId, conv] of conversationsMap) {
      const unreadCount = await this.messagesRepository.count({
        where: { receiverId: userId, senderId: partnerId, isRead: 0 },
      });
      conv.unreadCount = unreadCount;
    }

    return Array.from(conversationsMap.values()).sort(
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