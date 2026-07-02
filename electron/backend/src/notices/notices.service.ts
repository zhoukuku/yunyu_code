import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from '../entities/course.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
  ) {}

  async findAll(userId?: number, page: number = 1, pageSize: number = 20) {
    const where = userId ? { userId } : {};
    const [records, total] = await this.noticeRepository.findAndCount({
      where,
      order: { sendTime: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      records,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    return this.noticeRepository.findOne({ where: { id } });
  }

  async createNotice(data: Partial<Notice>) {
    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestException('通知标题不能为空');
    }
    const notice = this.noticeRepository.create({
      ...data,
      noticeId: data.noticeId || `notice_${Date.now()}`,
    });
    return this.noticeRepository.save(notice);
  }

  async updateNotice(id: number, data: Partial<Notice>) {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }

    const { id: _id, createdAt: _createdAt, ...allowedData } = data as Record<string, unknown>;
    Object.assign(notice, allowedData);

    return this.noticeRepository.save(notice);
  }

  async markAsRead(id: number, userId: number) {
    const notice = await this.noticeRepository.findOne({ where: { id, userId } });
    if (!notice) {
      throw new NotFoundException('通知不存在或无权操作');
    }
    await this.noticeRepository.update(id, { isRead: 1 });
    return this.findOne(id);
  }

  async markAllAsRead(userId: number) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const result = await this.noticeRepository
      .createQueryBuilder()
      .update(Notice)
      .set({ isRead: 1 })
      .where('userId = :userId', { userId })
      .andWhere('isRead = 0')
      .execute();
    return { success: true, affected: result.affected || 0 };
  }

  async deleteNotice(id: number, userId: number) {
    const notice = await this.noticeRepository.findOne({ where: { id, userId } });
    if (!notice) {
      throw new NotFoundException('通知不存在或无权操作');
    }
    await this.noticeRepository.delete(id);
    return { success: true };
  }

  async getUnreadCount(userId: number) {
    const count = await this.noticeRepository.count({ where: { userId, isRead: 0 } });
    return { count };
  }

  async getNoticePopup(userId: number) {
    const now = Date.now();
    return this.noticeRepository
      .createQueryBuilder('notice')
      .where('notice.userId = :userId', { userId })
      .andWhere('notice.popupType = 1')
      .andWhere('(notice.popupStartTime IS NULL OR notice.popupStartTime <= :now)', { now })
      .andWhere('(notice.popupEndTime IS NULL OR notice.popupEndTime >= :now)', { now })
      .orderBy('notice.sendTime', 'DESC')
      .getMany();
  }
}