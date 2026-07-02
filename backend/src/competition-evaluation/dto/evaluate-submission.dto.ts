import { IsOptional, IsNumber, IsString, IsEnum } from 'class-validator';
import { EvaluationStatus } from '../../entities/competition-evaluation.entity';

export class EvaluateSubmissionDto {
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
  @IsString()
  submittedCode?: string;

  @IsOptional()
  @IsEnum(EvaluationStatus)
  status?: EvaluationStatus;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsNumber()
  executionTime?: number;

  @IsOptional()
  @IsNumber()
  memoryUsage?: number;
}