-- Database Optimization Script
-- Generated: 2026-06-26
-- Target: SQLite database.sqlite

-- ============================================
-- PART 1: MISSING INDEXES
-- ============================================

-- courses: hierarchyId used for filtering courses by hierarchy
CREATE INDEX IF NOT EXISTS idx_courses_hierarchyId ON courses(hierarchyId);

-- courses: status for filtering active courses
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);

-- lessons: courseId heavily used in queries
CREATE INDEX IF NOT EXISTS idx_lessons_courseId ON lessons(courseId);

-- lessons: lessonOrder for ordered retrieval
CREATE INDEX IF NOT EXISTS idx_lessons_lessonOrder ON lessons(lessonOrder);

-- notices: userId for user-specific notices
CREATE INDEX IF NOT EXISTS idx_notices_userId ON notices(userId);

-- notices: noticeType for filtering
CREATE INDEX IF NOT EXISTS idx_notices_noticeType ON notices(noticeType);

-- notices: isRead for unread notice queries
CREATE INDEX IF NOT EXISTS idx_notices_isRead ON notices(isRead);

-- posts: userId for user's posts
CREATE INDEX IF NOT EXISTS idx_posts_userId ON posts(userId);

-- posts: scope for filtering
CREATE INDEX IF NOT EXISTS idx_posts_scope ON posts(scope);

-- posts: createdAt for timeline queries
CREATE INDEX IF NOT EXISTS idx_posts_createdAt ON posts(createdAt);

-- comments: postId for post comments
CREATE INDEX IF NOT EXISTS idx_comments_postId ON comments(postId);

-- comments: userId for user's comments
CREATE INDEX IF NOT EXISTS idx_comments_userId ON comments(userId);

-- comments: parentId for nested replies
CREATE INDEX IF NOT EXISTS idx_comments_parentId ON comments(parentId);

-- likes: postId for post like queries
CREATE INDEX IF NOT EXISTS idx_likes_postId ON likes(postId);

-- likes: userId for user's likes
CREATE INDEX IF NOT EXISTS idx_likes_userId ON likes(userId);

-- homework: teacherId for teacher's assignments
CREATE INDEX IF NOT EXISTS idx_homework_teacherId ON homework(teacherId);

-- homework: courseId for course assignments
CREATE INDEX IF NOT EXISTS idx_homework_courseId ON homework(courseId);

-- homework: classId for class assignments
CREATE INDEX IF NOT EXISTS idx_homework_classId ON homework(classId);

-- homework: status for filtering active/homework
CREATE INDEX IF NOT EXISTS idx_homework_status ON homework(status);

-- homework_submissions: homeworkId for submission lookups
CREATE INDEX IF NOT EXISTS idx_homework_submissions_homeworkId ON homework_submissions(homeworkId);

-- homework_submissions: studentId for student submissions
CREATE INDEX IF NOT EXISTS idx_homework_submissions_studentId ON homework_submissions(studentId);

-- homework_submissions: status for grading queries
CREATE INDEX IF NOT EXISTS idx_homework_submissions_status ON homework_submissions(status);

-- user_courses: userId for user's enrollments
CREATE INDEX IF NOT EXISTS idx_user_courses_userId ON user_courses(userId);

-- user_courses: courseId for course enrollment lookups
CREATE INDEX IF NOT EXISTS idx_user_courses_courseId ON user_courses(courseId);

-- user_courses: status for filtering active enrollments
CREATE INDEX IF NOT EXISTS idx_user_courses_status ON user_courses(status);

-- code_executions: userId for user's code history
CREATE INDEX IF NOT EXISTS idx_code_executions_userId ON code_executions(userId);

-- code_executions: projectId for project code lookups
CREATE INDEX IF NOT EXISTS idx_code_executions_projectId ON code_executions(projectId);

-- code_executions: status for pending execution queries
CREATE INDEX IF NOT EXISTS idx_code_executions_status ON code_executions(status);

