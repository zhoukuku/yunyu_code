import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  username?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  sex?: number;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  status?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  role?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  userType?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  wechatStatus?: number;
}

export class QueryUserDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  role?: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => parseInt(value, 10))
  status?: number;

  @IsOptional()
  @IsString()
  keyword?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  pageSize?: number = 10;
}