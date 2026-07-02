import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('study_notes')
@Index(['userId', 'createdAt'])
@Index(['courseId'])
@Index(['lessonId'])
export class StudyNote {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'int', nullable: true, name: 'course_id' })
  courseId: number | null;

  @Column({ type: 'int', nullable: true, name: 'lesson_id' })
  lessonId: number | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  tags: string;

  @Column({ default: false, name: 'is_public' })
  isPublic: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
