import { IsString, IsOptional } from 'class-validator';

export class SubmitHomeworkDto {
  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  attachments?: string;
}