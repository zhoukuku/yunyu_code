import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Post endpoints
  @Post('posts')
  async createPost(@Body() data: {
    title: string;
    description?: string;
    thumbnail?: string;
    projectUrl?: string;
    projectId?: number;
    userId?: number;
    scope?: string;
  }) {
    return this.communityService.createPost(data);
  }

  @Get('posts')
  async findAllPosts(
    @Query('scope') scope?: string,
    @Query('sortBy') sortBy?: 'likesCount' | 'viewsCount' | 'createdAt',
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('category') category?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
  ) {
    const filters = {
      sortBy,
      sortOrder,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    };
    return this.communityService.findAllPosts(scope, filters);
  }

  @Get('posts/user/:userId')
  async findPostsByUser(@Param('userId') userId: string) {
    return this.communityService.findAllPosts();
  }

  @Get('posts/:id')
  async findPost(@Param('id') id: string) {
    const post = await this.communityService.findPostById(parseInt(id, 10));
    if (post) {
      await this.communityService.incrementViews(parseInt(id, 10));
    }
    return post;
  }

  @Put('posts/:id')
  async updatePost(@Param('id') id: string, @Body() data: Partial<{
    title: string;
    description: string;
    thumbnail: string;
    projectUrl: string;
  }>) {
    return this.communityService.updatePost(parseInt(id, 10), data);
  }

  @Delete('posts/:id')
  async deletePost(@Param('id') id: string) {
    await this.communityService.deletePost(parseInt(id, 10));
    return { success: true };
  }

  // Comment endpoints
  @Post('comments')
  async createComment(@Body() data: {
    content: string;
    postId: number;
    userId?: number;
    parentId?: number;
  }) {
    return this.communityService.createComment(data);
  }

  @Get('comments/post/:postId')
  async findCommentsByPost(@Param('postId') postId: string) {
    return this.communityService.findCommentsByPostId(parseInt(postId, 10));
  }

  @Delete('comments/:id')
  async deleteComment(@Param('id') id: string) {
    await this.communityService.deleteComment(parseInt(id, 10));
    return { success: true };
  }

  // Like endpoints
  @Post('likes')
  async toggleLike(@Body() data: { postId: number; userId?: number }) {
    return this.communityService.toggleLike(data.postId, data.userId || 0);
  }

  @Get('likes/user/:userId')
  async getUserLikedPosts(@Param('userId') userId: string) {
    return this.communityService.getUserLikedPosts(parseInt(userId, 10));
  }

  @Get('likes/check')
  async checkUserLiked(@Query('postId') postId: string, @Query('userId') userId: string) {
    return { liked: await this.communityService.checkUserLiked(parseInt(postId, 10), parseInt(userId, 10)) };
  }
}