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
import { Problem } from './problem.entity';

export enum EvaluationStatus {
  PENDING = 0,      // 待评测
  RUNNING = 1,      // 评测中
  ACCEPTED = 2,     // 通过
  WRONG_ANSWER = 3, // 答案错误
  TIME_LIMIT = 4,   // 超时
  MEMORY_LIMIT = 5, // 内存超限
  COMPILE_ERROR = 6, // 编译错误
  RUNTIME_ERROR = 7, // 运行时错误
  SYSTEM_ERROR = 8,  // 系统错误
}

@Entity('competition_evaluations')
@Index(['competitionId'])
@Index(['userId'])
@Index(['problemId'])
export class CompetitionEvaluation {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  competitionId: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  problemId: number;

  @Column({ nullable: true })
  problemTitle: string;

  @Column({ type: 'text', nullable: true })
  submittedCode: string;

  @Column({ type: 'text', nullable: true })
  language: string;

  @Column({ type: 'text', nullable: true })
  testCases: string; // JSON array of test case results

  @Column({ nullable: true })
  score: number;

  @Column({ nullable: true })
  maxScore: number;

  @Column({ nullable: true })
  passedCases: number;

  @Column({ nullable: true })
  totalCases: number;

  @Column({ nullable: true })
  executionTime: number; // ms

  @Column({ nullable: true })
  memoryUsage: number; // KB

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ nullable: true })
  evaluatedAt: Date;

  @Column({ default: EvaluationStatus.PENDING })
  status: EvaluationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Problem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'problemId' })
  problem: Problem | null;
}

@Entity('competition_submissions')
@Index(['competitionId'])
@Index(['userId'])
@Index(['problemId'])
export class CompetitionSubmission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  competitionId: number;

  @Column()
  userId: number;

  @Column({ nullable: true })
  userName: string;

  @Column({ nullable: true })
  problemId: number;

  @Column({ nullable: true })
  problemTitle: string;

  @Column({ type: 'text', nullable: true })
  submittedCode: string;

  @Column({ nullable: true })
  language: string;

  @Column({ nullable: true })
  score: number;

  @Column({ nullable: true })
  maxScore: number;

  @Column({ default: 0 })
  status: number; // 0: pending, 1: accepted, 2: rejected

  @Column({ nullable: true })
  submittedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Problem, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'problemId' })
  problem: Problem | null;
}