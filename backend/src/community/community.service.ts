import { Injectable } from '@nestjs/common';
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

  async findAllPosts(scope?: string, filters?: {
    sortBy?: 'likesCount' | 'viewsCount' | 'createdAt';
    sortOrder?: 'ASC' | 'DESC';
    category?: string;
    startDate?: Date;
    endDate?: Date;
    search?: string;
  }): Promise<Post[]> {
    const query = this.postRepository.createQueryBuilder('post')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('post.likes', 'likes');

    if (scope) {
      query.where('post.scope = :scope', { scope });
    }

    if (filters?.category) {
      query.andWhere('post.scope = :category', { category: filters.category });
    }

    if (filters?.search) {
      query.andWhere('(post.title LIKE :search OR post.description LIKE :search)', { search: `%${filters.search}%` });
    }

    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'DESC';
    query.orderBy(`post.${sortBy}`, sortOrder);

    if (filters?.startDate) {
      query.andWhere('post.createdAt >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      query.andWhere('post.createdAt <= :endDate', { endDate: filters.endDate });
    }

    return query.getMany();
  }

  async findPostById(id: number): Promise<Post | null> {
    return this.postRepository.findOne({
      where: { id },
      relations: ['comments', 'likes'],
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

  async deleteComment(id: number): Promise<void> {
    const comment = await this.commentRepository.findOne({ where: { id } });
    if (comment) {
      await this.commentRepository.delete(id);
      if (comment.postId) {
        await this.postRepository.decrement({ id: comment.postId }, 'commentsCount', 1);
      }
    }
  }

  // Like operations
  async toggleLike(postId: number, userId: number): Promise<{ liked: boolean; likesCount: number }> {
    const existingLike = await this.likeRepository.findOne({
      where: { postId, userId },
    });

    if (existingLike) {
      await this.likeRepository.delete(existingLike.id);
      await this.postRepository.decrement({ id: postId }, 'likesCount', 1);
      const post = await this.findPostById(postId);
      return { liked: false, likesCount: post?.likesCount || 0 };
    } else {
      await this.likeRepository.save({ postId, userId });
      await this.postRepository.increment({ id: postId }, 'likesCount', 1);
      const post = await this.findPostById(postId);
      return { liked: true, likesCount: post?.likesCount || 0 };
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