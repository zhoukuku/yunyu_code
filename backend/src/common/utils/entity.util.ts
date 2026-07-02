import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';

/**
 * Find an entity by ID or throw NotFoundException.
 * Reduces boilerplate for common find-or-throw pattern.
 */
export async function findEntityOrThrow<T>(
  repo: Repository<T>,
  id: number,
  entityName: string,
): Promise<T> {
  const entity = await repo.findOne({ where: { id } as any });
  if (!entity) {
    throw new NotFoundException(`${entityName}不存在`);
  }
  return entity;
}
