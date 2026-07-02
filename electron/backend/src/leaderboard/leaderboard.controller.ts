import { Controller, Get, Post, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { LeaderboardService } from './leaderboard.service';
import { LeaderboardType } from '../entities/leaderboard.entity';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  private isValidLeaderboardType(type: string): type is LeaderboardType {
    return Object.values(LeaderboardType).includes(type as LeaderboardType);
  }

  @Get()
  async getLeaderboard(
    @Query('type') type: string = LeaderboardType.ALL_TIME,
    @Query('limit') limit?: number,
  ) {
    if (!this.isValidLeaderboardType(type)) {
      return { status: 400, message: `Invalid leaderboard type. Valid values: ${Object.values(LeaderboardType).join(', ')}` };
    }
    const leaderboardType = type;
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
    if (!this.isValidLeaderboardType(type)) {
      return { status: 400, message: `Invalid leaderboard type. Valid values: ${Object.values(LeaderboardType).join(', ')}` };
    }
    const rank = await this.leaderboardService.getUserRank(req.user.sub, type);
    return {
      status: 200,
      result: rank,
    };
  }

  @Get('user/:userId')
  async getUserLeaderboard(@Param('userId') userId: string, @Query('type') type: string = LeaderboardType.ALL_TIME) {
    if (!this.isValidLeaderboardType(type)) {
      return { status: 400, message: `Invalid leaderboard type. Valid values: ${Object.values(LeaderboardType).join(', ')}` };
    }
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) return { status: 400, message: 'Invalid userId' };
    const rank = await this.leaderboardService.getUserRank(uid, type);
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
    if (!this.isValidLeaderboardType(body.type)) {
      return { status: 400, message: `Invalid leaderboard type. Valid values: ${Object.values(LeaderboardType).join(', ')}` };
    }
    const entry = await this.leaderboardService.updateScore(
      req.user.sub,
      body.type,
      body.increment ?? 1,
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
    if (!this.isValidLeaderboardType(body.type)) {
      return { status: 400, message: `Invalid leaderboard type. Valid values: ${Object.values(LeaderboardType).join(', ')}` };
    }
    const entry = await this.leaderboardService.setScore(req.user.sub, body.type, body.score);
    return {
      status: 200,
      result: entry,
    };
  }

  @Post('recalculate')
  @UseGuards(AuthGuard('jwt'))
  async recalculateRanks(@Body() body: { type: LeaderboardType }) {
    if (!this.isValidLeaderboardType(body.type)) {
      return { status: 400, message: `Invalid leaderboard type. Valid values: ${Object.values(LeaderboardType).join(', ')}` };
    }
    await this.leaderboardService.recalculateRanks(body.type);
    return {
      status: 200,
      message: 'Ranks recalculated successfully',
    };
  }
}
