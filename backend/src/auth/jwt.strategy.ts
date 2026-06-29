import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Security: Use same JWT secret pattern as auth.module.ts
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production-2024';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    // Security: Validate token type
    if (payload.type && payload.type !== 'access') {
      throw new UnauthorizedException('无效的访问令牌类型');
    }

    if (!payload.sub) {
      throw new UnauthorizedException('令牌无效');
    }

    return {
      sub: payload.sub,
      id: payload.sub,
      username: payload.username,
      userType: payload.userType,
      role: payload.role,
    };
  }
}