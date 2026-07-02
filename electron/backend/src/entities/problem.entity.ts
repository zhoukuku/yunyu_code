import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ProblemDifficulty {
  EASY = '入门',
  MEDIUM = '进阶',
  HARD = '挑战',
}

@Entity('problems')
export class Problem {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  competitionId: number;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  inputDescription: string;

  @Column({ type: 'text', nullable: true })
  outputDescription: string;

  @Column({ type: 'text', nullable: true })
  sampleInput: string;

  @Column({ type: 'text', nullable: true })
  sampleOutput: string;

  @Column({ type: 'text', nullable: true })
  hint: string;

  @Column({ type: 'text', nullable: true })
  testCases: string; // JSON array of test cases

  @Column({ nullable: true })
  timeLimit: number; // ms

  @Column({ nullable: true })
  memoryLimit: number; // KB

  @Column({
    type: 'varchar',
    default: ProblemDifficulty.EASY,
  })
  difficulty: ProblemDifficulty;

  @Column({ nullable: true })
  maxScore: number;

  @Column({ nullable: true })
  maxAttempts: number;

  @Column({ default: 1 })
  enabled: boolean; // Whether the problem is active/available

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}