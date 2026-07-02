# File Inventory - project01

## 1. Frontend Pages

### frontend/ (UmiJS)
```
frontend/src/layouts/index.less
frontend/src/layouts/index.tsx
frontend/src/pages/admin/index.less
frontend/src/pages/admin/index.tsx
frontend/src/pages/class/index.less
frontend/src/pages/class/index.tsx
frontend/src/pages/course-detail/index.less
frontend/src/pages/course-detail/index.tsx
frontend/src/pages/courses/index.less
frontend/src/pages/courses/index.tsx
frontend/src/pages/home/index.less
frontend/src/pages/home/index.tsx
frontend/src/pages/ide/index.less
frontend/src/pages/ide/index.tsx
frontend/src/pages/login/index.less
frontend/src/pages/login/index.tsx
frontend/src/services/api.ts
frontend/src/services/types.ts
```

### frontend-vite/ (Vite + React)
```
frontend-vite/src/App.jsx
frontend-vite/src/components/Header.jsx
frontend-vite/src/components/Layout.jsx
frontend-vite/src/components/LoadingOverlay.jsx
frontend-vite/src/components/PageTransition.jsx
frontend-vite/src/components/PptViewer.jsx
frontend-vite/src/components/PptViewer.less
frontend-vite/src/components/blockly/blocks.js
frontend-vite/src/components/blockly/generators.js
frontend-vite/src/index.css
frontend-vite/src/main.jsx
frontend-vite/src/pages/achievements/index.jsx
frontend-vite/src/pages/activity/index.jsx
frontend-vite/src/pages/admin/CourseManage.jsx
frontend-vite/src/pages/admin/NoticeManage.jsx
frontend-vite/src/pages/admin/UserManage.jsx
frontend-vite/src/pages/admin/index.jsx
frontend-vite/src/pages/class-leaderboard/index.jsx
frontend-vite/src/pages/class/index.jsx
frontend-vite/src/pages/class/join/index.jsx
frontend-vite/src/pages/community/index.jsx
frontend-vite/src/pages/community/work/index.jsx
frontend-vite/src/pages/competition/index.jsx
frontend-vite/src/pages/course-detail/index.jsx
frontend-vite/src/pages/course-detail/index.less
frontend-vite/src/pages/courses/courses.css
frontend-vite/src/pages/courses/index.jsx
frontend-vite/src/pages/cpp-editor/cppFixed.jsx
frontend-vite/src/pages/cpp-editor/cppTemplates.js
frontend-vite/src/pages/cpp-editor/errorDisplay.jsx
frontend-vite/src/pages/cpp-editor/index.jsx
frontend-vite/src/pages/create/index.jsx
frontend-vite/src/pages/debuggerFeatures.jsx
frontend-vite/src/pages/explore/index.jsx
frontend-vite/src/pages/favorites/index.jsx
frontend-vite/src/pages/home/home.css
frontend-vite/src/pages/home/homeEnhanced/homeEnhanced.css
frontend-vite/src/pages/home/homeEnhanced/index.jsx
frontend-vite/src/pages/home/index.jsx
frontend-vite/src/pages/homework/create.jsx
frontend-vite/src/pages/homework/detail.jsx
frontend-vite/src/pages/homework/index.jsx
frontend-vite/src/pages/homework/submissions.jsx
frontend-vite/src/pages/ide/index.jsx
frontend-vite/src/pages/ide/soundBlocks.js
frontend-vite/src/pages/ide/style.css
frontend-vite/src/pages/ideEnhanced/index.jsx
frontend-vite/src/pages/ideEnhanced/style.css
frontend-vite/src/pages/leaderboard/index.jsx
frontend-vite/src/pages/learning-report/index.jsx
frontend-vite/src/pages/lesson/index.jsx
frontend-vite/src/pages/lesson/index.less
frontend-vite/src/pages/login/index.jsx
frontend-vite/src/pages/materials/index.jsx
frontend-vite/src/pages/messages/index.jsx
frontend-vite/src/pages/myworks/index.jsx
frontend-vite/src/pages/notes/index.jsx
frontend-vite/src/pages/notifications/index.jsx
frontend-vite/src/pages/parental-report/index.jsx
frontend-vite/src/pages/progress/index.jsx
frontend-vite/src/pages/python-editor/index.jsx
frontend-vite/src/pages/python-editor/pythonFixed
frontend-vite/src/pages/search/index.jsx
frontend-vite/src/pages/settings/index.jsx
frontend-vite/src/pages/teaching/index.jsx
frontend-vite/src/pages/users/index.jsx
frontend-vite/src/services/api.js
frontend-vite/src/styles/design-tokens.css
```

