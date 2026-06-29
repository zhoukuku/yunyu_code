import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CourseReviewsService } from './course-reviews.service';

@Controller('course-reviews')
export class CourseReviewsController {
  constructor(private readonly courseReviewsService: CourseReviewsService) {}

  @Post()
  async createReview(@Body() data: {
    courseId: number;
    userId?: number;
    rating: number;
    content?: string;
  }) {
    return this.courseReviewsService.createReview(data);
  }

  @Get('course/:courseId')
  async getReviewsByCourse(
    @Param('courseId') courseId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.courseReviewsService.getReviewsByCourse(
      parseInt(courseId, 10),
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
  }

  @Get('user/:userId')
  async getReviewsByUser(@Param('userId') userId: string) {
    return this.courseReviewsService.getReviewsByUser(parseInt(userId, 10));
  }

  @Get('check')
  async checkUserReviewed(@Query('courseId') courseId: string, @Query('userId') userId: string) {
    const review = await this.courseReviewsService.getUserReview(parseInt(courseId, 10), parseInt(userId, 10));
    return { hasReviewed: !!review, review };
  }

  @Put(':id')
  async updateReview(@Param('id') id: string, @Body() data: { rating?: number; content?: string }) {
    return this.courseReviewsService.updateReview(parseInt(id, 10), data);
  }

  @Delete(':id')
  async deleteReview(@Param('id') id: string) {
    await this.courseReviewsService.deleteReview(parseInt(id, 10));
    return { success: true };
  }

  @Get('stats/:courseId')
  async getCourseReviewStats(@Param('courseId') courseId: string) {
    return this.courseReviewsService.getCourseReviewStats(parseInt(courseId, 10));
  }
}
