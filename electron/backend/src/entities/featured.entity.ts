import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('featured_content')
export class FeaturedContent {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contentType: string; // 'course', 'project', 'category'

  @Column()
  contentId: number; // ID of the related course or project

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  coverImage: string;

  @Column({ default: 0 })
  sortOrder: number; // Lower number = higher priority

  @Column({ default: 1 })
  status: number; // 1: active, 0: inactive

  @Column({ nullable: true })
  category: string; // Category for browsing: 'programming', 'design', 'game', etc.

  @CreateDateColumn()
  createdAt: Date;
}