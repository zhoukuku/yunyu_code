import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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

    // Enrich with actual content details
    const enrichedList = await Promise.all(
      featuredList.map(async (item) => {
        if (item.contentType === 'course') {
          const course = await this.courseRepository.findOne({ where: { id: item.contentId } });
          return {
            ...item,
            course,
          };
        }
        return item;
      })
    );

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
      .whereInIds(courseIds)
      .andWhere('course.status = :status', { status: 1 })
      .getMany();

    // Maintain the sort order from featured items
    const orderedCourses = courseIds.map(id => courses.find(c => c.id === id)).filter(Boolean);

    return {
      records: orderedCourses,
      total: orderedCourses.length,
    };
  }

  async getAllCoursesGroupedByHierarchy() {
    const courses = await this.courseRepository.find({
      where: { status: 1 },
      order: { id: 'ASC' },
    });

    return {
      records: courses,
      total: courses.length,
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