import {
  Controller,
  Post,
  Delete,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MessagesService } from './messages.service';

@Controller('messages')
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async sendMessage(@Body() body: { receiverId: number; content: string }, @Request() req) {
    const senderId = req.user.sub;
    const { receiverId, content } = body;
    if (!receiverId || isNaN(receiverId)) return { status: 400, message: 'Invalid receiverId' };
    if (!content?.trim()) return { status: 400, message: 'Content is required' };
    const message = await this.messagesService.sendMessage(senderId, receiverId, content);
    return {
      status: 200,
      message: '发送成功',
      result: message,
    };
  }

  @Get('conversations')
  @UseGuards(AuthGuard('jwt'))
  async getConversationsList(@Request() req) {
    const userId = req.user.sub;
    const conversations = await this.messagesService.getConversationsList(userId);
    return {
      status: 200,
      result: conversations,
    };
  }

  @Get('conversation/:partnerId')
  @UseGuards(AuthGuard('jwt'))
  async getConversation(
    @Param('partnerId') partnerId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Request() req,
  ) {
    const userId = req.user.sub;
    const pid = parseInt(partnerId, 10);
    if (isNaN(pid)) return { status: 400, message: 'Invalid partnerId' };
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const result = await this.messagesService.getConversation(
      userId,
      pid,
      isNaN(pageNum) || pageNum < 1 ? 1 : pageNum,
      isNaN(limitNum) || limitNum < 1 ? 50 : limitNum,
    );
    return {
      status: 200,
      result,
    };
  }

  @Get('unread-count')
  @UseGuards(AuthGuard('jwt'))
  async getUnreadCount(@Request() req) {
    const userId = req.user.sub;
    const count = await this.messagesService.getUnreadCount(userId);
    return {
      status: 200,
      result: { count },
    };
  }

  @Put(':messageId/read')
  @UseGuards(AuthGuard('jwt'))
  async markAsRead(@Param('messageId') messageId: string, @Request() req) {
    const userId = req.user.sub;
    const mid = parseInt(messageId, 10);
    if (isNaN(mid)) return { status: 400, message: 'Invalid messageId' };
    const message = await this.messagesService.markAsRead(userId, mid);
    return {
      status: 200,
      message: '标记已读成功',
      result: message,
    };
  }

  @Post('conversation/:partnerId/read')
  @UseGuards(AuthGuard('jwt'))
  async markConversationAsRead(@Param('partnerId') partnerId: string, @Request() req) {
    const userId = req.user.sub;
    const pid = parseInt(partnerId, 10);
    if (isNaN(pid)) return { status: 400, message: 'Invalid partnerId' };
    const result = await this.messagesService.markConversationAsRead(userId, pid);
    return {
      status: 200,
      ...result,
    };
  }

  @Delete(':messageId')
  @UseGuards(AuthGuard('jwt'))
  async deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    const userId = req.user.sub;
    const mid = parseInt(messageId, 10);
    if (isNaN(mid)) return { status: 400, message: 'Invalid messageId' };
    const result = await this.messagesService.deleteMessage(userId, mid);
    return {
      status: 200,
      ...result,
    };
  }
}