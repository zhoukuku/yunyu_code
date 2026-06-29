import { IsString, IsOptional, IsNumber, Min, Max, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class BatchAccountItemDto {
  @IsString()
  username: string;

  @IsString()
  account: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  nickname?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  userType?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(3)
  role?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  sex?: number;
}

export class BatchAccountDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchAccountItemDto)
  accounts: BatchAccountItemDto[];
}

export class ResetPasswordDto {
  @IsArray()
  @IsString({ each: true })
  accountIds: string[];
}

export class SetRoleDto {
  @IsArray()
  @IsString({ each: true })
  accountIds: string[];

  @IsNumber()
  @Min(1)
  @Max(3)
  role: number;
}

export class BatchCreateResultDto {
  success: BatchAccountItemDto[];
  failed: { account: string; reason: string }[];
}