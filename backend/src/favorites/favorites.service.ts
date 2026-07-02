import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { Project } from '../entities/project.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private favoritesRepository: Repository<Favorite>,
  ) {}

  async findByUser(userId: number, page: number = 1, pageSize: number = 20): Promise<{ records: Favorite[]; total: number; current: number; size: number; pages: number }> {
    // Use query builder to only select safe project fields (exclude content/projectData)
    const [records, total] = await this.favoritesRepository.findAndCount({
      where: { userId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    // Sanitize: remove sensitive project data from favorited projects not owned by the user
    const sanitized = records.map(fav => {
      if (fav.project && fav.project.userId !== userId) {
        const { content, projectData, cloudVariables, ...safeProject } = fav.project as unknown as Record<string, unknown>;
        return { ...fav, project: safeProject };
      }
      return fav;
    });

    return {
      records: sanitized as Favorite[],
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async addFavorite(userId: number, projectId: number): Promise<Favorite> {
    // Validate project exists
    const project = await this.favoritesRepository.manager.findOne(Project, {
      where: { id: projectId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const existing = await this.favoritesRepository.findOne({
      where: { userId, projectId },
    });
    if (existing) {
      return existing;
    }
    const favorite = this.favoritesRepository.create({ userId, projectId });
    return this.favoritesRepository.save(favorite);
  }

  async removeFavorite(userId: number, projectId: number): Promise<void> {
    await this.favoritesRepository.delete({ userId, projectId });
  }

  async isFavorited(userId: number, projectId: number): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: { userId, projectId },
    });
    return !!favorite;
  }
}