-- code_executions: createdAt for timeline
CREATE INDEX IF NOT EXISTS idx_code_executions_createdAt ON code_executions(createdAt);

-- projects: userId for user's projects
CREATE INDEX IF NOT EXISTS idx_projects_userId ON projects(userId);

-- projects: isPublic for public project queries
CREATE INDEX IF NOT EXISTS idx_projects_isPublic ON projects(isPublic);

-- projects: type for filtering
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type);

-- problems: competitionId for competition problems
CREATE INDEX IF NOT EXISTS idx_problems_competitionId ON problems(competitionId);

-- problems: difficulty for filtering
CREATE INDEX IF NOT EXISTS idx_problems_difficulty ON problems(difficulty);

-- problems: enabled for active problem queries
CREATE INDEX IF NOT EXISTS idx_problems_enabled ON problems(enabled);

-- competition_evaluations: userId for user's submissions
CREATE INDEX IF NOT EXISTS idx_competition_evaluations_userId ON competition_evaluations(userId);

-- competition_evaluations: competitionId for competition submissions
CREATE INDEX IF NOT EXISTS idx_competition_evaluations_competitionId ON competition_evaluations(competitionId);

-- competition_evaluations: problemId for problem submissions
CREATE INDEX IF NOT EXISTS idx_competition_evaluations_problemId ON competition_evaluations(problemId);

-- competition_evaluations: status for pending evaluation queries
CREATE INDEX IF NOT EXISTS idx_competition_evaluations_status ON competition_evaluations(status);

-- competition_submissions: userId for user's submissions
CREATE INDEX IF NOT EXISTS idx_competition_submissions_userId ON competition_submissions(userId);

-- competition_submissions: competitionId for competition submissions
CREATE INDEX IF NOT EXISTS idx_competition_submissions_competitionId ON competition_submissions(competitionId);

-- competition_submissions: problemId for problem submissions
CREATE INDEX IF NOT EXISTS idx_competition_submissions_problemId ON competition_submissions(problemId);

-- course_reviews: courseId for course rating lookups
CREATE INDEX IF NOT EXISTS idx_course_reviews_courseId ON course_reviews(courseId);

-- course_reviews: userId for user's reviews
CREATE INDEX IF NOT EXISTS idx_course_reviews_userId ON course_reviews(userId);

-- user_classes: userId for user's class memberships
CREATE INDEX IF NOT EXISTS idx_user_classes_userId ON user_classes(userId);

-- user_classes: classId for class member lookups
CREATE INDEX IF NOT EXISTS idx_user_classes_classId ON user_classes(classId);

-- user_classes: status for approved/pending queries
CREATE INDEX IF NOT EXISTS idx_user_classes_status ON user_classes(status);

-- favorites: userId for user's favorites
CREATE INDEX IF NOT EXISTS idx_favorites_userId ON favorites(userId);

-- favorites: projectId for project favorite counts
CREATE INDEX IF NOT EXISTS idx_favorites_projectId ON favorites(projectId);

-- course_favorites: userId for user's course favorites
CREATE INDEX IF NOT EXISTS idx_course_favorites_userId ON course_favorites(userId);

-- course_favorites: courseId for course favorite counts
CREATE INDEX IF NOT EXISTS idx_course_favorites_courseId ON course_favorites(courseId);

-- featured_content: contentType for filtering
CREATE INDEX IF NOT EXISTS idx_featured_content_contentType ON featured_content(contentType);

-- featured_content: category for category browsing
CREATE INDEX IF NOT EXISTS idx_featured_content_category ON featured_content(category);

-- featured_content: status for active content queries
CREATE INDEX IF NOT EXISTS idx_featured_content_status ON featured_content(status);

-- featured_content: sortOrder for ordered retrieval
CREATE INDEX IF NOT EXISTS idx_featured_content_sortOrder ON featured_content(sortOrder);

