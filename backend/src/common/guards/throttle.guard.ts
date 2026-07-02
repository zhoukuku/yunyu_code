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

      // Use IP + route path as key for per-endpoint rate limiting
      const ip = request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || 'unknown';
      const userId = request.user?.sub || 'anonymous';
      const routePath = request.route?.path || request.url?.split('?')[0] || 'unknown';
      const key = this.getKey(ip, userId, routePath);

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

  private getKey(ip: string, userId: string, routePath: string): string {
    // Normalize IP address and route path for consistent key generation
    const normalizedIp = ip.replace(/::ffff:/, '');
    // Normalize the route path: strip /api/ prefix and replace slashes with colons
    const normalizedPath = routePath
      .replace(/^\/api\//, '')
      .replace(/^\/api/, '')
      .replace(/^\//, '')
      .replace(/\//g, ':');
    return `${normalizedIp}:${userId}:${normalizedPath}`;
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

  // Reset the rate limit store (useful for testing)
  resetStore(): void {
    this.store = {};
  }
}

@Injectable()
export class AuthThrottlerGuard implements CanActivate {
  private store: RateLimitStore = {};
  private readonly ttl = 60000;  // 1 minute window
  private readonly limit = 20;   // 20 attempts per minute for auth endpoints
  private readonly logger = new Logger('AuthThrottlerGuard');

  canActivate(context: ExecutionContext): boolean {
    try {
      const request = context.switchToHttp().getRequest();
      const response = context.switchToHttp().getResponse();

      // Only apply rate limiting to auth endpoints
      const routePath = request.route?.path || request.url?.split('?')[0] || '';
      if (!this.isAuthEndpoint(routePath)) {
        return true;
      }

      const ip = request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || 'unknown';
      const userId = request.user?.sub || 'anonymous';
      const key = `${ip.replace(/::ffff:/, '')}:${userId}:${routePath.replace(/^\/api\//, '').replace(/^\/api/, '').replace(/^\//, '').replace(/\//g, ':')}`;

      const now = Date.now();
      const record = this.store[key];

      // Clean expired entries periodically
      if (Math.random() < 0.01) {
        for (const k in this.store) {
          if (this.store[k].resetTime <= now) delete this.store[k];
        }
      }

      if (record && record.resetTime > now) {
        record.count++;
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
        this.store[key] = { count: 1, resetTime: now + this.ttl };
      }

      return true;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(`Guard error: ${(error as Error).message}`);
      return true;
    }
  }

  private isAuthEndpoint(path: string): boolean {
    return path.includes('/login') || path.includes('/register') || path.includes('/account/') || path.includes('/auth/');
  }
}

@Injectable()
export class StrictThrottlerGuard extends ThrottlerGuard {
  constructor() {
    super();
    // Even stricter: 10 requests per minute
    // Override private readonly fields via any cast
    (this as any).limit = 10;
    (this as any).ttl = 60000;
  }
}