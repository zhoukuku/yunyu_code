import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CodeExecutionService } from './code-execution.service';
import { CodeLanguage, ExecutionStatus } from '../entities/code-execution.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateExecutionDto } from './dto/create-execution.dto';
import { UpdateExecutionDto } from './dto/update-execution.dto';

@Controller('code-execution')
export class CodeExecutionController {
  constructor(private readonly codeExecutionService: CodeExecutionService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Request() req: any, @Body() dto: CreateExecutionDto) {
    const userId = req.user?.sub;
    if (!userId) return { status: 401, result: null };

    const language = dto.language;

    // Validate language
    if (!Object.values(CodeLanguage).includes(language)) {
      return {
        status: 400,
        result: null,
        message: '无效的编程语言',
      };
    }

    // Validate code
    if (!dto.code || dto.code.trim().length === 0) {
      return {
        status: 400,
        result: null,
        message: '代码不能为空',
      };
    }

    try {
      const execution = await this.codeExecutionService.createExecution({
        userId,
        language,
        code: dto.code,
        projectId: dto.projectId,
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
    @Request() req: any,
    @Query('userId') userId?: string,
    @Query('language') language?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    // Non-admin users can only see their own code executions
    const requestedUserId = userId ? parseInt(userId, 10) : undefined;
    let effectiveUserId = requestedUserId;
    if (req.user.role !== 1) {
      // Non-admin: force to own userId (ignore requested userId)
      effectiveUserId = req.user.sub;
    }
    const pageNum = page ? parseInt(page, 10) : undefined;
    const pageSizeNum = pageSize ? parseInt(pageSize, 10) : undefined;
    const languageEnum = language as CodeLanguage | undefined;
    const statusEnum = status as ExecutionStatus | undefined;

    const result = await this.codeExecutionService.findAll({
      userId: effectiveUserId,
      language: languageEnum,
      status: statusEnum,
      page: pageNum,
      pageSize: pageSizeNum,
    });
    return { status: 200, result };
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@Request() req: any, @Query('userId') userId?: string) {
    // Non-admin users can only see their own stats
    const requestedUserId = userId ? parseInt(userId, 10) : undefined;
    let effectiveUserId = requestedUserId;
    if (req.user.role !== 1) {
      effectiveUserId = req.user.sub;
    }
    const stats = await this.codeExecutionService.getExecutionStats(effectiveUserId);
    return { status: 200, result: stats };
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string, @Request() req: any) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) {
      return { status: 404, result: null, message: '执行记录不存在' };
    }
    // Non-admin users can only view their own executions
    if (req.user.role !== 1 && execution.userId !== req.user.sub) {
      return { status: 403, result: null, message: '无权查看此执行记录' };
    }
    return { status: 200, result: execution };
  }

  @Post(':id/execute')
  @UseGuards(AuthGuard('jwt'))
  async execute(@Param('id') id: string, @Request() req: any) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) {
      return { status: 404, result: null, message: '执行记录不存在' };
    }
    // Non-admin users can only execute their own code
    if (req.user.role !== 1 && execution.userId !== req.user.sub) {
      return { status: 403, result: null, message: '无权执行此代码' };
    }
    const result = await this.codeExecutionService.executeCode(parseInt(id, 10));
    return { status: 200, result };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() dto: UpdateExecutionDto,
  ) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) {
      return { status: 404, result: null, message: '执行记录不存在' };
    }
    if (req.user.role !== 1 && execution.userId !== req.user.sub) {
      return { status: 403, result: null, message: '无权修改此执行记录' };
    }
    const result = await this.codeExecutionService.updateExecution(parseInt(id, 10), {
      output: dto.output,
      errorMessage: dto.errorMessage,
      status: dto.status,
      executionTime: dto.executionTime,
    });
    return { status: 200, result };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: string, @Request() req: any) {
    const execution = await this.codeExecutionService.findOne(parseInt(id, 10));
    if (!execution) {
      return { status: 404, result: null, message: '执行记录不存在' };
    }
    if (req.user.role !== 1 && execution.userId !== req.user.sub) {
      return { status: 403, result: null, message: '无权删除此执行记录' };
    }
    await this.codeExecutionService.deleteExecution(parseInt(id, 10));
    return { status: 200, result: { success: true } };
  }

  @Post('cleanup')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async cleanup(@Body('olderThanDays') olderThanDays?: string) {
    const days = olderThanDays ? parseInt(olderThanDays, 10) : 7;
    const result = await this.codeExecutionService.cleanup(days);
    return { status: 200, result };
  }
}