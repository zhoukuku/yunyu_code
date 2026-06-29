import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { RolesGuard } from './roles.guard';
import { User } from '../entities/user.entity';
import { PasswordResetController } from './passwordReset.controller';
import { PasswordResetService } from './passwordReset.service';
export { Role, RoleLabels } from './role.enum';
export { LoginDto } from './dto/login.dto';
export { RegisterDto } from './dto/register.dto';

// Security: Use strong JWT secret from environment with fallback for development only
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable must be set in production');
}

const JWT_SECRET_VALUE = JWT_SECRET || 'dev-only-insecure-secret-do-not-use-in-production-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

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
  exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule {}