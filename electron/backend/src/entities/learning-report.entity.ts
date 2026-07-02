import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

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
}

@Entity('learning_reports')
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
}
