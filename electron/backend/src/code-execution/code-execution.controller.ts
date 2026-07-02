import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CodeExecutionService } from './code-execution.service';
import { CodeLanguage, ExecutionStatus } from '../entities/code-execution.entity';

@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() data: {
    userId?: number;
    language: string;
    code: string;
    projectId?: number;
  }) {
    const language = data.language as CodeLanguage;
    // Use authenticated user ID, ignore any userId from the body
    return this.codeExecutionService.createExecution({
      userId: req.user.sub,
      language,
      code: data.code,
      projectId: data.projectId,
    });
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const languageEnum = language as CodeLanguage | undefined;
    const statusEnum = status as ExecutionStatus | undefined;

    // Non-admin users can only see their own executions
    const filterUserId = req.user.role >= 2 ? (userId ? parseInt(userId, 10) : undefined) : req.user.sub;

    return this.codeExecutionService.findAll({
      userId: filterUserId,
      language: languageEnum,
      status: statusEnum,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@Req() req: any, @Query('userId') userId?: string) {
    const userIdNum = req.user.role >= 2 ? (userId ? parseInt(userId, 10) : undefined) : req.user.sub;
    return this.codeExecutionService.getExecutionStats(userIdNum);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Req() req: any) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (execution && execution.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, message: 'You can only view your own code executions' };
    }
    return execution;
  }

  @Post(':id/execute')
  @UseGuards(AuthGuard('jwt'))
  async execute(@Param('id') id: string, @Req() req: any) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) return { status: 404, result: null };
    if (execution.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only execute your own code' };
    }
    return this.codeExecutionService.executeCode(parseInt(id, 10));
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() data: {
      output?: string;
      errorMessage?: string;
      status?: string;
      executionTime?: number;
    },
  ) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) return { status: 404, result: null };
    if (execution.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only update your own code executions' };
    }
    const status = data.status as ExecutionStatus | undefined;
    return this.codeExecutionService.updateExecution(parseInt(id, 10), {
      output: data.output,
      errorMessage: data.errorMessage,
      status,
      executionTime: data.executionTime,
    });
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Req() req: any) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) return { status: 404, result: null };
    if (execution.userId !== req.user.sub && req.user.role < 2) {
      return { status: 403, result: null, message: 'You can only delete your own code executions' };
    }
    await this.codeExecutionService.deleteExecution(parseInt(id, 10));
    return { success: true };
  }
}