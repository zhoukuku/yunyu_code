import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

export enum LeaderboardType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ALL_TIME = 'all_time',
}

@Entity('leaderboard')
@Index(['type', 'period'])
export class Leaderboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 20 })
  type: LeaderboardType;

  @Column({ type: 'varchar', length: 20 })
  period: string;

  @Column({ default: 0 })
  score: number;

  @Column({ default: 0 })
  rank: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
