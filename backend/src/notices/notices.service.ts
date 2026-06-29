import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notice } from '../entities/course.entity';

@Injectable()
export class NoticesService {
  constructor(
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
  ) {}

  async findAll(userId?: number) {
    const where = userId ? { userId } : {};
    return this.noticeRepository.find({
      where,
      order: { sendTime: 'DESC' },
    });
  }

  async findOne(id: number) {
    return this.noticeRepository.findOne({ where: { id } });
  }

  async markAsRead(id: number) {
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

  async deleteNotice(id: number) {
    await this.noticeRepository.delete(id);
    return { success: true };
  }

  async getUnreadCount(userId: number) {
    const count = await this.noticeRepository.count({ where: { userId, isRead: 0 } });
    return { count };
  }

  async getNoticePopup(userId: number) {
    const notices = await this.noticeRepository.find({
      where: { userId, popupType: 1 },
      order: { sendTime: 'DESC' },
    });
    const now = Date.now();
    return notices.filter(n => {
      const startOk = !n.popupStartTime || n.popupStartTime <= now;
      const endOk = !n.popupEndTime || n.popupEndTime >= now;
      return startOk && endOk;
    });
  }
}