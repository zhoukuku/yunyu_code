import { IsNumber, IsString, IsOptional } from 'class-validator';

export class GradeSubmissionDto {
  @IsNumber()
  score: number;

  @IsString()
  feedback: string;
}