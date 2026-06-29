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
import { Course } from './course.entity';

@Entity('skill_categories')
export class SkillCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  categoryName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ default: 0 })
  sortOrder: number;
}

@Entity('course_skills')
export class CourseSkill {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseId: number;

  @Column()
  skillName: string;

  @Column({ nullable: true })
  skillLevel: number; // 1-5

  @Column({ nullable: true })
  categoryId: number;

  @Column({ nullable: true })
  description: string;

  @ManyToOne(() => Course, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Course;

  @ManyToOne(() => SkillCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: SkillCategory | null;
}

@Entity('user_skill_progress')
export class UserSkillProgress {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  skillName: string;

  @Column({ nullable: true })
  categoryId: number;

  @Column({ default: 0 })
  masteryLevel: number; // 0-100 percentage

  @Column({ default: 0 })
  associatedCourses: number; // Number of courses that taught this skill

  @Column({ nullable: true, type: 'datetime' })
  lastPracticedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => SkillCategory, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'categoryId' })
  category: SkillCategory | null;
}

@Entity('learning_reports')
@Index(['userId'])
export class LearningReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

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

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
