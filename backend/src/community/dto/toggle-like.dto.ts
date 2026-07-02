import { IsNumber } from 'class-validator';

export class ToggleLikeDto {
  @IsNumber()
  postId: number;
}