import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
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

@Module({
  imports: [
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
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USERNAME || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_DATABASE || 'yunyu_learning',
      entities: [__dirname + '/entities/*.entity{.ts,.js}', __dirname + '/search/*.entity{.ts,.js}'],
      synchronize: true, // 开发环境自动同步表结构
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
  ],
})
export class AppModule {}