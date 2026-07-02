import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompetitionEvaluationService } from './competition-evaluation.service';
import { EvaluationStatus } from '../entities/competition-evaluation.entity';

@Controller()
export class CompetitionEvaluationController {
  constructor(private evaluationService: CompetitionEvaluationService) {}

  // ============ Evaluation Routes ============

  @Get('competition-evaluation')
  @UseGuards(AuthGuard('jwt'))
  async getEvaluations(
    @Req() req: any,
    @Query('competitionId') competitionId?: string,
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      competitionId: competitionId ? parseInt(competitionId, 10) : undefined,
      userId: userId ? parseInt(userId, 10) : undefined,
      problemId: problemId ? parseInt(problemId, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) as EvaluationStatus : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };
    const result = await this.evaluationService.getEvaluations(filters);
    return { status: 200, result };
  }

  @Get('competition-evaluation/:id')
  @UseGuards(AuthGuard('jwt'))
  async getEvaluation(@Param('id') id: string) {
    const evaluation = await this.evaluationService.getEvaluation(+id);
    if (!evaluation) return { status: 404, result: null };
    return { status: 200, result: evaluation };
  }

  @Post('competition-evaluation')
  @UseGuards(AuthGuard('jwt'))
  async createEvaluation(@Req() req: any, @Body() data: any) {
    // Use authenticated user ID, ignore any userId from the body
    const evaluation = await this.evaluationService.createEvaluation({ ...data, userId: req.user.sub });
    return { status: 200, result: evaluation };
  }

  @Put('competition-evaluation/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateEvaluation(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const evaluation = await this.evaluationService.getEvaluation(+id);
    if (!evaluation) return { status: 404, result: null };
    if (evaluation.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only update your own evaluations' };
    }
    const result = await this.evaluationService.updateEvaluation(+id, data);
    return { status: 200, result };
  }

  @Delete('competition-evaluation/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteEvaluation(@Req() req: any, @Param('id') id: string) {
    const evaluation = await this.evaluationService.getEvaluation(+id);
    if (!evaluation) return { status: 404, result: null };
    if (evaluation.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only delete your own evaluations' };
    }
    const result = await this.evaluationService.deleteEvaluation(+id);
    return { status: 200, result };
  }

  // ============ Problem Routes ============

  @Get('problems')
  async getProblems(
    @Query('competitionId') competitionId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('enabled') enabled?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      competitionId: competitionId ? parseInt(competitionId, 10) : undefined,
      difficulty: difficulty || undefined,
      enabled: enabled !== undefined ? enabled === 'true' : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
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
  @UseGuards(AuthGuard('jwt'))
  async createProblem(@Body() data: any) {
    const problem = await this.evaluationService.createProblem(data);
    return { status: 200, result: problem };
  }

  @Put('problems/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateProblem(@Param('id') id: string, @Body() data: any) {
    const problem = await this.evaluationService.updateProblem(+id, data);
    return { status: 200, result: problem };
  }

  @Delete('problems/:id')
  @UseGuards(AuthGuard('jwt'))
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
  @UseGuards(AuthGuard('jwt'))
  async getSubmissions(
    @Req() req: any,
    @Query('competitionId') competitionId?: string,
    @Query('userId') userId?: string,
    @Query('problemId') problemId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      competitionId: competitionId ? parseInt(competitionId, 10) : undefined,
      userId: userId ? parseInt(userId, 10) : undefined,
      problemId: problemId ? parseInt(problemId, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };
    const result = await this.evaluationService.getSubmissions(filters);
    return { status: 200, result };
  }

  @Get('competition-submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async getSubmission(@Param('id') id: string, @Req() req: any) {
    const submission = await this.evaluationService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    // Only allow users to see their own submissions (unless admin)
    if (submission.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only view your own submissions' };
    }
    return { status: 200, result: submission };
  }

  @Post('competition-submit')
  @UseGuards(AuthGuard('jwt'))
  async submitCode(@Req() req: any, @Body() data: any) {
    // Use authenticated user ID, ignore any userId from the body
    const submission = await this.evaluationService.submitCode({ ...data, userId: req.user.sub });
    return { status: 200, result: submission };
  }

  @Put('competition-submission/:id/evaluate')
  @UseGuards(AuthGuard('jwt'))
  async evaluateSubmission(@Param('id') id: string, @Req() req: any, @Body() data: any) {
    // Only admin/teacher (role >= 2) can evaluate
    if (req.user.role < 2) {
      return { status: 403, result: null, message: 'Only teachers/admin can evaluate submissions' };
    }
    const submission = await this.evaluationService.evaluateSubmission(+id, data);
    return { status: 200, result: submission };
  }

  @Delete('competition-submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteSubmission(@Param('id') id: string, @Req() req: any) {
    const submission = await this.evaluationService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    if (submission.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only delete your own submissions' };
    }
    const result = await this.evaluationService.deleteSubmission(+id);
    return { status: 200, result };
  }

  @Get('competition-submission/user/:competitionId/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserSubmission(
    @Req() req: any,
    @Param('competitionId') competitionId: string,
    @Param('userId') userId: string,
    @Query('problemId') problemId?: string,
  ) {
    // Users can only query their own submissions (unless admin)
    if (parseInt(userId, 10) !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only view your own submissions' };
    }
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