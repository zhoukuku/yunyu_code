import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { SearchService } from './search.service';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  async globalSearch(@Query('keyword') keyword: string, @Query('userId') userId?: string) {
    if (!keyword) {
      return { status: 200, result: { courses: [], posts: [], projects: [] } };
    }
    const result = await this.searchService.globalSearch(keyword, userId ? parseInt(userId, 10) : undefined);
    return { status: 200, result };
  }

  @Post('history')
  async saveSearchHistory(@Body() data: { userId: number; keyword: string }) {
    const result = await this.searchService.saveSearchHistory(data.userId, data.keyword);
    return { status: 200, result };
  }

  @Get('history')
  async getSearchHistory(@Query('userId') userId: string, @Query('limit') limit?: string) {
    const result = await this.searchService.getSearchHistory(
      parseInt(userId, 10),
      limit ? parseInt(limit, 10) : 10,
    );
    return { status: 200, result };
  }

  @Delete('history')
  async clearSearchHistory(@Query('userId') userId: string) {
    await this.searchService.clearSearchHistory(parseInt(userId, 10));
    return { status: 200, result: { success: true } };
  }
}