import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CourseReviewsService } from './course-reviews.service';

@Controller('course-reviews')
export class CourseReviewsController {
  constructor(private readonly courseReviewsService: CourseReviewsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createReview(@Req() req: any, @Body() data: {
    courseId: number;
    userId?: number;
    rating: number;
    content?: string;
  }) {
    // Use authenticated user ID, ignore any userId from the body
    return this.courseReviewsService.createReview({ ...data, userId: req.user.sub });
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
    @Req() req: any,
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
  async checkUserReviewed(@Query('courseId') courseId: string, @Req() req: any) {
    const review = await this.courseReviewsService.getUserReview(parseInt(courseId, 10), req.user.sub);
    return { hasReviewed: !!review, review };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateReview(@Param('id') id: string, @Req() req: any, @Body() data: { rating?: number; content?: string }) {
    return this.courseReviewsService.updateReview(parseInt(id, 10), req.user.sub, data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteReview(@Param('id') id: string, @Req() req: any) {
    return this.courseReviewsService.deleteReview(parseInt(id, 10), req.user.sub);
  }

  @Get('stats/:courseId')
  async getCourseReviewStats(@Param('courseId') courseId: string) {
    return this.courseReviewsService.getCourseReviewStats(parseInt(courseId, 10));
  }
}
