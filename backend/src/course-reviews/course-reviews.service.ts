import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseReview } from '../entities/course-review.entity';

@Injectable()
export class CourseReviewsService {
  constructor(
    @InjectRepository(CourseReview)
    private reviewRepository: Repository<CourseReview>,
  ) {}

  async createReview(data: { courseId: number; userId?: number; rating: number; content?: string }) {
    const review = this.reviewRepository.create({
      courseId: data.courseId,
      userId: data.userId || 0,
      rating: data.rating,
      content: data.content || '',
    });
    return this.reviewRepository.save(review);
  }

  async getReviewsByCourse(courseId: number, page = 1, pageSize = 10) {
    const [records, total] = await this.reviewRepository.findAndCount({
      where: { courseId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      records,
      total,
      page,
      pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getReviewsByUser(userId: number) {
    return this.reviewRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async getUserReview(courseId: number, userId: number) {
    return this.reviewRepository.findOne({
      where: { courseId, userId },
    });
  }

  async updateReview(id: number, data: { rating?: number; content?: string }) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) return null;

    if (data.rating !== undefined) review.rating = data.rating;
    if (data.content !== undefined) review.content = data.content;

    return this.reviewRepository.save(review);
  }

  async deleteReview(id: number) {
    await this.reviewRepository.delete(id);
    return { success: true };
  }

  async getCourseReviewStats(courseId: number) {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .where('review.courseId = :courseId', { courseId })
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(*)', 'totalReviews')
      .getRawOne();

    return {
      averageRating: parseFloat(result.averageRating || 0).toFixed(1),
      totalReviews: parseInt(result.totalReviews || 0, 10),
    };
  }
}
