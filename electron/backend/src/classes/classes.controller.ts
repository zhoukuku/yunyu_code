import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Query, Req, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ClassesService } from './classes.service';

@Controller()
export class ClassesController {
  constructor(private classesService: ClassesService) {}

  // Teacher endpoints
  @Get('teacher/class')
  @UseGuards(AuthGuard('jwt'))
  async getClasses(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const teacherId = req.user.sub;
    const classes = await this.classesService.findAll(
      teacherId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 10,
    );
    return {
      status: 200,
      result: classes,
    };
  }

  @Get('teacher/class/:id')
  @UseGuards(AuthGuard('jwt'))
  async getClass(@Param('id') id: string) {
    const classEntity = await this.classesService.findOne(+id);
    return {
      status: 200,
      result: classEntity,
    };
  }

  @Post('teacher/class')
  @UseGuards(AuthGuard('jwt'))
  async createClass(@Body() data: any, @Req() req: any) {
    // Set teacherId from JWT token, ignore any value from request body
    const classData = { ...data, teacherId: req.user.sub };
    const classEntity = await this.classesService.create(classData);
    return {
      status: 200,
      result: classEntity,
    };
  }

  @Put('teacher/class/:id')
  @UseGuards(AuthGuard('jwt'))
  async updateClass(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const existing = await this.classesService.findOne(+id);
    if (!existing) {
      throw new NotFoundException('Class not found');
    }
    // Only the teacher who owns the class can update it
    if (existing.teacherId !== req.user.sub) {
      throw new ForbiddenException('You can only update your own classes');
    }
    const classEntity = await this.classesService.update(+id, data);
    return {
      status: 200,
      result: classEntity,
    };
  }

  @Delete('teacher/class/:id')
  @UseGuards(AuthGuard('jwt'))
  async deleteClass(@Param('id') id: string, @Req() req: any) {
    const existing = await this.classesService.findOne(+id);
    if (!existing) {
      throw new NotFoundException('Class not found');
    }
    // Only the teacher who owns the class can delete it
    if (existing.teacherId !== req.user.sub) {
      throw new ForbiddenException('You can only delete your own classes');
    }
    await this.classesService.delete(+id);
    return {
      status: 200,
      result: null,
    };
  }

  // Student endpoints
  @Get('student/class/search')
  @UseGuards(AuthGuard('jwt'))
  async searchClass(@Query('code') code: string) {
    if (!code) {
      return { status: 400, result: null, message: 'Class code is required' };
    }
    const classEntity = await this.classesService.findByCode(code);
    if (!classEntity) {
      return { status: 404, result: null, message: 'Class not found' };
    }
    return { status: 200, result: classEntity };
  }

  @Post('student/class/apply/:classId')
  @UseGuards(AuthGuard('jwt'))
  async applyToJoin(@Param('classId') classId: string, @Req() req: any) {
    const result = await this.classesService.applyToJoin(+classId, req.user.sub);
    return result;
  }

  @Get('student/class/my')
  @UseGuards(AuthGuard('jwt'))
  async getMyClasses(@Req() req: any) {
    const classes = await this.classesService.getStudentClasses(req.user.sub);
    return {
      status: 200,
      result: classes,
    };
  }

  @Get('student/class/check/:classId')
  @UseGuards(AuthGuard('jwt'))
  async checkMembership(@Param('classId') classId: string, @Req() req: any) {
    const isMember = await this.classesService.isStudentInClass(+classId, req.user.sub);
    return { status: 200, result: isMember };
  }
}