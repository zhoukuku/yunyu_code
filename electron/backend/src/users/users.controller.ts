import { Controller, Get, Post, Put, Delete, Param, UseGuards, Query, Body } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { User } from '../entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getUsers(
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '10',
    @Query('keyword') keyword: string = '',
  ) {
    let result;
    if (keyword) {
      result = await this.usersService.search(keyword, +page, +pageSize);
    } else {
      result = await this.usersService.findAllWithPagination(+page, +pageSize);
    }
    return {
      status: 200,
      result,
    };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createUser(@Body() data: Partial<User>) {
    const user = await this.usersService.create(data);
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

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findOne(+id);
    return {
      status: 200,
      result: user,
    };
  }

  @Get('username/:username')
  @UseGuards(AuthGuard('jwt'))
  async getUserByUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) {
      return {
        status: 404,
        message: '用户不存在',
      };
    }
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
}