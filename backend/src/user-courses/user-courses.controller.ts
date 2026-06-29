import { Controller, Post, Get, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserCoursesService } from './user-courses.service';

@Controller('user/course')
export class UserCoursesController {
  constructor(private userCoursesService: UserCoursesService) {}

  @Post('enroll/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async enroll(@Request() req: any, @Param('courseId') courseId: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const result = await this.userCoursesService.enroll(userId, +courseId);
    return { status: 200, result };
  }

  @Delete('enroll/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async unenroll(@Request() req: any, @Param('courseId') courseId: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const result = await this.userCoursesService.unenroll(userId, +courseId);
    return { status: 200, result };
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyCourses(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const courses = await this.userCoursesService.getUserCourses(userId);
    return { status: 200, result: courses };
  }

  @Get('enrolled/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async isEnrolled(@Request() req: any, @Param('courseId') courseId: string) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: false };
    const enrolled = await this.userCoursesService.isEnrolled(userId, +courseId);
    return { status: 200, result: enrolled };
  }

  @Post('progress/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async updateProgress(@Request() req: any, @Param('courseId') courseId: string, @Body() body: { completedLessons: number; lastLessonId?: number }) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const result = await this.userCoursesService.updateProgress(userId, +courseId, body.completedLessons, body.lastLessonId);
    return { status: 200, result };
  }
}