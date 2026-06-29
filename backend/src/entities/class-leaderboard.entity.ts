import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClassEntity } from './class.entity';

export enum ClassLeaderboardType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  ALL_TIME = 'all_time',
}

@Entity('class_leaderboard')
@Index(['type', 'period'])
export class ClassLeaderboard {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'class_id' })
  classId: number;

  @Column({ type: 'varchar', length: 20 })
  type: ClassLeaderboardType;

  @Column({ type: 'varchar', length: 20 })
  period: string;

  @Column({ default: 0 })
  totalScore: number;

  @Column({ default: 0 })
  rank: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: ClassEntity;
}
