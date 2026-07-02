import { Controller, Get, Post, Body, UseGuards, Request, Query, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ProgressService } from './progress.service';

@Controller('progress')
export class ProgressController {
  constructor(private progressService: ProgressService) {}

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getLearningStats(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const stats = await this.progressService.getLearningStats(userId);
    return { status: 200, result: stats };
  }

  @Get('courses')
  @UseGuards(AuthGuard('jwt'))
  async getCourseProgress(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const progress = await this.progressService.getCourseProgress(userId);
    return { status: 200, result: progress };
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  async getLearningHistory(@Request() req: any, @Query('limit') limit?: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const history = await this.progressService.getLearningHistory(userId, limit ? parseInt(limit, 10) : 20);
    return { status: 200, result: history };
  }

  @Post('record-time')
  @UseGuards(AuthGuard('jwt'))
  async recordLearningTime(
    @Request() req: any,
    @Body() body: { lessonId: number; minutes: number },
  ) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    await this.progressService.recordLearningTime(userId, body.lessonId, body.minutes);
    return { status: 200, result: true };
  }

  @Get('export')
  @UseGuards(AuthGuard('jwt'))
  async exportProgress(@Request() req: any, @Res() res: Response) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };

    const [stats, courses, history] = await Promise.all([
      this.progressService.getLearningStats(userId),
      this.progressService.getCourseProgress(userId),
      this.progressService.getLearningHistory(userId, 100),
    ]);

    const exportData = {
      exportTime: new Date().toISOString(),
      stats,
      courses,
      history,
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=learning-progress.json');
    res.json(exportData);
  }
}