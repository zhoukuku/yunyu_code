import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  content: string;

  @IsNumber()
  postId: number;

  @IsOptional()
  @IsNumber()
  parentId?: number;
}