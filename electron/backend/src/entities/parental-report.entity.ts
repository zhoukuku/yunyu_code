import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum ReportStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity('parental_reports')
export class ParentalReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  parentId: number;  // 家长用户ID

  @Column()
  studentId: number;  // 学生用户ID

  @Column({ nullable: true })
  studentName: string;  // 学生姓名（冗余存储便于显示）

  @Column({ nullable: true })
  reportType: string; // weekly, monthly, overall

  @Column({ nullable: true })
  periodStart: Date;

  @Column({ nullable: true })
  periodEnd: Date;

  @Column({ type: 'text', nullable: true })
  summary: string; // JSON string with report data

  @Column({ default: 0 })
  totalStudyMinutes: number;

  @Column({ default: 0 })
  lessonsCompleted: number;

  @Column({ default: 0 })
  coursesEnrolled: number;

  @Column({ default: 0 })
  coursesCompleted: number;

  @Column({ default: 0 })
  averageProgress: number; // 0-100

  @Column({ nullable: true })
  status: ReportStatus; // pending, approved, rejected

  @Column({ nullable: true })
  reviewedAt: Date;

  @Column({ nullable: true, type: 'text' })
  reviewComment: string | null;

  @CreateDateColumn()
  createdAt: Date;
}