import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClassEntity } from '../entities/class.entity';
import { UserClass } from '../entities/user-class.entity';
import { ClassLeaderboard } from '../entities/class-leaderboard.entity';
import { Leaderboard } from '../entities/leaderboard.entity';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { ClassLeaderboardService } from './class-leaderboard.service';
import { ClassLeaderboardController } from './class-leaderboard.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ClassEntity, UserClass, ClassLeaderboard, Leaderboard]), AuthModule],
  providers: [ClassesService, ClassLeaderboardService],
  controllers: [ClassesController, ClassLeaderboardController],
  exports: [ClassesService, ClassLeaderboardService],
})
export class ClassesModule {}