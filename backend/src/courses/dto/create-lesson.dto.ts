import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  lessonName: string;

  @IsOptional()
  @IsNumber()
  lessonOrder?: number;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  pptUrl?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;
}