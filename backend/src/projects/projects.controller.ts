import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() data: { name: string; type?: string; content?: string; projectData?: string; userId?: number; isPublic?: number }) {
    // Use authenticated user ID, ignore any userId from the body
    return this.projectsService.create({ ...data, userId: req.user.sub });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('userId') userId?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userIdNum = userId ? parseInt(userId, 10) : undefined;
    return this.projectsService.findAll(
      userIdNum,
      search,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    const project = await this.projectsService.findOne(parseInt(id, 10));
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Req() req: any, @Body() data: Partial<{ name: string; type: string; content: string; projectData: string; isPublic: number }>) {
    const project = await this.projectsService.findOne(parseInt(id, 10));
    if (!project) {
      return { status: 404, message: 'Project not found' };
    }
    if (project.userId !== req.user.sub) {
      return { status: 403, message: 'You can only update your own projects' };
    }
    return this.projectsService.update(parseInt(id, 10), data);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Req() req: any) {
    const project = await this.projectsService.findOne(parseInt(id, 10));
    if (!project) {
      return { status: 404, message: 'Project not found' };
    }
    if (project.userId !== req.user.sub) {
      return { status: 403, message: 'You can only delete your own projects' };
    }
    await this.projectsService.remove(parseInt(id, 10));
    return { success: true };
  }

  @Post(':id/remix')
  @UseGuards(AuthGuard('jwt'))
  async remix(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: { userId?: number; newName?: string },
  ) {
    return this.projectsService.remix(parseInt(id, 10), req.user.sub, data.newName);
  }

  @Get(':id/cloud-variables')
  @UseGuards(AuthGuard('jwt'))
  async getCloudVariables(@Param('id') id: string) {
    return this.projectsService.getCloudVariables(+id);
  }

  @Put(':id/cloud-variables')
  @UseGuards(AuthGuard('jwt'))
  async updateCloudVariables(
    @Param('id') id: string,
    @Req() req: any,
    @Body() cloudVariables: { name: string; value: string }[],
  ) {
    return this.projectsService.updateCloudVariables(+id, cloudVariables, req.user.sub);
  }
}