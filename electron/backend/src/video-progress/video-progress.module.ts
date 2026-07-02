import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VideoProgress } from '../entities/video-progress.entity';
import { VideoProgressService } from './video-progress.service';
import { VideoProgressController } from './video-progress.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VideoProgress])],
  controllers: [VideoProgressController],
  providers: [VideoProgressService],
  exports: [VideoProgressService],
})
export class VideoProgressModule {}