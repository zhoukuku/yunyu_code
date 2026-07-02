import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

// Search history entity for storing user search records
@Entity('search_history')
export class SearchHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  keyword: string;

  @CreateDateColumn()
  createdAt: Date;
}