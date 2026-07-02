import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('classes')
export class ClassEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  className: string;

  @Column({ nullable: true })
  teacherId: number;

  @Column({ nullable: true })
  lastCourseName: string;

  @Column({ default: 0 })
  studentNum: number;

  @Column({ default: 0 })
  totalCourseNum: number;

  @Column({ default: 0 })
  hadCourseNum: number;

  @Column({ default: 0 })
  isEnd: number;

  @Column({ name: 'class_code', unique: true, nullable: true })
  classCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}