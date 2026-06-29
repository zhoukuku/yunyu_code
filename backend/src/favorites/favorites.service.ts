import { Injectable } from '@nestjs/common';
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

  async findByUser(userId: number): Promise<Favorite[]> {
    return this.favoritesRepository.find({
      where: { userId },
      relations: ['project'],
      order: { createdAt: 'DESC' },
    });
  }

  async addFavorite(userId: number, projectId: number): Promise<Favorite> {
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

  async getProjectDetails(projectId: number): Promise<Project | null> {
    return this.favoritesRepository.manager.findOne(Project, {
      where: { id: projectId },
    });
  }
}