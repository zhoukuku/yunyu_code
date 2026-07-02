import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudyNotesService } from './study-notes.service';

@Controller('study-notes')
export class StudyNotesController {
  constructor(private readonly studyNotesService: StudyNotesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() body: {
    title: string;
    content: string;
    courseId?: number;
    lessonId?: number;
    tags?: string;
    isPublic?: boolean;
  }, @Request() req) {
    const note = await this.studyNotesService.create(req.user.sub, body);
    return {
      status: 200,
      result: note,
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(@Query() query: {
    courseId?: number;
    lessonId?: number;
    tag?: string;
    keyword?: string;
    page?: string;
    pageSize?: string;
  }, @Request() req) {
    const notes = await this.studyNotesService.findAll(req.user.sub, {
      ...query,
      page: query.page ? parseInt(query.page, 10) : undefined,
      pageSize: query.pageSize ? parseInt(query.pageSize, 10) : undefined,
    });
    return {
      status: 200,
      result: notes,
    };
  }

  @Get('count')
  @UseGuards(AuthGuard('jwt'))
  async count(@Request() req) {
    const count = await this.studyNotesService.count(req.user.sub);
    return {
      status: 200,
      result: { count },
    };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Request() req) {
    const note = await this.studyNotesService.findOne(parseInt(id, 10));
    if (!note) {
      return { status: 404, message: 'Note not found' };
    }
    return {
      status: 200,
      result: note,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(@Param('id') id: string, @Body() body: Partial<{
    title: string;
    content: string;
    courseId: number;
    lessonId: number;
    tags: string;
    isPublic: boolean;
  }>, @Request() req) {
    const note = await this.studyNotesService.update(parseInt(id, 10), req.user.sub, body);
    if (!note) {
      return { status: 404, message: 'Note not found' };
    }
    return {
      status: 200,
      result: note,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async delete(@Param('id') id: string, @Request() req) {
    const deleted = await this.studyNotesService.delete(parseInt(id, 10), req.user.sub);
    return {
      status: deleted ? 200 : 404,
      result: { deleted },
    };
  }

  @Get('course/:courseId')
  @UseGuards(AuthGuard('jwt'))
  async findByCourse(@Param('courseId') courseId: string) {
    const notes = await this.studyNotesService.findByCourse(parseInt(courseId, 10));
    return {
      status: 200,
      result: notes,
    };
  }

  @Get('lesson/:lessonId')
  @UseGuards(AuthGuard('jwt'))
  async findByLesson(@Param('lessonId') lessonId: string) {
    const notes = await this.studyNotesService.findByLesson(parseInt(lessonId, 10));
    return {
      status: 200,
      result: notes,
    };
  }
}
