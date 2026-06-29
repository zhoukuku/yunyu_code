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

    const evaluations = await query.getMany();
    return {
      records: evaluations,
      total: evaluations.length,
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

    const submissions = await query.getMany();
    return {
      records: submissions,
      total: submissions.length,
    };
  }

  async getSubmission(id: number) {
    return this.submissionRepository.findOne({ where: { id } });
  }

  async getUserSubmission(competitionId: number, userId: number, problemId?: number) {
    const where: any = { competitionId, userId };
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

    await this.evaluationRepository.update({ submissionId: id } as any, {
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
    } as any);

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

    const problems = await query.getMany();
    return {
      records: problems,
      total: problems.length,
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
    const query = this.evaluationRepository.createQueryBuilder('evaluation');
    query.andWhere('evaluation.competitionId = :competitionId', { competitionId });

    if (problemId) {
      query.andWhere('evaluation.problemId = :problemId', { problemId });
    }

    const evaluations = await query.getMany();

    const total = evaluations.length;
    const accepted = evaluations.filter(e => e.status === EvaluationStatus.ACCEPTED).length;
    const pending = evaluations.filter(e => e.status === EvaluationStatus.PENDING).length;
    const running = evaluations.filter(e => e.status === EvaluationStatus.RUNNING).length;
    const rejected = total - accepted - pending - running;

    const avgScore = total > 0
      ? evaluations.reduce((sum, e) => sum + (e.score || 0), 0) / total
      : 0;

    return {
      total,
      accepted,
      pending,
      running,
      rejected,
      avgScore: Math.round(avgScore * 100) / 100,
    };
  }

  async getSubmissionStats(competitionId: number) {
    const submissions = await this.submissionRepository.find({
      where: { competitionId },
    });

    const total = submissions.length;
    const accepted = submissions.filter(s => s.status === 1).length;
    const rejected = submissions.filter(s => s.status === 2).length;
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