import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material, MaterialType } from '../entities/material.entity';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async create(userId: number, data: Partial<Material>): Promise<Material> {
    const material = this.materialRepository.create({
      ...data,
      userId,
    });
    return this.materialRepository.save(material);
  }

  async findByUser(userId: number, filters?: {
    type?: MaterialType;
    isPublic?: boolean;
    page?: number;
    pageSize?: number;
  }): Promise<{ materials: Material[]; total: number }> {
    const { type, isPublic, page = 1, pageSize = 20 } = filters || {};

    const query = this.materialRepository.createQueryBuilder('material')
      .where('material.userId = :userId', { userId });

    if (type) {
      query.andWhere('material.type = :type', { type });
    }

    if (isPublic !== undefined) {
      query.andWhere('material.isPublic = :isPublic', { isPublic });
    }

    const [materials, total] = await query
      .orderBy('material.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { materials, total };
  }

  async findById(id: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    return material;
  }

  async update(id: number, userId: number, data: Partial<Material>): Promise<Material> {
    const material = await this.findOneByUser(id, userId);
    Object.assign(material, data);
    return this.materialRepository.save(material);
  }

  async delete(id: number, userId: number): Promise<void> {
    const material = await this.findOneByUser(id, userId);
    await this.materialRepository.remove(material);
  }

  async findOneByUser(id: number, userId: number): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id, userId },
    });
    if (!material) {
      throw new NotFoundException('Material not found');
    }
    return material;
  }

  async incrementDownloads(id: number): Promise<void> {
    await this.materialRepository.increment({ id }, 'downloads', 1);
  }

  async incrementViews(id: number): Promise<void> {
    await this.materialRepository.increment({ id }, 'views', 1);
  }

  async getPublicMaterials(filters?: {
    type?: MaterialType;
    page?: number;
    pageSize?: number;
  }): Promise<{ materials: Material[]; total: number }> {
    const { type, page = 1, pageSize = 20 } = filters || {};

    const query = this.materialRepository.createQueryBuilder('material')
      .where('material.isPublic = :isPublic', { isPublic: true })
      .leftJoinAndSelect('material.user', 'user');

    if (type) {
      query.andWhere('material.type = :type', { type });
    }

    const [materials, total] = await query
      .orderBy('material.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { materials, total };
  }

  async searchMaterials(keyword: string, filters?: {
    type?: MaterialType;
    page?: number;
    pageSize?: number;
  }): Promise<{ materials: Material[]; total: number }> {
    const { type, page = 1, pageSize = 20 } = filters || {};

    const query = this.materialRepository.createQueryBuilder('material')
      .where('material.isPublic = :isPublic', { isPublic: true })
      .andWhere('(material.name LIKE :keyword OR material.description LIKE :keyword OR material.tags LIKE :keyword)', {
        keyword: `%${keyword}%`,
      });

    if (type) {
      query.andWhere('material.type = :type', { type });
    }

    const [materials, total] = await query
      .orderBy('material.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return { materials, total };
  }

  async getStats(userId: number): Promise<{
    total: number;
    byType: Record<MaterialType, number>;
    totalSize: number;
  }> {
    const materials = await this.materialRepository.find({ where: { userId } });

    const byType: Record<MaterialType, number> = {
      [MaterialType.IMAGE]: 0,
      [MaterialType.VIDEO]: 0,
      [MaterialType.AUDIO]: 0,
      [MaterialType.DOCUMENT]: 0,
      [MaterialType.OTHER]: 0,
    };

    let totalSize = 0;

    materials.forEach(m => {
      byType[m.type]++;
      totalSize += m.size;
    });

    return {
      total: materials.length,
      byType,
      totalSize,
    };
  }
}
