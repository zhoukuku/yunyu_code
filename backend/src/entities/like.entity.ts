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

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}