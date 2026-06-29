import { IsOptional, IsString, IsNumber, IsEmail, MinLength, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  nickname?: string;

  @IsOptional()
  @IsNumber()
  sex?: number;

  @IsOptional()
  @IsString()
  avatar?: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  oldPassword: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  newPassword: string;
}

export class ResetPasswordDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(32)
  newPassword: string;

  @IsString()
  verificationCode: string;
}