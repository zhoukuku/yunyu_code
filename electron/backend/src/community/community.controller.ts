import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Post endpoints
  @Post('posts')
  @UseGuards(AuthGuard('jwt'))
  async createPost(@Req() req: any, @Body() data: {
    title: string;
    description?: string;
    thumbnail?: string;
    projectUrl?: string;
    projectId?: number;
    userId?: number;
    scope?: string;
  }) {
    // Use authenticated user ID, ignore any userId from the body
    return this.communityService.createPost({ ...data, userId: req.user.sub });
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
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      sortBy,
      sortOrder,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };
    return this.communityService.findAllPosts(scope, filters);
  }

  @Get('posts/user/:userId')
  async findPostsByUser(@Param('userId') userId: string) {
    return this.communityService.findAllPosts(undefined, {
      userId: parseInt(userId, 10),
    });
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
  @UseGuards(AuthGuard('jwt'))
  async updatePost(@Param('id') id: string, @Req() req: any, @Body() data: Partial<{
    title: string;
    description: string;
    thumbnail: string;
    projectUrl: string;
  }>) {
    const post = await this.communityService.findPostById(parseInt(id, 10));
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== req.user.sub) throw new ForbiddenException('You can only update your own posts');
    return this.communityService.updatePost(parseInt(id, 10), data);
  }

  @Delete('posts/:id')
  @UseGuards(AuthGuard('jwt'))
  async deletePost(@Param('id') id: string, @Req() req: any) {
    const post = await this.communityService.findPostById(parseInt(id, 10));
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== req.user.sub) throw new ForbiddenException('You can only delete your own posts');
    await this.communityService.deletePost(parseInt(id, 10));
    return { success: true };
  }

  // Comment endpoints
  @Post('comments')
  @UseGuards(AuthGuard('jwt'))
  async createComment(@Req() req: any, @Body() data: {
    content: string;
    postId: number;
    userId?: number;
    parentId?: number;
  }) {
    // Use authenticated user ID, ignore any userId from the body
    return this.communityService.createComment({ ...data, userId: req.user.sub });
  }

  @Get('comments/post/:postId')
  async findCommentsByPost(@Param('postId') postId: string) {
    return this.communityService.findCommentsByPostId(parseInt(postId, 10));
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteComment(@Param('id') id: string, @Req() req: any) {
    const result = await this.communityService.deleteComment(parseInt(id, 10), req.user.sub);
    return result;
  }

  // Like endpoints
  @Post('likes')
  @UseGuards(AuthGuard('jwt'))
  async toggleLike(@Req() req: any, @Body() data: { postId: number; userId?: number }) {
    // Use authenticated user ID, ignore any userId from the body
    return this.communityService.toggleLike(data.postId, req.user.sub);
  }

  @Get('likes/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserLikedPosts(@Param('userId') userId: string) {
    return this.communityService.getUserLikedPosts(parseInt(userId, 10));
  }

  @Get('likes/check')
  @UseGuards(AuthGuard('jwt'))
  async checkUserLiked(@Query('postId') postId: string, @Req() req: any) {
    return { liked: await this.communityService.checkUserLiked(parseInt(postId, 10), req.user.sub) };
  }
}