-- search_history: userId for user's search history
CREATE INDEX IF NOT EXISTS idx_search_history_userId ON search_history(userId);

-- search_history: keyword for search analytics
CREATE INDEX IF NOT EXISTS idx_search_history_keyword ON search_history(keyword);

-- search_history: createdAt for recent searches
CREATE INDEX IF NOT EXISTS idx_search_history_createdAt ON search_history(createdAt);

-- parental_reports: parentId for parent's reports
CREATE INDEX IF NOT EXISTS idx_parental_reports_parentId ON parental_reports(parentId);

-- parental_reports: studentId for student's reports
CREATE INDEX IF NOT EXISTS idx_parental_reports_studentId ON parental_reports(studentId);

-- parental_reports: status for pending report queries
CREATE INDEX IF NOT EXISTS idx_parental_reports_status ON parental_reports(status);

-- classes: teacherId for teacher's classes
CREATE INDEX IF NOT EXISTS idx_classes_teacherId ON classes(teacherId);

-- classes: isEnd for active/ended class queries
CREATE INDEX IF NOT EXISTS idx_classes_isEnd ON classes(isEnd);

-- course_skills: courseId for course skills
CREATE INDEX IF NOT EXISTS idx_course_skills_courseId ON course_skills(courseId);

-- course_skills: categoryId for category skills
CREATE INDEX IF NOT EXISTS idx_course_skills_categoryId ON course_skills(categoryId);

-- user_skill_progress: userId for user's skill progress
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_userId ON user_skill_progress(userId);

-- user_skill_progress: skillName for skill lookups
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_skillName ON user_skill_progress(skillName);

-- user_skill_progress: categoryId for category progress
CREATE INDEX IF NOT EXISTS idx_user_skill_progress_categoryId ON user_skill_progress(categoryId);

-- learning_reports: userId for user's reports
CREATE INDEX IF NOT EXISTS idx_learning_reports_userId ON learning_reports(userId);

-- learning_reports: reportType for type filtering
CREATE INDEX IF NOT EXISTS idx_learning_reports_reportType ON learning_reports(reportType);

-- learning_reports: createdAt for recent reports
CREATE INDEX IF NOT EXISTS idx_learning_reports_createdAt ON learning_reports(createdAt);

-- hierarchy: standardClassifyId for filtering
CREATE INDEX IF NOT EXISTS idx_hierarchy_standardClassifyId ON hierarchy(standardClassifyId);

-- hierarchy: themeClassifyId for filtering
CREATE INDEX IF NOT EXISTS idx_hierarchy_themeClassifyId ON hierarchy(themeClassifyId);

-- ============================================
-- PART 2: COMPOSITE INDEXES FOR COMMON QUERIES
-- ============================================

-- Posts: user's posts sorted by date
CREATE INDEX IF NOT EXISTS idx_posts_userId_createdAt ON posts(userId, createdAt DESC);

-- Comments: post comments sorted by date
CREATE INDEX IF NOT EXISTS idx_comments_postId_createdAt ON comments(postId, createdAt DESC);

-- Homework: teacher's active assignments
CREATE INDEX IF NOT EXISTS idx_homework_teacherId_status ON homework(teacherId, status);

-- User courses: user's active enrollments
CREATE INDEX IF NOT EXISTS idx_user_courses_userId_status ON user_courses(userId, status);

-- User classes: user's active memberships
CREATE INDEX IF NOT EXISTS idx_user_classes_userId_status ON user_classes(userId, status);

-- Competition evaluations: user's submissions by date
CREATE INDEX IF NOT EXISTS idx_competition_evaluations_userId_createdAt ON competition_evaluations(userId, createdAt DESC);

-- Course reviews: course reviews sorted by date
CREATE INDEX IF NOT EXISTS idx_course_reviews_courseId_createdAt ON course_reviews(courseId, createdAt DESC);

