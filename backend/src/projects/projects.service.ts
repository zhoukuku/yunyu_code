import { Injectable, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from '../entities/project.entity';
import { CloudVariablesGateway } from '../cloud-variables/cloud-variables.gateway';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private projectsRepository: Repository<Project>,
    @Optional()
    private cloudVariablesGateway?: CloudVariablesGateway,
  ) {}

  async create(data: Partial<Project>): Promise<Project> {
    const project = this.projectsRepository.create(data);
    return this.projectsRepository.save(project);
  }

  async findAll(userId?: number, search?: string, page: number = 1, pageSize: number = 20): Promise<{ records: Project[]; total: number; current: number; size: number; pages: number }> {
    const query = this.projectsRepository.createQueryBuilder('project');
    if (userId) {
      query.where('project.userId = :userId', { userId });
    } else {
      // When no userId is specified, only show public projects
      query.where('project.isPublic = :isPublic', { isPublic: 1 });
    }
    if (search) {
      const sanitized = search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere('project.name LIKE :search', { search: `%${sanitized}%` });
    }
    query.orderBy('project.updatedAt', 'DESC');
    query.skip((page - 1) * pageSize).take(pageSize);

    const [records, total] = await query.getManyAndCount();
    return {
      records,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
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

  async updateCloudVariables(id: number, cloudVariables: { name: string; value: string }[], userId?: number) {
    await this.projectsRepository.update(id, { cloudVariables });

    // Broadcast real-time cloud variable update via WebSocket
    this.cloudVariablesGateway?.broadcastCloudVariableUpdate({
      projectId: id,
      variables: cloudVariables,
      updatedBy: userId,
      timestamp: Date.now(),
    });

    return this.findOne(id);
  }
}