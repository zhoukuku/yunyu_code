import { Module, Global } from '@nestjs/common';
import { ThrottlerGuard, AuthThrottlerGuard, StrictThrottlerGuard } from '../common/guards/throttle.guard';

@Global()
@Module({
  providers: [
    ThrottlerGuard,
    AuthThrottlerGuard,
    StrictThrottlerGuard,
  ],
  exports: [
    ThrottlerGuard,
    AuthThrottlerGuard,
    StrictThrottlerGuard,
  ],
})
export class SecurityModule {}
