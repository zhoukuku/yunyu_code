import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VideoProgress } from '../entities/video-progress.entity';

@Injectable()
export class VideoProgressService {
  constructor(
    @InjectRepository(VideoProgress)
    private videoProgressRepository: Repository<VideoProgress>,
  ) {}

  async getVideoProgress(userId: number, lessonId: number): Promise<VideoProgress | null> {
    return this.videoProgressRepository.findOne({
      where: { userId, lessonId },
    });
  }

  async saveVideoProgress(
    userId: number,
    lessonId: number,
    currentTime: number,
    duration: number,
  ): Promise<VideoProgress> {
    let progress = await this.videoProgressRepository.findOne({
      where: { userId, lessonId },
    });

    const isCompleted = duration > 0 && currentTime >= duration * 0.9 ? 1 : 0;

    if (progress) {
      progress.currentTime = currentTime;
      progress.duration = duration;
      progress.isCompleted = isCompleted;
      return this.videoProgressRepository.save(progress);
    }

    progress = this.videoProgressRepository.create({
      userId,
      lessonId,
      currentTime,
      duration,
      isCompleted,
    });
    return this.videoProgressRepository.save(progress);
  }

  async markVideoCompleted(userId: number, lessonId: number): Promise<VideoProgress | null> {
    const progress = await this.videoProgressRepository.findOne({
      where: { userId, lessonId },
    });
    if (progress) {
      progress.isCompleted = 1;
      return this.videoProgressRepository.save(progress);
    }
    return null;
  }
}