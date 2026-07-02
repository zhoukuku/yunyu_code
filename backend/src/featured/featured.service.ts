import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { FeaturedContent } from '../entities/featured.entity';
import { Course } from '../entities/course.entity';

@Injectable()
export class FeaturedService {
  constructor(
    @InjectRepository(FeaturedContent)
    private featuredRepository: Repository<FeaturedContent>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
  ) {}

  async getFeaturedContents(category?: string) {
    const query = this.featuredRepository.createQueryBuilder('featured')
      .where('featured.status = :status', { status: 1 })
      .orderBy('featured.sortOrder', 'ASC');

    if (category) {
      query.andWhere('featured.category = :category', { category });
    }

    const featuredList = await query.getMany();

    // Batch load related courses to avoid N+1 queries
    const courseIds = featuredList
      .filter(item => item.contentType === 'course')
      .map(item => item.contentId);
    const courses = courseIds.length > 0
      ? await this.courseRepository.findBy({ id: In(courseIds) })
      : [];
    const courseMap = new Map(courses.map(c => [c.id, c]));

    // Enrich with actual content details
    const enrichedList = featuredList.map((item) => {
      if (item.contentType === 'course') {
        return { ...item, course: courseMap.get(item.contentId) || null };
      }
      return item;
    });

    return {
      records: enrichedList,
      total: enrichedList.length,
    };
  }

  async getFeaturedCategories() {
    const result = await this.featuredRepository
      .createQueryBuilder('featured')
      .select('DISTINCT featured.category', 'category')
      .where('featured.status = :status', { status: 1 })
      .andWhere('featured.category IS NOT NULL')
      .getRawMany();

    return result.map(r => r.category).filter(Boolean);
  }

  async getCoursesByCategory(category: string) {
    const featuredItems = await this.featuredRepository.find({
      where: { category, status: 1, contentType: 'course' },
      order: { sortOrder: 'ASC' },
    });

    const courseIds = featuredItems.map(item => item.contentId);
    if (courseIds.length === 0) return { records: [], total: 0 };

    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .where('course.id IN (:...ids)', { ids: courseIds })
      .andWhere('course.status = :status', { status: 1 })
      .getMany();

    // Maintain the sort order from featured items
    const orderedCourses = courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean);

    return {
      records: orderedCourses,
      total: orderedCourses.length,
    };
  }

  async getAllCourses(page: number = 1, pageSize: number = 20) {
    const [courses, total] = await this.courseRepository.findAndCount({
      where: { status: 1 },
      order: { id: 'ASC' },
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

  async createFeaturedContent(data: Partial<FeaturedContent>) {
    const featured = this.featuredRepository.create(data);
    return this.featuredRepository.save(featured);
  }

  async updateFeaturedContent(id: number, data: Partial<FeaturedContent>) {
    await this.featuredRepository.update(id, data);
    return this.featuredRepository.findOne({ where: { id } });
  }

  async deleteFeaturedContent(id: number) {
    await this.featuredRepository.delete(id);
    return { success: true };
  }
}