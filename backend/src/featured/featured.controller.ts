import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
  async getAllCoursesGroupedByHierarchy() {
    const result = await this.featuredService.getAllCoursesGroupedByHierarchy();
    return { status: 200, result };
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async createFeaturedContent(@Body() data: any) {
    const result = await this.featuredService.createFeaturedContent(data);
    return { status: 200, result };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateFeaturedContent(@Param('id') id: string, @Body() data: any) {
    const result = await this.featuredService.updateFeaturedContent(+id, data);
    return { status: 200, result };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteFeaturedContent(@Param('id') id: string) {
    const result = await this.featuredService.deleteFeaturedContent(+id);
    return { status: 200, result };
  }
}