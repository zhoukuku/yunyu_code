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

export enum AchievementType {
  COURSE_COMPLETE = 'course_complete',
  LESSON_COMPLETE = 'lesson_complete',
  PROJECT_SUBMIT = 'project_submit',
  POST_SHARE = 'post_share',
  COMMENT_MILESTONE = 'comment_milestone',
  FOLLOW_MILESTONE = 'follow_milestone',
  FIRST_LOGIN = 'first_login',
  DAILY_STUDY = 'daily_study',
  WEEKLY_STUDY = 'weekly_study',
  COURSE_MASTER = 'course_master',
}

@Entity('achievements')
@Index(['userId', 'createdAt'])
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 50 })
  type: AchievementType;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  icon: string;

  @Column({ default: 0 })
  progress: number;

  @Column({ default: 100 })
  target: number;

  @Column({ default: false })
  unlocked: boolean;

  @Column({ type: 'datetime', nullable: true, name: 'unlocked_at' })
  unlockedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

export const ACHIEVEMENT_CONFIGS: Record<AchievementType, { name: string; description: string; icon: string; target: number }> = {
  [AchievementType.COURSE_COMPLETE]: {
    name: 'Course Champion',
    description: 'Complete your first course',
    icon: 'trophy',
    target: 1,
  },
  [AchievementType.LESSON_COMPLETE]: {
    name: 'Quick Learner',
    description: 'Complete 10 lessons',
    icon: 'book',
    target: 10,
  },
  [AchievementType.PROJECT_SUBMIT]: {
    name: 'Creator',
    description: 'Submit 5 projects',
    icon: 'code',
    target: 5,
  },
  [AchievementType.POST_SHARE]: {
    name: 'Social Star',
    description: 'Share 10 posts',
    icon: 'share',
    target: 10,
  },
  [AchievementType.COMMENT_MILESTONE]: {
    name: 'Commentator',
    description: 'Write 20 comments',
    icon: 'message',
    target: 20,
  },
  [AchievementType.FOLLOW_MILESTONE]: {
    name: 'Social Butterfly',
    description: 'Follow 10 users',
    icon: 'team',
    target: 10,
  },
  [AchievementType.FIRST_LOGIN]: {
    name: 'Welcome Aboard',
    description: 'Log in for the first time',
    icon: 'star',
    target: 1,
  },
  [AchievementType.DAILY_STUDY]: {
    name: 'Daily Dedication',
    description: 'Study for 7 consecutive days',
    icon: 'fire',
    target: 7,
  },
  [AchievementType.WEEKLY_STUDY]: {
    name: 'Weekly Warrior',
    description: 'Study for 30 days total',
    icon: 'calendar',
    target: 30,
  },
  [AchievementType.COURSE_MASTER]: {
    name: 'Course Master',
    description: 'Complete 5 courses',
    icon: 'crown',
    target: 5,
  },
};