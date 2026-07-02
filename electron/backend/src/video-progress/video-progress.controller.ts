import { Controller, Get, Post, Body, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { VideoProgressService } from './video-progress.service';

@Controller('video-progress')
export class VideoProgressController {
  constructor(private videoProgressService: VideoProgressService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getVideoProgress(@Request() req: any, @Query('lessonId') lessonId: string) {
    const userId = req.user?.id;
    if (!userId) return { status: 401, result: null };
    const progress = await this.videoProgressService.getVideoProgress(userId, +lessonId);
    return { status: 200, result: progress };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async saveVideoProgress(
    @Request() req: any,
    @Body() body: { lessonId: number; currentTime: number; duration: number },
  ) {
    const userId = req.user?.id;
    if (!userId) return { status: 401, result: null };
    const progress = await this.videoProgressService.saveVideoProgress(
      userId,
      body.lessonId,
      body.currentTime,
      body.duration,
    );
    return { status: 200, result: progress };
  }

  @Post('complete')
  @UseGuards(AuthGuard('jwt'))
  async markCompleted(@Request() req: any, @Body() body: { lessonId: number }) {
    const userId = req.user?.id;
    if (!userId) return { status: 401, result: null };
    const progress = await this.videoProgressService.markVideoCompleted(userId, body.lessonId);
    return { status: 200, result: progress };
  }
}