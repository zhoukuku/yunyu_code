import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CodeExecutionService } from './code-execution.service';
import { CodeLanguage, ExecutionStatus } from '../entities/code-execution.entity';

@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() data: {
    userId?: number;
    language: string;
    code: string;
    projectId?: number;
  }) {
    const language = data.language as CodeLanguage;

    // Validate language
    if (!Object.values(CodeLanguage).includes(language)) {
      return {
        status: 400,
        result: null,
        message: '无效的编程语言',
      };
    }

    // Validate code
    if (!data.code || data.code.trim().length === 0) {
      return {
        status: 400,
        result: null,
        message: '代码不能为空',
      };
    }

    try {
      const execution = await this.codeExecutionService.createExecution({
        userId: data.userId,
        language,
        code: data.code,
        projectId: data.projectId,
      });
      return { status: 200, result: execution };
    } catch (error) {
      return {
        status: 400,
        result: null,
        message: error instanceof Error ? error.message : '创建执行任务失败',
      };
    }
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(
    @Query('userId') userId?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    const userIdNum = userId ? parseInt(userId, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const languageEnum = language as CodeLanguage | undefined;
    const statusEnum = status as ExecutionStatus | undefined;

    const executions = await this.codeExecutionService.findAll({
      userId: userIdNum,
      language: languageEnum,
      status: statusEnum,
      limit: limitNum,
    });
    return { status: 200, result: executions };
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@Query('userId') userId?: string) {
    const userIdNum = userId ? parseInt(userId, 10) : undefined;
    const stats = await this.codeExecutionService.getExecutionStats(userIdNum);
    return { status: 200, result: stats };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) {
      return { status: 404, result: null, message: '执行记录不存在' };
    }
    return { status: 200, result: execution };
  }

  @Post(':id/execute')
  @UseGuards(AuthGuard('jwt'))
  async execute(@Param('id') id: string) {
    const execution = await this.codeExecutionService.executeCode(parseInt(id, 10));
    if (!execution) {
      return { status: 404, result: null, message: '执行记录不存在' };
    }
    return { status: 200, result: execution };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() data: {
      output?: string;
      errorMessage?: string;
      status?: string;
      executionTime?: number;
    },
  ) {
    const status = data.status as ExecutionStatus | undefined;
    const execution = await this.codeExecutionService.updateExecution(parseInt(id, 10), {
      output: data.output,
      errorMessage: data.errorMessage,
      status,
      executionTime: data.executionTime,
    });
    if (!execution) {
      return { status: 404, result: null, message: '执行记录不存在' };
    }
    return { status: 200, result: execution };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string) {
    await this.codeExecutionService.deleteExecution(parseInt(id, 10));
    return { status: 200, result: { success: true } };
  }

  @Post('cleanup')
  @UseGuards(AuthGuard('jwt'))
  async cleanup(@Body('olderThanDays') olderThanDays?: string) {
    const days = olderThanDays ? parseInt(olderThanDays, 10) : 7;
    const result = await this.codeExecutionService.cleanup(days);
    return { status: 200, result };
  }
}