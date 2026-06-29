import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Institution } from './entities/institution.entity';
import { Hierarchy, Course, Lesson, Notice } from './entities/course.entity';
import { ClassEntity } from './entities/class.entity';
import { Activity } from './entities/activity.entity';
import { Achievement } from './entities/achievement.entity';
import { ClassLeaderboard } from './entities/class-leaderboard.entity';
import { CodeExecution } from './entities/code-execution.entity';
import { Comment } from './entities/comment.entity';
import { CompetitionEvaluation, CompetitionSubmission } from './entities/competition-evaluation.entity';
import { CourseFavorite } from './entities/course-favorite.entity';
import { CourseReview } from './entities/course-review.entity';
import { Favorite } from './entities/favorite.entity';
import { FeaturedContent } from './entities/featured.entity';
import { Homework, HomeworkSubmission } from './entities/homework.entity';
import { Leaderboard } from './entities/leaderboard.entity';
import { SkillCategory, CourseSkill, UserSkillProgress, LearningReport } from './entities/learning-report.entity';
import { Like } from './entities/like.entity';
import { Material } from './entities/material.entity';
import { Message } from './entities/message.entity';
import { ParentalReport } from './entities/parental-report.entity';
import { Post } from './entities/post.entity';
import { Problem } from './entities/problem.entity';
import { Project } from './entities/project.entity';
import { StudyNote } from './entities/study-note.entity';
import { UserClass } from './entities/user-class.entity';
import { UserCourse } from './entities/user-course.entity';
import { UserFollow } from './entities/user-follow.entity';
import { UserLessonProgress } from './entities/user-lesson-progress.entity';
import { VideoProgress } from './entities/video-progress.entity';
import { SearchHistory } from './search/search.entity';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [
    User,
    Institution,
    Hierarchy,
    Course,
    Lesson,
    Notice,
    ClassEntity,
    Activity,
    Achievement,
    ClassLeaderboard,
    CodeExecution,
    Comment,
    CompetitionEvaluation,
    CompetitionSubmission,
    CourseFavorite,
    CourseReview,
    Favorite,
    FeaturedContent,
    Homework,
    HomeworkSubmission,
    Leaderboard,
    SkillCategory,
    CourseSkill,
    UserSkillProgress,
    LearningReport,
    Like,
    Material,
    Message,
    ParentalReport,
    Post,
    Problem,
    Project,
    StudyNote,
    UserClass,
    UserCourse,
    UserFollow,
    UserLessonProgress,
    VideoProgress,
    SearchHistory,
  ],
  synchronize: false,
  logging: true,
  migrations: ['src/migrations/*{.ts,.js}'],
  migrationsRun: true,
});