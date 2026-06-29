import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Index,
} from 'typeorm';
import { Course } from './course.entity';
import { User } from './user.entity';

@Entity('course_reviews')
@Index(['courseId'])
@Index(['userId'])
export class CourseReview {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseId: number;

  @Column()
  userId: number;

  @Column({ type: 'integer', default: 5 })
  rating: number; // 1-5

  @Column({ type: 'text', nullable: true })
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  course: Course;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;
}
