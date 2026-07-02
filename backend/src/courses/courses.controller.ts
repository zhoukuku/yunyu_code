import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CoursesService } from './courses.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { CreateHierarchyDto } from './dto/create-hierarchy.dto';

@Controller()
export class CoursesController {
  constructor(private coursesService: CoursesService) {}

  @Get('dict/hierarchy')
  async getHierarchy() {
    const hierarchy = await this.coursesService.getHierarchy();
    return { status: 200, result: hierarchy };
  }

  // ============ Course Categories (courseFeatures) ============
  @Get('courses/categories')
  async getCourseCategories() {
    const categories = await this.coursesService.getCourseCategories();
    return { status: 200, result: categories };
  }

  @Get('courses/categories/tree')
  async getCategoryTree() {
    const tree = await this.coursesService.getCategoryTree();
    return { status: 200, result: tree };
  }

  @Get('courses/categories/:id')
  async getCoursesByCategory(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const parsedPage = page ? parseInt(page, 10) : NaN;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : NaN;
    const result = await this.coursesService.getCoursesByCategory(
      id,
      isNaN(parsedPage) ? 1 : parsedPage,
      isNaN(parsedPageSize) ? 20 : parsedPageSize,
    );
    return { status: 200, result };
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
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    const parsedDifficulty = difficulty ? parseInt(difficulty, 10) : NaN;
    const parsedStatus = status !== undefined && status !== '' ? parseInt(status, 10) : NaN;
    const parsedPage = page ? parseInt(page, 10) : NaN;
    const parsedPageSize = pageSize ? parseInt(pageSize, 10) : NaN;
    const filters = {
      difficulty: isNaN(parsedDifficulty) ? undefined : parsedDifficulty,
      status: isNaN(parsedStatus) ? undefined : parsedStatus,
      teacher,
      search,
      page: isNaN(parsedPage) ? undefined : parsedPage,
      pageSize: isNaN(parsedPageSize) ? undefined : parsedPageSize,
      sortBy,
      sortOrder,
    };
    const courses = await this.coursesService.getCourses(hierarchyId, filters);
    return { status: 200, result: courses };
  }

  @Get('courses/featured')
  async getFeaturedCourses(@Query('limit') limit?: string) {
    const courses = await this.coursesService.getFeaturedCourses(limit ? parseInt(limit, 10) : 10);
    return { status: 200, result: courses };
  }

  // ============ Search (searchWorks) ============
  @Get('courses/search/suggestions')
  async getSearchSuggestions(@Query('keyword') keyword: string) {
    const suggestions = await this.coursesService.getSearchSuggestions(keyword);
    return { status: 200, result: suggestions };
  }

  @Get('courses/search/hot')
  async getHotSearchTerms() {
    const hotTerms = await this.coursesService.getHotSearchTerms();
    return { status: 200, result: hotTerms };
  }

  @Get('courses/:id/lessons')
  async getLessons(@Param('id') id: string) {
    const lessons = await this.coursesService.getLessons(+id);
    return { status: 200, result: lessons };
  }

  @Get('courses/:id/stats')
  async getCourseStats(@Param('id') id: string) {
    const stats = await this.coursesService.getCourseStats(+id);
    return { status: 200, result: stats };
  }

  // ============ Course Favorites (favoritesWorks) ============
  @Get('courses/favorites')
  @UseGuards(AuthGuard('jwt'))
  async getFavoriteCourses(@Request() req: any, @Query('page') page?: string, @Query('pageSize') pageSize?: string) {
    const userId = req.user?.sub;
    const result = await this.coursesService.getFavoriteCourses(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
    return { status: 200, result };
  }

  @Post('courses/:id/favorite')
  @UseGuards(AuthGuard('jwt'))
  async toggleFavorite(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    const result = await this.coursesService.toggleFavorite(userId, +id);
    return { status: 200, result };
  }

  @Get('courses/:id/favorite')
  @UseGuards(AuthGuard('jwt'))
  async checkFavorite(@Request() req: any, @Param('id') id: string) {
    const userId = req.user?.sub;
    const isFavorited = await this.coursesService.isCourseFavorited(userId, +id);
    return { status: 200, result: { favorited: isFavorited } };
  }

  // Wildcard :id route placed after all specific single-segment routes
  @Get('courses/:id')
  async getCourse(@Param('id') id: string) {
    const course = await this.coursesService.getCourse(+id);
    return { status: 200, result: course };
  }

  @Get('courses/:courseId/lessons/:lessonId')
  async getLesson(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    const lesson = await this.coursesService.getLesson(+courseId, +lessonId);
    return { status: 200, result: lesson };
  }

  // ============ Course Management (Admin) ============
  @Post('courses')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createCourse(@Body() dto: CreateCourseDto) {
    const course = await this.coursesService.createCourse(dto);
    return { status: 200, result: course };
  }

  @Put('courses/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    const course = await this.coursesService.updateCourse(+id, dto);
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

  @Post('courses/:courseId/lessons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createLesson(@Param('courseId') courseId: string, @Body() dto: CreateLessonDto) {
    const lesson = await this.coursesService.createLesson({ ...dto, courseId: +courseId });
    return { status: 200, result: lesson };
  }

  @Put('courses/:courseId/lessons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateLesson(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    const lesson = await this.coursesService.updateLesson(+id, dto);
    return { status: 200, result: lesson };
  }

  @Delete('courses/:courseId/lessons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async deleteLesson(@Param('id') id: string) {
    const result = await this.coursesService.deleteLesson(+id);
    return { status: 200, result };
  }

  @Post('dict/hierarchy')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createHierarchy(@Body() dto: CreateHierarchyDto) {
    const hierarchy = await this.coursesService.createHierarchy(dto);
    return { status: 200, result: hierarchy };
  }

}