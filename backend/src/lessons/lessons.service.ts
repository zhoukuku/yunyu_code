import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Lesson } from '../entities/course.entity';
import { UserLessonProgress } from '../entities/user-lesson-progress.entity';

@Injectable()
export class LessonsService {
  constructor(
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(UserLessonProgress)
    private progressRepository: Repository<UserLessonProgress>,
  ) {}

  async getLessonDetail(lessonId: number, userId?: number) {
    const lesson = await this.lessonRepository.findOne({ where: { id: lessonId } });
    if (!lesson) return null;

    // Get all lessons for this course to determine prev/next
    const allLessons = await this.lessonRepository.find({
      where: { courseId: lesson.courseId },
      order: { lessonOrder: 'ASC' },
    });

    const currentIndex = allLessons.findIndex(l => l.id === lessonId);
    const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
    const nextLesson = currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

    // Get user's progress for all lessons in this course
    let userProgress: Record<number, boolean> = {};
    if (userId) {
      const lessonIds = allLessons.map(l => l.id);
      const progressRecords = await this.progressRepository.find({
        where: { userId, lessonId: In(lessonIds) },
      });
      userProgress = progressRecords.reduce((acc, p) => {
        acc[p.lessonId] = p.isCompleted === 1;
        return acc;
      }, {} as Record<number, boolean>);
    }

    // Mark isCompleted based on user progress
    const lessonsWithProgress = allLessons.map(l => ({
      ...l,
      isCompleted: userProgress[l.id] || false,
    }));

    return {
      ...lesson,
      isCompleted: userProgress[lessonId] || false,
      prevLesson: prevLesson ? { id: prevLesson.id, lessonName: prevLesson.lessonName } : null,
      nextLesson: nextLesson ? { id: nextLesson.id, lessonName: nextLesson.lessonName } : null,
      courseLessons: lessonsWithProgress,
    };
  }

  async markCompleted(userId: number, lessonId: number) {
    const existing = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });

    if (existing) {
      existing.isCompleted = 1;
      existing.completedAt = new Date();
      return this.progressRepository.save(existing);
    }

    const progress = this.progressRepository.create({
      userId,
      lessonId,
      isCompleted: 1,
      completedAt: new Date(),
    });
    return this.progressRepository.save(progress);
  }

  async markIncomplete(userId: number, lessonId: number) {
    const existing = await this.progressRepository.findOne({
      where: { userId, lessonId },
    });
    if (existing) {
      existing.isCompleted = 0;
      existing.completedAt = null as any;
      return this.progressRepository.save(existing);
    }
    return null;
  }

  async getLessonProgress(userId: number, courseId: number) {
    const lessons = await this.lessonRepository.find({
      where: { courseId },
      order: { lessonOrder: 'ASC' },
    });

    const lessonIds = lessons.map(l => l.id);
    const progressRecords = await this.progressRepository.find({
      where: { userId, lessonId: In(lessonIds) },
    });

    const progressMap = progressRecords.reduce((acc, p) => {
      acc[p.lessonId] = p.isCompleted === 1;
      return acc;
    }, {} as Record<number, boolean>);

    return lessons.map(l => ({
      id: l.id,
      lessonName: l.lessonName,
      lessonOrder: l.lessonOrder,
      isCompleted: progressMap[l.id] || false,
    }));
  }
}