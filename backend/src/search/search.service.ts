import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SearchHistory } from './search.entity';
import { Course } from '../entities/course.entity';
import { Post } from '../entities/post.entity';
import { Project } from '../entities/project.entity';

@Injectable()
export class SearchService {
  constructor(
    @InjectRepository(SearchHistory)
    private searchHistoryRepository: Repository<SearchHistory>,
    @InjectRepository(Course)
    private courseRepository: Repository<Course>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Project)
    private projectRepository: Repository<Project>,
  ) {}

  async globalSearch(keyword: string, userId?: number): Promise<{
    courses: Course[];
    posts: Post[];
    projects: Project[];
  }> {
    const sanitized = keyword
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
    const likeKeyword = `%${sanitized}%`;

    const courses = await this.courseRepository
      .createQueryBuilder('course')
      .where('course.status = :status', { status: 1 })
      .andWhere('(course.courseName LIKE :keyword OR course.description LIKE :keyword)', { keyword: likeKeyword })
      .orderBy('course.createdAt', 'DESC')
      .take(10)
      .getMany();

    const posts = await this.postRepository
      .createQueryBuilder('post')
      .where('post.title LIKE :keyword', { keyword: likeKeyword })
      .orWhere('post.description LIKE :keyword', { keyword: likeKeyword })
      .orderBy('post.createdAt', 'DESC')
      .take(10)
      .getMany();

    const projects = await this.projectRepository
      .createQueryBuilder('project')
      .where('project.name LIKE :keyword', { keyword: likeKeyword })
      .orderBy('project.updatedAt', 'DESC')
      .take(10)
      .getMany();

    return { courses, posts, projects };
  }

  async saveSearchHistory(userId: number, keyword: string): Promise<SearchHistory> {
    // Deduplicate: if the user already searched this keyword, update the timestamp
    const existing = await this.searchHistoryRepository.findOne({
      where: { userId, keyword },
    });
    if (existing) {
      await this.searchHistoryRepository.update(existing.id, { createdAt: new Date() });
      return { ...existing, createdAt: new Date() };
    }
    const history = this.searchHistoryRepository.create({ userId, keyword });
    return this.searchHistoryRepository.save(history);
  }

  async getSearchHistory(userId: number, limit: number = 10): Promise<SearchHistory[]> {
    return this.searchHistoryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async clearSearchHistory(userId: number): Promise<void> {
    await this.searchHistoryRepository.delete({ userId });
  }
}
