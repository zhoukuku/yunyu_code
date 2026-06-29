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
import { Project } from './project.entity';

export enum CodeLanguage {
  PYTHON = 'python',
  CPP = 'cpp',
  JAVASCRIPT = 'javascript',
}

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  TIMEOUT = 'timeout',
}

@Entity('code_executions')
@Index(['userId'])
export class CodeExecution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ default: CodeLanguage.PYTHON })
  language: CodeLanguage;

  @Column({ type: 'text' })
  code: string;

  @Column({ type: 'text', nullable: true })
  output: string;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @Column({ default: ExecutionStatus.PENDING })
  status: ExecutionStatus;

  @Column({ default: 0 })
  executionTime: number;

  @Column({ nullable: true })
  projectId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'projectId' })
  project: Project | null;
}