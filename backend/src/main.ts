import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SensitiveDataInterceptor } from './common/filters/sensitive-data.filter';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Logger } from '@nestjs/common';
import { SeedService } from './seed/seed.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // 1) Helmet 安全头
  app.use(helmet());

  // 2) 自定义安全头中间件
  app.use((req, res, next) => {
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // 3) CORS 配置 - 允许多种开发模式
  app.enableCors({
    origin: function (origin, callback) {
      // 允许 localhost 任意端口、Electron file:// 协议、以及配置的 CORS_ORIGIN
      const allowed = !origin || origin.startsWith('http://localhost:') || origin.startsWith('file://') || origin === process.env.CORS_ORIGIN;
      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset', 'Retry-After'],
    maxAge: 86400,
  });

  // 4) 全局异常过滤器 - 统一错误处理
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 5) 输入验证（class-validator）- 全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      skipMissingProperties: false,
      exceptionFactory: (errors) => {
        const messages = errors.map((err) => {
          const constraints = err.constraints;
          if (constraints) {
            return Object.values(constraints).join(', ');
          }
          return `${err.property}: validation error`;
        });
        return new BadRequestException({
          message: messages,
          errorCode: 'VALIDATION_ERROR',
          errors: errors.map((err) => ({
            property: err.property,
            constraints: err.constraints,
            value: err.value,
          })),
        });
      },
    }),
  );

  // 6) 敏感数据过滤 - 全局拦截器
  app.useGlobalInterceptors(new SensitiveDataInterceptor());

  // 7) 请求体大小限制
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 8) Cookie 解析器
  app.use(cookieParser());

  // 9) 全局路由前缀 /api
  app.setGlobalPrefix('api');

  // 10) 请求日志
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.log(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
    });
    next();
  });

  // 11) 关闭静默警告
  app.set('trust proxy', 1);

  // 自动初始化种子数据（仅在数据库为空时执行）
  const seedService = app.get(SeedService);
  await seedService.seedIfEmpty();

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`🚀 服务运行在 http://localhost:${port}`);
  logger.log(`🔒 安全功能已启用: Helmet, CORS, 全局异常过滤, 输入验证, 敏感数据过滤`);
}

bootstrap();