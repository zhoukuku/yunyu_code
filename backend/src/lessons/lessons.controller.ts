import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LessonsService } from './lessons.service';

@Controller('lessons')
export class LessonsController {
  constructor(private lessonsService: LessonsService) {}

  @Get(':lessonId')
  async getLessonDetail(@Param('lessonId') lessonId: string, @Request() req: any) {
    const userId = req.user?.id;
    const lesson = await this.lessonsService.getLessonDetail(+lessonId, userId);
    if (!lesson) return { status: 404, result: null };
    return { status: 200, result: lesson };
  }

  @Post(':lessonId/complete')
  @UseGuards(AuthGuard('jwt'))
  async markCompleted(@Request() req: any, @Param('lessonId') lessonId: string) {
    const userId = req.user?.id;
    if (!userId) return { status: 401, result: null };
    const result = await this.lessonsService.markCompleted(userId, +lessonId);
    return { status: 200, result };
  }

  @Post(':lessonId/incomplete')
  @UseGuards(AuthGuard('jwt'))
  async markIncomplete(@Request() req: any, @Param('lessonId') lessonId: string) {
    const userId = req.user?.id;
    if (!userId) return { status: 401, result: null };
    const result = await this.lessonsService.markIncomplete(userId, +lessonId);
    return { status: 200, result };
  }

  @Get(':lessonId/progress')
  @UseGuards(AuthGuard('jwt'))
  async getProgress(@Request() req: any, @Param('lessonId') lessonId: string) {
    const userId = req.user?.id;
    if (!userId) return { status: 401, result: null };

    const lesson = await this.lessonsService.getLessonDetail(+lessonId, userId);
    return { status: 200, result: { isCompleted: lesson?.isCompleted || false } };
  }

  @Get('course/:courseId/progress')
  @UseGuards(AuthGuard('jwt'))
  async getCourseProgress(@Request() req: any, @Param('courseId') courseId: string) {
    const userId = req.user?.id;
    if (!userId) return { status: 401, result: null };
    const progress = await this.lessonsService.getLessonProgress(userId, +courseId);
    return { status: 200, result: progress };
  }
}