import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { ExecutionStatus } from '../../entities/code-execution.entity';

export class UpdateExecutionDto {
  @IsOptional()
  @IsString()
  output?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;

  @IsOptional()
  @IsEnum(ExecutionStatus)
  status?: ExecutionStatus;

  @IsOptional()
  @IsNumber()
  executionTime?: number;
}