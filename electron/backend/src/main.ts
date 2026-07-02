import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 启用CORS
  app.enableCors({
    origin: true,
    credentials: true,
  });

  // 使用body-parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 使用cookie-parser
  app.use(cookieParser());

  // 全局路由前缀 /api
  app.setGlobalPrefix('api');

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 服务运行在 http://localhost:${port}`);
}

bootstrap();
