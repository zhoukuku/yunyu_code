import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FeaturedContent } from '../entities/featured.entity';
import { Course } from '../entities/course.entity';
import { FeaturedService } from './featured.service';
import { FeaturedController } from './featured.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FeaturedContent, Course])],
  providers: [FeaturedService],
  controllers: [FeaturedController],
  exports: [FeaturedService],
})
export class FeaturedModule {}