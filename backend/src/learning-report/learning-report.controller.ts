import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LearningReportService } from './learning-report.service';

@Controller('learning-report')
export class LearningReportController {
  constructor(private learningReportService: LearningReportService) {}

  @Get('skills/categories')
  async getSkillCategories() {
    const categories = await this.learningReportService.getSkillCategories();
    return { status: 200, result: categories };
  }

  @Post('skills/categories')
  @UseGuards(AuthGuard('jwt'))
  async createSkillCategory(@Body() data: any) {
    const category = await this.learningReportService.createSkillCategory(data);
    return { status: 200, result: category };
  }

  @Get('skills/atlas')
  @UseGuards(AuthGuard('jwt'))
  async getSkillAtlas(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const atlas = await this.learningReportService.getSkillAtlas(userId);
    return { status: 200, result: atlas };
  }

  @Put('skills/progress')
  @UseGuards(AuthGuard('jwt'))
  async updateSkillProgress(
    @Request() req: any,
    @Body() body: { skillName: string; masteryLevel: number },
  ) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const progress = await this.learningReportService.updateSkillProgress(
      userId,
      body.skillName,
      body.masteryLevel
    );
    return { status: 200, result: progress };
  }

  @Post('skills/calculate/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async calculateSkillFromProgress(
    @Request() req: any,
    @Param('courseId') courseId: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    await this.learningReportService.calculateSkillFromProgress(userId, +courseId);
    return { status: 200, result: { success: true } };
  }

  @Get('course-skills/:courseId')
  async getCourseSkills(@Param('courseId') courseId: string) {
    const skills = await this.learningReportService.getCourseSkills(+courseId);
    return { status: 200, result: skills };
  }

  @Post('course-skills')
  @UseGuards(AuthGuard('jwt'))
  async createCourseSkill(@Body() data: any) {
    const skill = await this.learningReportService.createCourseSkill(data);
    return { status: 200, result: skill };
  }

  @Get('report')
  @UseGuards(AuthGuard('jwt'))
  async getLearningReport(
    @Request() req: any,
    @Query('type') type?: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const reportType = type === 'weekly' || type === 'monthly' ? type : 'overall';
    const report = await this.learningReportService.generateLearningReport(userId, reportType);
    return { status: 200, result: report };
  }

  @Get('reports')
  @UseGuards(AuthGuard('jwt'))
  async getLearningReports(@Request() req: any, @Query('limit') limit?: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const reports = await this.learningReportService.getLearningReports(
      userId,
      limit ? parseInt(limit) : 10
    );
    return { status: 200, result: reports };
  }

  @Get('report/:id')
  @UseGuards(AuthGuard('jwt'))
  async getReportDetail(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const report = await this.learningReportService.getReportDetail(userId, +id);
    if (!report) return { status: 404, result: null };
    return { status: 200, result: report };
  }
}
