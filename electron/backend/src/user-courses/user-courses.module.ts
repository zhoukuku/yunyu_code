import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserCourse } from '../entities/user-course.entity';
import { UserCoursesService } from './user-courses.service';
import { UserCoursesController } from './user-courses.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserCourse])],
  providers: [UserCoursesService],
  controllers: [UserCoursesController],
  exports: [UserCoursesService],
})
export class UserCoursesModule {}