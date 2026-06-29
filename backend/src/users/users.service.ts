import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { BatchAccountItemDto, BatchCreateResultDto } from './dto/batch-account.dto';

const SALT_ROUNDS = 12;
const DEFAULT_PASSWORD = '123456';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  private sanitizeSearchInput(input: string): string {
    // Escape special LIKE characters to prevent SQL injection
    return input
      .replace(/\\/g, '\\\\')
      .replace(/%/g, '\\%')
      .replace(/_/g, '\\_');
  }

  async findAll(filters?: {
    role?: number;
    status?: number;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ users: Partial<User>[]; total: number }> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (filters?.role !== undefined) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.status !== undefined) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      const sanitized = this.sanitizeSearchInput(filters.search);
      query.andWhere(
        '(user.username LIKE :search OR user.name LIKE :search OR user.account LIKE :search OR user.nickname LIKE :search)',
        { search: `%${sanitized}%` },
      );
    }

    const total = await query.getCount();

    if (filters?.page && filters?.pageSize) {
      query.skip((filters.page - 1) * filters.pageSize).take(filters.pageSize);
    }

    query.orderBy('user.createdAt', 'DESC');

    const users = await query.getMany();

    return {
      users: users.map((u) => this.sanitizeUser(u)),
      total,
    };
  }

  async findAllWithPagination(page: number = 1, pageSize: number = 10) {
    const [users, total] = await this.usersRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return {
      records: users.map((u) => this.sanitizeUser(u)),
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.sanitizeUser(user);
  }

  async findByUsername(username: string): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { username } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return this.sanitizeUser(user);
  }

  async findByAccount(account: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { account } });
  }

  async updateProfile(id: number, dto: UpdateProfileDto): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // Update allowed fields only
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.nickname !== undefined) user.nickname = dto.nickname;
    if (dto.sex !== undefined) user.sex = dto.sex;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;

    const saved = await this.usersRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<{ success: boolean }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // Verify old password
    const isValid = await bcrypt.compare(dto.oldPassword, user.password);
    if (!isValid) {
      throw new BadRequestException('原密码错误');
    }

    // Hash new password
    user.password = await bcrypt.hash(dto.newPassword, SALT_ROUNDS);
    await this.usersRepository.save(user);

    return { success: true };
  }

  async updateStatus(id: number, status: number): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (![0, 1].includes(status)) {
      throw new BadRequestException('无效的状态值');
    }

    user.status = status;
    const saved = await this.usersRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async updateRole(id: number, role: number): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (![1, 2, 3].includes(role)) {
      throw new BadRequestException('无效的角色值');
    }

    user.role = role;
    const saved = await this.usersRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async updateUser(id: number, data: Partial<User>): Promise<Partial<User>> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // Prevent updating sensitive fields
    const { password, id: _id, ...allowedData } = data as any;
    Object.assign(user, allowedData);
    const saved = await this.usersRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async create(data: Partial<User>): Promise<Partial<User>> {
    const user = this.usersRepository.create(data);
    const saved = await this.usersRepository.save(user);
    return this.sanitizeUser(saved);
  }

  async delete(id: number): Promise<{ success: boolean }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // Soft delete by setting status to 0
    user.status = 0;
    await this.usersRepository.save(user);

    return { success: true };
  }

  async search(keyword: string, page: number = 1, pageSize: number = 10) {
    const sanitizedKeyword = this.sanitizeSearchInput(keyword);

    const queryBuilder = this.usersRepository.createQueryBuilder('user');

    if (sanitizedKeyword) {
      queryBuilder.where(
        'user.username LIKE :keyword OR user.account LIKE :keyword OR user.name LIKE :keyword OR user.nickname LIKE :keyword',
        { keyword: `%${sanitizedKeyword}%` }
      );
    }

    const [users, total] = await queryBuilder
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)
      .getManyAndCount();

    return {
      records: users.map((u) => this.sanitizeUser(u)),
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getLearningStats(userId: number): Promise<{
    coursesEnrolled: number;
    coursesCompleted: number;
    totalLearningTime: number;
    achievements: number;
  }> {
    // Placeholder - would join user_courses, progress, achievements tables
    return {
      coursesEnrolled: 0,
      coursesCompleted: 0,
      totalLearningTime: 0,
      achievements: 0,
    };
  }

  async batchCreate(accounts: BatchAccountItemDto[]): Promise<BatchCreateResultDto> {
    const result: BatchCreateResultDto = { success: [], failed: [] };
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    for (const item of accounts) {
      try {
        // Check if username or account already exists
        const existingUser = await this.usersRepository.findOne({
          where: [{ username: item.username }, { account: item.account }],
        });

        if (existingUser) {
          result.failed.push({
            account: item.account,
            reason: existingUser.username === item.username ? '用户名已存在' : '账号已存在',
          });
          continue;
        }

        const user = this.usersRepository.create({
          username: item.username,
          account: item.account,
          password: hashedPassword,
          name: item.name || '',
          nickname: item.nickname || '',
          userType: item.userType ?? 2,
          role: item.role ?? 3,
          sex: item.sex ?? 0,
          status: 1,
        });

        const saved = await this.usersRepository.save(user);
        result.success.push(saved as unknown as BatchAccountItemDto);
      } catch (error) {
        result.failed.push({
          account: item.account,
          reason: error.message || '创建失败',
        });
      }
    }

    return result;
  }

  async resetPassword(accountIds: string[]): Promise<{ success: string[]; failed: { id: string; reason: string }[] }> {
    const result = { success: [] as string[], failed: [] as { id: string; reason: string }[] };
    const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, SALT_ROUNDS);

    for (const id of accountIds) {
      try {
        const user = await this.usersRepository.findOne({ where: { id: +id } });
        if (!user) {
          result.failed.push({ id, reason: '用户不存在' });
          continue;
        }
        user.password = hashedPassword;
        await this.usersRepository.save(user);
        result.success.push(id);
      } catch (error) {
        result.failed.push({ id, reason: error.message || '重置失败' });
      }
    }

    return result;
  }

  async setRole(accountIds: string[], role: number): Promise<{ success: string[]; failed: { id: string; reason: string }[] }> {
    const result = { success: [] as string[], failed: [] as { id: string; reason: string }[] };

    if (![1, 2, 3].includes(role)) {
      throw new BadRequestException('无效的角色值');
    }

    for (const id of accountIds) {
      try {
        const user = await this.usersRepository.findOne({ where: { id: +id } });
        if (!user) {
          result.failed.push({ id, reason: '用户不存在' });
          continue;
        }
        user.role = role;
        await this.usersRepository.save(user);
        result.success.push(id);
      } catch (error) {
        result.failed.push({ id, reason: error.message || '设置失败' });
      }
    }

    return result;
  }

  private sanitizeUser(user: User): Partial<User> {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}