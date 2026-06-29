import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req, Request } from '@nestjs/common';
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
    const result = await this.coursesService.getCoursesByCategory(
      id,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
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
    const filters = {
      difficulty: difficulty ? parseInt(difficulty, 10) : undefined,
      status: status !== undefined ? parseInt(status, 10) : undefined,
      teacher,
      search,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
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

  @Get('courses/:id')
  async getCourse(@Param('id') id: string) {
    const course = await this.coursesService.getCourse(+id);
    return { status: 200, result: course };
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

  @Get('courses/:courseId/lessons/:lessonId')
  async getLesson(@Param('courseId') courseId: string, @Param('lessonId') lessonId: string) {
    const lesson = await this.coursesService.getLesson(+courseId, +lessonId);
    return { status: 200, result: lesson };
  }

  @Get('notice')
  @UseGuards(AuthGuard('jwt'))
  async getNotices(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('noticeType') noticeType?: string,
  ) {
    const filters = {
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
      noticeType,
    };
    const notices = await this.coursesService.getNotices(filters);
    return { status: 200, result: notices };
  }

  @Get('notice/popup')
  async getNoticePopup() {
    const notices = await this.coursesService.getNoticePopup();
    return { status: 200, result: notices };
  }

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

  @Post('courses/:courseId/lessons')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createLesson(@Param('courseId') courseId: string, @Body() data: any) {
    const lesson = await this.coursesService.createLesson({ ...data, courseId: +courseId });
    return { status: 200, result: lesson };
  }

  @Put('courses/:courseId/lessons/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateLesson(@Param('id') id: string, @Body() data: any) {
    const lesson = await this.coursesService.updateLesson(+id, data);
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
  async createHierarchy(@Body() data: any) {
    const hierarchy = await this.coursesService.createHierarchy(data);
    return { status: 200, result: hierarchy };
  }

  @Post('notice')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createNotice(@Body() data: any) {
    const notice = await this.coursesService.createNotice(data);
    return { status: 200, result: notice };
  }

  @Put('notice/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateNotice(@Param('id') id: string, @Body() data: any) {
    const notice = await this.coursesService.updateNotice(+id, data);
    return { status: 200, result: notice };
  }

  @Delete('notice/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async deleteNotice(@Param('id') id: string) {
    const result = await this.coursesService.deleteNotice(+id);
    return { status: 200, result };
  }

  @Put('notice/:id/read')
  @UseGuards(AuthGuard('jwt'))
  async markNoticeAsRead(@Param('id') id: string, @Req() req: any) {
    await this.coursesService.markNoticeAsRead(+id, req.user.sub);
    return { status: 200, result: { success: true } };
  }
}