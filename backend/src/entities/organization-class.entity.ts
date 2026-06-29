import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Organization } from './organization.entity';
import { ClassEntity } from './class.entity';

@Entity('organization_classes')
export class OrganizationClass {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  organizationId: number;

  @Column()
  classId: number;

  @Column({ default: 1 })
  status: number; // 1: active, 0: inactive

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Organization, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => ClassEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'classId' })
  class: ClassEntity;
}