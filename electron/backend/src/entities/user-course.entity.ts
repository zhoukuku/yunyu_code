import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_courses')
export class UserCourse {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  courseId: number;

  @Column({ default: 0 })
  completedLessons: number;

  @Column({ default: 0 })
  lastLessonId: number;

  @Column({ default: 0 })
  status: number; // 1: enrolled, 0: dropped

  @CreateDateColumn()
  enrolledAt: Date;
}