---

## 2. Backend Modules (NestJS)

### Core
```
backend/src/main.ts
backend/src/app.module.ts
backend/src/data-source.ts
backend/src/seedData.ts
```

### Entities
```
backend/src/entities/achievement.entity.ts
backend/src/entities/activity.entity.ts
backend/src/entities/class-leaderboard.entity.ts
backend/src/entities/class.entity.ts
backend/src/entities/code-execution.entity.ts
backend/src/entities/comment.entity.ts
backend/src/entities/competition-evaluation.entity.ts
backend/src/entities/course-favorite.entity.ts
backend/src/entities/course-review.entity.ts
backend/src/entities/course.entity.ts
backend/src/entities/favorite.entity.ts
backend/src/entities/featured.entity.ts
backend/src/entities/homework.entity.ts
backend/src/entities/institution.entity.ts
backend/src/entities/leaderboard.entity.ts
backend/src/entities/learning-report.entity.ts
backend/src/entities/like.entity.ts
backend/src/entities/material.entity.ts
backend/src/entities/message.entity.ts
backend/src/entities/organization-class.entity.ts
backend/src/entities/organization.entity.ts
backend/src/entities/parental-report.entity.ts
backend/src/entities/post.entity.ts
backend/src/entities/problem.entity.ts
backend/src/entities/project.entity.ts
backend/src/entities/student.entity.ts
backend/src/entities/study-note.entity.ts
backend/src/entities/user-class.entity.ts
backend/src/entities/user-course.entity.ts
backend/src/entities/user-follow.entity.ts
backend/src/entities/user-lesson-progress.entity.ts
backend/src/entities/user.entity.ts
backend/src/entities/video-progress.entity.ts
```

