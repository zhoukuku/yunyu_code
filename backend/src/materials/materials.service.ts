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

    const sanitized = keyword
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');

    const query = this.materialRepository.createQueryBuilder('material')
      .where('material.isPublic = :isPublic', { isPublic: true })
      .andWhere('(material.name LIKE :keyword OR material.description LIKE :keyword OR material.tags LIKE :keyword)', {
        keyword: `%${sanitized}%`,
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
    const stats = await this.materialRepository
      .createQueryBuilder('material')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN material.type = :image THEN 1 ELSE 0 END)', 'image')
      .addSelect('SUM(CASE WHEN material.type = :video THEN 1 ELSE 0 END)', 'video')
      .addSelect('SUM(CASE WHEN material.type = :audio THEN 1 ELSE 0 END)', 'audio')
      .addSelect('SUM(CASE WHEN material.type = :document THEN 1 ELSE 0 END)', 'document')
      .addSelect('SUM(CASE WHEN material.type = :other THEN 1 ELSE 0 END)', 'other')
      .addSelect('COALESCE(SUM(material.size), 0)', 'totalSize')
      .where('material.userId = :userId', { userId })
      .setParameter('image', MaterialType.IMAGE)
      .setParameter('video', MaterialType.VIDEO)
      .setParameter('audio', MaterialType.AUDIO)
      .setParameter('document', MaterialType.DOCUMENT)
      .setParameter('other', MaterialType.OTHER)
      .getRawOne();

    return {
      total: parseInt(stats.total, 10) || 0,
      byType: {
        [MaterialType.IMAGE]: parseInt(stats.image, 10) || 0,
        [MaterialType.VIDEO]: parseInt(stats.video, 10) || 0,
        [MaterialType.AUDIO]: parseInt(stats.audio, 10) || 0,
        [MaterialType.DOCUMENT]: parseInt(stats.document, 10) || 0,
        [MaterialType.OTHER]: parseInt(stats.other, 10) || 0,
      },
      totalSize: parseInt(stats.totalSize, 10) || 0,
    };
  }
}
