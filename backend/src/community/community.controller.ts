import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CommunityService } from './community.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ToggleLikeDto } from './dto/toggle-like.dto';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  // Post endpoints
  @Post('posts')
  @UseGuards(AuthGuard('jwt'))
  async createPost(@Request() req: any, @Body() dto: CreatePostDto) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    if (!dto?.title?.trim()) return { status: 400, message: 'Title is required' };
    return this.communityService.createPost({ ...dto, userId });
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
    const pageNum = page ? parseInt(page, 10) : undefined;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : undefined;
    const filters = {
      sortBy,
      sortOrder,
      category,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page: pageNum && !isNaN(pageNum) && pageNum > 0 ? pageNum : undefined,
      pageSize: pageSizeNum && !isNaN(pageSizeNum) && pageSizeNum > 0 ? pageSizeNum : undefined,
    };
    const result = await this.communityService.findAllPosts(scope, filters);
    return { status: 200, result };
  }

  @Get('posts/user/:userId')
  async findPostsByUser(@Param('userId') userId: string) {
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) return { status: 400, message: 'Invalid userId' };
    const result = await this.communityService.findAllPosts(undefined, {
      userId: uid,
    });
    return { status: 200, result };
  }

  @Get('posts/:id')
  async findPost(@Param('id') id: string) {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) return { status: 400, message: 'Invalid postId' };
    const post = await this.communityService.findPostById(postId);
    if (post) {
      await this.communityService.incrementViews(postId);
    }
    if (!post) return { status: 404, result: null };
    return { status: 200, result: post };
  }

  @Put('posts/:id')
  @UseGuards(AuthGuard('jwt'))
  async updatePost(@Request() req: any, @Param('id') id: string, @Body() dto: UpdatePostDto) {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) return { status: 400, message: 'Invalid postId' };
    const post = await this.communityService.findPostById(postId);
    if (!post) {
      return { status: 404, message: 'Post not found' };
    }
    if (post.userId !== req.user.sub) {
      return { status: 403, message: 'You can only update your own posts' };
    }
    return this.communityService.updatePost(postId, dto);
  }

  @Delete('posts/:id')
  @UseGuards(AuthGuard('jwt'))
  async deletePost(@Request() req: any, @Param('id') id: string) {
    const postId = parseInt(id, 10);
    if (isNaN(postId)) return { status: 400, message: 'Invalid postId' };
    const post = await this.communityService.findPostById(postId);
    if (!post) {
      return { status: 404, message: 'Post not found' };
    }
    if (post.userId !== req.user.sub) {
      return { status: 403, message: 'You can only delete your own posts' };
    }
    await this.communityService.deletePost(postId);
    return { success: true };
  }

  // Comment endpoints
  @Post('comments')
  @UseGuards(AuthGuard('jwt'))
  async createComment(@Request() req: any, @Body() dto: CreateCommentDto) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    if (!dto?.content?.trim()) return { status: 400, message: 'Content is required' };
    if (!dto?.postId || isNaN(dto.postId)) return { status: 400, message: 'Invalid postId' };
    return this.communityService.createComment({ ...dto, userId });
  }

  @Get('comments/post/:postId')
  async findCommentsByPost(@Param('postId') postId: string) {
    const pid = parseInt(postId, 10);
    if (isNaN(pid)) return { status: 400, message: 'Invalid postId' };
    const comments = await this.communityService.findCommentsByPostId(pid);
    return { status: 200, result: comments };
  }

  @Delete('comments/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteComment(@Request() req: any, @Param('id') id: string) {
    const commentId = parseInt(id, 10);
    if (isNaN(commentId)) return { status: 400, message: 'Invalid commentId' };
    return this.communityService.deleteComment(commentId, req.user.sub);
  }

  // Like endpoints
  @Post('likes')
  @UseGuards(AuthGuard('jwt'))
  async toggleLike(@Request() req: any, @Body() dto: ToggleLikeDto) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    if (!dto?.postId || isNaN(dto.postId)) return { status: 400, message: 'Invalid postId' };
    const result = await this.communityService.toggleLike(dto.postId, userId);
    return { status: 200, result };
  }

  @Get('likes/user/:userId')
  @UseGuards(AuthGuard('jwt'))
  async getUserLikedPosts(@Param('userId') userId: string) {
    const uid = parseInt(userId, 10);
    if (isNaN(uid)) return { status: 400, message: 'Invalid userId' };
    const postIds = await this.communityService.getUserLikedPosts(uid);
    return { status: 200, result: postIds };
  }

  @Get('likes/check')
  @UseGuards(AuthGuard('jwt'))
  async checkUserLiked(@Request() req: any, @Query('postId') postId: string) {
    const pid = parseInt(postId, 10);
    if (isNaN(pid)) return { status: 400, message: 'Invalid postId' };
    const liked = await this.communityService.checkUserLiked(pid, req.user.sub);
    return { status: 200, result: { liked } };
  }
}