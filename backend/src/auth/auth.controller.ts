import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthThrottlerGuard } from '../common/guards/throttle.guard';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('account/login')
  @UseGuards(AuthThrottlerGuard)
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      status: 200,
      result,
    };
  }

  @Post('account/refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(@Body('refreshToken') refreshToken: string) {
    const result = await this.authService.refreshTokens(refreshToken);
    return {
      status: 200,
      result,
    };
  }

  @Post('account/logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async logout(@Body('refreshToken') refreshToken: string) {
    await this.authService.logout(refreshToken);
    return {
      status: 200,
      message: '登出成功',
    };
  }

  @Post('account/register')
  @UseGuards(AuthThrottlerGuard)
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return {
      status: 200,
      result: {
        id: result.id,
        username: result.username,
        account: result.account,
        name: result.name,
        avatar: result.avatar,
        userType: result.userType,
        role: result.role,
      },
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('user/detail')
  async getUserDetail(@Req() req: any) {
    const user = await this.authService.getUserById(req.user.sub);
    if (!user) {
      return { status: 404, result: null };
    }
    return {
      status: 200,
      result: {
        id: user.id,
        username: user.username,
        account: user.account,
        name: user.name,
        avatar: user.avatar,
        userType: user.userType,
        sex: user.sex,
        nickname: user.nickname,
        wechatStatus: user.wechatStatus,
      },
    };
  }
}