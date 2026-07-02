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
    const result = await this.messagesService.getConversation(
      userId,
      +partnerId,
      parseInt(page, 10) || 1,
      parseInt(limit, 10) || 50,
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
    const message = await this.messagesService.markAsRead(userId, +messageId);
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
    const result = await this.messagesService.markConversationAsRead(userId, +partnerId);
    return {
      status: 200,
      ...result,
    };
  }

  @Delete(':messageId')
  @UseGuards(AuthGuard('jwt'))
  async deleteMessage(@Param('messageId') messageId: string, @Request() req) {
    const userId = req.user.sub;
    const result = await this.messagesService.deleteMessage(userId, +messageId);
    return {
      status: 200,
      ...result,
    };
  }
}