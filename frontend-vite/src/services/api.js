import axios from 'axios';

// 检测是否在 Electron 环境中
const isElectron = typeof window !== 'undefined' && window.location.protocol === 'file:';
// Electron 或生产模式下使用完整 URL
const API_BASE_URL = (isElectron || import.meta.env.PROD)
  ? 'http://localhost:3000/api'  // Electron 或生产模式
  : '/api';  // 开发模式

export const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// 认证
export const login = (account, password) => request.post('/account/login', { account, password });
export const getUserDetail = () => request.get('/user/detail');

// 课程相关
export const getHierarchy = () => request.get('/dict/hierarchy');
export const getCourses = (hierarchyId, filters) => request.get('/courses', { params: { hierarchyId, ...filters } });
export const getCourse = (id) => request.get(`/courses/${id}`);
export const getLessons = (courseId) => request.get(`/courses/${courseId}/lessons`);
export const getCourseDetail = (id) => request.get(`/courses/${id}`);
export const enrollCourse = (courseId) => request.post(`/user/course/enroll/${courseId}`);
export const isEnrolled = (courseId) => request.get(`/user/course/enrolled/${courseId}`);
export const getMyCourses = () => request.get('/user/course/my');

// 班级
export const getClasses = () => request.get('/teacher/class');
export const createClass = (data) => request.post('/teacher/class', data);
export const updateClass = (id, data) => request.put(`/teacher/class/${id}`, data);
export const deleteClass = (id) => request.delete(`/teacher/class/${id}`);
export const searchClassByCode = (code) => request.get('/student/class/search', { params: { code } });
export const applyToJoinClass = (classId) => request.post(`/student/class/apply/${classId}`);
export const getMyClasses = () => request.get('/student/class/my');
export const checkClassMembership = (classId) => request.get(`/student/class/check/${classId}`);

// 通知
export const getNotices = (userId) => request.get('/notice', { params: { userId } });
export const getNoticePopup = (userId) => request.get('/notice/popup', { params: { userId } });
export const markNoticeAsRead = (id) => request.put(`/notice/${id}/read`);
export const markAllNoticesAsRead = (userId) => request.put('/notice/read-all', { userId });
export const deleteNotice = (id) => request.delete(`/notice/${id}`);
export const getUnreadNoticeCount = (userId) => request.get('/notice/unread-count', { params: { userId } });

// 课时相关
export const getLessonDetail = (lessonId) => request.get(`/lessons/${lessonId}`);
export const markLessonCompleted = (lessonId) => request.post(`/lessons/${lessonId}/complete`);
export const markLessonIncomplete = (lessonId) => request.post(`/lessons/${lessonId}/incomplete`);
export const getLessonProgress = (lessonId) => request.get(`/lessons/${lessonId}/progress`);
export const getCourseLessonProgress = (courseId) => request.get(`/lessons/course/${courseId}/progress`);

// 视频进度相关
export const getVideoProgress = (lessonId) => request.get('/video-progress', { params: { lessonId } });
export const saveVideoProgress = (lessonId, currentTime, duration) =>
  request.post('/video-progress', { lessonId, currentTime, duration });
export const markVideoCompleted = (lessonId) => request.post('/video-progress/complete', { lessonId });

// 学习进度相关
export const getLearningStats = () => request.get('/progress/stats');
export const getCourseProgress = () => request.get('/progress/courses');
export const getLearningHistory = (limit) => request.get('/progress/history', { params: { limit } });
export const recordLearningTime = (lessonId, minutes) => request.post('/progress/record-time', { lessonId, minutes });
export const exportProgress = () => request.get('/progress/export');

// 项目相关
export const createProject = (data) => request.post('/projects', data);
export const getProjects = (userId) => request.get('/projects', { params: { userId } });
export const getProject = (id) => request.get(`/projects/${id}`);
export const updateProject = (id, data) => request.put(`/projects/${id}`, data);
export const deleteProject = (id) => request.delete(`/projects/${id}`);
export const updateProjectData = (id, projectData) => request.put(`/projects/${id}`, { projectData });
export const remixProject = (id, userId, newName) => request.post(`/projects/${id}/remix`, { userId, newName });

// 云变量相关
export const getCloudVariables = (projectId) => request.get(`/projects/${projectId}/cloud-variables`);
export const updateCloudVariables = (projectId, cloudVariables) => request.put(`/projects/${projectId}/cloud-variables`, cloudVariables);

