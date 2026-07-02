import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { ClassLeaderboard, ClassLeaderboardType } from '../entities/class-leaderboard.entity';
import { ClassEntity } from '../entities/class.entity';
import { UserClass } from '../entities/user-class.entity';
import { Leaderboard, LeaderboardType } from '../entities/leaderboard.entity';

@Injectable()
export class ClassLeaderboardService {
  constructor(
    @InjectRepository(ClassLeaderboard)
    private classLeaderboardRepository: Repository<ClassLeaderboard>,
    @InjectRepository(ClassEntity)
    private classRepository: Repository<ClassEntity>,
    @InjectRepository(UserClass)
    private userClassRepository: Repository<UserClass>,
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
  ) {}

  private getPeriodKey(type: ClassLeaderboardType): string {
    const now = new Date();
    if (type === ClassLeaderboardType.DAILY) {
      return now.toISOString().split('T')[0];
    } else if (type === ClassLeaderboardType.WEEKLY) {
      const year = now.getFullYear();
      const week = this.getWeekNumber(now);
      return `${year}-W${week}`;
    }
    return 'all';
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  async getClassLeaderboard(type: ClassLeaderboardType, limit = 100): Promise<ClassLeaderboard[]> {
    const period = this.getPeriodKey(type);
    return this.classLeaderboardRepository.find({
      where: { type, period },
      relations: ['class'],
      order: { totalScore: 'DESC', rank: 'ASC' },
      take: limit,
    });
  }

  async getClassRank(classId: number, type: ClassLeaderboardType): Promise<ClassLeaderboard | null> {
    const period = this.getPeriodKey(type);
    return this.classLeaderboardRepository.findOne({
      where: { classId, type, period },
      relations: ['class'],
    });
  }

  async calculateClassScores(type: ClassLeaderboardType): Promise<void> {
    const period = this.getPeriodKey(type);
    const classes = await this.classRepository.find();

    if (classes.length === 0) return;

    const classIds = classes.map(c => c.id);

    // Batch query: get all user-class relations for all classes at once
    const allUserClasses = await this.userClassRepository.find({
      where: { classId: In(classIds), status: 1 },
    });

    // Group userIds by classId
    const userIdsByClass = new Map<number, number[]>();
    for (const uc of allUserClasses) {
      const list = userIdsByClass.get(uc.classId) || [];
      list.push(uc.userId);
      userIdsByClass.set(uc.classId, list);
    }

    // Collect all unique userIds across all classes
    const allUserIds = [...new Set(allUserClasses.map(uc => uc.userId))];
    const leaderboardType: LeaderboardType = (type === ClassLeaderboardType.ALL_TIME ? 'all_time' : type) as LeaderboardType;

    // Batch query: get leaderboard scores for all users at once
    let scoresByUser = new Map<number, number>();
    if (allUserIds.length > 0) {
      const leaderboardEntries = await this.leaderboardRepository.find({
        where: { userId: In(allUserIds), type: leaderboardType },
      });
      for (const entry of leaderboardEntries) {
        const current = scoresByUser.get(entry.userId) || 0;
        scoresByUser.set(entry.userId, current + (entry.score || 0));
      }
    }

    // Process each class using in-memory data (no DB queries in the loop)
    for (const classEntity of classes) {
      const userIds = userIdsByClass.get(classEntity.id) || [];
      if (userIds.length === 0) continue;

      // Sum scores from pre-fetched data
      let totalScore = 0;
      for (const uid of userIds) {
        totalScore += scoresByUser.get(uid) || 0;
      }

      // Update or create class leaderboard entry
      let entry = await this.classLeaderboardRepository.findOne({
        where: { classId: classEntity.id, type, period },
      });

      if (!entry) {
        entry = this.classLeaderboardRepository.create({
          classId: classEntity.id,
          type,
          period,
          totalScore,
          rank: 0,
        });
      } else {
        entry.totalScore = totalScore;
      }

      await this.classLeaderboardRepository.save(entry);
    }

    // Recalculate ranks
    await this.recalculateClassRanks(type);
  }

  async recalculateClassRanks(type: ClassLeaderboardType): Promise<void> {
    const period = this.getPeriodKey(type);
    const entries = await this.classLeaderboardRepository.find({
      where: { type, period },
      order: { totalScore: 'DESC' },
    });

    for (let i = 0; i < entries.length; i++) {
      entries[i].rank = i + 1;
    }

    await this.classLeaderboardRepository.save(entries);
  }

  async getClassLeaderboardStats(type: ClassLeaderboardType): Promise<{ totalClasses: number; topScore: number }> {
    const period = this.getPeriodKey(type);
    const result = await this.classLeaderboardRepository
      .createQueryBuilder('cl')
      .where('cl.type = :type', { type })
      .andWhere('cl.period = :period', { period })
      .select('COUNT(DISTINCT cl.class_id)', 'totalClasses')
      .getRawOne();

    const topEntry = await this.classLeaderboardRepository.findOne({
      where: { type, period },
      order: { totalScore: 'DESC' },
    });

    return {
      totalClasses: parseInt(result.totalClasses, 10) || 0,
      topScore: topEntry?.totalScore || 0,
    };
  }
}
