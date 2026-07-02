import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hierarchy, Course, Lesson } from '../entities/course.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Hierarchy)
    private hierarchyRepository: Repository<Hierarchy>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
  ) {}

  async getHierarchy() {
    return this.hierarchyRepository.find();
  }

  async getCourses(hierarchyId?: string, filters?: {
    difficulty?: number;
    status?: number;
    teacher?: string;
    search?: string;
    page?: number;
    pageSize?: number;
  }) {
    const query = this.courseRepository.createQueryBuilder('course');

    if (hierarchyId) {
      query.andWhere('course.hierarchyId = :hierarchyId', { hierarchyId });
    }

    if (filters?.difficulty && filters.difficulty > 0) {
      query.andWhere('course.difficulty = :difficulty', { difficulty: filters.difficulty });
    }

    if (filters?.status !== undefined && filters.status !== null) {
      query.andWhere('course.status = :status', { status: filters.status });
    }

    if (filters?.teacher) {
      // Sanitize LIKE special characters to prevent wildcard injection
      const sanitizedTeacher = filters.teacher
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere('course.teacher LIKE :teacher', { teacher: `%${sanitizedTeacher}%` });
    }

    if (filters?.search) {
      // Sanitize LIKE special characters to prevent wildcard injection
      const sanitized = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere('(course.courseName LIKE :search OR course.description LIKE :search)', { search: `%${sanitized}%` });
    }

    query.orderBy('course.id', 'ASC');

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [courses, total] = await query.getManyAndCount();
    return {
      records: courses,
      total,
    };
  }

  async getCourse(id: number) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) return null;

    const lessons = await this.lessonRepository.find({
      where: { courseId: id },
      order: { lessonOrder: 'ASC' },
    });

    return {
      ...course,
      lessons,
    };
  }

  async getLessons(courseId: number) {
    return this.lessonRepository.find({
      where: { courseId },
      order: { lessonOrder: 'ASC' },
    });
  }

  // All notice-related methods (createNotice, updateNotice, deleteNotice) moved to
  // NoticesService to consolidate notice management under a single module.

  async createHierarchy(data: Partial<Hierarchy>) {
    const hierarchy = this.hierarchyRepository.create(data);
    return this.hierarchyRepository.save(hierarchy);
  }

  async createCourse(data: Partial<Course>) {
    const course = this.courseRepository.create(data);
    return this.courseRepository.save(course);
  }

  async createLesson(data: Partial<Lesson>) {
    const lesson = this.lessonRepository.create(data);
    return this.lessonRepository.save(lesson);
  }

  async updateCourseStatus(id: number, status: number) {
    await this.courseRepository.update(id, { status });
    return this.courseRepository.findOne({ where: { id } });
  }

  async deleteCourse(id: number) {
    await this.courseRepository.delete(id);
    return { success: true };
  }

  async updateCourse(id: number, data: Partial<Course>) {
    await this.courseRepository.update(id, data);
    return this.courseRepository.findOne({ where: { id } });
  }
}
