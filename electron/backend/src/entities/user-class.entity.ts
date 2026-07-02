import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity('user_classes')
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
}