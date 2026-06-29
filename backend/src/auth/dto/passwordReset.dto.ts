import { IsString, IsNotEmpty, IsOptional, IsEmail, IsPhoneNumber, MinLength, IsInt, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

// 发送验证码 DTO
export class SendResetCodeDto {
  @IsString()
  @IsNotEmpty({ message: '账户不能为空' })
  @Transform(({ value }) => value?.trim())
  account: string;

  @IsString()
  @IsIn(['email', 'phone'], { message: '验证方式必须是 email 或 phone' })
  type: 'email' | 'phone';
}

// 验证验证码并重置密码 DTO
export class VerifyResetCodeDto {
  @IsString()
  @IsNotEmpty({ message: '账户不能为空' })
  @Transform(({ value }) => value?.trim())
  account: string;

  @IsString()
  @IsIn(['email', 'phone'], { message: '验证方式必须是 email 或 phone' })
  type: 'email' | 'phone';

  @IsString()
  @IsNotEmpty({ message: '验证码不能为空' })
  @Transform(({ value }) => value?.trim())
  code: string;

  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword: string;
}

// 管理员重置密码 DTO
export class AdminResetPasswordDto {
  @IsInt()
  @IsNotEmpty({ message: '用户ID不能为空' })
  userId: number;

  @IsString()
  @MinLength(6, { message: '新密码至少6个字符' })
  newPassword: string;

  @IsString()
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
