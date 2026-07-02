import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../entities/organization.entity';
import { OrganizationClass } from '../entities/organization-class.entity';
import { Student } from '../entities/student.entity';
import { ClassEntity } from '../entities/class.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(OrganizationClass)
    private organizationClassRepository: Repository<OrganizationClass>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(ClassEntity)
    private classRepository: Repository<ClassEntity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // Organization CRUD
  async findAllOrganizations(page = 1, pageSize = 10) {
    const [records, total] = await this.organizationRepository.findAndCount({
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return {
      records,
      total,
      size: pageSize,
      current: page,
      pages: Math.ceil(total / pageSize),
    };
  }

  async findOneOrganization(id: number) {
    return this.organizationRepository.findOne({ where: { id } });
  }

  async findByOrganizationCode(code: string) {
    return this.organizationRepository.findOne({ where: { organizationCode: code } });
  }

  async createOrganization(data: Partial<Organization>) {
    const organization = this.organizationRepository.create(data);
    return this.organizationRepository.save(organization);
  }

  async updateOrganization(id: number, data: Partial<Organization>) {
    await this.organizationRepository.update(id, data);
    return this.findOneOrganization(id);
  }

  async deleteOrganization(id: number) {
    return this.organizationRepository.delete(id);
  }

  // Class management within organization
  async addClassToOrganization(organizationId: number, classId: number) {
    // Validate organization exists
    const org = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (!org) {
      return { status: 404, message: 'Organization not found' };
    }
    // Validate class exists
    const classEntity = await this.classRepository.findOne({ where: { id: classId } });
    if (!classEntity) {
      return { status: 404, message: 'Class not found' };
    }
    const existing = await this.organizationClassRepository.findOne({
      where: { organizationId, classId },
    });
    if (existing) {
      return { status: 400, message: 'Class already linked to organization' };
    }
    const link = this.organizationClassRepository.create({ organizationId, classId });
    await this.organizationClassRepository.save(link);
    // Update class count
    await this.organizationRepository.increment({ id: organizationId }, 'classCount', 1);
    return { status: 200, message: 'Class added successfully' };
  }

  async removeClassFromOrganization(organizationId: number, classId: number) {
    const link = await this.organizationClassRepository.findOne({
      where: { organizationId, classId },
    });
    if (!link) {
      return { status: 404, message: 'Link not found' };
    }
    await this.organizationClassRepository.delete(link.id);
    // Prevent counter going below zero
    const org = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (org && org.classCount > 0) {
      await this.organizationRepository.decrement({ id: organizationId }, 'classCount', 1);
    }
    return { status: 200, message: 'Class removed successfully' };
  }

  async getOrganizationClasses(organizationId: number) {
    const links = await this.organizationClassRepository.find({
      where: { organizationId },
      relations: ['class'],
    });
    return links.map((link) => link.class);
  }

  // Student management within organization
  async addStudentToOrganization(organizationId: number, userId: number, studentNumber?: string, grade?: string, major?: string) {
    // Validate organization exists
    const org = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (!org) {
      return { status: 404, message: 'Organization not found' };
    }
    // Validate user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return { status: 404, message: 'User not found' };
    }
    const existing = await this.studentRepository.findOne({
      where: { organizationId, userId },
    });
    if (existing) {
      return { status: 400, message: 'Student already exists in organization' };
    }
    const student = this.studentRepository.create({
      organizationId,
      userId,
      studentNumber,
      grade,
      major,
    });
    await this.studentRepository.save(student);
    await this.organizationRepository.increment({ id: organizationId }, 'studentCount', 1);
    return { status: 200, message: 'Student added successfully' };
  }

  async removeStudentFromOrganization(organizationId: number, userId: number) {
    const student = await this.studentRepository.findOne({
      where: { organizationId, userId },
    });
    if (!student) {
      return { status: 404, message: 'Student not found in organization' };
    }
    await this.studentRepository.delete(student.id);
    // Prevent counter going below zero
    const org = await this.organizationRepository.findOne({ where: { id: organizationId } });
    if (org && org.studentCount > 0) {
      await this.organizationRepository.decrement({ id: organizationId }, 'studentCount', 1);
    }
    return { status: 200, message: 'Student removed successfully' };
  }

  async getOrganizationStudents(organizationId: number, page = 1, pageSize = 10) {
    const [records, total] = await this.studentRepository.findAndCount({
      where: { organizationId },
      relations: ['user'],
      skip: (page - 1) * pageSize,
      take: pageSize,
      order: { createdAt: 'DESC' },
    });
    return {
      records,
      total,
      size: pageSize,
      current: page,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getStudentOrganizations(userId: number) {
    const students = await this.studentRepository.find({
      where: { userId },
      relations: ['organization'],
    });
    return students.map((s) => s.organization);
  }

  async isStudentInOrganization(organizationId: number, userId: number) {
    const student = await this.studentRepository.findOne({
      where: { organizationId, userId },
    });
    return !!student;
  }

  async getClassStudents(classId: number, page = 1, pageSize = 10) {
    // 先从 organization-class 关联表获取该班级关联的组织 ID
    const orgClassLinks = await this.organizationClassRepository.find({
      where: { classId },
    });
    const orgIds = orgClassLinks.map((lc) => lc.organizationId);

    if (orgIds.length === 0) {
      return {
        records: [],
        total: 0,
        size: pageSize,
        current: page,
        pages: 0,
      };
    }

    // 使用 QueryBuilder 进行服务端过滤和分页
    const queryBuilder = this.studentRepository.createQueryBuilder('student')
      .leftJoinAndSelect('student.user', 'user')
      .leftJoinAndSelect('student.organization', 'organization')
      .where('student.status = :status', { status: 1 })
      .andWhere('student.organizationId IN (:...orgIds)', { orgIds })
      .orderBy('student.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [records, total] = await queryBuilder.getManyAndCount();
    return {
      records,
      total,
      size: pageSize,
      current: page,
      pages: Math.ceil(total / pageSize),
    };
  }
}