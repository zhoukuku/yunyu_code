import { Injectable, UnauthorizedException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

const SALT_ROUNDS = 12;
const ACCESS_TOKEN_EXPIRES_IN = '15m';
const REFRESH_TOKEN_EXPIRES_IN = '7d';

// In-memory store for revoked tokens (use Redis in production)
const revokedTokens = new Set<string>();
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

@Injectable()
export class AuthService {
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { account, password } = loginDto;
    const ipKey = `ip:${account}`;

    // Check account lockout
    const attempts = loginAttempts.get(ipKey);
    if (attempts && attempts.lockedUntil > Date.now()) {
      const remainingMinutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      throw new ForbiddenException(`账户已被锁定，请 ${remainingMinutes} 分钟后再试`);
    }

    // Find user
    const user = await this.usersRepository.findOne({
      where: [{ account }, { username: account }],
    });

    if (!user) {
      this.recordFailedAttempt(ipKey);
      throw new UnauthorizedException('用户名或密码错误');
    }

    // Check if account is disabled
    if (user.status !== 1) {
      throw new ForbiddenException('账户已被禁用');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      this.recordFailedAttempt(ipKey);
      throw new UnauthorizedException('用户名或密码错误');
    }

    // Clear failed attempts on successful login
    loginAttempts.delete(ipKey);

    // Generate tokens with rotation
    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
      role: user.role,
      type: 'access',
    };

    const refreshPayload = {
      sub: user.id,
      username: user.username,
      type: 'refresh',
      jti: this.generateTokenId(), // Unique ID for refresh token
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
    const refreshToken = this.jwtService.sign(refreshPayload, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    return {
      accessToken: `Bearer ${accessToken}`,
      refreshToken: `Bearer ${refreshToken}`,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        username: user.username,
        account: user.account,
        name: user.name,
        avatar: user.avatar,
        userType: user.userType,
        role: user.role,
      },
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const token = refreshToken.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);

      // Verify this is a refresh token
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('无效的刷新令牌');
      }

      // Check if token has been revoked
      if (payload.jti && revokedTokens.has(payload.jti)) {
        throw new UnauthorizedException('刷新令牌已被使用或撤销');
      }

      // Check if user still exists and is active
      const user = await this.usersRepository.findOne({ where: { id: payload.sub } });
      if (!user || user.status !== 1) {
        throw new UnauthorizedException('用户不存在或已被禁用');
      }

      // Revoke old refresh token (rotation)
      if (payload.jti) {
        revokedTokens.add(payload.jti);
      }

      // Generate new tokens
      const newPayload = {
        sub: user.id,
        username: user.username,
        userType: user.userType,
        role: user.role,
        type: 'access',
      };

      const newRefreshPayload = {
        sub: user.id,
        username: user.username,
        type: 'refresh',
        jti: this.generateTokenId(),
      };

      const accessToken = this.jwtService.sign(newPayload, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
      const newRefreshToken = this.jwtService.sign(newRefreshPayload, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

      return {
        accessToken: `Bearer ${accessToken}`,
        refreshToken: `Bearer ${newRefreshToken}`,
        expiresIn: 900,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('刷新令牌无效或已过期');
    }
  }

  async logout(refreshToken: string): Promise<boolean> {
    try {
      const token = refreshToken.replace('Bearer ', '');
      const payload = this.jwtService.verify(token);

      // Revoke the refresh token
      if (payload.jti) {
        revokedTokens.add(payload.jti);
      }
      return true;
    } catch {
      return false;
    }
  }

  async getUserById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));

      // Don't allow refresh tokens for access
      if (payload.type === 'refresh') {
        throw new UnauthorizedException('无效的访问令牌');
      }

      return payload;
    } catch {
      throw new UnauthorizedException('Token无效或已过期');
    }
  }

  async register(registerDto: RegisterDto) {
    const { username, account, password, name, role } = registerDto;

    // Validate password is provided and not empty
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      throw new BadRequestException('密码不能为空');
    }

    // Check if account or username already exists
    const existingUser = await this.usersRepository.findOne({
      where: [{ account }, { username }],
    });
    if (existingUser) {
      throw new UnauthorizedException('用户名或账号已存在');
    }

    if (password.length < 6) {
      throw new BadRequestException('密码至少6个字符');
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = this.usersRepository.create({
      username,
      account,
      password: hashedPassword,
      name: name || username,
      role: role ?? 3, // Default to STUDENT role
    });
    return this.usersRepository.save(user);
  }

  private recordFailedAttempt(key: string): void {
    let attempts = loginAttempts.get(key);
    if (!attempts) {
      attempts = { count: 0, lockedUntil: 0 };
    }
    attempts.count++;

    if (attempts.count >= this.MAX_LOGIN_ATTEMPTS) {
      attempts.lockedUntil = Date.now() + this.LOCKOUT_DURATION;
    }

    loginAttempts.set(key, attempts);
  }

  private generateTokenId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}