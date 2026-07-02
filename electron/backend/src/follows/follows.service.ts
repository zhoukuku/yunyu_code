import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserFollow } from '../entities/user-follow.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class FollowsService {
  constructor(
    @InjectRepository(UserFollow)
    private followsRepository: Repository<UserFollow>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async follow(followerId: number, followingId: number) {
    if (followerId === followingId) {
      throw new BadRequestException('不能关注自己');
    }

    const followingUser = await this.usersRepository.findOne({ where: { id: followingId } });
    if (!followingUser) {
      throw new BadRequestException('用户不存在');
    }

    const existingFollow = await this.followsRepository.findOne({
      where: { followerId, followingId },
    });

    if (existingFollow) {
      throw new BadRequestException('已经关注过该用户');
    }

    const follow = this.followsRepository.create({ followerId, followingId });
    return this.followsRepository.save(follow);
  }

  async unfollow(followerId: number, followingId: number) {
    const follow = await this.followsRepository.findOne({
      where: { followerId, followingId },
    });

    if (!follow) {
      throw new BadRequestException('未关注该用户');
    }

    await this.followsRepository.remove(follow);
    return { message: '取消关注成功' };
  }

  async getFollowers(userId: number) {
    const follows = await this.followsRepository.find({
      where: { followingId: userId },
      relations: ['follower'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => ({
      id: f.follower.id,
      username: f.follower.username,
      name: f.follower.name,
      avatar: f.follower.avatar,
      nickname: f.follower.nickname,
      followedAt: f.createdAt,
    }));
  }

  async getFollowing(userId: number) {
    const follows = await this.followsRepository.find({
      where: { followerId: userId },
      relations: ['following'],
      order: { createdAt: 'DESC' },
    });

    return follows.map((f) => ({
      id: f.following.id,
      username: f.following.username,
      name: f.following.name,
      avatar: f.following.avatar,
      nickname: f.following.nickname,
      followedAt: f.createdAt,
    }));
  }

  async getFollowStats(userId: number) {
    const followersCount = await this.followsRepository.count({ where: { followingId: userId } });
    const followingCount = await this.followsRepository.count({ where: { followerId: userId } });

    return {
      followersCount,
      followingCount,
    };
  }

  async isFollowing(followerId: number, followingId: number) {
    const follow = await this.followsRepository.findOne({
      where: { followerId, followingId },
    });
    return { isFollowing: !!follow };
  }

  async checkFollowStatus(followerId: number, targetIds: number[]) {
    const follows = await this.followsRepository.find({
      where: targetIds.map((id) => ({ followerId, followingId: id })),
    });
    const followingSet = new Set(follows.map((f) => f.followingId));
    return targetIds.map((id) => ({ userId: id, isFollowing: followingSet.has(id) }));
  }
}