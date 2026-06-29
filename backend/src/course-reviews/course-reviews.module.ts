import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourseReview } from '../entities/course-review.entity';
import { CourseReviewsController } from './course-reviews.controller';
import { CourseReviewsService } from './course-reviews.service';

@Module({
  imports: [TypeOrmModule.forFeature([CourseReview])],
  controllers: [CourseReviewsController],
  providers: [CourseReviewsService],
  exports: [CourseReviewsService],
})
export class CourseReviewsModule {}
