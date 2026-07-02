import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, Logger, OnModuleDestroy } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { randomInt } from 'crypto';
import { User } from '../entities/user.entity';
import { SendResetCodeDto, VerifyResetCodeDto, AdminResetPasswordDto } from './dto/passwordReset.dto';

// 验证码存储（生产环境应使用 Redis）
interface VerificationCode {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class PasswordResetService implements OnModuleDestroy {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly CODE_EXPIRY_SECONDS = 5 * 60; // 5分钟
  private readonly MAX_CODE_ATTEMPTS = 5;
  private readonly VERIFICATION_CODES = new Map<string, VerificationCode>();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {
    // 定期清理过期验证码，防止内存泄漏
    this.cleanupInterval = setInterval(() => {
      const cleaned = this.cleanupExpiredCodes();
      if (cleaned > 0) {
        this.logger.debug(`Cleaned ${cleaned} expired verification codes`);
      }
    }, 5 * 60 * 1000); // 每5分钟清理一次
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  /**
   * 生成6位数字验证码（使用加密安全的随机数生成器）
   */
  private generateCode(): string {
    return randomInt(100000, 999999).toString();
  }

  /**
   * 获取验证码存储键
   */
  private getCodeKey(account: string, type: 'email' | 'phone'): string {
    return `${type}:${account.toLowerCase()}`;
  }

  /**
   * 发送重置验证码
   */
  async sendResetCode(sendResetCodeDto: SendResetCodeDto): Promise<{ message: string; expiresIn: number }> {
    const { account, type } = sendResetCodeDto;

    // 查找用户
    const user = await this.usersRepository.findOne({
      where: [{ account }, { username: account }],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.status !== 1) {
      throw new ForbiddenException('账户已被禁用');
    }

    // 验证用户的邮箱/手机是否存在
    if (type === 'email' && !user.email) {
      throw new ForbiddenException('该账户未绑定邮箱');
    }
    if (type === 'phone' && !user.phone) {
      throw new ForbiddenException('该账户未绑定手机');
    }

    // 生成验证码
    const code = this.generateCode();
    const codeKey = this.getCodeKey(account, type);

    // 存储验证码
    this.VERIFICATION_CODES.set(codeKey, {
      code,
      expiresAt: Date.now() + this.CODE_EXPIRY_SECONDS * 1000,
      attempts: 0,
    });

    // 实际发送逻辑（这里只是日志，生产环境应接入邮件/短信服务）
    if (type === 'email') {
      this.logger.debug(`[Password Reset] Email verification code sent to user: ${user.email}`);
      // TODO: 接入邮件服务发送验证码
    } else {
      this.logger.debug(`[Password Reset] SMS verification code sent to user: ${user.phone}`);
      // TODO: 接入短信服务发送验证码
    }

    return {
      message: '验证码已发送',
      expiresIn: this.CODE_EXPIRY_SECONDS,
    };
  }

  /**
   * 验证验证码并重置密码
   */
  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto): Promise<{ message: string }> {
    const { account, type, code, newPassword } = verifyResetCodeDto;

    // 查找用户
    const user = await this.usersRepository.findOne({
      where: [{ account }, { username: account }],
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.status !== 1) {
      throw new ForbiddenException('账户已被禁用');
    }

    const codeKey = this.getCodeKey(account, type);
    const storedCode = this.VERIFICATION_CODES.get(codeKey);

    // 验证验证码是否存在
    if (!storedCode) {
      throw new UnauthorizedException('验证码已过期，请重新获取');
    }

    // 验证验证码是否过期
    if (Date.now() > storedCode.expiresAt) {
      this.VERIFICATION_CODES.delete(codeKey);
      throw new UnauthorizedException('验证码已过期，请重新获取');
    }

    // 验证尝试次数
    if (storedCode.attempts >= this.MAX_CODE_ATTEMPTS) {
      this.VERIFICATION_CODES.delete(codeKey);
      throw new ForbiddenException('验证码尝试次数过多，请重新获取');
    }

    // 验证验证码是否正确
    if (storedCode.code !== code) {
      storedCode.attempts++;
      this.VERIFICATION_CODES.set(codeKey, storedCode);
      throw new UnauthorizedException('验证码错误');
    }

    // 验证新密码复杂度（defense in depth，与注册策略一致）
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('新密码至少8个字符');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new UnauthorizedException('新密码必须包含大小写字母和数字');
    }

    // 验证通过，更新密码（明文存储）
    await this.usersRepository.update(user.id, { password: newPassword });

    // 删除已使用的验证码
    this.VERIFICATION_CODES.delete(codeKey);

    this.logger.log(`[Password Reset] Password reset successfully for user: ${user.username}`);

    return { message: '密码重置成功' };
  }

  /**
   * 管理员重置用户密码
   */
  async adminResetPassword(adminResetPasswordDto: AdminResetPasswordDto, adminId: number): Promise<{ message: string }> {
    const { userId, newPassword, reason } = adminResetPasswordDto;

    // 查找目标用户
    const targetUser = await this.usersRepository.findOne({ where: { id: userId } });

    if (!targetUser) {
      throw new NotFoundException('目标用户不存在');
    }

    if (targetUser.status !== 1) {
      throw new ForbiddenException('目标用户已被禁用');
    }

    // 不能重置管理员自己的密码（可选安全限制）
    if (targetUser.role === 1 && userId === adminId) {
      throw new ForbiddenException('不能重置自己的密码');
    }

    // 验证新密码复杂度（defense in depth，与注册策略一致）
    if (!newPassword || newPassword.length < 8) {
      throw new UnauthorizedException('新密码至少8个字符');
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(newPassword)) {
      throw new UnauthorizedException('新密码必须包含大小写字母和数字');
    }

    // 更新密码（明文存储）
    await this.usersRepository.update(userId, { password: newPassword });

    this.logger.log(`[Admin Password Reset] Admin ${adminId} reset password for user ${userId}. Reason: ${reason || 'N/A'}`);

    return { message: `用户 ${targetUser.username} 的密码已重置` };
  }

  /**
   * 清理过期验证码（可由定时任务调用）
   */
  cleanupExpiredCodes(): number {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, value] of this.VERIFICATION_CODES.entries()) {
      if (now > value.expiresAt) {
        this.VERIFICATION_CODES.delete(key);
        cleaned++;
      }
    }

    return cleaned;
  }
}
