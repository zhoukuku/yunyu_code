import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Leaderboard, LeaderboardType } from '../entities/leaderboard.entity';

@Injectable()
export class LeaderboardService {
  constructor(
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
  ) {}

  private getPeriodKey(type: LeaderboardType): string {
    const now = new Date();
    if (type === LeaderboardType.DAILY) {
      return now.toISOString().split('T')[0];
    } else if (type === LeaderboardType.WEEKLY) {
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

  async getLeaderboard(type: LeaderboardType, limit = 100): Promise<Leaderboard[]> {
    const period = this.getPeriodKey(type);
    return this.leaderboardRepository.find({
      where: { type, period },
      relations: ['user'],
      order: { score: 'DESC', rank: 'ASC' },
      take: limit,
    });
  }

  async getUserRank(userId: number, type: LeaderboardType): Promise<Leaderboard | null> {
    const period = this.getPeriodKey(type);
    return this.leaderboardRepository.findOne({
      where: { userId, type, period },
      relations: ['user'],
    });
  }

  async updateScore(userId: number, type: LeaderboardType, scoreIncrement: number): Promise<Leaderboard> {
    const period = this.getPeriodKey(type);
    let entry = await this.leaderboardRepository.findOne({
      where: { userId, type, period },
    });

    if (!entry) {
      entry = this.leaderboardRepository.create({
        userId,
        type,
        period,
        score: 0,
        rank: 0,
      });
    }

    entry.score += scoreIncrement;
    const saved = await this.leaderboardRepository.save(entry);
    // Recalculate ranks for this period so ranks stay current
    await this.recalculateRanks(type);
    return saved;
  }

  async setScore(userId: number, type: LeaderboardType, score: number): Promise<Leaderboard> {
    const period = this.getPeriodKey(type);
    let entry = await this.leaderboardRepository.findOne({
      where: { userId, type, period },
    });

    if (!entry) {
      entry = this.leaderboardRepository.create({
        userId,
        type,
        period,
        score: 0,
        rank: 0,
      });
    }

    entry.score = score;
    const saved = await this.leaderboardRepository.save(entry);
    // Recalculate ranks for this period so ranks stay current
    await this.recalculateRanks(type);
    return saved;
  }

  async recalculateRanks(type: LeaderboardType): Promise<void> {
    const period = this.getPeriodKey(type);

    // Use a raw query to update ranks directly in DB without loading all entries into memory
    await this.leaderboardRepository.query(`
      UPDATE leaderboard l
      SET l.rank = ranked.rank_num
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY score DESC, created_at ASC) as rank_num
        FROM leaderboard
        WHERE type = $1 AND period = $2
      ) ranked
      WHERE l.id = ranked.id AND l.type = $1 AND l.period = $2
    `, [type, period]);
  }

  async getLeaderboardStats(type: LeaderboardType): Promise<{ totalUsers: number; topScore: number }> {
    const period = this.getPeriodKey(type);
    const result = await this.leaderboardRepository
      .createQueryBuilder('leaderboard')
      .where('leaderboard.type = :type', { type })
      .andWhere('leaderboard.period = :period', { period })
      .select('COUNT(DISTINCT leaderboard.userId)', 'totalUsers')
      .getRawOne();

    const topEntry = await this.leaderboardRepository.findOne({
      where: { type, period },
      order: { score: 'DESC' },
    });

    return {
      totalUsers: parseInt(result.totalUsers, 10) || 0,
      topScore: topEntry?.score || 0,
    };
  }
}
