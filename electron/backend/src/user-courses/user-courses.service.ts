import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserCourse } from '../entities/user-course.entity';

@Injectable()
export class UserCoursesService {
  constructor(
    @InjectRepository(UserCourse)
    private userCourseRepository: Repository<UserCourse>,
  ) {}

  async enroll(userId: number, courseId: number) {
    const existing = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      existing.status = 1;
      return this.userCourseRepository.save(existing);
    }
    const userCourse = this.userCourseRepository.create({
      userId,
      courseId,
      status: 1,
    });
    return this.userCourseRepository.save(userCourse);
  }

  async unenroll(userId: number, courseId: number) {
    const existing = await this.userCourseRepository.findOne({
      where: { userId, courseId },
    });
    if (existing) {
      existing.status = 0;
      return this.userCourseRepository.save(existing);
    }
    return null;
  }

  async getUserCourses(userId: number) {
    return this.userCourseRepository.find({
      where: { userId, status: 1 },
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