import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateCourseDto {
  @IsString()
  courseName: string;

  @IsString()
  hierarchyId: string;

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
}