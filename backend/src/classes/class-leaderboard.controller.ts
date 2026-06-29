import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClassLeaderboardService } from './class-leaderboard.service';
import { ClassLeaderboardType } from '../entities/class-leaderboard.entity';

@Controller('class-leaderboard')
export class ClassLeaderboardController {
  constructor(private readonly classLeaderboardService: ClassLeaderboardService) {}

  @Get()
  async getClassLeaderboard(
    @Query('type') type: string = ClassLeaderboardType.ALL_TIME,
    @Query('limit') limit?: number,
  ) {
    const leaderboardType = type as ClassLeaderboardType;
    const entries = await this.classLeaderboardService.getClassLeaderboard(leaderboardType, limit);
    const stats = await this.classLeaderboardService.getClassLeaderboardStats(leaderboardType);
    return {
      status: 200,
      result: entries,
      stats,
    };
  }

  @Get('rank/:classId')
  async getClassRank(
    @Param('classId') classId: string,
    @Query('type') type: string = ClassLeaderboardType.ALL_TIME,
  ) {
    const leaderboardType = type as ClassLeaderboardType;
    const rank = await this.classLeaderboardService.getClassRank(parseInt(classId, 10), leaderboardType);
    return {
      status: 200,
      result: rank,
    };
  }

  @Post('calculate')
  @UseGuards(AuthGuard('jwt'))
  async calculateScores(@Body() body: { type: ClassLeaderboardType }) {
    await this.classLeaderboardService.calculateClassScores(body.type);
    return {
      status: 200,
      message: 'Class scores calculated successfully',
    };
  }

  @Post('recalculate')
  @UseGuards(AuthGuard('jwt'))
  async recalculateRanks(@Body() body: { type: ClassLeaderboardType }) {
    await this.classLeaderboardService.recalculateClassRanks(body.type);
    return {
      status: 200,
      message: 'Class ranks recalculated successfully',
    };
  }
}
