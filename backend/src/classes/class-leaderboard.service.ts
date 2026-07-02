import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    const leaderboardType: LeaderboardType = (type === ClassLeaderboardType.ALL_TIME ? 'all_time' : type) as LeaderboardType;

    // Use a single query to calculate class scores directly in the database
    // This computes the total score for each class based on sum of user scores
    await this.classLeaderboardRepository.query(`
      INSERT INTO class_leaderboard (class_id, type, period, total_score, rank)
      SELECT
        uc.class_id,
        $1,
        $2,
        COALESCE(SUM(l.score), 0),
        0
      FROM user_class uc
      INNER JOIN leaderboard l ON l.user_id = uc.user_id AND l.type = $3
      WHERE uc.class_id = ANY($4) AND uc.status = 1
      GROUP BY uc.class_id
      ON CONFLICT (class_id, type, period)
      DO UPDATE SET total_score = EXCLUDED.total_score
    `, [type, period, leaderboardType, classIds]);
  }

  async recalculateClassRanks(type: ClassLeaderboardType): Promise<void> {
    const period = this.getPeriodKey(type);

    // Use a raw query to update ranks directly in DB without loading all entries into memory
    await this.classLeaderboardRepository.query(`
      UPDATE class_leaderboard cl
      SET rank = ranked.rank_num
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY total_score DESC) as rank_num
        FROM class_leaderboard
        WHERE type = $1 AND period = $2
      ) ranked
      WHERE cl.id = ranked.id AND cl.type = $1 AND cl.period = $2
    `, [type, period]);
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
