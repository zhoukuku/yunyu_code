import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
    // Validate rating
    if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
      throw new BadRequestException('Rating must be an integer between 1 and 5');
    }
    if (!data.userId || data.userId === 0) {
      throw new BadRequestException('Valid userId is required');
    }
    const review = this.reviewRepository.create({
      courseId: data.courseId,
      userId: data.userId,
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
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getReviewsByUser(userId: number, page: number = 1, pageSize: number = 20) {
    const [records, total] = await this.reviewRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
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

  async getUserReview(courseId: number, userId: number) {
    return this.reviewRepository.findOne({
      where: { courseId, userId },
    });
  }

  async updateReview(id: number, userId: number, data: { rating?: number; content?: string }) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }

    // Ownership check
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    // Validate rating if provided
    if (data.rating !== undefined) {
      if (data.rating < 1 || data.rating > 5 || !Number.isInteger(data.rating)) {
        throw new BadRequestException('Rating must be an integer between 1 and 5');
      }
      review.rating = data.rating;
    }
    if (data.content !== undefined) review.content = data.content;

    return this.reviewRepository.save(review);
  }

  async deleteReview(id: number, userId: number) {
    const review = await this.reviewRepository.findOne({ where: { id } });
    if (!review) {
      throw new NotFoundException('Review not found');
    }
    // Ownership check
    if (review.userId !== userId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }
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

    const avg = parseFloat(result.averageRating || '0');
    return {
      averageRating: Math.round(avg * 10) / 10,
      totalReviews: parseInt(result.totalReviews || '0', 10),
    };
  }
}
