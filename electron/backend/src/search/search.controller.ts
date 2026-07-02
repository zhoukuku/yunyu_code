import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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
  @UseGuards(AuthGuard('jwt'))
  async saveSearchHistory(@Req() req: any, @Body() data: { keyword: string }) {
    // Use authenticated user ID, not one from the body
    const result = await this.searchService.saveSearchHistory(req.user.sub, data.keyword);
    return { status: 200, result };
  }

  @Get('history')
  @UseGuards(AuthGuard('jwt'))
  async getSearchHistory(@Req() req: any, @Query('limit') limit?: string) {
    const result = await this.searchService.getSearchHistory(
      req.user.sub,
      limit ? parseInt(limit, 10) : 10,
    );
    return { status: 200, result };
  }

  @Delete('history')
  @UseGuards(AuthGuard('jwt'))
  async clearSearchHistory(@Req() req: any) {
    await this.searchService.clearSearchHistory(req.user.sub);
    return { status: 200, result: { success: true } };
  }
}