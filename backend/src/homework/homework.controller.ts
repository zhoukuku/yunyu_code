import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { HomeworkService } from './homework.service';
import { CreateHomeworkDto } from './dto/create-homework.dto';
import { UpdateHomeworkDto } from './dto/update-homework.dto';
import { SubmitHomeworkDto } from './dto/submit-homework.dto';
import { GradeSubmissionDto } from './dto/grade-submission.dto';

@Controller()
export class HomeworkController {
  constructor(private homeworkService: HomeworkService) {}

  // ============ Homework Routes ============

  @Get('homework')
  @UseGuards(AuthGuard('jwt'))
  async getHomeworks(
    @Query('courseId') courseId?: string,
    @Query('classId') classId?: string,
    @Query('teacherId') teacherId?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      courseId: courseId ? parseInt(courseId, 10) : undefined,
      classId: classId ? parseInt(classId, 10) : undefined,
      teacherId: teacherId ? parseInt(teacherId, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
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
  async createHomework(@Request() req: any, @Body() dto: CreateHomeworkDto) {
    // Use authenticated user as teacherId, ignore any teacherId from the body
    const homework = await this.homeworkService.createHomework({ ...dto, teacherId: req.user.sub });
    return { status: 200, result: homework };
  }

  @Put('homework/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateHomework(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateHomeworkDto) {
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    if (homework.teacherId !== req.user.sub && req.user.role !== 1) {
      return { status: 403, result: null, message: 'Only the homework teacher can update this homework' };
    }
    const result = await this.homeworkService.updateHomework(+id, dto);
    return { status: 200, result };
  }

  @Delete('homework/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteHomework(@Request() req: any, @Param('id') id: string) {
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    if (homework.teacherId !== req.user.sub && req.user.role !== 1) {
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
  async getSubmissions(
    @Request() req: any,
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    // Only the homework's teacher (or admin) can view all submissions
    const filters: any = {
      homeworkId: +id,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };
    // If not the teacher, only return the requesting user's own submission
    if (homework.teacherId !== userId) {
      filters.studentId = userId;
    }
    const submissions = await this.homeworkService.getSubmissions(filters);
    return { status: 200, result: submissions };
  }

  @Get('submissions')
  @UseGuards(AuthGuard('jwt'))
  async getMySubmissions(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const studentId = req.user?.sub;
    if (!studentId) {
      return { status: 401, result: null };
    }
    const filters = {
      studentId,
      status: status !== undefined ? parseInt(status, 10) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };
    const submissions = await this.homeworkService.getSubmissions(filters);
    return { status: 200, result: submissions };
  }

  @Get('submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async getSubmission(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const submission = await this.homeworkService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    // Only the student who submitted or the homework's teacher can view
    const homework = await this.homeworkService.getHomework(submission.homeworkId);
    if (submission.studentId !== userId && homework?.teacherId !== userId) {
      return { status: 403, result: null, message: 'You can only view your own submissions' };
    }
    return { status: 200, result: submission };
  }

  @Post('homework/:id/submit')
  @UseGuards(AuthGuard('jwt'))
  async submitHomework(@Request() req: any, @Param('id') id: string, @Body() dto: SubmitHomeworkDto) {
    const studentId = req.user?.sub;
    if (!studentId) return { status: 401, result: null };
    // Verify homework exists
    const homework = await this.homeworkService.getHomework(+id);
    if (!homework) return { status: 404, result: null };
    const submission = await this.homeworkService.submitHomework({
      ...dto,
      homeworkId: +id,
      studentId,
    });
    return { status: 200, result: submission };
  }

  @Put('submission/:id/grade')
  @UseGuards(AuthGuard('jwt'))
  async gradeSubmission(@Request() req: any, @Param('id') id: string, @Body() dto: GradeSubmissionDto) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const submission = await this.homeworkService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    // Only the homework's teacher can grade
    const homework = await this.homeworkService.getHomework(submission.homeworkId);
    if (!homework || homework.teacherId !== userId) {
      return { status: 403, result: null, message: 'Only the homework teacher can grade submissions' };
    }
    const result = await this.homeworkService.gradeSubmission(+id, dto);
    return { status: 200, result };
  }

  @Delete('submission/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteSubmission(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const submission = await this.homeworkService.getSubmission(+id);
    if (!submission) return { status: 404, result: null };
    // Only the submitting student or the homework teacher can delete
    const homework = await this.homeworkService.getHomework(submission.homeworkId);
    if (submission.studentId !== userId && homework?.teacherId !== userId) {
      return { status: 403, result: null, message: 'You can only delete your own submissions' };
    }
    const result = await this.homeworkService.deleteSubmission(+id);
    return { status: 200, result };
  }
}
