import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CourseReviewsService } from './course-reviews.service';

@Controller('course-reviews')
export class CourseReviewsController {
  constructor(private readonly courseReviewsService: CourseReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createReview(@Request() req: any, @Body() data: {
    courseId: number;
    rating: number;
    content?: string;
  }) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    return this.courseReviewsService.createReview({ ...data, userId });
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
  @UseGuards(AuthGuard('jwt'))
  async getReviewsByUser(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.courseReviewsService.getReviewsByUser(
      parseInt(userId, 10),
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  async checkUserReviewed(@Request() req: any, @Query('courseId') courseId: string) {
    const review = await this.courseReviewsService.getUserReview(parseInt(courseId, 10), req.user.sub);
    return { status: 200, result: { hasReviewed: !!review, review } };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateReview(@Request() req: any, @Param('id') id: string, @Body() data: { rating?: number; content?: string }) {
    return this.courseReviewsService.updateReview(parseInt(id, 10), req.user.sub, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteReview(@Request() req: any, @Param('id') id: string) {
    return this.courseReviewsService.deleteReview(parseInt(id, 10), req.user.sub);
  }

  @Get('stats/:courseId')
  async getCourseReviewStats(@Param('courseId') courseId: string) {
    return this.courseReviewsService.getCourseReviewStats(parseInt(courseId, 10));
  }
}
