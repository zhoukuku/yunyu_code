import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ParentalReport, ReportStatus } from '../entities/parental-report.entity';
import { LearningReport } from '../entities/learning-report.entity';
import { UserCourse } from '../entities/user-course.entity';
import { VideoProgress } from '../entities/video-progress.entity';

@Injectable()
export class ParentalReportService {
  private readonly logger = new Logger(ParentalReportService.name);

  constructor(
    @InjectRepository(ParentalReport)
    private parentalReportRepository: Repository<ParentalReport>,
    @InjectRepository(LearningReport)
    private learningReportRepository: Repository<LearningReport>,
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
    @InjectRepository(VideoProgress)
    private videoProgressRepository: Repository<VideoProgress>,
  ) {}

  async generateReport(parentId: number, studentId: number, reportType: string, studentName?: string): Promise<ParentalReport> {
    // Calculate period based on report type
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    switch (reportType) {
      case 'weekly':
        periodStart = new Date(now);
        periodStart.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        periodStart = new Date(now);
        periodStart.setMonth(now.getMonth() - 1);
        break;
      default: // overall
        periodStart = new Date(0);
    }

    // Get student's learning data
    const studentCourses = await this.userCourseRepository.find({
      where: { userId: studentId },
    });

    const coursesEnrolled = studentCourses.length;
    const coursesCompleted = studentCourses.filter(c => c.status === 1).length;

    // Get lessons completed in period based on video progress
    const lessonsCompleted = await this.videoProgressRepository
      .createQueryBuilder('vp')
      .where('vp.userId = :studentId', { studentId })
      .andWhere('vp.isCompleted = :completed', { completed: 1 })
      .andWhere('vp.updatedAt >= :periodStart', { periodStart })
      .andWhere('vp.updatedAt <= :periodEnd', { periodEnd })
      .getCount();

    // Calculate total study minutes (using video duration)
    const videoProgressList = await this.videoProgressRepository.find({
      where: { userId: studentId, isCompleted: 1 },
    });
    const totalStudyMinutes = videoProgressList.reduce((sum, vp) => sum + Math.floor(vp.duration / 60), 0);

    // Calculate average progress
    let averageProgress = 0;
    if (studentCourses.length > 0) {
      // completedLessons could be used for progress calculation
      const totalCompleted = studentCourses.reduce((sum, c) => sum + c.completedLessons, 0);
      averageProgress = studentCourses.length > 0 ? Math.round(totalCompleted / studentCourses.length) : 0;
    }

    // Get top and weak skills from learning reports
    const learningReports = await this.learningReportRepository.find({
      where: {
        userId: studentId,
        reportType,
      },
    });

    let topSkills: any[] = [];
    let weakSkills: any[] = [];
    let recentAchievements: string[] = [];

    if (learningReports.length > 0) {
      const latestReport = learningReports[0];
      if (latestReport.summary) {
        try {
          const summaryData = JSON.parse(latestReport.summary);
          topSkills = summaryData.topSkills || [];
          weakSkills = summaryData.weakSkills || [];
          recentAchievements = summaryData.recentAchievements || [];
        } catch (e) {
          this.logger.warn(`Failed to parse summary JSON for report, proceeding with defaults`);
        }
      }
    }

    // Create the parental report
    const parentalReport = this.parentalReportRepository.create({
      parentId,
      studentId,
      studentName: studentName || '',
      reportType,
      periodStart,
      periodEnd,
      totalStudyMinutes,
      lessonsCompleted,
      coursesEnrolled,
      coursesCompleted,
      averageProgress,
      status: ReportStatus.PENDING,
      summary: JSON.stringify({
        topSkills,
        weakSkills,
        recentAchievements,
        generatedAt: now.toISOString(),
      }),
    });

    return this.parentalReportRepository.save(parentalReport);
  }

  async getReportsByParent(parentId: number, limit = 10): Promise<ParentalReport[]> {
    return this.parentalReportRepository.find({
      where: { parentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getReportsByStudent(studentId: number, limit = 10): Promise<ParentalReport[]> {
    return this.parentalReportRepository.find({
      where: { studentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getReportById(id: number): Promise<ParentalReport | null> {
    return this.parentalReportRepository.findOne({ where: { id } });
  }

  async approveReport(id: number, comment?: string): Promise<ParentalReport | null> {
    const report = await this.parentalReportRepository.findOne({ where: { id } });
    if (!report) return null;

    report.status = ReportStatus.APPROVED;
    report.reviewedAt = new Date();
    report.reviewComment = comment ?? null;

    return this.parentalReportRepository.save(report);
  }

  async rejectReport(id: number, comment?: string): Promise<ParentalReport | null> {
    const report = await this.parentalReportRepository.findOne({ where: { id } });
    if (!report) return null;

    report.status = ReportStatus.REJECTED;
    report.reviewedAt = new Date();
    report.reviewComment = comment ?? null;

    return this.parentalReportRepository.save(report);
  }

  async deleteReport(id: number): Promise<boolean> {
    const result = await this.parentalReportRepository.delete({ id });
    return (result.affected || 0) > 0;
  }

  async getLinkedStudents(parentId: number): Promise<{ studentId: number; studentName: string }[]> {
    // In a real app, there would be a parent-student relationship table
    // For now, return students that have reports generated by this parent
    const reports = await this.parentalReportRepository
      .createQueryBuilder('report')
      .select('DISTINCT report.studentId', 'studentId')
      .addSelect('report.studentName', 'studentName')
      .where('report.parentId = :parentId', { parentId })
      .getRawMany();

    return reports;
  }
}