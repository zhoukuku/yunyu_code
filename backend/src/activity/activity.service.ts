import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Activity, ActivityType } from '../entities/activity.entity';
import { UserFollow } from '../entities/user-follow.entity';
import { Post } from '../entities/post.entity';

@Injectable()
export class ActivityService {
  constructor(
    @InjectRepository(Activity)
    private activityRepository: Repository<Activity>,
    @InjectRepository(UserFollow)
    private userFollowRepository: Repository<UserFollow>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async createActivity(data: {
    type: ActivityType;
    userId: number;
    targetId?: number;
    content?: string;
    extra?: string;
  }): Promise<Activity> {
    const activity = this.activityRepository.create(data);
    return this.activityRepository.save(activity);
  }

  async recordPost(userId: number, postId: number): Promise<Activity> {
    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return this.createActivity({
      type: ActivityType.POST,
      userId,
      targetId: postId,
      content: post.title || 'Shared a new work',
      extra: post.thumbnail || undefined,
    });
  }

  async recordComment(userId: number, postId: number, commentId: number): Promise<Activity> {
    return this.createActivity({
      type: ActivityType.COMMENT,
      userId,
      targetId: commentId,
      content: 'Commented on a work',
      extra: String(postId),
    });
  }

  async recordLike(userId: number, postId: number): Promise<Activity> {
    return this.createActivity({
      type: ActivityType.LIKE,
      userId,
      targetId: postId,
      content: 'Liked a work',
    });
  }

  async recordFollow(followerId: number, followingId: number): Promise<Activity> {
    return this.createActivity({
      type: ActivityType.FOLLOW,
      userId: followerId,
      targetId: followingId,
      content: 'Followed a user',
    });
  }

  async getFollowingActivities(userId: number, page = 1, limit = 20): Promise<{ activities: Activity[]; total: number }> {
    // Get the list of users this user is following
    const following = await this.userFollowRepository.find({
      where: { followerId: userId },
      select: ['followingId'],
    });

    if (following.length === 0) {
      return { activities: [], total: 0 };
    }

    const followingIds = following.map((f) => f.followingId);

    const [activities, total] = await this.activityRepository.findAndCount({
      where: { userId: In(followingIds) },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { activities, total };
  }

  async getGlobalActivities(page = 1, limit = 20): Promise<{ activities: Activity[]; total: number }> {
    const [activities, total] = await this.activityRepository.findAndCount({
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { activities, total };
  }

  async getUserActivities(userId: number, page = 1, limit = 20): Promise<{ activities: Activity[]; total: number }> {
    const [activities, total] = await this.activityRepository.findAndCount({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { activities, total };
  }
}