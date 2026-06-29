import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Course } from './course.entity';

@Entity('course_favorites')
@Unique(['userId', 'courseId'])
@Index(['userId'])
export class CourseFavorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  courseId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course: Course;
}