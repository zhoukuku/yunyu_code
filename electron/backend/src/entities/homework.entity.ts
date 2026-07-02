import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('homework')
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
}

@Entity('homework_submissions')
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
}
