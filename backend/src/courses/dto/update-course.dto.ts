import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateCourseDto {
  @IsOptional()
  @IsString()
  courseName?: string;

  @IsOptional()
  @IsString()
  hierarchyId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  coverImage?: string;

  @IsOptional()
  @IsNumber()
  difficulty?: number;

  @IsOptional()
  @IsString()
  teacher?: string;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsNumber()
  status?: number;

  @IsOptional()
  @IsNumber()
  totalLessons?: number;

  @IsOptional()
  @IsNumber()
  completedLessons?: number;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsNumber()
  studentCount?: number;
}