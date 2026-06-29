import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense } from 'react';
import Layout from './components/Layout';
import { LoadingOverlay } from './components/LoadingOverlay';
import LoginPage from './pages/login';
import HomePage from './pages/home';
import CoursesPage from './pages/courses';
import CourseDetailPage from './pages/course-detail';
import LessonPage from './pages/lesson';
import TeachingPage from './pages/teaching';
import CommunityPage from './pages/community';
import WorkDetailPage from './pages/community/work';
import CompetitionPage from './pages/competition';
import CreatePage from './pages/create';
import IDEPage from './pages/ide';
import PythonEditorPage from './pages/python-editor';
import CppEditorPage from './pages/cpp-editor';
import MyWorksPage from './pages/myworks';
import FavoritesPage from './pages/favorites';
import SettingsPage from './pages/settings';
import NotificationsPage from './pages/notifications';
import ProgressPage from './pages/progress';
import LearningReportPage from './pages/learning-report';
import ClassPage from './pages/class';
import ClassJoinPage from './pages/class/join';
import SearchPage from './pages/search';
import UsersPage from './pages/users';
import ActivityPage from './pages/activity';
import MessagesPage from './pages/messages';
import AchievementsPage from './pages/achievements';
import LeaderboardPage from './pages/leaderboard';
import ClassLeaderboardPage from './pages/class-leaderboard';
import ExplorePage from './pages/explore';
import AdminPage from './pages/admin';
import UserManage from './pages/admin/UserManage';
import CourseManage from './pages/admin/CourseManage';
import NoticeManage from './pages/admin/NoticeManage';
import HomeworkPage from './pages/homework';
import HomeworkDetailPage from './pages/homework/detail';
import CreateHomeworkPage from './pages/homework/create';
import HomeworkSubmissionsPage from './pages/homework/submissions';
import NotesPage from './pages/notes';
import MaterialsPage from './pages/materials';
import ParentalReportPage from './pages/parental-report';

function App() {
  return (
    <Suspense fallback={<LoadingOverlay fullscreen tip="页面加载中..." />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="course" element={<CoursesPage />} />
          <Route path="course/:type" element={<CoursesPage />} />
          <Route path="course-detail/:id" element={<CourseDetailPage />} />
          <Route path="courses/:id/lessons/:lessonId" element={<LessonPage />} />
          <Route path="teaching" element={<TeachingPage />} />
          <Route path="community" element={<CommunityPage />} />
          <Route path="community/:tab" element={<CommunityPage />} />
          <Route path="community/work/:id" element={<WorkDetailPage />} />
          <Route path="competition" element={<CompetitionPage />} />
          <Route path="competition/:tab" element={<CompetitionPage />} />
          <Route path="create" element={<CreatePage />} />
          <Route path="create/scratch" element={<IDEPage />} />
          <Route path="create/python" element={<PythonEditorPage />} />
          <Route path="create/cpp" element={<CppEditorPage />} />
          <Route path="create/:type" element={<CreatePage />} />
          <Route path="projects/my" element={<MyWorksPage />} />
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="progress" element={<ProgressPage />} />
          <Route path="learning-report" element={<LearningReportPage />} />
          <Route path="class" element={<ClassPage />} />
          <Route path="class/join" element={<ClassJoinPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="users/:username" element={<UsersPage />} />
          <Route path="activity" element={<ActivityPage />} />
          <Route path="achievements" element={<AchievementsPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="class-leaderboard" element={<ClassLeaderboardPage />} />
          <Route path="materials" element={<MaterialsPage />} />
          <Route path="parental-report" element={<ParentalReportPage />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="homework" element={<HomeworkPage />} />
          <Route path="homework/create" element={<CreateHomeworkPage />} />
          <Route path="homework/:id" element={<HomeworkDetailPage />} />
          <Route path="homework/:id/submissions" element={<HomeworkSubmissionsPage />} />
        </Route>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/users" element={<UserManage />} />
        <Route path="/admin/courses" element={<CourseManage />} />
        <Route path="/admin/notices" element={<NoticeManage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;