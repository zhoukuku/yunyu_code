import { Controller, Get, Post, Put, Delete, Param, UseGuards, Query, Body, Req, UseInterceptors, UploadedFile, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { UpdateProfileDto, ChangePasswordDto } from './dto/update-profile.dto';
import { CreateUserDto, UpdateUserDto, QueryUserDto } from './dto/update-user.dto';
import { BatchAccountDto, ResetPasswordDto, SetRoleDto } from './dto/batch-account.dto';
import { parseCSV, parseExcel, detectFileType } from '../common/utils/file-parser.util';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getUsers(@Query() query: QueryUserDto) {
    const { role, status, keyword, page = 1, pageSize = 10 } = query;

    // Use findAll which supports role/status/search/pagination filters
    const { users, total } = await this.usersService.findAll({
      role: role !== undefined ? +role : undefined,
      status: status !== undefined ? +status : undefined,
      search: keyword,
      page: +page,
      pageSize: +pageSize,
    });

    return {
      status: 200,
      result: {
        records: users,
        total,
        current: +page,
        size: +pageSize,
        pages: Math.ceil(total / (+pageSize || 1)),
      },
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createUser(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto as Partial<User>);
    return {
      status: 200,
      result: user,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const user = await this.usersService.updateUser(+id, dto);
    return {
      status: 200,
      result: user,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async deleteUser(@Param('id') id: string) {
    await this.usersService.delete(+id);
    return {
      status: 200,
      message: '删除成功',
    };
  }

  @Get('profile/me')
  @UseGuards(AuthGuard('jwt'))
  async getMyProfile(@Req() req: any) {
    const user = await this.usersService.findOne(req.user.sub);
    return {
      status: 200,
      result: user,
    };
  }

  @Get('username/:username')
  @UseGuards(AuthGuard('jwt'))
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    return {
      status: 200,
      result: user,
    };
  }

  @Put(':id/status')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateStatus(@Param('id') id: string, @Body('status') status: number) {
    const user = await this.usersService.updateStatus(+id, status);
    return {
      status: 200,
      result: user,
    };
  }

  @Put(':id/role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateRole(@Param('id') id: string, @Body('role') role: number) {
    const user = await this.usersService.updateRole(+id, role);
    return {
      status: 200,
      result: user,
    };
  }

  // Batch account endpoints
  @Post('batch-create')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  @HttpCode(HttpStatus.OK)
  async batchCreate(@Body() dto: BatchAccountDto) {
    const result = await this.usersService.batchCreate(dto.accounts);
    return {
      status: 200,
      result,
    };
  }

  @Post('batch-create/file')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  async batchCreateFromFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    const fileType = detectFileType(file.originalname);
    let records;

    if (fileType === 'csv') {
      records = await parseCSV(file.buffer);
    } else if (fileType === 'excel') {
      records = await parseExcel(file.buffer);
    } else {
      throw new BadRequestException('不支持的文件格式，请上传CSV或Excel文件');
    }

    if (records.length === 0) {
      throw new BadRequestException('文件中没有有效数据');
    }

    const MAX_RECORDS = 1000;
    if (records.length > MAX_RECORDS) {
      throw new BadRequestException(`单次最多创建${MAX_RECORDS}个账号，当前文件包含${records.length}条记录`);
    }

    const result = await this.usersService.batchCreate(records);
    return {
      status: 200,
      result,
    };
  }

  @Post('batch-reset-password')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  @HttpCode(HttpStatus.OK)
  async batchResetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.usersService.resetPassword(dto.accountIds);
    return {
      status: 200,
      result,
    };
  }

  @Post('batch-set-role')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  @HttpCode(HttpStatus.OK)
  async batchSetRole(@Body() dto: SetRoleDto) {
    const result = await this.usersService.setRole(dto.accountIds, dto.role);
    return {
      status: 200,
      result,
    };
  }

  @Put('profile/me')
  @UseGuards(AuthGuard('jwt'))
  async updateMyProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    const user = await this.usersService.updateProfile(req.user.sub, dto);
    return {
      status: 200,
      result: user,
    };
  }

  @Put('profile/password')
  @UseGuards(AuthGuard('jwt'))
  async changeMyPassword(@Req() req: any, @Body() dto: ChangePasswordDto) {
    const result = await this.usersService.changePassword(req.user.sub, dto);
    return {
      status: 200,
      result,
    };
  }

  @Get('profile/stats')
  @UseGuards(AuthGuard('jwt'))
  async getMyStats(@Req() req: any) {
    const stats = await this.usersService.getLearningStats(req.user.sub);
    return {
      status: 200,
      result: stats,
    };
  }

  // Wildcard :id route MUST be last to avoid shadowing specific routes
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    return {
      status: 200,
      result: user,
    };
  }
}