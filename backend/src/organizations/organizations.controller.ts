import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  // Organization CRUD
  @Get()
  async getAllOrganizations(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.organizationsService.findAllOrganizations(
      page ? +page : 1,
      pageSize ? +pageSize : 10,
    );
    return { status: 200, result };
  }

  @Get(':id')
  async getOrganization(@Param('id') id: string) {
    const organization = await this.organizationsService.findOneOrganization(+id);
    if (!organization) {
      return { status: 404, result: null, message: 'Organization not found' };
    }
    return { status: 200, result: organization };
  }

  @Get('code/:code')
  async getOrganizationByCode(@Param('code') code: string) {
    const organization = await this.organizationsService.findByOrganizationCode(code);
    if (!organization) {
      return { status: 404, result: null, message: 'Organization not found' };
    }
    return { status: 200, result: organization };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createOrganization(@Body() data: any) {
    const organization = await this.organizationsService.createOrganization(data);
    return { status: 200, result: organization };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateOrganization(@Param('id') id: string, @Body() data: any) {
    const organization = await this.organizationsService.updateOrganization(+id, data);
    return { status: 200, result: organization };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteOrganization(@Param('id') id: string) {
    await this.organizationsService.deleteOrganization(+id);
    return { status: 200, result: null };
  }

  // Class management
  @Post(':organizationId/classes/:classId')
  @UseGuards(AuthGuard('jwt'))
  async addClassToOrganization(
    @Param('organizationId') organizationId: string,
    @Param('classId') classId: string,
  ) {
    return await this.organizationsService.addClassToOrganization(+organizationId, +classId);
  }

  @Delete(':organizationId/classes/:classId')
  @UseGuards(AuthGuard('jwt'))
  async removeClassFromOrganization(
    @Param('organizationId') organizationId: string,
    @Param('classId') classId: string,
  ) {
    return await this.organizationsService.removeClassFromOrganization(+organizationId, +classId);
  }

  @Get(':organizationId/classes')
  async getOrganizationClasses(@Param('organizationId') organizationId: string) {
    const classes = await this.organizationsService.getOrganizationClasses(+organizationId);
    return { status: 200, result: classes };
  }

  @Get('class/:classId/students')
  async getClassStudents(
    @Param('classId') classId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.organizationsService.getClassStudents(
      +classId,
      page ? +page : 1,
      pageSize ? +pageSize : 10,
    );
    return { status: 200, result };
  }

  // Student management
  @Post(':organizationId/students')
  @UseGuards(AuthGuard('jwt'))
  async addStudentToOrganization(
    @Param('organizationId') organizationId: string,
    @Body() data: { userId: number; studentNumber?: string; grade?: string; major?: string },
  ) {
    const { userId, studentNumber, grade, major } = data;
    return await this.organizationsService.addStudentToOrganization(
      +organizationId,
      userId,
      studentNumber,
      grade,
      major,
    );
  }

  @Delete(':organizationId/students/:userId')
  @UseGuards(AuthGuard('jwt'))
  async removeStudentFromOrganization(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    return await this.organizationsService.removeStudentFromOrganization(+organizationId, +userId);
  }

  @Get(':organizationId/students')
  async getOrganizationStudents(
    @Param('organizationId') organizationId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.organizationsService.getOrganizationStudents(
      +organizationId,
      page ? +page : 1,
      pageSize ? +pageSize : 10,
    );
    return { status: 200, result };
  }

  @Get('my')
  @UseGuards(AuthGuard('jwt'))
  async getMyOrganizations(@Req() req: any) {
    const organizations = await this.organizationsService.getStudentOrganizations(req.user.sub);
    return { status: 200, result: organizations };
  }

  @Get(':organizationId/check/:userId')
  @UseGuards(AuthGuard('jwt'))
  async checkStudentMembership(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
  ) {
    const isMember = await this.organizationsService.isStudentInOrganization(+organizationId, +userId);
    return { status: 200, result: isMember };
  }
}