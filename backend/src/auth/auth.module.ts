import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from '../common/guards/roles.guard';
import { User } from '../entities/user.entity';
import { PasswordResetController } from './passwordReset.controller';
import { PasswordResetService } from './passwordReset.service';
export { Role, RoleLabels } from './role.enum';
export { LoginDto } from './dto/login.dto';
export { RegisterDto } from './dto/register.dto';

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

const JWT_SECRET_VALUE = JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN ?? '7d';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: JWT_SECRET_VALUE,
      signOptions: { expiresIn: JWT_EXPIRES_IN },
    }),
  ],
  controllers: [AuthController, PasswordResetController],
  providers: [
    AuthService,
    JwtStrategy,
    RolesGuard,
    PasswordResetService,
    { provide: 'JWT_SECRET', useValue: JWT_SECRET_VALUE },
    { provide: 'JWT_EXPIRES_IN', useValue: JWT_EXPIRES_IN },
    { provide: 'REFRESH_TOKEN_EXPIRES_IN', useValue: REFRESH_TOKEN_EXPIRES_IN },
  ],
  exports: [AuthService, JwtStrategy, PassportModule, RolesGuard],
})
export class AuthModule {}