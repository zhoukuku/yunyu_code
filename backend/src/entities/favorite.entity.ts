import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  Unique,
  Index,
} from 'typeorm';
import { User } from './user.entity';
import { Project } from './project.entity';

@Entity('favorites')
@Unique(['userId', 'projectId'])
@Index(['userId'])
export class Favorite {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  projectId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  project: Project;
}