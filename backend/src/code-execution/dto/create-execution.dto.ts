import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { CodeLanguage } from '../../entities/code-execution.entity';

export class CreateExecutionDto {
  @IsEnum(CodeLanguage)
  language: CodeLanguage;

  @IsString()
  code: string;

  @IsOptional()
  @IsNumber()
  projectId?: number;
}