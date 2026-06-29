import { Module, Global } from '@nestjs/common';
import { ThrottlerGuard, AuthThrottlerGuard } from '../common/guards/throttle.guard';

@Global()
@Module({
  providers: [
    ThrottlerGuard,
    AuthThrottlerGuard,
  ],
  exports: [
    ThrottlerGuard,
    AuthThrottlerGuard,
  ],
})
export class SecurityModule {}
