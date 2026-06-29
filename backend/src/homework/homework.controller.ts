import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HomeworkService } from './homework.service';

@Controller()
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  // ============ Homework Routes ============

  @Get('homework')
  async getHomeworks(
    @Query('courseId') courseId?: string,
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
  ) {
    const filters = {
      courseId: courseId ? parseInt(courseId, 10) : undefined,
      classId: classId ? parseInt(classId, 10) : undefined,
      teacherId: teacherId ? parseInt(teacherId, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) : undefined,
    };
    const result = await this.homeworkService.getHomeworks(filters);
    return { status: 200, result };
  }

  @Get('homework/:id')
  async getHomework(@Param('id') id: string) {
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    return { status: 200, result: homework };
  }

  @Post('homework')
  @UseGuards(AuthGuard('jwt'))
  async createHomework(@Body() data: any) {
    const homework = await this.homeworkService.createHomework(data);
    return { status: 200, result: homework };
  }

  @Put('homework/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateHomework(@Param('id') id: string, @Body() data: any) {
    const homework = await this.homeworkService.updateHomework(+id, data);
    return { status: 200, result: homework };
  }

  @Delete('homework/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteHomework(@Param('id') id: string) {
    const result = await this.homeworkService.deleteHomework(+id);
    return { status: 200, result };
  }

  @Get('homework/:id/stats')
  async getHomeworkStats(@Param('id') id: string) {
    const stats = await this.homeworkService.getHomeworkStats(+id);
    return { status: 200, result: stats };
  }

  // ============ Submission Routes ============

  @Get('homework/:id/submissions')
  async getSubmissions(@Param('id') id: string) {
    const submissions = await this.homeworkService.getSubmissions({ homeworkId: +id });
    return { status: 200, result: submissions };
  }

  @Get('submissions')
  async getMySubmissions(
    @Query('studentId') studentId?: string,
    @Query('status') status?: string,
  ) {
    const filters = {
      studentId: studentId ? parseInt(studentId, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) : undefined,
    };
    const submissions = await this.homeworkService.getSubmissions(filters);
    return { status: 200, result: submissions };
  }

  @Get('submission/:id')
  async getSubmission(@Param('id') id: string) {
    const submission = await this.homeworkService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    return { status: 200, result: submission };
  }

  @Post('homework/:id/submit')
  @UseGuards(AuthGuard('jwt'))
  async submitHomework(@Param('id') id: string, @Body() data: any) {
    const submission = await this.homeworkService.submitHomework({
      ...data,
      homeworkId: +id,
    });
    return { status: 200, result: submission };
  }

  @Put('submission/:id/grade')
  @UseGuards(AuthGuard('jwt'))
  async gradeSubmission(@Param('id') id: string, @Body() data: { score: number; feedback: string }) {
    const submission = await this.homeworkService.gradeSubmission(+id, data);
    return { status: 200, result: submission };
  }

  @Delete('submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteSubmission(@Param('id') id: string) {
    const result = await this.homeworkService.deleteSubmission(+id);
    return { status: 200, result };
  }
}
