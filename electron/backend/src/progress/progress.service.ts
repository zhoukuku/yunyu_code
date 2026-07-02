import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { UserCourse } from '../entities/user-course.entity';
import { UserLessonProgress } from '../entities/user-lesson-progress.entity';
import { VideoProgress } from '../entities/video-progress.entity';
import { Course, Lesson } from '../entities/course.entity';
import { User } from '../entities/user.entity';

export interface CourseProgress {
  courseId: number;
  courseName: string;
  coverImage: string;
  teacher: string;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
  lastLessonId: number;
  lastLessonName: string;
  enrolledAt: Date;
  lastStudyTime: Date | null;
}

export interface LearningStats {
  totalEnrolledCourses: number;
  completedCourses: number;
  totalLessonsCompleted: number;
  totalLearningMinutes: number;
  totalVideoMinutes: number;
  averageProgressPercent: number;
  continueLearning: {
    courseId: number;
    lessonId: number;
    courseName: string;
    lessonName: string;
  } | null;
  weeklyStudyMinutes: number;
  monthlyStudyMinutes: number;
  studyStreak: number;
  longestStreak: number;
}

export interface HistoryItem {
  lessonId: number;
  lessonName: string;
  courseId: number;
  courseName: string;
  completedAt: Date;
}

@Injectable()
export class ProgressService {
  constructor(
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
    @InjectRepository(UserLessonProgress)
    private progressRepository: Repository<UserLessonProgress>,
    @InjectRepository(VideoProgress)
    private videoProgressRepository: Repository<VideoProgress>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async getLearningStats(userId: number): Promise<LearningStats> {
    // Get all enrolled courses
    const enrolledCourses = await this.userCourseRepository.find({
      where: { userId, status: 1 },
    });

    // Get all completed lessons
    const completedProgress = await this.progressRepository.find({
      where: { userId, isCompleted: 1 },
    });

    // Get video progress for actual watch time
    const videoProgress = await this.videoProgressRepository.find({
      where: { userId },
    });

    // Calculate total video minutes actually watched
    const totalVideoMinutes = videoProgress.reduce((sum, vp) => sum + (vp.currentTime ?? 0), 0);

    // Get all courses for reference
    const courseIds = enrolledCourses.map(uc => uc.courseId);
    const courses = courseIds.length > 0
      ? await this.courseRepository.find({ where: { id: In(courseIds) } })
      : [];
    const courseMap = new Map(courses.map(c => [c.id, c]));

    // Calculate completed courses (all lessons completed)
    let completedCourses = 0;
    let totalProgressPercent = 0;
    for (const uc of enrolledCourses) {
      const course = courseMap.get(uc.courseId);
      if (course && course.totalLessons > 0) {
        if (uc.completedLessons >= course.totalLessons) {
          completedCourses++;
        }
        totalProgressPercent += Math.round((uc.completedLessons / course.totalLessons) * 100);
      }
    }
    const averageProgressPercent = enrolledCourses.length > 0
      ? Math.round(totalProgressPercent / enrolledCourses.length)
      : 0;

    // Find continue learning (last lesson the user was on)
    let continueLearning: LearningStats['continueLearning'] = null;
    const lastRecords = enrolledCourses
      .filter(uc => uc.lastLessonId != null && uc.lastLessonId > 0)
      .sort((a, b) => new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime());

    if (lastRecords.length > 0) {
      const last = lastRecords[0];
      if (last.lastLessonId != null) {
        const lesson = await this.lessonRepository.findOne({ where: { id: last.lastLessonId } });
        const course = courseMap.get(last.courseId);
        if (lesson && course) {
          continueLearning = {
            courseId: last.courseId,
            lessonId: last.lastLessonId,
            courseName: course.courseName,
            lessonName: lesson.lessonName,
          };
        }
      }
    }

    // Calculate weekly and monthly study minutes
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyProgress = completedProgress.filter(
      p => p.completedAt && new Date(p.completedAt) >= weekAgo
    );
    const monthlyProgress = completedProgress.filter(
      p => p.completedAt && new Date(p.completedAt) >= monthAgo
    );

    // Calculate study streak
    const { studyStreak, longestStreak } = this.calculateStudyStreak(completedProgress);

    return {
      totalEnrolledCourses: enrolledCourses.length,
      completedCourses,
      totalLessonsCompleted: completedProgress.length,
      totalLearningMinutes: completedProgress.length * 15, // Estimate 15 min per lesson
      totalVideoMinutes,
      averageProgressPercent,
      continueLearning,
      weeklyStudyMinutes: weeklyProgress.length * 15,
      monthlyStudyMinutes: monthlyProgress.length * 15,
      studyStreak,
      longestStreak,
    };
  }

  private calculateStudyStreak(progressList: UserLessonProgress[]): { studyStreak: number; longestStreak: number } {
    if (!progressList || progressList.length === 0) {
      return { studyStreak: 0, longestStreak: 0 };
    }

    // Get unique dates with completed lessons
    const completedDates = progressList
      .filter(p => p.completedAt)
      .map(p => new Date(p.completedAt!).toISOString().split('T')[0])
      .filter((date, index, self) => self.indexOf(date) === index)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    if (completedDates.length === 0) {
      return { studyStreak: 0, longestStreak: 0 };
    }

    let studyStreak = 0;
    let longestStreak = 0;
    let currentStreak = 0;
    let prevDate: Date | null = null;

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Check if the most recent study was today or yesterday to count as active streak
    const isRecentStudy = completedDates[0] === today || completedDates[0] === yesterday;

    for (const dateStr of completedDates) {
      const date = new Date(dateStr);

      if (prevDate === null) {
        currentStreak = 1;
      } else {
        const diffDays = Math.floor((prevDate.getTime() - date.getTime()) / (24 * 60 * 60 * 1000));
        if (diffDays === 1) {
          currentStreak++;
        } else {
          longestStreak = Math.max(longestStreak, currentStreak);
          currentStreak = 1;
        }
      }

      prevDate = date;
    }

    longestStreak = Math.max(longestStreak, currentStreak);
    studyStreak = isRecentStudy ? currentStreak : 0;

    return { studyStreak, longestStreak };
  }

  async getCourseProgress(userId: number): Promise<CourseProgress[]> {
    const enrolledCourses = await this.userCourseRepository.find({
      where: { userId, status: 1 },
      order: { enrolledAt: 'DESC' },
    });

    if (enrolledCourses.length === 0) return [];

    const courseIds = enrolledCourses.map(uc => uc.courseId);
    const courses = await this.courseRepository.find({ where: { id: In(courseIds) } });
    const courseMap = new Map(courses.map(c => [c.id, c]));

    // Batch fetch all lessons for all enrolled courses (avoid N+1)
    const allLessons = await this.lessonRepository.find({
      where: { courseId: In(courseIds) },
      order: { lessonOrder: 'ASC' },
    });
    const lessonsByCourse = new Map<number, Lesson[]>();
    for (const lesson of allLessons) {
      const list = lessonsByCourse.get(lesson.courseId) ?? [];
      list.push(lesson);
      lessonsByCourse.set(lesson.courseId, list);
    }

    // Batch fetch all completed progress for all lessons (avoid N+1)
    const allLessonIds = allLessons.map(l => l.id);
    const allCompleted = allLessonIds.length > 0
      ? await this.progressRepository.find({
          where: { userId, lessonId: In(allLessonIds), isCompleted: 1 },
        })
      : [];
    const completedByLesson = new Map<number, UserLessonProgress[]>();
    for (const p of allCompleted) {
      const list = completedByLesson.get(p.lessonId) ?? [];
      list.push(p);
      completedByLesson.set(p.lessonId, list);
    }

    const result: CourseProgress[] = [];

    for (const uc of enrolledCourses) {
      const course = courseMap.get(uc.courseId);
      if (!course) continue;

      const lessons = lessonsByCourse.get(course.id) ?? [];

      // Count completed lessons from pre-fetched data
      let completedCount = 0;
      let lastCompletedAt: Date | null = null;
      let lastCompletedLessonId: number | null = null;
      for (const lesson of lessons) {
        const completed = completedByLesson.get(lesson.id);
        if (completed && completed.length > 0) {
          completedCount++;
          const latest = completed.reduce((latest, p) =>
            (p.completedAt && (!latest || p.completedAt > latest)) ? p.completedAt : latest,
            null as Date | null);
          if (latest && (!lastCompletedAt || latest > lastCompletedAt)) {
            lastCompletedAt = latest;
            lastCompletedLessonId = lesson.id;
          }
        }
      }

      const progressPercent = course.totalLessons > 0
        ? Math.round((completedCount / course.totalLessons) * 100)
        : 0;

      // Determine last lesson (prefer the tracked lastLessonId, fall back to last completed)
      let lastLesson: Lesson | null = null;
      if (uc.lastLessonId != null && uc.lastLessonId > 0) {
        const found = lessons.find(l => l.id === uc.lastLessonId);
        if (found) lastLesson = found;
      }
      if (!lastLesson && lastCompletedLessonId != null) {
        const found = lessons.find(l => l.id === lastCompletedLessonId);
        if (found) lastLesson = found;
      }

      result.push({
        courseId: course.id,
        courseName: course.courseName,
        coverImage: course.coverImage,
        teacher: course.teacher,
        totalLessons: course.totalLessons,
        completedLessons: completedCount,
        progressPercent,
        lastLessonId: uc.lastLessonId ?? 0,
        lastLessonName: lastLesson?.lessonName ?? '',
        enrolledAt: uc.enrolledAt,
        lastStudyTime: lastCompletedAt ?? null,
      });
    }

    return result;
  }

  async getLearningHistory(userId: number, limit: number = 20): Promise<HistoryItem[]> {
    const recentProgress = await this.progressRepository.find({
      where: { userId, isCompleted: 1 },
      order: { completedAt: 'DESC' },
      take: limit,
    });

    if (recentProgress.length === 0) return [];

    const lessonIds = recentProgress.map(p => p.lessonId);
    const lessons = await this.lessonRepository.find({ where: { id: In(lessonIds) } });
    const lessonMap = new Map(lessons.map(l => [l.id, l]));

    const courseIds = [...new Set(lessons.map(l => l.courseId))];
    const courses = await this.courseRepository.find({ where: { id: In(courseIds) } });
    const courseMap = new Map(courses.map(c => [c.id, c]));

    return recentProgress
      .filter(p => p.completedAt)
      .map(p => {
        const lesson = lessonMap.get(p.lessonId);
        const course = lesson ? courseMap.get(lesson.courseId) : null;
        return {
          lessonId: p.lessonId,
          lessonName: lesson?.lessonName ?? '',
          courseId: lesson?.courseId ?? 0,
          courseName: course?.courseName ?? '',
          completedAt: p.completedAt!,
        };
      });
  }

  async recordLearningTime(userId: number, lessonId: number, minutes: number): Promise<void> {
    // Update user's last activity (could be stored in user table if needed)
    // For now, we just update the lesson progress record if it exists
    const progress = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });
    if (progress) {
      progress.updatedAt = new Date();
      await this.progressRepository.save(progress);
    }
  }
}