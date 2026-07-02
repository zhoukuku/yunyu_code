import { IsString, IsOptional, IsNumber } from 'class-validator';

export class UpdateHomeworkDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  courseId?: number;

  @IsOptional()
  @IsNumber()
  classId?: number;

  @IsOptional()
  @IsNumber()
  totalScore?: number;

  @IsOptional()
  @IsNumber()
  status?: number;

  @IsOptional()
  @IsString()
  attachments?: string;
}