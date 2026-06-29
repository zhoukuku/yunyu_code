import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('institutions')
export class Institution {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  institutionCode: string;

  @Column()
  institutionName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ default: 1 })
  status: number; // 1: active, 0: inactive

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}