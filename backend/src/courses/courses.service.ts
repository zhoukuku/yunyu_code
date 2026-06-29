import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hierarchy, Course, Lesson, Notice } from '../entities/course.entity';
import { CourseFavorite } from '../entities/course-favorite.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Hierarchy)
    private hierarchyRepository: Repository<Hierarchy>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Lesson)
    private lessonRepository: Repository<Lesson>,
    @InjectRepository(Notice)
    private noticeRepository: Repository<Notice>,
    @InjectRepository(CourseFavorite)
    private courseFavoriteRepository: Repository<CourseFavorite>,
  ) {}

  private sanitizeSearchInput(input: string): string {
    return input
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
  }

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
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
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
      const sanitizedTeacher = this.sanitizeSearchInput(filters.teacher);
      query.andWhere('course.teacher LIKE :teacher', { teacher: `%${sanitizedTeacher}%` });
    }

    if (filters?.search) {
      const sanitized = this.sanitizeSearchInput(filters.search);
      query.andWhere('(course.courseName LIKE :search OR course.description LIKE :search)', { search: `%${sanitized}%` });
    }

    // Sorting
    const sortField = filters?.sortBy || 'course.id';
    const sortOrder = filters?.sortOrder || 'ASC';
    query.orderBy(sortField, sortOrder);

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [courses, total] = await query.getManyAndCount();
    return {
      records: courses,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getCourse(id: number) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const lessons = await this.lessonRepository.find({
      where: { courseId: id },
      order: { lessonOrder: 'ASC' },
    });

    return {
      ...course,
      lessons,
      lessonCount: lessons.length,
    };
  }

  async getLessons(courseId: number) {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    return this.lessonRepository.find({
      where: { courseId },
      order: { lessonOrder: 'ASC' },
    });
  }

  async getLesson(courseId: number, lessonId: number) {
    const lesson = await this.lessonRepository.findOne({
      where: { id: lessonId, courseId },
    });
    if (!lesson) {
      throw new NotFoundException('课时不存在');
    }
    return lesson;
  }

  async getNotices(filters?: {
    page?: number;
    pageSize?: number;
    noticeType?: string;
  }) {
    const query = this.noticeRepository.createQueryBuilder('notice');

    if (filters?.noticeType) {
      query.andWhere('notice.noticeType = :noticeType', { noticeType: filters.noticeType });
    }

    query.orderBy('notice.sendTime', 'DESC');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 10;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [notices, total] = await query.getManyAndCount();
    return {
      records: notices,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getNoticePopup() {
    const now = Date.now();
    const notices = await this.noticeRepository
      .createQueryBuilder('notice')
      .where('notice.popupStartTime <= :now', { now })
      .andWhere('notice.popupEndTime >= :now', { now })
      .andWhere('notice.isRead = :isRead', { isRead: 0 })
      .getMany();

    return {
      records: notices,
      total: notices.length,
    };
  }

  async markNoticeAsRead(noticeId: number, userId: number): Promise<void> {
    await this.noticeRepository.update(
      { noticeId: String(noticeId), userId },
      { isRead: 1 }
    );
  }

  async createHierarchy(data: Partial<Hierarchy>) {
    const hierarchy = this.hierarchyRepository.create(data);
    return this.hierarchyRepository.save(hierarchy);
  }

  async createCourse(data: Partial<Course>) {
    if (!data.courseName || data.courseName.trim().length === 0) {
      throw new BadRequestException('课程名称不能为空');
    }
    const course = this.courseRepository.create(data);
    return this.courseRepository.save(course);
  }

  async createLesson(data: Partial<Lesson>) {
    if (!data.lessonName || data.lessonName.trim().length === 0) {
      throw new BadRequestException('课时名称不能为空');
    }
    const lesson = this.lessonRepository.create(data);
    return this.lessonRepository.save(lesson);
  }

  async createNotice(data: Partial<Notice>) {
    if (!data.title || data.title.trim().length === 0) {
      throw new BadRequestException('通知标题不能为空');
    }
    const notice = this.noticeRepository.create({
      ...data,
      noticeId: data.noticeId || `notice_${Date.now()}`,
    });
    return this.noticeRepository.save(notice);
  }

  async updateCourse(id: number, data: Partial<Course>) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    // Prevent changing certain fields
    const { id: _id, createdAt: _createdAt, ...allowedData } = data as any;
    Object.assign(course, allowedData);

    return this.courseRepository.save(course);
  }

  async updateCourseStatus(id: number, status: number) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    if (![0, 1].includes(status)) {
      throw new BadRequestException('无效的状态值');
    }

    course.status = status;
    return this.courseRepository.save(course);
  }

  async updateLesson(id: number, data: Partial<Lesson>) {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('课时不存在');
    }

    const { id: _id, createdAt: _createdAt, ...allowedData } = data as any;
    Object.assign(lesson, allowedData);

    return this.lessonRepository.save(lesson);
  }

  async deleteCourse(id: number) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    // Delete associated lessons first
    await this.lessonRepository.delete({ courseId: id });
    await this.courseRepository.delete(id);

    return { success: true };
  }

  async deleteLesson(id: number) {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('课时不存在');
    }

    await this.lessonRepository.delete(id);
    return { success: true };
  }

  async updateNotice(id: number, data: Partial<Notice>) {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }

    const { id: _id, createdAt: _createdAt, ...allowedData } = data as any;
    Object.assign(notice, allowedData);

    return this.noticeRepository.save(notice);
  }

  async deleteNotice(id: number) {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }

    await this.noticeRepository.delete(id);
    return { success: true };
  }

  async getFeaturedCourses(limit: number = 10) {
    return this.courseRepository.find({
      where: { status: 1 },
      order: { studentCount: 'DESC' },
      take: limit,
    });
  }

  async getCourseStats(courseId: number): Promise<{
    totalLessons: number;
    totalDuration: number;
    studentCount: number;
  }> {
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    const lessons = await this.lessonRepository.find({ where: { courseId } });

    return {
      totalLessons: lessons.length,
      totalDuration: lessons.reduce((sum, l) => sum + (l.duration || 0), 0),
      studentCount: course.studentCount || 0,
    };
  }

  // ============ Course Categories (courseFeatures) ============
  async getCourseCategories() {
    // Group courses by hierarchyId and get category info with counts
    const categories = await this.courseRepository
      .createQueryBuilder('course')
      .select('course.hierarchyId', 'hierarchyId')
      .addSelect('COUNT(*)', 'courseCount')
      .groupBy('course.hierarchyId')
      .getRawMany();

    // Get hierarchy details
    const hierarchies = await this.hierarchyRepository.find();
    const hierarchyMap = new Map(hierarchies.map(h => [h.hierarchyId, h]));

    return categories.map(cat => {
      const hierarchy = hierarchyMap.get(cat.hierarchyId);
      return {
        hierarchyId: cat.hierarchyId,
        hierarchyName: hierarchy?.hierarchyName || cat.hierarchyId,
        standardClassifyId: hierarchy?.standardClassifyId || '',
        standardClassifyName: hierarchy?.standardClassifyName || '',
        themeClassifyId: hierarchy?.themeClassifyId || '',
        themeClassifyName: hierarchy?.themeClassifyName || '',
        courseCount: parseInt(cat.courseCount, 10),
      };
    });
  }

  async getCategoryTree() {
    const hierarchies = await this.hierarchyRepository.find();
    const categories = await this.getCourseCategories();

    // Build tree structure: standardClassify -> themeClassify -> hierarchy
    const tree: Record<string, any> = {};

    for (const cat of categories) {
      const standardName = cat.standardClassifyName || '其他';
      const themeName = cat.themeClassifyName || '其他';

      if (!tree[standardName]) {
        tree[standardName] = {
          name: standardName,
          id: cat.standardClassifyId,
          children: {},
        };
      }

      if (!tree[standardName].children[themeName]) {
        tree[standardName].children[themeName] = {
          name: themeName,
          id: cat.themeClassifyId,
          hierarchies: [],
        };
      }

      tree[standardName].children[themeName].hierarchies.push({
        hierarchyId: cat.hierarchyId,
        hierarchyName: cat.hierarchyName,
        courseCount: cat.courseCount,
      });
    }

    // Convert to array format
    return Object.values(tree).map((standard: any) => ({
      ...standard,
      children: Object.values(standard.children),
    }));
  }

  async getCoursesByCategory(hierarchyId: string, page = 1, pageSize = 20) {
    const [courses, total] = await this.courseRepository.findAndCount({
      where: { hierarchyId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      records: courses,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  // ============ Search (searchWorks) ============
  async getSearchSuggestions(keyword: string, limit = 10) {
    if (!keyword || keyword.trim().length === 0) {
      return [];
    }

    const sanitized = this.sanitizeSearchInput(keyword);

    // Get matching courses
    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .where('course.courseName LIKE :keyword', { keyword: `%${sanitized}%` })
      .select(['course.id', 'course.courseName', 'course.teacher', 'course.coverImage'])
      .orderBy('course.studentCount', 'DESC')
      .take(limit)
      .getMany();

    return courses.map(c => ({
      type: 'course',
      id: c.id,
      name: c.courseName,
      subtitle: c.teacher,
      coverImage: c.coverImage,
    }));
  }

  async getHotSearchTerms(limit = 10) {
    // Return popular courses as hot terms
    const courses = await this.courseRepository.find({
      where: { status: 1 },
      order: { studentCount: 'DESC' },
      take: limit,
    });

    return courses.map(c => ({
      keyword: c.courseName,
      courseId: c.id,
      studentCount: c.studentCount,
    }));
  }

  // ============ Course Favorites (favoritesWorks) ============
  async getFavoriteCourses(userId: number, page = 1, pageSize = 20) {
    const [favorites, total] = await this.courseFavoriteRepository.findAndCount({
      where: { userId },
      relations: ['course'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      records: favorites.map(f => f.course).filter(Boolean),
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async toggleFavorite(userId: number, courseId: number) {
    const existing = await this.courseFavoriteRepository.findOne({
      where: { userId, courseId },
    });

    if (existing) {
      await this.courseFavoriteRepository.delete(existing.id);
      return { favorited: false };
    }

    const favorite = this.courseFavoriteRepository.create({ userId, courseId });
    await this.courseFavoriteRepository.save(favorite);
    return { favorited: true };
  }

  async isCourseFavorited(userId: number, courseId: number): Promise<boolean> {
    const favorite = await this.courseFavoriteRepository.findOne({
      where: { userId, courseId },
    });
    return !!favorite;
  }
}