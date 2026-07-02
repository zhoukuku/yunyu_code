import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement, AchievementType, ACHIEVEMENT_CONFIGS } from '../entities/achievement.entity';

@Injectable()
export class AchievementsService {
  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
  ) {}

  async initializeUserAchievements(userId: number): Promise<void> {
    const existing = await this.achievementRepository.findOne({ where: { userId } });
    if (existing) return;

    // Object.values for string enums — Object.keys returns key names, not values
    const achievements = Object.values(AchievementType).map((type) => {
      const config = ACHIEVEMENT_CONFIGS[type];
      return this.achievementRepository.create({
        userId,
        type: type as AchievementType,
        name: config.name,
        description: config.description,
        icon: config.icon,
        target: config.target,
        progress: 0,
        unlocked: false,
      });
    });

    await this.achievementRepository.save(achievements);
  }

  async getUserAchievements(userId: number): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { userId },
      order: { unlocked: 'DESC', createdAt: 'ASC' },
    });
  }

  async getUnlockedAchievements(userId: number): Promise<Achievement[]> {
    return this.achievementRepository.find({
      where: { userId, unlocked: true },
      order: { unlockedAt: 'DESC' },
    });
  }

  async updateProgress(userId: number, type: AchievementType, increment = 1): Promise<Achievement | null> {
    const achievement = await this.achievementRepository.findOne({
      where: { userId, type },
    });

    if (!achievement) return null;

    achievement.progress += increment;

    if (achievement.progress >= achievement.target && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
    }

    return this.achievementRepository.save(achievement);
  }

  async unlockAchievement(userId: number, type: AchievementType): Promise<Achievement | null> {
    const achievement = await this.achievementRepository.findOne({
      where: { userId, type },
    });

    if (!achievement) return null;

    achievement.unlocked = true;
    achievement.unlockedAt = new Date();
    achievement.progress = achievement.target;

    return this.achievementRepository.save(achievement);
  }

  async checkAndUpdateAchievements(userId: number): Promise<Achievement[]> {
    const achievements = await this.getUserAchievements(userId);
    const updated: Achievement[] = [];

    for (const achievement of achievements) {
      if (achievement.unlocked) continue;

      const result = await this.updateProgress(userId, achievement.type, 0);
      if (result && result.unlocked) {
        updated.push(result);
      }
    }

    return updated;
  }

  async getAchievementStats(userId: number): Promise<{ total: number; unlocked: number; locked: number }> {
    const stats = await this.achievementRepository
      .createQueryBuilder('achievement')
      .select('COUNT(*)', 'total')
      .addSelect('SUM(CASE WHEN achievement.unlocked = 1 THEN 1 ELSE 0 END)', 'unlocked')
      .where('achievement.userId = :userId', { userId })
      .getRawOne();

    const total = parseInt(stats.total, 10) || 0;
    const unlocked = parseInt(stats.unlocked, 10) || 0;

    return { total, unlocked, locked: total - unlocked };
  }
}