// 社区相关
export const getCommunityPosts = (scope) => request.get('/community/posts', { params: { scope } });
export const getCommunityPost = (id) => request.get(`/community/posts/${id}`);
export const createCommunityPost = (data) => request.post('/community/posts', data);
export const updateCommunityPost = (id, data) => request.put(`/community/posts/${id}`, data);
export const deleteCommunityPost = (id) => request.delete(`/community/posts/${id}`);
export const getPostComments = (postId) => request.get(`/community/comments/post/${postId}`);
export const createComment = (data) => request.post('/community/comments', data);
export const deleteComment = (id) => request.delete(`/community/comments/${id}`);
export const toggleLike = (postId, userId) => request.post('/community/likes', { postId, userId });
export const getUserLikedPosts = (userId) => request.get(`/community/likes/user/${userId}`);
export const checkUserLiked = (postId, userId) => request.get('/community/likes/check', { params: { postId, userId } });

// 社区相关 - 带筛选
export const getCommunityPostsFiltered = (scope, filters) => request.get('/community/posts', { params: { scope, ...filters } });

// 全局搜索
export const globalSearch = (keyword, userId) => request.get('/search', { params: { keyword, userId } });
export const saveSearchHistory = (userId, keyword) => request.post('/search/history', { userId, keyword });
export const getSearchHistory = (userId, limit) => request.get('/search/history', { params: { userId, limit } });
export const clearSearchHistory = (userId) => request.delete('/search/history', { params: { userId } });

// 收藏相关
export const getFavorites = () => request.get('/favorites');
export const addFavorite = (projectId) => request.post('/favorites', { projectId });
export const removeFavorite = (projectId) => request.delete(`/favorites/${projectId}`);
export const checkFavorite = (projectId) => request.get('/favorites/check', { params: { projectId } });

// 关注相关
export const followUser = (userId) => request.post(`/follows/${userId}`);
export const unfollowUser = (userId) => request.delete(`/follows/${userId}`);
export const getFollowers = (userId) => request.get(`/follows/${userId}/followers`);
export const getFollowing = (userId) => request.get(`/follows/${userId}/following`);
export const getFollowStats = (userId) => request.get(`/follows/${userId}/stats`);
export const checkFollow = (userId) => request.get('/follows/check', { params: { targetId: userId } });
export const checkFollowBatch = (userIds) => request.post('/follows/check-batch', { targetIds: userIds });

// 动态/活动相关
export const getFollowingActivities = (page = 1, limit = 20) => request.get('/activity/following', { params: { page, limit } });
export const getGlobalActivities = (page = 1, limit = 20) => request.get('/activity/global', { params: { page, limit } });
export const getUserActivities = (userId, page = 1, limit = 20) => request.get(`/activity/user/${userId}`, { params: { page, limit } });

// 私信相关
export const sendMessage = (receiverId, content) => request.post('/messages', { receiverId, content });
export const getConversationsList = () => request.get('/messages/conversations');
export const getConversation = (partnerId, page = 1, limit = 50) => request.get(`/messages/conversation/${partnerId}`, { params: { page, limit } });
export const getUnreadMessageCount = () => request.get('/messages/unread-count');
export const markConversationAsRead = (partnerId) => request.post(`/messages/conversation/${partnerId}/read`);

// 管理后台 - 用户管理
export const getAdminUsers = (page = 1, pageSize = 10, keyword = '') => request.get('/users', { params: { page, pageSize, keyword } });
export const createUser = (data) => request.post('/users', data);
export const deleteUser = (id) => request.delete(`/users/${id}`);
export const updateUserStatus = (id, status) => request.put(`/users/${id}/status`, { status });
export const updateUserRole = (id, role) => request.put(`/users/${id}/role`, { role });

// 管理后台 - 课程管理
export const getAdminCourses = (hierarchyId, filters) => request.get('/courses', { params: { hierarchyId, ...filters } });
export const createCourse = (data) => request.post('/courses', data);
export const updateCourse = (id, data) => request.put(`/courses/${id}`, data);
export const updateCourseStatus = (id, status) => request.put(`/courses/${id}/status`, { status });
export const deleteCourse = (id) => request.delete(`/courses/${id}`);

// 管理后台 - 通知管理
export const createNotice = (data) => request.post('/notice', data);
export const updateNotice = (id, data) => request.put(`/notice/${id}`, data);

