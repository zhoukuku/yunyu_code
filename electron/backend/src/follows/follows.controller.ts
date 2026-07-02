import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowsService } from './follows.service';

@Controller('follows')
export class FollowsController {
  constructor(private followsService: FollowsService) {}

  @Post(':userId')
  @UseGuards(AuthGuard('jwt'))
  async follow(@Param('userId') userId: string, @Request() req) {
    const followerId = req.user.sub;
    const followingId = +userId;
    const result = await this.followsService.follow(followerId, followingId);
    return {
      status: 200,
      message: '关注成功',
      result,
    };
  }

  @Delete(':userId')
  @UseGuards(AuthGuard('jwt'))
  async unfollow(@Param('userId') userId: string, @Request() req) {
    const followerId = req.user.sub;
    const followingId = +userId;
    const result = await this.followsService.unfollow(followerId, followingId);
    return {
      status: 200,
      ...result,
    };
  }

  @Get(':userId/followers')
  @UseGuards(AuthGuard('jwt'))
  async getFollowers(@Param('userId') userId: string) {
    const followers = await this.followsService.getFollowers(+userId);
    return {
      status: 200,
      result: followers,
    };
  }

  @Get(':userId/following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowing(@Param('userId') userId: string) {
    const following = await this.followsService.getFollowing(+userId);
    return {
      status: 200,
      result: following,
    };
  }

  @Get(':userId/stats')
  @UseGuards(AuthGuard('jwt'))
  async getFollowStats(@Param('userId') userId: string) {
    const stats = await this.followsService.getFollowStats(+userId);
    return {
      status: 200,
      result: stats,
    };
  }

  @Get('check')
  @UseGuards(AuthGuard('jwt'))
  async checkFollow(@Query('targetId') targetId: string, @Request() req) {
    const followerId = req.user.sub;
    const result = await this.followsService.isFollowing(followerId, +targetId);
    return {
      status: 200,
      result,
    };
  }

  @Post('check-batch')
  @UseGuards(AuthGuard('jwt'))
  async checkFollowBatch(@Body() body: { targetIds: number[] }, @Request() req) {
    const followerId = req.user.sub;
    const result = await this.followsService.checkFollowStatus(followerId, body.targetIds);
    return {
      status: 200,
      result,
    };
  }
}