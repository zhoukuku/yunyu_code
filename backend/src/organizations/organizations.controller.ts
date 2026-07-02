import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
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

  @Get('code/:code')
  async getOrganizationByCode(@Param('code') code: string) {
    const organization = await this.organizationsService.findByOrganizationCode(code);
    if (!organization) {
      return { status: 404, result: null, message: 'Organization not found' };
    }
    return { status: 200, result: organization };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1, 2)
  async createOrganization(@Body() data: any, @Req() req: any) {
    const organization = await this.organizationsService.createOrganization({
      ...data,
      ownerId: req.user.sub,
    });
    return { status: 200, result: organization };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateOrganization(@Param('id') id: string, @Body() data: any, @Req() req: any) {
    const org = await this.organizationsService.findOneOrganization(+id);
    if (!org) {
      return { status: 404, result: null, message: 'Organization not found' };
    }
    // Only the organization owner or admin (role 1) can update
    if (org.ownerId && org.ownerId !== req.user.sub && req.user.role !== 1) {
      return { status: 403, message: 'Only the organization owner or admin can update this organization' };
    }
    const organization = await this.organizationsService.updateOrganization(+id, data);
    return { status: 200, result: organization };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteOrganization(@Param('id') id: string, @Req() req: any) {
    const org = await this.organizationsService.findOneOrganization(+id);
    if (!org) {
      return { status: 404, result: null, message: 'Organization not found' };
    }
    // Only the organization owner or admin (role 1) can delete
    if (org.ownerId && org.ownerId !== req.user.sub && req.user.role !== 1) {
      return { status: 403, message: 'Only the organization owner or admin can delete this organization' };
    }
    await this.organizationsService.deleteOrganization(+id);
    return { status: 200, result: null };
  }

  // Class management
  @Post(':organizationId/classes/:classId')
  @UseGuards(AuthGuard('jwt'))
  async addClassToOrganization(
    @Param('organizationId') organizationId: string,
    @Param('classId') classId: string,
    @Req() req: any,
  ) {
    const org = await this.organizationsService.findOneOrganization(+organizationId);
    if (!org) {
      return { status: 404, message: 'Organization not found' };
    }
    // Only the organization owner or admin (role 1) can manage classes
    if (org.ownerId && org.ownerId !== req.user.sub && req.user.role !== 1) {
      return { status: 403, message: 'Only the organization owner or admin can manage classes' };
    }
    return await this.organizationsService.addClassToOrganization(+organizationId, +classId);
  }

  @Delete(':organizationId/classes/:classId')
  @UseGuards(AuthGuard('jwt'))
  async removeClassFromOrganization(
    @Param('organizationId') organizationId: string,
    @Param('classId') classId: string,
    @Req() req: any,
  ) {
    const org = await this.organizationsService.findOneOrganization(+organizationId);
    if (!org) {
      return { status: 404, message: 'Organization not found' };
    }
    if (org.ownerId && org.ownerId !== req.user.sub && req.user.role !== 1) {
      return { status: 403, message: 'Only the organization owner or admin can manage classes' };
    }
    return await this.organizationsService.removeClassFromOrganization(+organizationId, +classId);
  }

  @Get(':organizationId/classes')
  @UseGuards(AuthGuard('jwt'))
  async getOrganizationClasses(@Param('organizationId') organizationId: string) {
    const classes = await this.organizationsService.getOrganizationClasses(+organizationId);
    return { status: 200, result: classes };
  }

  @Get('class/:classId/students')
  @UseGuards(AuthGuard('jwt'))
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
    @Body() data: { userId?: number; studentNumber?: string; grade?: string; major?: string },
    @Req() req: any,
  ) {
    const org = await this.organizationsService.findOneOrganization(+organizationId);
    if (!org) {
      return { status: 404, message: 'Organization not found' };
    }
    // Determine the target userId: admins/owners can specify a userId, otherwise use the authenticated user
    const isAdminOrOwner = (org.ownerId && org.ownerId === req.user.sub) || req.user.role === 1;
    let targetUserId: number;
    if (isAdminOrOwner && data.userId) {
      targetUserId = data.userId;
    } else if (isAdminOrOwner) {
      targetUserId = req.user.sub;
    } else {
      // Regular users can only add themselves
      targetUserId = req.user.sub;
    }
    const { studentNumber, grade, major } = data;
    return await this.organizationsService.addStudentToOrganization(
      +organizationId,
      targetUserId,
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
    @Req() req: any,
  ) {
    const org = await this.organizationsService.findOneOrganization(+organizationId);
    if (!org) {
      return { status: 404, message: 'Organization not found' };
    }
    // Only the organization owner, admin (role 1), or the student themselves can remove
    const isAdminOrOwner = (org.ownerId && org.ownerId === req.user.sub) || req.user.role === 1;
    const isSelf = +userId === req.user.sub;
    if (!isAdminOrOwner && !isSelf) {
      return { status: 403, message: 'Only the organization owner, admin, or the student themselves can remove a student' };
    }
    return await this.organizationsService.removeStudentFromOrganization(+organizationId, +userId);
  }

  @Get(':organizationId/students')
  @UseGuards(AuthGuard('jwt'))
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

  // Wildcard :id route MUST be last to avoid shadowing specific routes like 'my'
  @Get(':id')
  async getOrganization(@Param('id') id: string) {
    const organization = await this.organizationsService.findOneOrganization(+id);
    if (!organization) {
      return { status: 404, result: null, message: 'Organization not found' };
    }
    return { status: 200, result: organization };
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