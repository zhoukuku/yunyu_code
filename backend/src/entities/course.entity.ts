import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('hierarchy')
export class Hierarchy {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  hierarchyId: string;

  @Column()
  hierarchyName: string;

  @Column()
  standardClassifyId: string;

  @Column()
  standardClassifyName: string;

  @Column()
  themeClassifyId: string;

  @Column()
  themeClassifyName: string;
}

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseName: string;

  @Column()
  hierarchyId: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ default: 0 })
  totalLessons: number;

  @Column({ default: 0 })
  completedLessons: number;

  @Column({ default: 0 })
  duration: number; // 分钟

  @Column({ default: 0 })
  difficulty: number; // 1-5

  @Column({ nullable: true })
  teacher: string;

  @Column({ default: 0 })
  studentCount: number;

  @Column({ default: 0 })
  price: number;

  @Column({ default: 1 })
  status: number; // 1: 正常, 0: 已下架

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('lessons')
export class Lesson {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  courseId: number;

  @Column()
  lessonName: string;

  @Column({ default: 1 })
  lessonOrder: number;

  @Column({ nullable: true })
  videoUrl: string;

  @Column({ nullable: true })
  content: string;

  @Column({ nullable: true })
  pptUrl: string;

  @Column({ default: 0 })
  duration: number; // 分钟

  @Column({ default: 0 })
  isCompleted: number;

  @CreateDateColumn()
  createdAt: Date;
}

@Entity('notices')
@Index(['popupType', 'popupStartTime', 'popupEndTime', 'isRead'])
export class Notice {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  noticeId: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column()
  noticeType: string;

  @Column({ default: 0 })
  popupType: number;

  @Column({ default: 0 })
  contentType: number;

  @Column()
  sendTime: number;

  @Column({ nullable: true })
  popupStartTime: number;

  @Column({ nullable: true })
  popupEndTime: number;

  @Column({ default: 0 })
  isRead: number;

  @Column({ nullable: true })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;
}