-- Learning reports: user's reports by date
CREATE INDEX IF NOT EXISTS idx_learning_reports_userId_createdAt ON learning_reports(userId, createdAt DESC);

-- ============================================
-- PART 3: RELATIONSHIP OPTIMIZATIONS
-- ============================================

-- Note: The following are FK constraint suggestions for referential integrity
-- SQLite does not enforce FK constraints by default, but these help document relationships

-- 1. Posts -> Users relationship (userId -> users.id)
-- Query pattern: SELECT * FROM posts WHERE userId = ? ORDER BY createdAt DESC

-- 2. Comments -> Posts relationship (postId -> posts.id)
-- Query pattern: SELECT * FROM comments WHERE postId = ? ORDER BY createdAt ASC

-- 3. Comments -> Users relationship (userId -> users.id)
-- Query pattern: SELECT * FROM comments WHERE userId = ? ORDER BY createdAt DESC

-- 4. Homework -> Users (teacher) relationship
-- Query pattern: SELECT * FROM homework WHERE teacherId = ? AND status = 1

-- 5. Homework -> Courses relationship
-- Query pattern: SELECT * FROM homework WHERE courseId = ?

-- 6. Homework -> Classes relationship
-- Query pattern: SELECT * FROM homework WHERE classId = ?

-- 7. HomeworkSubmissions -> Homework relationship
-- Query pattern: SELECT * FROM homework_submissions WHERE homeworkId = ? AND studentId = ?

-- 8. UserCourses -> Users relationship
-- Query pattern: SELECT * FROM user_courses WHERE userId = ? AND status = 1

-- 9. UserCourses -> Courses relationship
-- Query pattern: SELECT * FROM user_courses WHERE courseId = ?

-- 10. Projects -> Users relationship
-- Query pattern: SELECT * FROM projects WHERE userId = ? ORDER BY createdAt DESC

-- 11. CompetitionEvaluations -> Users relationship
-- Query pattern: SELECT * FROM competition_evaluations WHERE userId = ? ORDER BY createdAt DESC

-- 12. CompetitionSubmissions -> Users relationship
-- Query pattern: SELECT * FROM competition_submissions WHERE userId = ? ORDER BY createdAt DESC

-- 13. CourseReviews -> Courses relationship
-- Query pattern: SELECT AVG(rating) FROM course_reviews WHERE courseId = ?

-- 14. UserClasses -> Classes relationship
-- Query pattern: SELECT * FROM user_classes WHERE classId = ? AND status = 1

-- 15. Favorites -> Projects relationship
-- Query pattern: SELECT * FROM favorites WHERE projectId = ?

-- 16. CourseFavorites -> Courses relationship
-- Query pattern: SELECT * FROM course_favorites WHERE courseId = ?

-- 17. SearchHistory -> Users relationship
-- Query pattern: SELECT * FROM search_history WHERE userId = ? ORDER BY createdAt DESC LIMIT 10

-- 18. ParentalReports -> Users (parent) relationship
-- Query pattern: SELECT * FROM parental_reports WHERE parentId = ?

-- 19. Classes -> Users (teacher) relationship
-- Query pattern: SELECT * FROM classes WHERE teacherId = ?

-- 20. LearningReports -> Users relationship
-- Query pattern: SELECT * FROM learning_reports WHERE userId = ? ORDER BY createdAt DESC

-- ============================================
-- PART 4: UNUSED INDEX CLEANUP (optional)
-- ============================================

-- If any indexes are not being used, they can be dropped with:
-- DROP INDEX IF EXISTS idx_index_name;

-- ============================================
-- PART 5: ANALYZE TABLE (update query planner statistics)
-- ============================================

-- For SQLite, run ANALYZE to update index statistics
-- This helps the query planner choose optimal execution plans
ANALYZE;

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- List all indexes created
-- SELECT name FROM sqlite_master WHERE type = 'index' ORDER BY name;