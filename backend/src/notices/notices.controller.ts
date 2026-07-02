import { Controller, Get, Post, Put, Delete, Param, UseGuards, Body, Query, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NoticesService } from './notices.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('notice')
export class NoticesController {
  constructor(private noticesService: NoticesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getNotices(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const notices = await this.noticesService.findAll(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
    return {
      status: 200,
      result: notices,
    };
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  async getUnreadCount(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const result = await this.noticesService.getUnreadCount(userId);
    return {
      status: 200,
      result,
    };
  }

  @Get('popup')
  @UseGuards(AuthGuard('jwt'))
  async getNoticePopup(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const notices = await this.noticesService.getNoticePopup(userId);
    return {
      status: 200,
      result: notices,
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createNotice(@Body() data: any) {
    const notice = await this.noticesService.createNotice(data);
    return { status: 200, result: notice };
  }

  // Specific PUT routes must come before parameterized @Put(':id')
  @Put('read-all')
  @UseGuards(AuthGuard('jwt'))
  async markAllAsRead(@Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) {
      return { status: 401, result: null };
    }
    const result = await this.noticesService.markAllAsRead(userId);
    return {
      status: 200,
      result,
    };
  }

  // Specific :id/read route must come BEFORE generic :id route
  @Put(':id/read')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const notice = await this.noticesService.markAsRead(+id, userId);
    return {
      status: 200,
      result: notice,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateNotice(@Param('id') id: string, @Body() data: any) {
    const notice = await this.noticesService.updateNotice(+id, data);
    return { status: 200, result: notice };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteNotice(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };
    const result = await this.noticesService.deleteNotice(+id, userId);
    return {
      status: 200,
      result,
    };
  }
}