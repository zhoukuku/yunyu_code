import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from './user.entity';

@Entity('comments')
@Index(['postId'])
@Index(['userId'])
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ nullable: true })
  postId: number;

  @Column({ nullable: true })
  userId: number;

  @Column({ nullable: true })
  parentId: number;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  post: Post;

  @ManyToOne(() => Comment, (comment) => comment.replies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'parentId' })
  parent: Comment | null;

  @ManyToOne(() => Comment, (comment) => comment.parent)
  replies: Comment[];

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}