import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from '../entities/post.entity';
import { Comment } from '../entities/comment.entity';
import { Like } from '../entities/like.entity';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(Like)
    private likeRepository: Repository<Like>,
  ) {}

  // Post operations
  async createPost(data: Partial<Post>): Promise<Post> {
    const post = this.postRepository.create(data);
    return this.postRepository.save(post);
  }

  private readonly ALLOWED_SORT_COLUMNS = ['likesCount', 'viewsCount', 'createdAt', 'updatedAt'];
  private readonly ALLOWED_SORT_ORDERS = ['ASC', 'DESC'];

  async findAllPosts(scope?: string, filters?: {
    sortBy?: 'likesCount' | 'viewsCount' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    category?: string;
    userId?: number;
    startDate?: Date;
    endDate?: Date;
    search?: string;
    page?: number;
    pageSize?: number;
  }): Promise<{ posts: Post[]; total: number }> {
    const query = this.postRepository.createQueryBuilder('post')
      .select([
        'post.id',
        'post.title',
        'post.description',
        'post.scope',
        'post.userId',
        'post.likesCount',
        'post.commentsCount',
        'post.viewsCount',
        'post.createdAt',
        'post.updatedAt',
      ])
      .addSelect('(SELECT COUNT(*) FROM comments WHERE comments.post_id = post.id)', 'commentCount')
      .addSelect('(SELECT COUNT(*) FROM likes WHERE likes.post_id = post.id)', 'likeCount');

    // category is an alias for scope; prefer category if both are provided
    const effectiveScope = filters?.category || scope;
    if (effectiveScope) {
      query.where('post.scope = :scope', { scope: effectiveScope });
    }

    if (filters?.userId) {
      query.andWhere('post.userId = :userId', { userId: filters.userId });
    }

    if (filters?.search) {
      // 清理 LIKE 特殊字符防止通配符注入
      const sanitized = filters.search
        .replace(/\\/g, '\\\\')
        .replace(/%/g, '\\%')
        .replace(/_/g, '\\_');
      query.andWhere('(post.title LIKE :search OR post.description LIKE :search)', { search: `%${sanitized}%` });
    }

    // 白名单校验排序字段防止 SQL 注入
    const sortBy = this.ALLOWED_SORT_COLUMNS.includes(filters?.sortBy || '') ? filters!.sortBy : 'createdAt';
    const sortOrder = this.ALLOWED_SORT_ORDERS.includes(filters?.sortOrder || '') ? filters!.sortOrder : 'DESC';
    query.orderBy(`post.${sortBy}`, sortOrder as 'ASC' | 'DESC');

    if (filters?.startDate) {
      query.andWhere('post.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('post.createdAt <= :endDate', { endDate: filters.endDate });
    }

    // Pagination
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    query.skip((page - 1) * pageSize).take(pageSize);

    const [posts, total] = await query.getManyAndCount();
    return { posts, total };
  }

  async findPostById(id: number): Promise<Post | null> {
    return this.postRepository.findOne({
      where: { id },
      select: ['id', 'title', 'description', 'scope', 'userId', 'likesCount', 'commentsCount', 'viewsCount', 'createdAt', 'updatedAt'],
    });
  }

  async incrementViews(id: number): Promise<void> {
    await this.postRepository.increment({ id }, 'viewsCount', 1);
  }

  async updatePost(id: number, data: Partial<Post>): Promise<Post | null> {
    await this.postRepository.update(id, data);
    return this.findPostById(id);
  }

  async deletePost(id: number): Promise<void> {
    await this.postRepository.delete(id);
  }

  // Comment operations
  async createComment(data: Partial<Comment>): Promise<Comment> {
    // Verify the post exists before creating a comment
    if (data.postId) {
      const post = await this.postRepository.findOne({ where: { id: data.postId } });
      if (!post) {
        throw new NotFoundException('Post not found');
      }
    }

    const comment = this.commentRepository.create(data);
    const saved = await this.commentRepository.save(comment);

    // Update comments count on post
    if (data.postId) {
      await this.postRepository.increment({ id: data.postId }, 'commentsCount', 1);
    }

    return saved;
  }

  async findCommentsByPostId(postId: number): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { postId },
      order: { createdAt: 'ASC' },
    });
  }

  async deleteComment(id: number, userId: number): Promise<{ success: boolean; error?: string }> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (!comment) {
      return { success: false, error: 'Comment not found' };
    }
    if (comment.userId !== userId) {
      return { success: false, error: 'You can only delete your own comments' };
    }
    await this.commentRepository.delete(id);
    if (comment.postId) {
      await this.postRepository.decrement({ id: comment.postId }, 'commentsCount', 1);
    }
    return { success: true };
  }

  // Like operations
  async toggleLike(postId: number, userId: number): Promise<{ liked: boolean; likesCount: number }> {
    // Verify post exists
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const existingLike = await this.likeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      await this.likeRepository.delete(existingLike.id);
      await this.postRepository.decrement({ id: postId }, 'likesCount', 1);
      const updatedPost = await this.postRepository.findOne({ where: { id: postId }, select: ['likesCount'] });
      return { liked: false, likesCount: updatedPost?.likesCount || 0 };
    } else {
      await this.likeRepository.save({ postId, userId });
      await this.postRepository.increment({ id: postId }, 'likesCount', 1);
      const updatedPost = await this.postRepository.findOne({ where: { id: postId }, select: ['likesCount'] });
      return { liked: true, likesCount: updatedPost?.likesCount || 0 };
    }
  }

  async checkUserLiked(postId: number, userId: number): Promise<boolean> {
    const like = await this.likeRepository.findOne({ where: { postId, userId } });
    return !!like;
  }

  async getUserLikedPosts(userId: number): Promise<number[]> {
    const likes = await this.likeRepository.find({ where: { userId } });
    return likes.map((like) => like.postId);
  }
}