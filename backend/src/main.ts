import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SensitiveDataInterceptor } from './common/filters/sensitive-data.filter';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const logger = new Logger('Bootstrap');

  // 1) Helmet 安全头
  app.use(helmet());

  // 2) 自定义安全头中间件
  app.use(SecurityHeadersMiddleware);

  // 3) CORS 配置 - 限制性更强的配置
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
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
        return new (require('@nestjs/common').BadRequestException)({
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
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

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

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 服务运行在 http://localhost:${port}`);
  logger.log(`🔒 安全功能已启用: Helmet, CORS, 全局异常过滤, 输入验证, 敏感数据过滤`);
}

bootstrap();