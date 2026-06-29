import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';

interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

@Injectable()
export class ThrottlerGuard implements CanActivate {
  private store: RateLimitStore = {};
  private readonly ttl: number;
  private readonly limit: number;
  private readonly logger = new Logger(ThrottlerGuard.name);

  constructor() {
    this.ttl = 60000; // 1 minute window
    this.limit = 100; // 100 requests per minute
  }

  canActivate(context: ExecutionContext): boolean {
    try {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();

      // Use IP + User-Agent as key, fallback to IP only
      const ip = request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || 'unknown';
      const userAgent = request.headers['user-agent'] || 'unknown';
      const userId = request.user?.sub || 'anonymous';
      const key = this.getKey(ip, userId);

      const now = Date.now();
      const record = this.store[key];

      // Clean expired entries periodically (1% chance)
      if (Math.random() < 0.01) {
        this.cleanExpired(now);
      }

      if (record && record.resetTime > now) {
        record.count++;

        // Set rate limit headers
        response.set({
          'X-RateLimit-Limit': this.limit,
          'X-RateLimit-Remaining': Math.max(0, this.limit - record.count),
          'X-RateLimit-Reset': Math.ceil(record.resetTime / 1000),
        });

        if (record.count > this.limit) {
          const retryAfter = Math.ceil((record.resetTime - now) / 1000);
          response.set('Retry-After', retryAfter.toString());
          throw new HttpException(
            {
              statusCode: HttpStatus.TOO_MANY_REQUESTS,
              message: '请求过于频繁，请稍后再试',
              error: 'Too Many Requests',
              errorCode: 'RATE_LIMIT_EXCEEDED',
              retryAfter,
            },
            HttpStatus.TOO_MANY_REQUESTS
          );
        }
      } else {
        // Create new record
        this.store[key] = {
          count: 1,
          resetTime: now + this.ttl,
        };
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Throttler guard error: ${error.message}`);
      // On error, allow request but log it
      return true;
    }
  }

  private getKey(ip: string, userId: string): string {
    // Normalize IP address for consistent key generation
    const normalizedIp = ip.replace(/::ffff:/, '');
    return `${normalizedIp}:${userId}`;
  }

  private cleanExpired(now: number): void {
    for (const key in this.store) {
      if (this.store[key].resetTime <= now) {
        delete this.store[key];
      }
    }
  }

  // Check if this is an auth endpoint (for stricter limits)
  isAuthEndpoint(path: string): boolean {
    return path.includes('/login') || path.includes('/register') || path.includes('/account/');
  }
}

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  constructor() {
    super();
    // Override: 5 attempts per minute for auth endpoints
    (this as any).limit = 5;
    (this as any).ttl = 60000;
  }
}

@Injectable()
export class StrictThrottlerGuard extends ThrottlerGuard {
  constructor() {
    super();
    // Even stricter: 10 requests per minute
    (this as any).limit = 10;
    (this as any).ttl = 60000;
  }
}