import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Security: Require JWT_SECRET in all environments except explicit local development/test.
// A hardcoded fallback must never reach staging or production.
const JWT_SECRET = process.env.JWT_SECRET;
const IS_DEV_OR_TEST = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';

if (!JWT_SECRET) {
  if (IS_DEV_OR_TEST) {
    // eslint-disable-next-line no-console
    console.warn(
      '\x1b[33m[SECURITY WARNING] JWT_SECRET is not set. Using a hardcoded fallback secret.\n' +
      '  This is ONLY acceptable for local development. Never deploy to staging or production without JWT_SECRET.\x1b[0m',
    );
  } else {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is required. ' +
      'The app will not start without it in non-development environments.',
    );
  }
}

const JWT_SECRET_VALUE = JWT_SECRET || 'electron-dev-insecure-secret-do-not-use-in-production-2024';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JWT_SECRET_VALUE,
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
      account: payload.account,
      userType: payload.userType,
      role: payload.role,
    };
  }
}