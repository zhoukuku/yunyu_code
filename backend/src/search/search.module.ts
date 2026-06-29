import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { SearchHistory } from './search.entity';
import { Course } from '../entities/course.entity';
import { Post } from '../entities/post.entity';
import { Project } from '../entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([SearchHistory, Course, Post, Project]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}