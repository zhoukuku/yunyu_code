import { Controller, Get, Post, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ActivityService } from './activity.service';

@Controller('activity')
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get('following')
  @UseGuards(AuthGuard('jwt'))
  async getFollowingActivities(@Request() req, @Query('page') page = '1', @Query('limit') limit = '20') {
    const userId = req.user.sub;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.activityService.getFollowingActivities(
      userId,
      isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
      isNaN(limitNum) || limitNum < 1 ? 20 : limitNum,
    );
    return {
      status: 200,
      result,
    };
  }

  @Get('global')
  async getGlobalActivities(@Query('page') page = '1', @Query('limit') limit = '20') {
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.activityService.getGlobalActivities(
      isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
      isNaN(limitNum) || limitNum < 1 ? 20 : limitNum,
    );
    return {
      status: 200,
      result,
    };
  }

  @Get('user/:userId')
  async getUserActivities(@Param('userId') userId: string, @Query('page') page = '1', @Query('limit') limit = '20') {
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) return { status: 400, message: 'Invalid userId' };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.activityService.getUserActivities(
      uid,
      isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
      isNaN(limitNum) || limitNum < 1 ? 20 : limitNum,
    );
    return {
      status: 200,
      result,
    };
  }

  @Post('record/post')
  @UseGuards(AuthGuard('jwt'))
  async recordPost(@Body() body: { postId: number }, @Request() req) {
    const activity = await this.activityService.recordPost(req.user.sub, body.postId);
    return {
      status: 200,
      result: activity,
    };
  }

  @Post('record/comment')
  @UseGuards(AuthGuard('jwt'))
  async recordComment(@Body() body: { postId: number; commentId: number }, @Request() req) {
    const activity = await this.activityService.recordComment(req.user.sub, body.postId, body.commentId);
    return {
      status: 200,
      result: activity,
    };
  }

  @Post('record/like')
  @UseGuards(AuthGuard('jwt'))
  async recordLike(@Body() body: { postId: number }, @Request() req) {
    const activity = await this.activityService.recordLike(req.user.sub, body.postId);
    return {
      status: 200,
      result: activity,
    };
  }

  @Post('record/follow')
  @UseGuards(AuthGuard('jwt'))
  async recordFollow(@Body() body: { followingId: number }, @Request() req) {
    const activity = await this.activityService.recordFollow(req.user.sub, body.followingId);
    return {
      status: 200,
      result: activity,
    };
  }
}