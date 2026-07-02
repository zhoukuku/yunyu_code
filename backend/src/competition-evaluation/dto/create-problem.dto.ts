import { IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateProblemDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  difficulty?: number;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsString()
  testCases?: string;

  @IsOptional()
  @IsNumber()
  timeLimit?: number;

  @IsOptional()
  @IsNumber()
  memoryLimit?: number;

  @IsOptional()
  @IsString()
  templateCode?: string;

  @IsOptional()
  @IsNumber()
  enabled?: number;
}