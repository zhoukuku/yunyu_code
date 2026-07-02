import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClassEntity } from '../entities/class.entity';
import { UserClass } from '../entities/user-class.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(ClassEntity)
    private classesRepository: Repository<ClassEntity>,
    @InjectRepository(UserClass)
    private userClassRepository: Repository<UserClass>,
  ) {}

  async findAll(teacherId?: number, page: number = 1, pageSize: number = 10) {
    const where = teacherId ? { teacherId } : {};
    const [classes, total] = await this.classesRepository.findAndCount({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return {
      records: classes,
      total,
      size: pageSize,
      current: page,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: number) {
    return this.classesRepository.findOne({ where: { id } });
  }

  async findByCode(code: string) {
    return this.classesRepository.findOne({ where: { classCode: code } });
  }

  async create(data: Partial<ClassEntity>) {
    const classEntity = this.classesRepository.create(data);
    return this.classesRepository.save(classEntity);
  }

  async update(id: number, data: Partial<ClassEntity>) {
    await this.classesRepository.update(id, data);
    return this.findOne(id);
  }

  async delete(id: number) {
    return this.classesRepository.delete(id);
  }

  async applyToJoin(classId: number, userId: number) {
    // Check if already exists
    const existing = await this.userClassRepository.findOne({
      where: { classId, userId },
    });
    if (existing) {
      return { status: 400, message: 'Already applied or joined' };
    }
    const userClass = this.userClassRepository.create({ classId, userId, status: 1 });
    await this.userClassRepository.save(userClass);
    // Update student count
    await this.classesRepository.increment({ id: classId }, 'studentNum', 1);
    return { status: 200, message: 'Joined successfully' };
  }

  async getStudentClasses(userId: number) {
    const userClasses = await this.userClassRepository.find({
      where: { userId, status: 1 },
    });
    const classIds = userClasses.map(uc => uc.classId);
    if (classIds.length === 0) return [];
    const classes = await this.classesRepository
      .createQueryBuilder('class')
      .where('class.id IN (:...ids)', { ids: classIds })
      .getMany();
    return classes;
  }

  async isStudentInClass(classId: number, userId: number) {
    const userClass = await this.userClassRepository.findOne({
      where: { classId, userId, status: 1 },
    });
    return !!userClass;
  }
}