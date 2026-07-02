import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MaterialsService } from './materials.service';
import { MaterialType } from '../entities/material.entity';

@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Request() req, @Body() body: {
    type: MaterialType;
    name: string;
    url: string;
    thumbnailUrl?: string;
    size?: number;
    mimeType?: string;
    description?: string;
    tags?: string;
    isPublic?: boolean;
  }) {
    const material = await this.materialsService.create(req.user.sub, body);
    return {
      status: 200,
      result: material,
    };
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getUserMaterials(@Request() req, @Query() query: {
    type?: MaterialType;
    isPublic?: boolean;
    page?: number;
    pageSize?: number;
  }) {
    const result = await this.materialsService.findByUser(req.user.sub, {
      type: query.type,
      isPublic: query.isPublic,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    });
    return {
      status: 200,
      result,
    };
  }

  @Get('public')
  async getPublicMaterials(@Query() query: {
    type?: MaterialType;
    page?: number;
    pageSize?: number;
  }) {
    const result = await this.materialsService.getPublicMaterials({
      type: query.type,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    });
    return {
      status: 200,
      result,
    };
  }

  @Get('search')
  async searchMaterials(@Query() query: {
    keyword: string;
    type?: MaterialType;
    page?: number;
    pageSize?: number;
  }) {
    const result = await this.materialsService.searchMaterials(query.keyword, {
      type: query.type,
      page: query.page || 1,
      pageSize: query.pageSize || 20,
    });
    return {
      status: 200,
      result,
    };
  }

  @Get('stats')
  @UseGuards(AuthGuard('jwt'))
  async getStats(@Request() req) {
    const stats = await this.materialsService.getStats(req.user.sub);
    return {
      status: 200,
      result: stats,
    };
  }

  @Get(':id')
  async getMaterial(@Param('id') id: string) {
    const material = await this.materialsService.findById(parseInt(id, 10));
    // Increment views
    await this.materialsService.incrementViews(parseInt(id, 10));
    return {
      status: 200,
      result: material,
    };
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async updateMaterial(@Param('id') id: string, @Request() req, @Body() body: {
    name?: string;
    url?: string;
    thumbnailUrl?: string;
    description?: string;
    tags?: string;
    isPublic?: boolean;
  }) {
    const material = await this.materialsService.update(parseInt(id, 10), req.user.sub, body);
    return {
      status: 200,
      result: material,
    };
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async deleteMaterial(@Param('id') id: string, @Request() req) {
    await this.materialsService.delete(parseInt(id, 10), req.user.sub);
    return {
      status: 200,
      message: 'Material deleted successfully',
    };
  }

  @Post(':id/download')
  @UseGuards(AuthGuard('jwt'))
  async downloadMaterial(@Param('id') id: string) {
    await this.materialsService.incrementDownloads(parseInt(id, 10));
    return {
      status: 200,
      message: 'Download recorded',
    };
  }
}
