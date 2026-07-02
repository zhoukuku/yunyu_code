import { Controller, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PasswordResetService } from './passwordReset.service';
import {
  SendResetCodeDto,
  VerifyResetCodeDto,
  AdminResetPasswordDto,
} from './dto/passwordReset.dto';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from './role.enum';

@Controller('auth/reset-password')
export class PasswordResetController {
  constructor(private passwordResetService: PasswordResetService) {}

  /**
   * 发送重置验证码
   * POST /auth/reset-password/send-code
   */
  @Post('send-code')
  @HttpCode(HttpStatus.OK)
  async sendResetCode(@Body() sendResetCodeDto: SendResetCodeDto) {
    const result = await this.passwordResetService.sendResetCode(sendResetCodeDto);
    return {
      status: 200,
      result,
    };
  }

  /**
   * 验证验证码并重置密码
   * POST /auth/reset-password/verify
   */
  @Post('verify')
  @HttpCode(HttpStatus.OK)
  async verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    const result = await this.passwordResetService.verifyResetCode(verifyResetCodeDto);
    return {
      status: 200,
      result,
    };
  }

  /**
   * 管理员重置用户密码
   * POST /auth/reset-password/admin
   * 仅管理员可访问
   */
  @Post('admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  async adminResetPassword(@Body() adminResetPasswordDto: AdminResetPasswordDto, @Req() req: any) {
    const result = await this.passwordResetService.adminResetPassword(
      adminResetPasswordDto,
      req.user.sub, // 管理员ID
    );
    return {
      status: 200,
      result,
    };
  }
}
