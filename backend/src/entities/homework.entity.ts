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
import { Course } from './course.entity';
import { ClassEntity } from './class.entity';

@Entity('homework')
@Index(['teacherId'])
@Index(['courseId'])
@Index(['classId'])
export class Homework {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  courseId: number;

  @Column({ nullable: true })
  classId: number;

  @Column()
  teacherId: number;

  @Column({ nullable: true })
  teacherName: string;

  @Column({ nullable: true })
  dueDate: Date;

  @Column({ default: 100 })
  totalScore: number;

  @Column({ default: 1 })
  status: number; // 1:  active, 0: archived

  @Column({ nullable: true })
  attachments: string; // JSON array of file URLs

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'teacherId' })
  teacher: User;

  @ManyToOne(() => Course, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'courseId' })
  course: Course | null;

  @ManyToOne(() => ClassEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'classId' })
  class: ClassEntity | null;
}

@Entity('homework_submissions')
@Index(['homeworkId'])
@Index(['studentId'])
export class HomeworkSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  homeworkId: number;

  @Column()
  studentId: number;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ nullable: true })
  attachments: string; // JSON array of file URLs

  @Column({ nullable: true })
  score: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  @Column({ nullable: true })
  submittedAt: Date;

  @Column({ nullable: true })
  gradedAt: Date;

  @Column({ default: 0 })
  status: number; // 0: not submitted, 1: submitted, 2: graded

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Homework, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'homeworkId' })
  homework: Homework;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'studentId' })
  student: User;
}
