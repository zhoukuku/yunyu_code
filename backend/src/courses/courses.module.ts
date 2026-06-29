import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Hierarchy, Course, Lesson, Notice } from '../entities/course.entity';
import { CourseFavorite } from '../entities/course-favorite.entity';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Hierarchy, Course, Lesson, Notice, CourseFavorite])],
  providers: [CoursesService],
  controllers: [CoursesController],
  exports: [CoursesService],
})
export class CoursesModule {}