// 精选/发现相关
export const getFeaturedContents = (category) => request.get('/featured', { params: { category } });
export const getFeaturedCategories = () => request.get('/featured/categories');
export const getCoursesByCategory = (category) => request.get(`/featured/category/${category}`);
export const getFeaturedCourses = () => request.get('/featured/courses');

// 课程评价相关
export const getCourseReviews = (courseId, page = 1, pageSize = 10) =>
  request.get(`/course-reviews/course/${courseId}`, { params: { page, pageSize } });
export const createCourseReview = (data) => request.post('/course-reviews', data);
export const updateCourseReview = (id, data) => request.put(`/course-reviews/${id}`, data);
export const deleteCourseReview = (id) => request.delete(`/course-reviews/${id}`);
export const checkUserReviewed = (courseId, userId) =>
  request.get('/course-reviews/check', { params: { courseId, userId } });
export const getCourseReviewStats = (courseId) => request.get(`/course-reviews/stats/${courseId}`);

// 学习报告/技能图谱
export const getSkillCategories = () => request.get('/learning-report/skills/categories');
export const getSkillAtlas = () => request.get('/learning-report/skills/atlas');
export const updateSkillProgress = (skillName, masteryLevel) =>
  request.put('/learning-report/skills/progress', { skillName, masteryLevel });
export const calculateSkillFromProgress = (courseId) =>
  request.post(`/learning-report/skills/calculate/${courseId}`);
export const getCourseSkills = (courseId) => request.get(`/learning-report/course-skills/${courseId}`);
export const getLearningReport = (type) => request.get('/learning-report/report', { params: { type } });
export const getLearningReports = (limit) => request.get('/learning-report/reports', { params: { limit } });
export const getReportDetail = (id) => request.get(`/learning-report/report/${id}`);

// 成就徽章相关
export const initializeAchievements = () => request.post('/achievements/initialize');
export const getAchievements = () => request.get('/achievements');
export const getAchievementStats = () => request.get('/achievements/stats');
export const getUnlockedAchievements = () => request.get('/achievements/unlocked');
export const getUserAchievementsById = (userId) => request.get(`/achievements/${userId}`);
export const updateAchievementProgress = (type, increment) => request.post('/achievements/progress', { type, increment });
export const unlockAchievement = (type) => request.post('/achievements/unlock', { type });

// 排行榜相关
export const getLeaderboard = (type, limit) => request.get('/leaderboard', { params: { type, limit } });
export const getUserRank = (type) => request.get('/leaderboard/rank', { params: { type } });
export const getUserLeaderboard = (userId, type) => request.get(`/leaderboard/user/${userId}`, { params: { type } });
export const updateLeaderboardScore = (type, increment) => request.post('/leaderboard/score', { type, increment });
export const setLeaderboardScore = (type, score) => request.post('/leaderboard/set-score', { type, score });

// 班级排行榜相关
export const getClassLeaderboard = (type, limit) => request.get('/class-leaderboard', { params: { type, limit } });
export const getClassRank = (classId, type) => request.get(`/class-leaderboard/rank/${classId}`, { params: { type } });
export const calculateClassLeaderboard = (type) => request.post('/class-leaderboard/calculate', { type });

// 作业相关
export const getHomeworks = (filters) => request.get('/homework', { params: filters });
export const getHomework = (id) => request.get(`/homework/${id}`);
export const createHomework = (data) => request.post('/homework', data);
export const updateHomework = (id, data) => request.put(`/homework/${id}`, data);
export const deleteHomework = (id) => request.delete(`/homework/${id}`);
export const getHomeworkStats = (id) => request.get(`/homework/${id}/stats`);
export const getHomeworkSubmissions = (id) => request.get(`/homework/${id}/submissions`);
export const getMySubmissions = (filters) => request.get('/submissions', { params: filters });
export const getSubmission = (id) => request.get(`/submission/${id}`);
export const submitHomework = (id, data) => request.post(`/homework/${id}/submit`, data);
export const gradeSubmission = (id, data) => request.put(`/submission/${id}/grade`, data);
export const deleteSubmission = (id) => request.delete(`/submission/${id}`);

