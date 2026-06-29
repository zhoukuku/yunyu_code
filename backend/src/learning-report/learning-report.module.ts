import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import {
  SkillCategory,
  CourseSkill,
  UserSkillProgress,
  LearningReport,
} from '../entities/learning-report.entity';
import { UserCourse } from '../entities/user-course.entity';
import { UserLessonProgress } from '../entities/user-lesson-progress.entity';
import { Course, Lesson } from '../entities/course.entity';
import { LearningReportService } from './learning-report.service';
import { LearningReportController } from './learning-report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SkillCategory,
      CourseSkill,
      UserSkillProgress,
      LearningReport,
      UserCourse,
      UserLessonProgress,
      Course,
      Lesson,
    ]),
    AuthModule,
  ],
  controllers: [LearningReportController],
  providers: [LearningReportService],
  exports: [LearningReportService],
})
export class LearningReportModule {}
