import { Controller, Get, Post, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AchievementsService } from './achievements.service';
import { AchievementType } from '../entities/achievement.entity';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  private isValidAchievementType(type: string): type is AchievementType {
    return Object.values(AchievementType).includes(type as AchievementType);
  }

  @Post('initialize')
  @UseGuards(AuthGuard('jwt'))
  async initializeAchievements(@Request() req) {
    await this.achievementsService.initializeUserAchievements(req.user.sub);
    return {
      status: 200,
      message: 'Achievements initialized',
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getUserAchievements(@Request() req) {
    const achievements = await this.achievementsService.getUserAchievements(req.user.sub);
    return {
      status: 200,
      result: achievements,
    };
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getAchievementStats(@Request() req) {
    const stats = await this.achievementsService.getAchievementStats(req.user.sub);
    return {
      status: 200,
      result: stats,
    };
  }

  @Get('unlocked')
  @UseGuards(AuthGuard('jwt'))
  async getUnlockedAchievements(@Request() req) {
    const achievements = await this.achievementsService.getUnlockedAchievements(req.user.sub);
    return {
      status: 200,
      result: achievements,
    };
  }

  @Get(':userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserAchievementsById(@Request() req, @Param('userId') userId: string) {
    const requestingUserId = req.user?.sub;
    if (!requestingUserId) return { status: 401, result: null };
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) return { status: 400, message: 'Invalid userId' };
    const achievements = await this.achievementsService.getUserAchievements(uid);
    return {
      status: 200,
      result: achievements,
    };
  }

  @Post('progress')
  @UseGuards(AuthGuard('jwt'))
  async updateProgress(@Body() body: { type: AchievementType; increment?: number }, @Request() req) {
    if (!this.isValidAchievementType(body.type)) {
      return { status: 400, message: `Invalid achievement type. Valid values: ${Object.values(AchievementType).join(', ')}` };
    }
    const achievement = await this.achievementsService.updateProgress(
      req.user.sub,
      body.type,
      body.increment ?? 1,
    );
    return {
      status: 200,
      result: achievement,
    };
  }

  @Post('unlock')
  @UseGuards(AuthGuard('jwt'))
  async unlockAchievement(@Body() body: { type: AchievementType }, @Request() req) {
    if (!this.isValidAchievementType(body.type)) {
      return { status: 400, message: `Invalid achievement type. Valid values: ${Object.values(AchievementType).join(', ')}` };
    }
    const achievement = await this.achievementsService.unlockAchievement(req.user.sub, body.type);
    return {
      status: 200,
      result: achievement,
    };
  }
}