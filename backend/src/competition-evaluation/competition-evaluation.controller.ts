import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CompetitionEvaluationService } from './competition-evaluation.service';
import { EvaluationStatus } from '../entities/competition-evaluation.entity';

@Controller()
export class CompetitionEvaluationController {
  constructor(private evaluationService: CompetitionEvaluationService) {}

  // ============ Evaluation Routes ============

  @Get('competition-evaluation')
  async getEvaluations(
    @Query('competitionId') competitionId?: string,
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
    @Query('status') status?: string,
  ) {
    const filters = {
      competitionId: competitionId ? parseInt(competitionId, 10) : undefined,
      userId: userId ? parseInt(userId, 10) : undefined,
      problemId: problemId ? parseInt(problemId, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) as EvaluationStatus : undefined,
    };
    const result = await this.evaluationService.getEvaluations(filters);
    return { status: 200, result };
  }

  @Get('competition-evaluation/:id')
  async getEvaluation(@Param('id') id: string) {
    const evaluation = await this.evaluationService.getEvaluation(+id);
    if (!evaluation) return { status: 404, result: null };
    return { status: 200, result: evaluation };
  }

  @Post('competition-evaluation')
  async createEvaluation(@Body() data: any) {
    const evaluation = await this.evaluationService.createEvaluation(data);
    return { status: 200, result: evaluation };
  }

  @Put('competition-evaluation/:id')
  async updateEvaluation(@Param('id') id: string, @Body() data: any) {
    const evaluation = await this.evaluationService.updateEvaluation(+id, data);
    return { status: 200, result: evaluation };
  }

  @Delete('competition-evaluation/:id')
  async deleteEvaluation(@Param('id') id: string) {
    const result = await this.evaluationService.deleteEvaluation(+id);
    return { status: 200, result };
  }

  // ============ Problem Routes ============

  @Get('problems')
  async getProblems(
    @Query('competitionId') competitionId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('enabled') enabled?: string,
  ) {
    const filters = {
      competitionId: competitionId ? parseInt(competitionId, 10) : undefined,
      difficulty: difficulty || undefined,
      enabled: enabled !== undefined ? enabled === 'true' : undefined,
    };
    const result = await this.evaluationService.getProblems(filters);
    return { status: 200, result };
  }

  @Get('problems/:id')
  async getProblem(@Param('id') id: string) {
    const problem = await this.evaluationService.getProblem(+id);
    if (!problem) return { status: 404, result: null };
    return { status: 200, result: problem };
  }

  @Post('problems')
  async createProblem(@Body() data: any) {
    const problem = await this.evaluationService.createProblem(data);
    return { status: 200, result: problem };
  }

  @Put('problems/:id')
  async updateProblem(@Param('id') id: string, @Body() data: any) {
    const problem = await this.evaluationService.updateProblem(+id, data);
    return { status: 200, result: problem };
  }

  @Delete('problems/:id')
  async deleteProblem(@Param('id') id: string) {
    const result = await this.evaluationService.deleteProblem(+id);
    return { status: 200, result };
  }

  @Get('competition-evaluation/:id/stats')
  async getEvaluationStats(
    @Param('id') id: string,
    @Query('problemId') problemId?: string,
  ) {
    const stats = await this.evaluationService.getEvaluationStats(+id, problemId ? +problemId : undefined);
    return { status: 200, result: stats };
  }

  // ============ Submission Routes ============

  @Get('competition-submissions')
  async getSubmissions(
    @Query('competitionId') competitionId?: string,
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
    @Query('status') status?: string,
  ) {
    const filters = {
      competitionId: competitionId ? parseInt(competitionId, 10) : undefined,
      userId: userId ? parseInt(userId, 10) : undefined,
      problemId: problemId ? parseInt(problemId, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) : undefined,
    };
    const result = await this.evaluationService.getSubmissions(filters);
    return { status: 200, result };
  }

  @Get('competition-submission/:id')
  async getSubmission(@Param('id') id: string) {
    const submission = await this.evaluationService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    return { status: 200, result: submission };
  }

  @Post('competition-submit')
  async submitCode(@Body() data: any) {
    const submission = await this.evaluationService.submitCode(data);
    return { status: 200, result: submission };
  }

  @Put('competition-submission/:id/evaluate')
  async evaluateSubmission(@Param('id') id: string, @Body() data: any) {
    const submission = await this.evaluationService.evaluateSubmission(+id, data);
    return { status: 200, result: submission };
  }

  @Delete('competition-submission/:id')
  async deleteSubmission(@Param('id') id: string) {
    const result = await this.evaluationService.deleteSubmission(+id);
    return { status: 200, result };
  }

  @Get('competition-submission/user/:competitionId/:userId')
  async getUserSubmission(
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Query('problemId') problemId?: string,
  ) {
    const submission = await this.evaluationService.getUserSubmission(
      +competitionId,
      +userId,
      problemId ? +problemId : undefined,
    );
    return { status: 200, result: submission };
  }

  @Get('competition-stats/:competitionId')
  async getSubmissionStats(@Param('competitionId') competitionId: string) {
    const stats = await this.evaluationService.getSubmissionStats(+competitionId);
    return { status: 200, result: stats };
  }
}