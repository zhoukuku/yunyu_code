import { IsString, IsOptional, IsNumber } from 'class-validator';

export class SubmitCodeDto {
  @IsNumber()
  competitionId: number;

  @IsOptional()
  @IsNumber()
  problemId?: number;

  @IsString()
  submittedCode: string;

  @IsString()
  language: string;
}