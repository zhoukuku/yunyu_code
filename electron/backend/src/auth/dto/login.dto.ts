import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsString({ message: '账号格式不正确' })
  @IsNotEmpty({ message: '账号不能为空' })
  @Transform(({ value }) => value?.trim())
  account: string;

  @IsString({ message: '密码格式不正确' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码至少8个字符' })
  password: string;
}