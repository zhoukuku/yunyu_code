import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { SendResetCodeDto, VerifyResetCodeDto, AdminResetPasswordDto } from './dto/passwordReset.dto';

const SALT_ROUNDS = 12;

// 验证码存储（生产环境应使用 Redis）
interface VerificationCode {
  code: string;
  expiresAt: number;
  attempts: number;
}

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private readonly CODE_EXPIRY_SECONDS = 5 * 60; // 5分钟
  private readonly MAX_CODE_ATTEMPTS = 5;
  private readonly VERIFICATION_CODES = new Map<string, VerificationCode>();

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  /**
   * 生成6位数字验证码
   */
  private generateCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
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
      this.logger.log(`[Password Reset] Email verification code for ${user.email}: ${code}`);
      // TODO: 接入邮件服务发送验证码
    } else {
      this.logger.log(`[Password Reset] SMS verification code for ${user.phone}: ${code}`);
      // TODO: 接入短信服务发送验证码
    }

    // 开发环境返回验证码以便测试
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
      this.logger.debug(`[Dev Only] Verification code: ${code}`);
    }

    return {
      message: isDev ? `验证码已发送${isDev ? `，开发环境验证码: ${code}` : ''}` : '验证码已发送',
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

    // 验证通过，更新密码
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepository.update(user.id, { password: hashedPassword });

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

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await this.usersRepository.update(userId, { password: hashedPassword });

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
