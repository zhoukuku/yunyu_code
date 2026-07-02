import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req } from '@nestjs/common';
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
  async createHomework(@Req() req: any, @Body() data: any) {
    // Use authenticated user as teacherId, ignore any teacherId from the body
    const homework = await this.homeworkService.createHomework({ ...data, teacherId: req.user.sub });
    return { status: 200, result: homework };
  }

  @Put('homework/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateHomework(@Req() req: any, @Param('id') id: string, @Body() data: any) {
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    if (homework.teacherId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'Only the homework teacher can update this homework' };
    }
    const result = await this.homeworkService.updateHomework(+id, data);
    return { status: 200, result };
  }

  @Delete('homework/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteHomework(@Req() req: any, @Param('id') id: string) {
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    if (homework.teacherId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'Only the homework teacher can delete this homework' };
    }
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
  @UseGuards(AuthGuard('jwt'))
  async getSubmissions(@Req() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    // Only the homework's teacher (or admin) can view all submissions
    const filters: any = { homeworkId: +id };
    if (homework.teacherId !== userId) {
      filters.studentId = userId;
    }
    const submissions = await this.homeworkService.getSubmissions(filters);
    return { status: 200, result: submissions };
  }

  @Get('submissions')
  @UseGuards(AuthGuard('jwt'))
  async getMySubmissions(
    @Req() req: any,
    @Query('status') status?: string,
  ) {
    // Use authenticated user ID, not query param
    const filters = {
      studentId: req.user.sub,
      status: status !== undefined ? parseInt(status, 10) : undefined,
    };
    const submissions = await this.homeworkService.getSubmissions(filters);
    return { status: 200, result: submissions };
  }

  @Get('submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async getSubmission(@Param('id') id: string, @Req() req: any) {
    const submission = await this.homeworkService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    // Only allow students to see their own submissions, or teachers to see any
    if (submission.studentId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only view your own submissions' };
    }
    return { status: 200, result: submission };
  }

  @Post('homework/:id/submit')
  @UseGuards(AuthGuard('jwt'))
  async submitHomework(@Param('id') id: string, @Req() req: any, @Body() data: any) {
    // Use authenticated user ID, ignore any studentId from the body
    const submission = await this.homeworkService.submitHomework({
      ...data,
      studentId: req.user.sub,
      homeworkId: +id,
    });
    return { status: 200, result: submission };
  }

  @Put('submission/:id/grade')
  @UseGuards(AuthGuard('jwt'))
  async gradeSubmission(@Param('id') id: string, @Req() req: any, @Body() data: { score: number; feedback: string }) {
    // Only teachers/admin can grade
    if (req.user.role < 2) {
      return { status: 403, result: null, message: 'Only teachers can grade submissions' };
    }
    const submission = await this.homeworkService.gradeSubmission(+id, data);
    return { status: 200, result: submission };
  }

  @Delete('submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteSubmission(@Param('id') id: string, @Req() req: any) {
    const submission = await this.homeworkService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    if (submission.studentId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only delete your own submissions' };
    }
    const result = await this.homeworkService.deleteSubmission(+id);
    return { status: 200, result };
  }
}
