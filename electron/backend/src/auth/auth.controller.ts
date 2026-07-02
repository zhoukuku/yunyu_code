import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('account/login')
  async login(@Body() loginDto: LoginDto) {
    const result = await this.authService.login(loginDto);
    return {
      status: 200,
      result,
    };
  }

  @Post('account/register')
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