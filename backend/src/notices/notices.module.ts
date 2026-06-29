import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notice } from '../entities/course.entity';
import { NoticesService } from './notices.service';
import { NoticesController } from './notices.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Notice]), AuthModule],
  providers: [NoticesService],
  controllers: [NoticesController],
  exports: [NoticesService],
})
export class NoticesModule {}