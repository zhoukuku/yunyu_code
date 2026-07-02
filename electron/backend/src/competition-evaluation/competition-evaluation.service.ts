import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompetitionEvaluation, EvaluationStatus, CompetitionSubmission } from '../entities/competition-evaluation.entity';
import { Problem } from '../entities/problem.entity';

@Injectable()
export class CompetitionEvaluationService {
  constructor(
    @InjectRepository(CompetitionEvaluation)
    private evaluationRepository: Repository<CompetitionEvaluation>,
    @InjectRepository(CompetitionSubmission)
    private submissionRepository: Repository<CompetitionSubmission>,
    @InjectRepository(Problem)
    private problemRepository: Repository<Problem>,
  ) {}

  // ============ Evaluation CRUD ============

  async getEvaluations(filters?: {
    competitionId?: number;
    userId?: number;
    problemId?: number;
    status?: EvaluationStatus;
    page?: number;
    pageSize?: number;
  }) {
    const query = this.evaluationRepository.createQueryBuilder('evaluation');

    if (filters?.competitionId) {
      query.andWhere('evaluation.competitionId = :competitionId', { competitionId: filters.competitionId });
    }
    if (filters?.userId) {
      query.andWhere('evaluation.userId = :userId', { userId: filters.userId });
    }
    if (filters?.problemId) {
      query.andWhere('evaluation.problemId = :problemId', { problemId: filters.problemId });
    }
    if (filters?.status !== undefined && filters.status !== null) {
      query.andWhere('evaluation.status = :status', { status: filters.status });
    }

    query.orderBy('evaluation.createdAt', 'DESC');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [evaluations, total] = await query.getManyAndCount();
    return {
      records: evaluations,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getEvaluation(id: number) {
    return this.evaluationRepository.findOne({ where: { id } });
  }

  async createEvaluation(data: Partial<CompetitionEvaluation>) {
    const evaluation = this.evaluationRepository.create({
      ...data,
      status: EvaluationStatus.PENDING,
    });
    return this.evaluationRepository.save(evaluation);
  }

  async updateEvaluation(id: number, data: Partial<CompetitionEvaluation>) {
    await this.evaluationRepository.update(id, data);
    return this.evaluationRepository.findOne({ where: { id } });
  }

  async deleteEvaluation(id: number) {
    await this.evaluationRepository.delete(id);
    return { success: true };
  }

  // ============ Submission CRUD ============

  async getSubmissions(filters?: {
    competitionId?: number;
    userId?: number;
    problemId?: number;
    status?: number;
    page?: number;
    pageSize?: number;
  }) {
    const query = this.submissionRepository.createQueryBuilder('submission');

    if (filters?.competitionId) {
      query.andWhere('submission.competitionId = :competitionId', { competitionId: filters.competitionId });
    }
    if (filters?.userId) {
      query.andWhere('submission.userId = :userId', { userId: filters.userId });
    }
    if (filters?.problemId) {
      query.andWhere('submission.problemId = :problemId', { problemId: filters.problemId });
    }
    if (filters?.status !== undefined && filters.status !== null) {
      query.andWhere('submission.status = :status', { status: filters.status });
    }

    query.orderBy('submission.submittedAt', 'DESC');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [submissions, total] = await query.getManyAndCount();
    return {
      records: submissions,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getSubmission(id: number) {
    return this.submissionRepository.findOne({ where: { id } });
  }

  async getUserSubmission(competitionId: number, userId: number, problemId?: number) {
    const where: Record<string, unknown> = { competitionId, userId };
    if (problemId) where.problemId = problemId;
    return this.submissionRepository.findOne({ where, order: { submittedAt: 'DESC' } });
  }

  async submitCode(data: Partial<CompetitionSubmission>) {
    const submission = this.submissionRepository.create({
      ...data,
      submittedAt: new Date(),
      status: 0,
    });
    const saved = await this.submissionRepository.save(submission);

    // Create evaluation record
    await this.createEvaluation({
      competitionId: data.competitionId,
      userId: data.userId,
      userName: data.userName,
      problemId: data.problemId,
      problemTitle: data.problemTitle,
      submittedCode: data.submittedCode,
      language: data.language,
    });

    return saved;
  }

  async evaluateSubmission(id: number, result: {
    score: number;
    maxScore: number;
    passedCases: number;
    totalCases: number;
    executionTime: number;
    memoryUsage: number;
    status: EvaluationStatus;
    errorMessage?: string;
    testCases?: string;
  }) {
    await this.submissionRepository.update(id, {
      score: result.score,
      maxScore: result.maxScore,
      status: result.status === EvaluationStatus.ACCEPTED ? 1 : 2,
    });

    await this.evaluationRepository
      .createQueryBuilder()
      .update(CompetitionEvaluation)
      .set({
        score: result.score,
        maxScore: result.maxScore,
        passedCases: result.passedCases,
        totalCases: result.totalCases,
        executionTime: result.executionTime,
        memoryUsage: result.memoryUsage,
        status: result.status,
        errorMessage: result.errorMessage,
        testCases: result.testCases,
        evaluatedAt: new Date(),
      })
      .where('submissionId = :id', { id })
      .execute();

    return this.submissionRepository.findOne({ where: { id } });
  }

  async deleteSubmission(id: number) {
    await this.submissionRepository.delete(id);
    return { success: true };
  }

  // ============ Problem CRUD ============

  async getProblems(filters?: {
    competitionId?: number;
    difficulty?: string;
    enabled?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const query = this.problemRepository.createQueryBuilder('problem');

    if (filters?.competitionId) {
      query.andWhere('problem.competitionId = :competitionId', { competitionId: filters.competitionId });
    }
    if (filters?.difficulty) {
      query.andWhere('problem.difficulty = :difficulty', { difficulty: filters.difficulty });
    }
    if (filters?.enabled !== undefined && filters?.enabled !== null) {
      query.andWhere('problem.enabled = :enabled', { enabled: filters.enabled });
    }

    query.orderBy('problem.id', 'ASC');

    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [problems, total] = await query.getManyAndCount();
    return {
      records: problems,
      total,
      current: page,
      size: pageSize,
      pages: Math.ceil(total / pageSize),
    };
  }

  async getProblem(id: number) {
    return this.problemRepository.findOne({ where: { id } });
  }

  async createProblem(data: Partial<Problem>) {
    const problem = this.problemRepository.create({
      ...data,
      enabled: data.enabled !== undefined ? data.enabled : true,
    });
    return this.problemRepository.save(problem);
  }

  async updateProblem(id: number, data: Partial<Problem>) {
    await this.problemRepository.update(id, data);
    return this.problemRepository.findOne({ where: { id } });
  }

  async deleteProblem(id: number) {
    await this.problemRepository.delete(id);
    return { success: true };
  }

  // ============ Stats ============

  async getEvaluationStats(competitionId: number, problemId?: number) {
    const query = this.evaluationRepository.createQueryBuilder('evaluation')
      .select('COUNT(*)', 'total')
      .addSelect(`SUM(CASE WHEN evaluation.status = :accepted THEN 1 ELSE 0 END)`, 'accepted')
      .addSelect(`SUM(CASE WHEN evaluation.status = :pending THEN 1 ELSE 0 END)`, 'pending')
      .addSelect(`SUM(CASE WHEN evaluation.status = :running THEN 1 ELSE 0 END)`, 'running')
      .addSelect('AVG(COALESCE(evaluation.score, 0))', 'avgScore')
      .where('evaluation.competitionId = :competitionId', { competitionId })
      .setParameter('accepted', EvaluationStatus.ACCEPTED)
      .setParameter('pending', EvaluationStatus.PENDING)
      .setParameter('running', EvaluationStatus.RUNNING);

    if (problemId) {
      query.andWhere('evaluation.problemId = :problemId', { problemId });
    }

    const stats = await query.getRawOne();

    const total = parseInt(stats.total, 10) || 0;
    const accepted = parseInt(stats.accepted, 10) || 0;
    const pending = parseInt(stats.pending, 10) || 0;
    const running = parseInt(stats.running, 10) || 0;
    const rejected = total - accepted - pending - running;

    return {
      total,
      accepted,
      pending,
      running,
      rejected,
      avgScore: Math.round((parseFloat(stats.avgScore) || 0) * 100) / 100,
    };
  }

  async getSubmissionStats(competitionId: number) {
    const stats = await this.submissionRepository
      .createQueryBuilder('submission')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN submission.status = 1 THEN 1 ELSE 0 END)', 'accepted')
      .addSelect('SUM(CASE WHEN submission.status = 2 THEN 1 ELSE 0 END)', 'rejected')
      .where('submission.competitionId = :competitionId', { competitionId })
      .getRawOne();

    const total = parseInt(stats.total, 10) || 0;
    const accepted = parseInt(stats.accepted, 10) || 0;
    const rejected = parseInt(stats.rejected, 10) || 0;
    const pending = total - accepted - rejected;

    return {
      total,
      accepted,
      rejected,
      pending,
      acceptRate: total > 0 ? Math.round((accepted / total) * 10000) / 100 : 0,
    };
  }
}