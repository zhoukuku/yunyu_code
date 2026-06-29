import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Homework, HomeworkSubmission } from '../entities/homework.entity';

@Injectable()
export class HomeworkService {
  constructor(
    @InjectRepository(Homework)
    private homeworkRepository: Repository<Homework>,
    @InjectRepository(HomeworkSubmission)
    private submissionRepository: Repository<HomeworkSubmission>,
  ) {}

  // ============ Homework CRUD ============

  async getHomeworks(filters?: {
    courseId?: number;
    classId?: number;
    teacherId?: number;
    status?: number;
  }) {
    const query = this.homeworkRepository.createQueryBuilder('homework');

    if (filters?.courseId) {
      query.andWhere('homework.courseId = :courseId', { courseId: filters.courseId });
    }
    if (filters?.classId) {
      query.andWhere('homework.classId = :classId', { classId: filters.classId });
    }
    if (filters?.teacherId) {
      query.andWhere('homework.teacherId = :teacherId', { teacherId: filters.teacherId });
    }
    if (filters?.status !== undefined && filters.status !== null) {
      query.andWhere('homework.status = :status', { status: filters.status });
    }

    query.orderBy('homework.createdAt', 'DESC');

    const homeworks = await query.getMany();
    return {
      records: homeworks,
      total: homeworks.length,
    };
  }

  async getHomework(id: number) {
    return this.homeworkRepository.findOne({ where: { id } });
  }

  async createHomework(data: Partial<Homework>) {
    const homework = this.homeworkRepository.create(data);
    return this.homeworkRepository.save(homework);
  }

  async updateHomework(id: number, data: Partial<Homework>) {
    await this.homeworkRepository.update(id, data);
    return this.homeworkRepository.findOne({ where: { id } });
  }

  async deleteHomework(id: number) {
    await this.homeworkRepository.delete(id);
    return { success: true };
  }

  // ============ Submission CRUD ============

  async getSubmissions(filters?: {
    homeworkId?: number;
    studentId?: number;
    status?: number;
  }) {
    const query = this.submissionRepository.createQueryBuilder('submission');

    if (filters?.homeworkId) {
      query.andWhere('submission.homeworkId = :homeworkId', { homeworkId: filters.homeworkId });
    }
    if (filters?.studentId) {
      query.andWhere('submission.studentId = :studentId', { studentId: filters.studentId });
    }
    if (filters?.status !== undefined && filters.status !== null) {
      query.andWhere('submission.status = :status', { status: filters.status });
    }

    query.orderBy('submission.submittedAt', 'DESC');

    const submissions = await query.getMany();
    return {
      records: submissions,
      total: submissions.length,
    };
  }

  async getSubmission(id: number) {
    return this.submissionRepository.findOne({ where: { id } });
  }

  async getStudentSubmission(homeworkId: number, studentId: number) {
    return this.submissionRepository.findOne({
      where: { homeworkId, studentId },
    });
  }

  async submitHomework(data: Partial<HomeworkSubmission>) {
    const existing = await this.getStudentSubmission(data.homeworkId!, data.studentId!);

    if (existing) {
      await this.submissionRepository.update(existing.id, {
        content: data.content,
        attachments: data.attachments,
        submittedAt: new Date(),
        status: 1,
      });
      return this.submissionRepository.findOne({ where: { id: existing.id } });
    }

    const submission = this.submissionRepository.create({
      ...data,
      submittedAt: new Date(),
      status: 1,
    });
    return this.submissionRepository.save(submission);
  }

  async gradeSubmission(id: number, data: { score: number; feedback: string }) {
    await this.submissionRepository.update(id, {
      score: data.score,
      feedback: data.feedback,
      gradedAt: new Date(),
      status: 2,
    });
    return this.submissionRepository.findOne({ where: { id } });
  }

  async deleteSubmission(id: number) {
    await this.submissionRepository.delete(id);
    return { success: true };
  }

  // ============ Stats ============

  async getHomeworkStats(homeworkId: number) {
    const submissions = await this.submissionRepository.find({
      where: { homeworkId },
    });

    const total = submissions.length;
    const submitted = submissions.filter(s => s.status >= 1).length;
    const graded = submissions.filter(s => s.status === 2).length;
    const avgScore = graded > 0
      ? submissions.filter(s => s.status === 2).reduce((sum, s) => sum + (s.score || 0), 0) / graded
      : 0;

    return {
      total,
      submitted,
      graded,
      avgScore: Math.round(avgScore * 100) / 100,
    };
  }
}
