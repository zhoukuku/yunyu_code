import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Hierarchy, Course, Lesson, Notice } from '../entities/course.entity';
import { CourseFavorite } from '../entities/course-favorite.entity';

export interface ThemeNode {
  name: string;
  id: string;
  hierarchies: Array<{ hierarchyId: string; hierarchyName: string; courseCount: number }>;
}

export interface StandardNode {
  name: string;
  id: string;
  children: Record<string, ThemeNode>;
}

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

  async getHierarchy(limit = 1000) {
    return this.hierarchyRepository.find({
      take: limit,
    });
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

    // 白名单校验排序字段防止 SQL 注入
    const ALLOWED_SORT_COLUMNS = ['course.id', 'course.courseName', 'course.createdAt', 'course.difficulty', 'course.studentCount'];
    const ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];
    const sortField = ALLOWED_SORT_COLUMNS.includes(filters?.sortBy || '') ? filters!.sortBy! : 'course.id';
    const sortOrder = ALLOWED_SORT_ORDERS.includes(filters?.sortOrder || '') ? filters!.sortOrder! : 'ASC';
    query.orderBy(sortField, sortOrder as 'ASC' | 'DESC');

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

  async markNoticeAsRead(id: number, userId: number): Promise<void> {
    await this.noticeRepository.update(
      { id, userId },
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
    if (!data.courseId) {
      throw new BadRequestException('课程ID不能为空');
    }
    // Validate course exists
    const course = await this.courseRepository.findOne({ where: { id: data.courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }
    // Auto-set lessonOrder if not explicitly provided
    if (data.lessonOrder === undefined || data.lessonOrder === null) {
      const maxOrderLesson = await this.lessonRepository.find({
        where: { courseId: data.courseId },
        order: { lessonOrder: 'DESC' },
        take: 1,
      });
      data.lessonOrder = maxOrderLesson.length > 0 ? (maxOrderLesson[0].lessonOrder || 0) + 1 : 1;
    }
    const lesson = this.lessonRepository.create(data);
    const savedLesson = await this.lessonRepository.save(lesson);

    // Update course totalLessons count
    const lessonCount = await this.lessonRepository.count({ where: { courseId: data.courseId } });
    await this.courseRepository.update(data.courseId, { totalLessons: lessonCount });

    return savedLesson;
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

    // Prevent changing certain fields that are managed by the system
    const allowedData: Partial<Course> = {};
    for (const key of Object.keys(data) as (keyof Course)[]) {
      if (!['id', 'createdAt', 'studentCount', 'totalLessons', 'completedLessons'].includes(key)) {
        (allowedData as Record<string, unknown>)[key] = data[key];
      }
    }
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

    // Handle lessonOrder conflicts: if new order conflicts with another lesson, swap them
    if (data.lessonOrder !== undefined && data.lessonOrder !== lesson.lessonOrder) {
      const conflict = await this.lessonRepository.findOne({
        where: { courseId: lesson.courseId, lessonOrder: data.lessonOrder },
      });
      if (conflict && conflict.id !== id) {
        // Swap: assign the old order to the conflicting lesson
        conflict.lessonOrder = lesson.lessonOrder;
        await this.lessonRepository.save(conflict);
      }
    }

    const { id: _id, createdAt: _createdAt, courseId: _courseId, ...allowedData } = data as Record<string, unknown>;
    Object.assign(lesson, allowedData);

    return this.lessonRepository.save(lesson);
  }

  async deleteCourse(id: number) {
    const course = await this.courseRepository.findOne({ where: { id } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

    // Delete associated lessons and favorites first
    await this.lessonRepository.delete({ courseId: id });
    await this.courseFavoriteRepository.delete({ courseId: id });
    await this.courseRepository.delete(id);

    return { success: true };
  }

  async deleteLesson(id: number) {
    const lesson = await this.lessonRepository.findOne({ where: { id } });
    if (!lesson) {
      throw new NotFoundException('课时不存在');
    }

    const courseId = lesson.courseId;
    await this.lessonRepository.delete(id);

    // Update course totalLessons count
    const lessonCount = await this.lessonRepository.count({ where: { courseId } });
    await this.courseRepository.update(courseId, { totalLessons: lessonCount });

    return { success: true };
  }

  async updateNotice(id: number, data: Partial<Notice>) {
    const notice = await this.noticeRepository.findOne({ where: { id } });
    if (!notice) {
      throw new NotFoundException('通知不存在');
    }

    const { id: _id, createdAt: _createdAt, ...allowedData } = data as Record<string, unknown>;
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
      const hierarchy = cat.hierarchyId ? hierarchyMap.get(cat.hierarchyId) : undefined;
      return {
        hierarchyId: cat.hierarchyId || '未分类',
        hierarchyName: hierarchy?.hierarchyName || cat.hierarchyId || '未分类',
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
    const tree: Record<string, StandardNode> = {};

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
    return Object.values(tree).map((standard) => ({
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

    // Get matching courses (search both courseName and description)
    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .where('(course.courseName LIKE :keyword OR course.description LIKE :keyword)', { keyword: `%${sanitized}%` })
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
    // Use query builder with inner join to only count favorites whose course still exists
    const query = this.courseFavoriteRepository
      .createQueryBuilder('favorite')
      .innerJoinAndSelect('favorite.course', 'course')
      .where('favorite.userId = :userId', { userId })
      .orderBy('favorite.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [favorites, total] = await query.getManyAndCount();

    return {
      records: favorites.map(f => f.course).filter(Boolean),
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async toggleFavorite(userId: number, courseId: number) {
    // Validate course exists
    const course = await this.courseRepository.findOne({ where: { id: courseId } });
    if (!course) {
      throw new NotFoundException('课程不存在');
    }

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