### Modules & Controllers & Services
```
backend/src/achievements/achievements.controller.ts
backend/src/achievements/achievements.module.ts
backend/src/achievements/achievements.service.ts
backend/src/activity/activity.controller.ts
backend/src/activity/activity.module.ts
backend/src/activity/activity.service.ts
backend/src/auth/auth.controller.ts
backend/src/auth/auth.module.ts
backend/src/auth/auth.service.ts
backend/src/auth/dto/login.dto.ts
backend/src/auth/dto/passwordReset.dto.ts
backend/src/auth/dto/register.dto.ts
backend/src/auth/jwt.strategy.ts
backend/src/auth/passwordReset.controller.ts
backend/src/auth/passwordReset.service.ts
backend/src/auth/role.enum.ts
backend/src/auth/roles.decorator.ts
backend/src/auth/roles.guard.ts
backend/src/classes/class-leaderboard.controller.ts
backend/src/classes/class-leaderboard.service.ts
backend/src/classes/classes.controller.ts
backend/src/classes/classes.module.ts
backend/src/classes/classes.service.ts
backend/src/code-execution/code-execution.controller.ts
backend/src/code-execution/code-execution.module.ts
backend/src/code-execution/code-execution.service.ts
backend/src/community/community.controller.ts
backend/src/community/community.module.ts
backend/src/community/community.service.ts
backend/src/competition-evaluation/competition-evaluation.controller.ts
backend/src/competition-evaluation/competition-evaluation.module.ts
backend/src/competition-evaluation/competition-evaluation.service.ts
backend/src/competition-evaluation/seed-problems.ts
backend/src/course-reviews/course-reviews.controller.ts
backend/src/course-reviews/course-reviews.module.ts
backend/src/course-reviews/course-reviews.service.ts
backend/src/courses/courses.controller.ts
backend/src/courses/courses.module.ts
backend/src/courses/courses.service.ts
backend/src/favorites/favorites.controller.ts
backend/src/favorites/favorites.module.ts
backend/src/favorites/favorites.service.ts
backend/src/featured/featured.controller.ts
backend/src/featured/featured.module.ts
backend/src/featured/featured.service.ts
backend/src/follows/follows.controller.ts
backend/src/follows/follows.module.ts
backend/src/follows/follows.service.ts
backend/src/homework/homework.controller.ts
backend/src/homework/homework.module.ts
backend/src/homework/homework.service.ts
backend/src/leaderboard/leaderboard.controller.ts
backend/src/leaderboard/leaderboard.module.ts
backend/src/leaderboard/leaderboard.service.ts
backend/src/learning-report/learning-report.controller.ts
backend/src/learning-report/learning-report.module.ts
backend/src/learning-report/learning-report.service.ts
backend/src/lessons/lessons.controller.ts
backend/src/lessons/lessons.module.ts
backend/src/lessons/lessons.service.ts
backend/src/materials/materials.controller.ts
backend/src/materials/materials.module.ts
backend/src/materials/materials.service.ts
backend/src/messages/messages.controller.ts
backend/src/messages/messages.module.ts
backend/src/messages/messages.service.ts
backend/src/notices/notices.controller.ts
backend/src/notices/notices.module.ts
backend/src/notices/notices.service.ts
backend/src/organizations/organizations.controller.ts
backend/src/organizations/organizations.module.ts
backend/src/organizations/organizations.service.ts
backend/src/parental-report/parental-report.controller.ts
backend/src/parental-report/parental-report.module.ts
backend/src/parental-report/parental-report.service.ts
backend/src/progress/progress.controller.ts
backend/src/progress/progress.module.ts
backend/src/progress/progress.service.ts
backend/src/projects/projects.controller.ts
backend/src/projects/projects.module.ts
backend/src/projects/projects.service.ts
backend/src/search/search.controller.ts
backend/src/search/search.entity.ts
backend/src/search/search.module.ts
backend/src/search/search.service.ts
backend/src/security/security.module.ts
backend/src/study-notes/study-notes.controller.ts
backend/src/study-notes/study-notes.module.ts
backend/src/study-notes/study-notes.service.ts
backend/src/user-courses/user-courses.controller.ts
backend/src/user-courses/user-courses.module.ts
backend/src/user-courses/user-courses.service.ts
backend/src/users/dto/batch-account.dto.ts
backend/src/users/dto/update-profile.dto.ts
backend/src/users/dto/update-user.dto.ts
backend/src/users/users.controller.ts
backend/src/users/users.module.ts
backend/src/users/users.service.ts
backend/src/video-progress/video-progress.controller.ts
backend/src/video-progress/video-progress.module.ts
backend/src/video-progress/video-progress.service.ts
```

### Common (Middleware, Guards, Filters, etc.)
```
backend/src/common/decorators/roles.decorator.ts
backend/src/common/filters/global-exception.filter.ts
backend/src/common/filters/sensitive-data.filter.ts
backend/src/common/guards/roles.guard.ts
backend/src/common/guards/throttle.guard.ts
backend/src/common/middleware/security-headers.middleware.ts
backend/src/common/pipes/validation.pipe.ts
backend/src/common/utils/file-parser.util.ts
backend/src/migrations/1782452908721-InitialSchema.ts
```

---

## 3. Electron Files

### Main Process
```
electron/main.js
electron/preload.js
electron/cacheStrategy.js
electron/offlineSupport.js
electron/update.js
electron/run-electron.js
```

### Package Management
```
electron/package/cli.js
electron/package/electron.d.ts
electron/package/index.js
electron/package/install.js
electron/package/trayMenu.js
electron/package/windowManagement.js
```

### Electron Backend (embedded NestJS)
```
electron/backend/src/app.module.ts
electron/backend/src/main.ts
electron/backend/scripts/seed.ts
```

### Scripts & Utilities
```
electron/scripts/generate-icon.js
electron/scripts/generate-icons.js
electron/test-app.js
electron/test-builtin.js
electron/test-main.js
electron/test-version.js
```

### Config Files
```
electron/electron-builder.json
electron/builder-debug.yml
```

---

## Summary

| Category | Count |
|----------|-------|
| Frontend Pages (frontend/) | 18 |
| Frontend Pages (frontend-vite/) | 65 |
| Backend Modules | ~100 |
| Electron Files | 18 |
| **Total** | ~201 |
