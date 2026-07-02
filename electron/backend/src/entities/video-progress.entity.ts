import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';

@Entity('user_video_progress')
@Unique(['userId', 'lessonId'])
export class VideoProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  lessonId: number;

  @Column({ default: 0 })
  currentTime: number; // seconds watched

  @Column({ default: 0 })
  duration: number; // total video duration in seconds

  @Column({ default: 0 })
  isCompleted: number; // 1: completed, 0: not completed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}