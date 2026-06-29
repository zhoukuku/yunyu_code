import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.projectsRepository.create(data);
    return this.projectsRepository.save(project);
  }

  async findAll(userId?: number, search?: string): Promise<Project[]> {
    const query = this.projectsRepository.createQueryBuilder('project');
    if (userId) {
      query.where('project.userId = :userId', { userId });
    }
    if (search) {
      query.andWhere('project.name LIKE :search', { search: `%${search}%` });
    }
    query.orderBy('project.updatedAt', 'DESC');
    return query.getMany();
  }

  async findOne(id: number): Promise<Project | null> {
    return this.projectsRepository.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Project>): Promise<Project | null> {
    await this.projectsRepository.update(id, data);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.projectsRepository.delete(id);
  }

  async remix(id: number, userId: number, newName?: string): Promise<Project | null> {
    const original = await this.findOne(id);
    if (!original) return null;

    const remixedProject = this.projectsRepository.create({
      name: newName || `${original.name} (派生)`,
      type: original.type,
      content: original.content,
      projectData: original.projectData,
      userId: userId,
      isPublic: 0,
      remixedFrom: id,
    });
    return this.projectsRepository.save(remixedProject);
  }

  async getCloudVariables(id: number) {
    const project = await this.findOne(id);
    return project?.cloudVariables || [];
  }

  async updateCloudVariables(id: number, cloudVariables: { name: string; value: string }[]) {
    await this.projectsRepository.update(id, { cloudVariables });
    return this.findOne(id);
  }
}