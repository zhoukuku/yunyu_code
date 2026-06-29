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

export enum ActivityType {
  POST = 'post',
  COMMENT = 'comment',
  LIKE = 'like',
  FOLLOW = 'follow',
}

@Entity('activities')
@Index(['userId', 'createdAt'])
export class Activity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  type: ActivityType;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ nullable: true })
  targetId: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  extra: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}