// 学习笔记相关
export const createStudyNote = (data) => request.post('/study-notes', data);
export const getStudyNotes = (filters) => request.get('/study-notes', { params: filters });
export const getStudyNote = (id) => request.get(`/study-notes/${id}`);
export const updateStudyNote = (id, data) => request.put(`/study-notes/${id}`, data);
export const deleteStudyNote = (id) => request.delete(`/study-notes/${id}`);
export const getStudyNotesByCourse = (courseId) => request.get(`/study-notes/course/${courseId}`);
export const getStudyNotesByLesson = (lessonId) => request.get(`/study-notes/lesson/${lessonId}`);
export const getStudyNotesCount = () => request.get('/study-notes/count');

// 素材中心相关
export const getMaterials = (filters) => request.get('/materials', { params: filters });
export const getPublicMaterials = (filters) => request.get('/materials/public', { params: filters });
export const searchMaterials = (keyword, filters) => request.get('/materials/search', { params: { keyword, ...filters } });
export const getMaterialStats = () => request.get('/materials/stats');
export const getMaterial = (id) => request.get(`/materials/${id}`);
export const createMaterial = (data) => request.post('/materials', data);
export const updateMaterial = (id, data) => request.put(`/materials/${id}`, data);
export const deleteMaterial = (id) => request.delete(`/materials/${id}`);
export const recordDownload = (id) => request.post(`/materials/${id}/download`);

// 竞赛评测相关
export const getCompetitionEvaluations = (filters) => request.get('/competition-evaluation', { params: filters });
export const getCompetitionEvaluation = (id) => request.get(`/competition-evaluation/${id}`);
export const createCompetitionEvaluation = (data) => request.post('/competition-evaluation', data);
export const updateCompetitionEvaluation = (id, data) => request.put(`/competition-evaluation/${id}`, data);
export const deleteCompetitionEvaluation = (id) => request.delete(`/competition-evaluation/${id}`);
export const getCompetitionEvaluationStats = (id, problemId) => request.get(`/competition-evaluation/${id}/stats`, { params: { problemId } });

export const getCompetitionSubmissions = (filters) => request.get('/competition-submissions', { params: filters });
export const getCompetitionSubmission = (id) => request.get(`/competition-submission/${id}`);
export const submitCompetitionCode = (data) => request.post('/competition-submit', data);
export const evaluateCompetitionSubmission = (id, data) => request.put(`/competition-submission/${id}/evaluate`, data);
export const deleteCompetitionSubmission = (id) => request.delete(`/competition-submission/${id}`);
export const getUserCompetitionSubmission = (competitionId, userId, problemId) =>
  request.get(`/competition-submission/user/${competitionId}/${userId}`, { params: { problemId } });
export const getCompetitionStats = (competitionId) => request.get(`/competition-stats/${competitionId}`);

// 竞赛题目相关
export const getProblems = (filters) => request.get('/problems', { params: filters });
export const getProblem = (id) => request.get(`/problems/${id}`);
export const createProblem = (data) => request.post('/problems', data);
export const updateProblem = (id, data) => request.put(`/problems/${id}`, data);
export const deleteProblem = (id) => request.delete(`/problems/${id}`);

// 家长监管报告相关
export const getParentalReports = (limit) => request.get('/parental-report/my', { params: { limit } });
export const generateParentalReport = (studentId, reportType) =>
  request.post('/parental-report/generate', { studentId, reportType });
export const getLinkedStudents = () => request.get('/parental-report/linked-students');
export const getParentalReportById = (id) => request.get(`/parental-report/${id}`);
export const approveParentalReport = (id, comment) =>
  request.put(`/parental-report/${id}/approve`, { comment });
export const rejectParentalReport = (id, comment) =>
  request.put(`/parental-report/${id}/reject`, { comment });
export const deleteParentalReport = (id) => request.delete(`/parental-report/${id}`);
export const getStudentReports = (studentId, limit) =>
  request.get(`/parental-report/student/${studentId}`, { params: { limit } });

// 代码执行相关
export const createCodeExecution = (data) => request.post('/code-execution', data);
export const getCodeExecutions = (filters) => request.get('/code-execution', { params: filters });
export const getCodeExecution = (id) => request.get(`/code-execution/${id}`);
export const executeCode = (id) => request.post(`/code-execution/${id}/execute`);
export const updateCodeExecution = (id, data) => request.put(`/code-execution/${id}`, data);
export const deleteCodeExecution = (id) => request.delete(`/code-execution/${id}`);
export const getCodeExecutionStats = (userId) => request.get('/code-execution/stats', { params: { userId } });
