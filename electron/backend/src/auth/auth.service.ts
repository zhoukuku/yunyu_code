import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const { account, password } = loginDto;

    // Defense in depth: reject missing/empty credentials before any DB operations
    if (!account || typeof account !== 'string' || account.trim().length === 0) {
      throw new BadRequestException('账号不能为空');
    }
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      throw new BadRequestException('密码不能为空');
    }

    // 查找用户
    const user = await this.usersRepository.findOne({
      where: [{ account }, { username: account }],
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('密码错误');
    }

    // 生成JWT
    const payload = {
      sub: user.id,
      username: user.username,
      userType: user.userType,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });

    return {
      accessToken: `Bearer ${accessToken}`,
      refreshToken: `Bearer ${refreshToken}`,
      user: {
        id: user.id,
        username: user.username,
        account: user.account,
        name: user.name,
        avatar: user.avatar,
        userType: user.userType,
      },
    };
  }

  async getUserById(id: number) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token.replace('Bearer ', ''));
      return payload;
    } catch {
      throw new UnauthorizedException('Token无效');
    }
  }

  async register(userData: RegisterDto) {
    const password = userData.password;
    // Defense in depth: reject missing/empty password before hashing
    if (!password || typeof password !== 'string' || password.trim().length === 0) {
      throw new BadRequestException('密码不能为空');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return this.usersRepository.save(user);
  }
}