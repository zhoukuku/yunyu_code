import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findAllWithPagination(page: number = 1, pageSize: number = 10) {
    const [users, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      records: users,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByUsername(username: string) {
    return this.usersRepository.findOne({ where: { username } });
  }

  async updateStatus(id: number, status: number) {
    await this.usersRepository.update(id, { status });
    return this.findOne(id);
  }

  async updateRole(id: number, role: number) {
    await this.usersRepository.update(id, { role });
    return this.findOne(id);
  }

  async updateUser(id: number, data: Partial<User>) {
    await this.usersRepository.update(id, data);
    return this.findOne(id);
  }

  async create(data: Partial<User>) {
    const user = this.usersRepository.create(data);
    return this.usersRepository.save(user);
  }

  async delete(id: number) {
    return this.usersRepository.delete(id);
  }

  async search(keyword: string, page: number = 1, pageSize: number = 10) {
    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (keyword) {
      // Sanitize LIKE special characters to prevent wildcard injection
      const sanitized = keyword
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      queryBuilder.where(
        'user.username LIKE :keyword OR user.account LIKE :keyword OR user.name LIKE :keyword OR user.nickname LIKE :keyword',
        { keyword: `%${sanitized}%` }
      );
    }

    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      records: users,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }
}