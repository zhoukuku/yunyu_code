import { IsString, IsNotEmpty, IsOptional, MinLength, MaxLength, Matches, IsInt, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

// 发送验证码 DTO
export class SendResetCodeDto {
  @IsString({ message: '账户格式不正确' })
  @IsNotEmpty({ message: '账户不能为空' })
  @Transform(({ value }) => value?.trim())
  account: string;

  @IsString({ message: '验证方式格式不正确' })
  @IsIn(['email', 'phone'], { message: '验证方式必须是 email 或 phone' })
  type: 'email' | 'phone';
}

// 验证验证码并重置密码 DTO
export class VerifyResetCodeDto {
  @IsString({ message: '账户格式不正确' })
  @IsNotEmpty({ message: '账户不能为空' })
  @Transform(({ value }) => value?.trim())
  account: string;

  @IsString({ message: '验证方式格式不正确' })
  @IsIn(['email', 'phone'], { message: '验证方式必须是 email 或 phone' })
  type: 'email' | 'phone';

  @IsString({ message: '验证码格式不正确' })
  @IsNotEmpty({ message: '验证码不能为空' })
  @Transform(({ value }) => value?.trim())
  code: string;

  @IsString({ message: '新密码格式不正确' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(8, { message: '新密码至少8个字符' })
  @MaxLength(32, { message: '新密码最多32个字符' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: '新密码必须包含大小写字母和数字' })
  newPassword: string;
}

// 管理员重置密码 DTO
export class AdminResetPasswordDto {
  @IsInt({ message: '用户ID必须为整数' })
  @IsNotEmpty({ message: '用户ID不能为空' })
  userId: number;

  @IsString({ message: '新密码格式不正确' })
  @IsNotEmpty({ message: '新密码不能为空' })
  @MinLength(8, { message: '新密码至少8个字符' })
  @MaxLength(32, { message: '新密码最多32个字符' })
  @Matches(/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, { message: '新密码必须包含大小写字母和数字' })
  newPassword: string;

  @IsString({ message: '原因格式不正确' })
  @IsOptional()
  reason?: string;
}

// 验证码发送响应
export class ResetCodeResponse {
  // 实际不会返回真正的验证码，仅在开发环境下返回
  code?: string;
  message: string;
  expiresIn: number; // 验证码有效期（秒）
}
