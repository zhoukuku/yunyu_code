import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('likes')
@Unique(['postId', 'userId'])
@Index(['postId'])
@Index(['userId'])
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  postId: number;

  @Column({ nullable: true })
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'postId' })
  post: Post | null;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User | null;
}