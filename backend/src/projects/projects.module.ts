import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '../entities/project.entity';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
// CloudVariablesModule is @Global() and conditionally loaded in AppModule.
// ProjectsService uses @Optional() for CloudVariablesGateway, so it works
// with or without the websocket packages installed.

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}