import { IsString, IsNotEmpty, IsOptional, IsInt, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @IsString({ message: '用户名格式不正确' })
  @IsNotEmpty({ message: '用户名不能为空' })
  @Transform(({ value }) => value?.trim())
  username: string;

  @IsString({ message: '账号格式不正确' })
  @IsNotEmpty({ message: '账号不能为空' })
  @Transform(({ value }) => value?.trim())
  account: string;

  @IsString({ message: '密码格式不正确' })
  @IsNotEmpty({ message: '密码不能为空' })
  @MinLength(8, { message: '密码至少8个字符' })
  @MaxLength(64, { message: '密码最多64个字符' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: '密码必须包含大小写字母和数字' })
  password: string;

  @IsString({ message: '姓名格式不正确' })
  @IsOptional()
  name?: string;

  @IsInt({ message: '角色值必须为整数' })
  @IsOptional()
  role?: number;

  @IsInt({ message: '用户类型必须为整数' })
  @IsOptional()
  userType?: number;
}
