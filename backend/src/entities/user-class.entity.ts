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
import { ClassEntity } from './class.entity';

@Entity('user_classes')
@Index(['userId'])
@Index(['classId'])
export class UserClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  classId: number;

  @Column({ default: 0 })
  status: number; // 1: approved/joined, 0: pending

  @CreateDateColumn()
  joinedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: ClassEntity;
}