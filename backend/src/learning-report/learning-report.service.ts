import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import {
  SkillCategory,
  CourseSkill,
  UserSkillProgress,
  LearningReport,
} from '../entities/learning-report.entity';
import { UserCourse } from '../entities/user-course.entity';
import { UserLessonProgress } from '../entities/user-lesson-progress.entity';
import { Course, Lesson } from '../entities/course.entity';

export interface SkillAtlasItem {
  skillName: string;
  categoryId: number;
  categoryName: string;
  masteryLevel: number;
  associatedCourses: number;
  lastPracticedAt: Date | null;
}

export interface SkillCategorySummary {
  categoryId: number;
  categoryName: string;
  icon: string;
  totalSkills: number;
  averageMastery: number;
  skills: SkillAtlasItem[];
}

export interface LearningReportSummary {
  reportId: number;
  periodStart: Date;
  periodEnd: Date;
  totalStudyMinutes: number;
  lessonsCompleted: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  averageProgress: number;
  topSkills: { skillName: string; masteryLevel: number }[];
  weakSkills: { skillName: string; masteryLevel: number }[];
  recentAchievements: string[];
}

@Injectable()
export class LearningReportService {
  constructor(
    @InjectRepository(SkillCategory)
    private skillCategoryRepository: Repository<SkillCategory>,
    @InjectRepository(CourseSkill)
    private courseSkillRepository: Repository<CourseSkill>,
    @InjectRepository(UserSkillProgress)
    private userSkillProgressRepository: Repository<UserSkillProgress>,
    @InjectRepository(LearningReport)
    private learningReportRepository: Repository<LearningReport>,
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
    @InjectRepository(UserLessonProgress)
    private progressRepository: Repository<UserLessonProgress>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  async getSkillCategories() {
    return this.skillCategoryRepository.find({
      order: { sortOrder: 'ASC' },
    });
  }

  async createSkillCategory(data: Partial<SkillCategory>) {
    const category = this.skillCategoryRepository.create(data);
    return this.skillCategoryRepository.save(category);
  }

  async getCourseSkills(courseId: number) {
    return this.courseSkillRepository.find({
      where: { courseId },
    });
  }

  async createCourseSkill(data: Partial<CourseSkill>) {
    const skill = this.courseSkillRepository.create(data);
    return this.courseSkillRepository.save(skill);
  }

  async getSkillAtlas(userId: number): Promise<SkillCategorySummary[]> {
    // Get all skill categories
    const categories = await this.skillCategoryRepository.find({
      order: { sortOrder: 'ASC' },
    });

    // Get user's skill progress
    const userSkills = await this.userSkillProgressRepository.find({
      where: { userId },
    });
    const userSkillMap = new Map(userSkills.map(s => [s.skillName, s]));

    // Get all course skills grouped by category
    const allCourseSkills = await this.courseSkillRepository.find();
    const courseSkillMap = new Map<string, CourseSkill[]>();
    for (const cs of allCourseSkills) {
      const key = cs.categoryId?.toString() || 'uncategorized';
      if (!courseSkillMap.has(key)) courseSkillMap.set(key, []);
      courseSkillMap.get(key)!.push(cs);
    }

    // Pre-build map from courseId to Set of skill names for O(1) lookup
    const skillNamesByCourseId = new Map<number, Set<string>>();
    for (const cs of allCourseSkills) {
      if (!skillNamesByCourseId.has(cs.courseId)) {
        skillNamesByCourseId.set(cs.courseId, new Set());
      }
      skillNamesByCourseId.get(cs.courseId)!.add(cs.skillName);
    }

    // Get user's enrolled courses for course count
    const enrolledCourses = await this.userCourseRepository.find({
      where: { userId, status: 1 },
    });
    const enrolledCourseIds = enrolledCourses.map(uc => uc.courseId);

    const result: SkillCategorySummary[] = [];

    for (const category of categories) {
      const skills = courseSkillMap.get(category.id.toString()) || [];
      const skillItems: SkillAtlasItem[] = [];

      for (const cs of skills) {
        const userProgress = userSkillMap.get(cs.skillName);
        skillItems.push({
          skillName: cs.skillName,
          categoryId: category.id,
          categoryName: category.categoryName,
          masteryLevel: userProgress?.masteryLevel || 0,
          associatedCourses: enrolledCourseIds.filter(cid => {
            const skills = skillNamesByCourseId.get(cid);
            return skills ? skills.has(cs.skillName) : false;
          }).length,
          lastPracticedAt: userProgress?.lastPracticedAt || null,
        });
      }

      const totalSkills = skillItems.length;
      const averageMastery = totalSkills > 0
        ? Math.round(skillItems.reduce((sum, s) => sum + s.masteryLevel, 0) / totalSkills)
        : 0;

      result.push({
        categoryId: category.id,
        categoryName: category.categoryName,
        icon: category.icon || 'default',
        totalSkills,
        averageMastery,
        skills: skillItems,
      });
    }

    return result;
  }

  async updateSkillProgress(userId: number, skillName: string, masteryLevel: number) {
    let progress = await this.userSkillProgressRepository.findOne({
      where: { userId, skillName },
    });

    if (progress) {
      progress.masteryLevel = masteryLevel;
      progress.lastPracticedAt = new Date();
    } else {
      progress = this.userSkillProgressRepository.create({
        userId,
        skillName,
        masteryLevel,
        lastPracticedAt: new Date(),
      });
    }

    return this.userSkillProgressRepository.save(progress);
  }

  async calculateSkillFromProgress(userId: number, courseId: number): Promise<void> {
    // Get all lessons in the course
    const lessons = await this.lessonRepository.find({
      where: { courseId },
    });

    if (lessons.length === 0) return;

    const lessonIds = lessons.map(l => l.id);

    // Get user's completed lessons in this course
    const completedProgress = await this.progressRepository.find({
      where: {
        userId,
        lessonId: In(lessonIds),
        isCompleted: 1,
      },
    });

    const completedCount = completedProgress.length;
    const completionRate = lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0;

    // Get skills for this course
    const courseSkills = await this.courseSkillRepository.find({
      where: { courseId },
    });

    // Update skill mastery based on course completion
    for (const cs of courseSkills) {
      const baseMastery = cs.skillLevel ?? 1;
      const newMastery = Math.min(100, Math.round(completionRate * baseMastery));

      await this.updateSkillProgress(userId, cs.skillName, newMastery);
    }
  }

  async generateLearningReport(
    userId: number,
    reportType: 'weekly' | 'monthly' | 'overall' = 'overall'
  ): Promise<LearningReportSummary> {
    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;

    switch (reportType) {
      case 'weekly':
        periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        periodStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        periodStart = new Date(0); // All time
    }

    // Get enrolled courses
    const enrolledCourses = await this.userCourseRepository.find({
      where: { userId, status: 1 },
    });

    // Get completed lessons within period
    const completedProgress = await this.progressRepository.find({
      where: {
        userId,
        isCompleted: 1,
        completedAt: Between(periodStart, periodEnd),
      },
    });

    // Calculate completed courses
    const courseIds = enrolledCourses.map(uc => uc.courseId);
    const courses = courseIds.length > 0
      ? await this.courseRepository.find({ where: { id: In(courseIds) } })
      : [];
    const courseMap = new Map(courses.map(c => [c.id, c]));

    let completedCourses = 0;
    for (const uc of enrolledCourses) {
      const course = courseMap.get(uc.courseId);
      if (course && course.totalLessons > 0 && uc.completedLessons >= course.totalLessons) {
        completedCourses++;
      }
    }

    // Get skill atlas for top/weak skills
    const skillAtlas = await this.getSkillAtlas(userId);
    const allSkills = skillAtlas.flatMap(c => c.skills);
    const sortedByMastery = [...allSkills].sort((a, b) => b.masteryLevel - a.masteryLevel);
    const topSkills = sortedByMastery.slice(0, 5).map(s => ({
      skillName: s.skillName,
      masteryLevel: s.masteryLevel,
    }));
    const weakSkills = sortedByMastery.slice(-5).map(s => ({
      skillName: s.skillName,
      masteryLevel: s.masteryLevel,
    }));

    // Calculate average progress
    let totalProgress = 0;
    for (const uc of enrolledCourses) {
      const course = courseMap.get(uc.courseId);
      if (course && course.totalLessons > 0) {
        totalProgress += (uc.completedLessons / course.totalLessons) * 100;
      }
    }
    const averageProgress = enrolledCourses.length > 0
      ? Math.round(totalProgress / enrolledCourses.length)
      : 0;

    // Generate recent achievements
    const recentAchievements: string[] = [];
    if (completedCourses > 0) {
      recentAchievements.push(`完成了 ${completedCourses} 门课程`);
    }
    if (completedProgress.length > 5) {
      recentAchievements.push(`完成了 ${completedProgress.length} 个课时`);
    }
    if (averageProgress >= 80) {
      recentAchievements.push('学习进度优秀');
    }
    if (enrolledCourses.length >= 3) {
      recentAchievements.push('多课程并行学习');
    }

    // Save report to database
    const report = this.learningReportRepository.create({
      userId,
      reportType,
      periodStart,
      periodEnd,
      totalStudyMinutes: completedProgress.length * 15,
      lessonsCompleted: completedProgress.length,
      coursesEnrolled: enrolledCourses.length,
      coursesCompleted: completedCourses,
      averageProgress,
      summary: JSON.stringify({
        topSkills,
        weakSkills,
        recentAchievements,
        generatedAt: now.toISOString(),
      }),
    });
    const savedReport = await this.learningReportRepository.save(report);

    return {
      reportId: savedReport.id,
      periodStart,
      periodEnd,
      totalStudyMinutes: completedProgress.length * 15,
      lessonsCompleted: completedProgress.length,
      coursesEnrolled: enrolledCourses.length,
      coursesCompleted: completedCourses,
      averageProgress,
      topSkills,
      weakSkills,
      recentAchievements,
    };
  }

  async getLearningReports(userId: number, limit: number = 10) {
    return this.learningReportRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getReportDetail(userId: number, reportId: number) {
    const report = await this.learningReportRepository.findOne({
      where: { id: reportId, userId },
    });
    if (!report) return null;
    return report;
  }
}
