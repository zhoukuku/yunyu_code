import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true })
  account: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ default: 2 })
  userType: number;

  @Column({ default: 0 })
  sex: number;

  @Column({ nullable: true })
  nickname: string;

  @Column({ default: 0 })
  wechatStatus: number;

  @Column({ default: 1 })
  status: number; // 1: 启用, 0: 禁用

  @Column({ default: 2 })
  role: number; // 1: 管理员, 2: 普通用户, 3: 教师

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}