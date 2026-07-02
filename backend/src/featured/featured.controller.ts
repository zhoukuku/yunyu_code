import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import { FeaturedService } from './featured.service';

@Controller('featured')
export class FeaturedController {
  constructor(private featuredService: FeaturedService) {}

  @Get()
  async getFeaturedContents(@Query('category') category?: string) {
    const result = await this.featuredService.getFeaturedContents(category);
    return { status: 200, result };
  }

  @Get('categories')
  async getFeaturedCategories() {
    const categories = await this.featuredService.getFeaturedCategories();
    return { status: 200, result: categories };
  }

  @Get('category/:category')
  async getCoursesByCategory(@Param('category') category: string) {
    const result = await this.featuredService.getCoursesByCategory(category);
    return { status: 200, result };
  }

  @Get('courses')
  async getAllCourses(
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const result = await this.featuredService.getAllCourses(
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
    return { status: 200, result };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async createFeaturedContent(@Body() data: any) {
    const result = await this.featuredService.createFeaturedContent(data);
    return { status: 200, result };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async updateFeaturedContent(@Param('id') id: string, @Body() data: any) {
    const result = await this.featuredService.updateFeaturedContent(+id, data);
    return { status: 200, result };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(1)
  async deleteFeaturedContent(@Param('id') id: string) {
    const result = await this.featuredService.deleteFeaturedContent(+id);
    return { status: 200, result };
  }
}