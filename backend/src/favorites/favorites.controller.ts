import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FavoritesService } from './favorites.service';

@Controller('favorites')
@UseGuards(AuthGuard('jwt'))
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  async getUserFavorites(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    const userId = req.user?.sub;
    return this.favoritesService.findByUser(
      userId,
      page ? parseInt(page, 10) : 1,
      pageSize ? parseInt(pageSize, 10) : 20,
    );
  }

  @Post()
  async addFavorite(@Request() req: any, @Body() body: { projectId: number }) {
    const userId = req.user?.sub;
    return this.favoritesService.addFavorite(userId, body.projectId);
  }

  @Delete(':projectId')
  async removeFavorite(@Request() req: any, @Param('projectId') projectId: string) {
    const userId = req.user?.sub;
    await this.favoritesService.removeFavorite(userId, parseInt(projectId, 10));
    return { success: true };
  }

  @Get('check')
  async checkFavorite(@Request() req: any, @Query('projectId') projectId: string) {
    const userId = req.user?.sub;
    const isFavorited = await this.favoritesService.isFavorited(userId, parseInt(projectId, 10));
    return { status: 200, result: { favorited: isFavorited } };
  }
}