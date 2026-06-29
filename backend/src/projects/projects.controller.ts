import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  async create(@Body() data: { name: string; type?: string; content?: string; projectData?: string; userId?: number; isPublic?: number }) {
    return this.projectsService.create(data);
  }

  @Get()
  async findAll(@Query('userId') userId?: string, @Query('search') search?: string) {
    const userIdNum = userId ? parseInt(userId, 10) : undefined;
    return this.projectsService.findAll(userIdNum, search);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(parseInt(id, 10));
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<{ name: string; type: string; content: string; projectData: string; isPublic: number }>) {
    return this.projectsService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.projectsService.remove(parseInt(id, 10));
    return { success: true };
  }

  @Post(':id/remix')
  async remix(
    @Param('id') id: string,
    @Body() data: { userId: number; newName?: string },
  ) {
    return this.projectsService.remix(parseInt(id, 10), data.userId, data.newName);
  }

  @Get(':id/cloud-variables')
  async getCloudVariables(@Param('id') id: string) {
    return this.projectsService.getCloudVariables(+id);
  }

  @Put(':id/cloud-variables')
  async updateCloudVariables(
    @Param('id') id: string,
    @Body() cloudVariables: { name: string; value: string }[],
  ) {
    return this.projectsService.updateCloudVariables(+id, cloudVariables);
  }
}