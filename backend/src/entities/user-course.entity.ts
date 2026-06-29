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
import { Course, Lesson } from './course.entity';

@Entity('user_courses')
@Index(['userId'])
@Index(['courseId'])
export class UserCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  courseId: number;

  @Column({ default: 0 })
  completedLessons: number;

  @Column({ nullable: true, default: null })
  lastLessonId: number | null;

  @Column({ default: 0 })
  status: number; // 1: enrolled, 0: dropped

  @CreateDateColumn()
  enrolledAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => Lesson, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'lastLessonId' })
  lastLesson: Lesson | null;
}