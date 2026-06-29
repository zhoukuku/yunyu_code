import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('projects')
@Index(['userId'])
export class Project {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ default: 'scratch' })
  type: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @Column({ type: 'text', nullable: true })
  projectData: string;

  @Column({ nullable: true })
  userId: number;

  @Column({ default: 0 })
  isPublic: number;

  @Column({ nullable: true })
  remixedFrom: number;

  @Column({ type: 'simple-json', nullable: true })
  cloudVariables: { name: string; value: string }[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Project, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'remixedFrom' })
  originalProject: Project | null;

  @OneToMany(() => Project, (project) => project.originalProject)
  remixes: Project[];
}