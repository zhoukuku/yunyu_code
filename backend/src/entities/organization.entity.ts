import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { OrganizationClass } from './organization-class.entity';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  organizationCode: string;

  @Column()
  organizationName: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  contactPhone: string;

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ default: 1 })
  status: number; // 1: active, 0: inactive

  @Column({ nullable: true })
  logo: string;

  @Column({ type: 'int', default: 0 })
  classCount: number;

  @Column({ type: 'int', default: 0 })
  studentCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => OrganizationClass, (oc) => oc.organization)
  organizationClasses: OrganizationClass[];
}