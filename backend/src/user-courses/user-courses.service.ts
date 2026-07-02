import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCourse } from '../entities/user-course.entity';
import { Course } from '../entities/course.entity';

@Injectable()
export class UserCoursesService {
  constructor(
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
  ) {}

  async enroll(userId: number, courseId: number) {
    // Validate course exists
    const course = await this.userCourseRepository.manager.findOne(Course, { where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const existing = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      if (existing.status !== 1) {
        // Re-enrolling: update status and increment studentCount
        existing.status = 1;
        const result = await this.userCourseRepository.save(existing);
        await this.userCourseRepository.manager.increment(Course, { id: courseId }, 'studentCount', 1);
        return result;
      }
      return existing;
    }
    const userCourse = this.userCourseRepository.create({
      userId,
      courseId,
      status: 1,
    });
    const result = await this.userCourseRepository.save(userCourse);
    // Increment studentCount on the course
    await this.userCourseRepository.manager.increment(Course, { id: courseId }, 'studentCount', 1);
    return result;
  }

  async unenroll(userId: number, courseId: number) {
    const existing = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      const wasEnrolled = existing.status === 1;
      existing.status = 0;
      const result = await this.userCourseRepository.save(existing);
      // Only decrement if user was actually enrolled
      if (wasEnrolled) {
        await this.userCourseRepository.manager.decrement(Course, { id: courseId }, 'studentCount', 1);
      }
      return result;
    }
    return null;
  }

  async getUserCourses(userId: number) {
    return this.userCourseRepository.find({
      where: { userId, status: 1 },
      relations: ['course', 'lastLesson'],
      order: { enrolledAt: 'DESC' },
    });
  }

  async isEnrolled(userId: number, courseId: number) {
    const record = await this.userCourseRepository.findOne({
      where: { userId, courseId, status: 1 },
    });
    return !!record;
  }

  async updateProgress(userId: number, courseId: number, completedLessons: number, lastLessonId?: number) {
    const existing = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      existing.completedLessons = completedLessons;
      if (lastLessonId) {
        existing.lastLessonId = lastLessonId;
      }
      return this.userCourseRepository.save(existing);
    }
    return null;
  }
}