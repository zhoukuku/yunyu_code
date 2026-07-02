import { IsNumber, IsOptional, IsString, IsEnum } from 'class-validator';
import { EvaluationStatus } from '../../entities/competition-evaluation.entity';

export class CreateEvaluationDto {
  @IsNumber()
  competitionId: number;

  @IsOptional()
  @IsNumber()
  problemId?: number;

  @IsOptional()
  @IsString()
  submittedCode?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsNumber()
  score?: number;

  @IsOptional()
  @IsNumber()
  maxScore?: number;

  @IsOptional()
  @IsNumber()
  passedCases?: number;

  @IsOptional()
  @IsNumber()
  totalCases?: number;

  @IsOptional()
  @IsNumber()
  executionTime?: number;

  @IsOptional()
  @IsNumber()
  memoryUsage?: number;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;
}