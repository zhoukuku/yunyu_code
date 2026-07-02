import { IsOptional, IsString, IsNumber, IsNotEmpty, Min, Max, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @MinLength(2, { message: '用户名至少2个字符' })
  @MaxLength(32, { message: '用户名最多32个字符' })
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsString()
  @IsNotEmpty({ message: '账号不能为空' })
  @MinLength(2, { message: '账号至少2个字符' })
  @MaxLength(32, { message: '账号最多32个字符' })
  @Transform(({ value }) => value?.trim())
  account: string;

  @IsOptional()
  @IsString()
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(32)
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: '密码必须包含大小写字母和数字' })
  password?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nickname?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  userType?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4)
  role?: number;

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
  wechatStatus?: number;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}

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
  @Max(4)
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