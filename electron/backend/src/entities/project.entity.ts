import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('projects')
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
}