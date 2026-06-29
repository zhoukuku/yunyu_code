import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ParentalReport } from '../entities/parental-report.entity';
import { LearningReport } from '../entities/learning-report.entity';
import { UserCourse } from '../entities/user-course.entity';
import { VideoProgress } from '../entities/video-progress.entity';
import { ParentalReportService } from './parental-report.service';
import { ParentalReportController } from './parental-report.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([ParentalReport, LearningReport, UserCourse, VideoProgress]),
  ],
  controllers: [ParentalReportController],
  providers: [ParentalReportService],
  exports: [ParentalReportService],
})
export class ParentalReportModule {}