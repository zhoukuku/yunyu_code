import * as path from 'path';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthThrottlerGuard } from './common/guards/throttle.guard';
import { AuthModule } from './auth/auth.module';
import { SecurityModule } from './security/security.module';
import { UsersModule } from './users/users.module';
import { ClassesModule } from './classes/classes.module';
import { CoursesModule } from './courses/courses.module';
import { NoticesModule } from './notices/notices.module';
import { UserCoursesModule } from './user-courses/user-courses.module';
import { LessonsModule } from './lessons/lessons.module';
import { ProgressModule } from './progress/progress.module';
import { VideoProgressModule } from './video-progress/video-progress.module';
import { ProjectsModule } from './projects/projects.module';
import { CommunityModule } from './community/community.module';
import { SearchModule } from './search/search.module';
import { FavoritesModule } from './favorites/favorites.module';
import { FollowsModule } from './follows/follows.module';
import { ActivityModule } from './activity/activity.module';
import { MessagesModule } from './messages/messages.module';
import { FeaturedModule } from './featured/featured.module';
import { CourseReviewsModule } from './course-reviews/course-reviews.module';
import { LearningReportModule } from './learning-report/learning-report.module';
import { AchievementsModule } from './achievements/achievements.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { HomeworkModule } from './homework/homework.module';
import { StudyNotesModule } from './study-notes/study-notes.module';
import { MaterialsModule } from './materials/materials.module';
import { CompetitionEvaluationModule } from './competition-evaluation/competition-evaluation.module';
import { ParentalReportModule } from './parental-report/parental-report.module';
import { CodeExecutionModule } from './code-execution/code-execution.module';
import { OrganizationsModule } from './organizations/organizations.module';
// CloudVariablesModule requires @nestjs/websockets and socket.io packages.
// It is conditionally loaded only when those peer dependencies are installed.
// To enable: npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
let CloudVariablesModule: any = null;
try {
  require.resolve('@nestjs/websockets');
  require.resolve('socket.io');
  CloudVariablesModule = require('./cloud-variables/cloud-variables.module').CloudVariablesModule;
} catch {
  console.log('[AppModule] CloudVariablesModule disabled: missing @nestjs/websockets or socket.io packages');
}
import { SeedModule } from './seed/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 3) 速率限制配置 - 60秒内最多100个请求
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    // 数据库配置 - MySQL
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_DATABASE || 'yunyu_learning',
      entities: [path.join(__dirname, 'entities', '*.entity{.ts,.js}'), path.join(__dirname, 'search', '*.entity{.ts,.js}')],
      synchronize: process.env.NODE_ENV !== 'production',
      charset: 'utf8mb4',
      timezone: '+08:00',
    }),
    AuthModule,
    SecurityModule,
    UsersModule,
    ClassesModule,
    CoursesModule,
    NoticesModule,
    UserCoursesModule,
    LessonsModule,
    ProgressModule,
    VideoProgressModule,
    ProjectsModule,
    CommunityModule,
    SearchModule,
    FavoritesModule,
    FollowsModule,
    ActivityModule,
    MessagesModule,
    FeaturedModule,
    CourseReviewsModule,
    LearningReportModule,
    AchievementsModule,
    LeaderboardModule,
    HomeworkModule,
    StudyNotesModule,
    MaterialsModule,
    CompetitionEvaluationModule,
    ParentalReportModule,
    CodeExecutionModule,
    OrganizationsModule,
    ...(CloudVariablesModule ? [CloudVariablesModule] : []),
    SeedModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthThrottlerGuard,
    },
  ],
})
export class AppModule {}