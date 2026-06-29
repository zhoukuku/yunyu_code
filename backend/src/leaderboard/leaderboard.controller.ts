import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardType } from '../entities/leaderboard.entity';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  async getLeaderboard(
    @Query('type') type: string = LeaderboardType.ALL_TIME,
    @Query('limit') limit?: number,
  ) {
    const leaderboardType = type as LeaderboardType;
    const entries = await this.leaderboardService.getLeaderboard(leaderboardType, limit);
    const stats = await this.leaderboardService.getLeaderboardStats(leaderboardType);
    return {
      status: 200,
      result: entries,
      stats,
    };
  }

  @Get('rank')
  @UseGuards(AuthGuard('jwt'))
  async getUserRank(@Query('type') type: string = LeaderboardType.ALL_TIME, @Request() req) {
    const leaderboardType = type as LeaderboardType;
    const rank = await this.leaderboardService.getUserRank(req.user.sub, leaderboardType);
    return {
      status: 200,
      result: rank,
    };
  }

  @Get('user/:userId')
  async getUserLeaderboard(@Param('userId') userId: string, @Query('type') type: string = LeaderboardType.ALL_TIME) {
    const leaderboardType = type as LeaderboardType;
    const rank = await this.leaderboardService.getUserRank(parseInt(userId, 10), leaderboardType);
    return {
      status: 200,
      result: rank,
    };
  }

  @Post('score')
  @UseGuards(AuthGuard('jwt'))
  async updateScore(
    @Body() body: { type: LeaderboardType; increment?: number },
    @Request() req,
  ) {
    const entry = await this.leaderboardService.updateScore(
      req.user.sub,
      body.type,
      body.increment || 1,
    );
    return {
      status: 200,
      result: entry,
    };
  }

  @Post('set-score')
  @UseGuards(AuthGuard('jwt'))
  async setScore(
    @Body() body: { type: LeaderboardType; score: number },
    @Request() req,
  ) {
    const entry = await this.leaderboardService.setScore(req.user.sub, body.type, body.score);
    return {
      status: 200,
      result: entry,
    };
  }

  @Post('recalculate')
  @UseGuards(AuthGuard('jwt'))
  async recalculateRanks(@Body() body: { type: LeaderboardType }) {
    await this.leaderboardService.recalculateRanks(body.type);
    return {
      status: 200,
      message: 'Ranks recalculated successfully',
    };
  }
}
