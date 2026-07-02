import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get('dict/hierarchy')
  async getHierarchy() {
    const hierarchy = await this.coursesService.getHierarchy();
    return { status: 200, result: hierarchy };
  }

  @Get('courses')
  async getCourses(
    @Query('hierarchyId') hierarchyId?: string,
    @Query('difficulty') difficulty?: string,
    @Query('status') status?: string,
    @Query('teacher') teacher?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const filters = {
      difficulty: difficulty ? parseInt(difficulty, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) : undefined,
      teacher,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    };
    const courses = await this.coursesService.getCourses(hierarchyId, filters);
    return { status: 200, result: courses };
  }

  @Get('courses/:id')
  async getCourse(@Param('id') id: string) {
    const course = await this.coursesService.getCourse(+id);
    if (!course) return { status: 404, result: null };
    return { status: 200, result: course };
  }

  @Get('courses/:id/lessons')
  async getLessons(@Param('id') id: string) {
    const lessons = await this.coursesService.getLessons(+id);
    return { status: 200, result: lessons };
  }

  // Notice routes (POST/PUT/DELETE) moved to NoticesController
  // to consolidate all notice management under a single controller.

  @Post('courses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createCourse(@Body() data: any) {
    const course = await this.coursesService.createCourse(data);
    return { status: 200, result: course };
  }

  @Put('courses/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateCourse(@Param('id') id: string, @Body() data: any) {
    const course = await this.coursesService.updateCourse(+id, data);
    return { status: 200, result: course };
  }

  @Put('courses/:id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateCourseStatus(@Param('id') id: string, @Body('status') status: number) {
    const course = await this.coursesService.updateCourseStatus(+id, status);
    return { status: 200, result: course };
  }

  @Delete('courses/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async deleteCourse(@Param('id') id: string) {
    const result = await this.coursesService.deleteCourse(+id);
    return { status: 200, result };
  }

  @Post('dict/hierarchy')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createHierarchy(@Body() data: any) {
    const hierarchy = await this.coursesService.createHierarchy(data);
    return { status: 200, result: hierarchy };
  }

  // All notice management routes (GET/POST/PUT/DELETE) have been consolidated
  // into NoticesController to avoid route conflicts and centralize authorization.
}