import { Controller, Get, Put, Delete, Param, UseGuards, Body, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NoticesService } from './notices.service';

@Controller('notice')
export class NoticesController {
  constructor(private noticesService: NoticesService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getNotices(@Query('userId') userId: number) {
    const notices = await this.noticesService.findAll(userId);
    return {
      status: 200,
      result: notices,
    };
  }

  @Put('read-all')
  @UseGuards(AuthGuard('jwt'))
  async markAllAsRead(@Body('userId') userId: number) {
    if (!userId) {
      return {
        status: 400,
        result: { success: false, message: 'userId is required' },
      };
    }
    const result = await this.noticesService.markAllAsRead(userId);
    return {
      status: 200,
      result,
    };
  }

  @Put(':id/read')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(@Param('id') id: string) {
    const notice = await this.noticesService.markAsRead(+id);
    return {
      status: 200,
      result: notice,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteNotice(@Param('id') id: string) {
    const result = await this.noticesService.deleteNotice(+id);
    return {
      status: 200,
      result,
    };
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  async getUnreadCount(@Query('userId') userId: number) {
    const result = await this.noticesService.getUnreadCount(userId);
    return {
      status: 200,
      result,
    };
  }

  @Get('popup')
  @UseGuards(AuthGuard('jwt'))
  async getNoticePopup(@Query('userId') userId: number) {
    const notices = await this.noticesService.getNoticePopup(userId);
    return {
      status: 200,
      result: notices,
    };
  }
}