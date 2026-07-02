import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserCourse } from '../entities/user-course.entity';
import { UserLessonProgress } from '../entities/user-lesson-progress.entity';
import { VideoProgress } from '../entities/video-progress.entity';
import { Course, Lesson } from '../entities/course.entity';
import { User } from '../entities/user.entity';
import { ProgressService } from './progress.service';
import { ProgressController } from './progress.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserCourse, UserLessonProgress, VideoProgress, Course, Lesson, User]),
    AuthModule,
  ],
  controllers: [ProgressController],
  providers: [ProgressService],
  exports: [ProgressService],
})
export class ProgressModule {}