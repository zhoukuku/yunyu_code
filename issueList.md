# 云屿学习平台 - 问题记录

## 待修复问题 (Pending Issues)

*暂无待修复问题*

---

## 本次修复 (2026-07-01 Scan & Fix #19) -- 全部已修复

本次扫描发现 **2 处问题**（electron/backend NoticesController 架构不一致 + 路由顺序），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend), 32/32 运算符测试, 15/15 画笔测试, Vite build 通过.

### 修复列表:
- #180 electron/backend NoticesController 缺少 POST/PUT 端点（createNotice/updateNotice 在 CoursesController 中）-> 将 createNotice/updateNotice 方法添加到 NoticesService，将 @Post()/@Put(':id') 端点添加到 NoticesController（含 RolesGuard admin 认证），从 CoursesController 移除重复的 POST/PUT notice 路由，从 CoursesService 移除 createNotice/updateNotice/deleteNotice 方法，从 CoursesModule 移除 Notice 实体注册
- #181 backend + electron/backend NoticesController 路由顺序问题：@Put(':id') 在 @Put('read-all') 和 @Put(':id/read') 之前注册 -> 重新排序：GET unread-count/popup 在 GET 之后，POST 在 PUT 之前，PUT read-all 和 PUT :id/read 在 PUT :id 之前，DELETE :id 在最后

---

## 本次修复 (2026-07-01 Scan & Fix #18) -- 全部已修复

本次扫描发现 **15 处问题**（10 处 parseInt 缺 radix + 2 处 electron/backend 缺 DTO 输入验证 + 其他），全部修复完成。
验证通过: tsc --noEmit 零错误 (electron/backend), 32/32 运算符测试, 15/15 画笔测试, Vite build 通过.

### 修复列表:
- #177 backend + electron/backend 10处 parseInt() 缺 radix 参数（可能导致八进制解析歧义）-> 改为 parseInt(x, 10): leaderboard.service.ts, class-leaderboard.service.ts, learning-report.controller.ts, progress.controller.ts (backend each x1); messages.controller.ts x2, progress.controller.ts, learning-report.controller.ts (electron/backend)
- #178 electron/backend LoginDto 缺 MinLength 和 Transform trim 验证（main backend 有，electron 版缺失）-> 添加 MinLength(8) + Transform trim + 错误消息
- #179 electron/backend register 端点使用 @Body() data: any 无类型 -> 创建 RegisterDto (含 MinLength/MaxLength/Matches 密码复杂度校验)；更新 auth.controller.ts 和 auth.service.ts 使用 RegisterDto 类型

---

## 本次修复 (2026-07-01 Scan & Fix #17) -- 全部已修复

本次扫描发现 **12 处问题**（main backend progress.service.ts 的 `||` vs `??` 不一致 + parental-report `|| null` 边缘情况），全部修复完成。
验证通过: tsc --noEmit 零错误 (electron/backend), 32/32 运算符测试, 15/15 画笔测试, Vite build 通过.

### 修复列表:
- #175 backend progress.service.ts 9处 `||` vs `??` 不一致（electron/backend 已修复但 main backend 遗漏）-> 改为 `??` 操作符：vp.currentTime、3处 Map.get()、lastLessonName、lastCompletedAt、lessonName、courseId、courseName；移除未使用的 Between import
- #176 backend + electron/backend parental-report.service.ts approveReport/rejectReport `comment || null` 空字符串被错误转为 null -> 改为 `?? null`

---

## 本次修复 (2026-07-01 Scan & Fix #16) -- 全部已修复

本次扫描发现 **12 个问题**（electron/backend 缺失验证/功能不均 + main backend 缺 AuthGuard），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend), 32/32 运算符测试, 15/15 画笔测试, Vite build 通过.

### 修复列表:
- #164 electron/backend leaderboard.controller.ts 缺失 isValidLeaderboardType 验证（main backend 有，electron 版缺失）-> 添加验证方法，所有 type 入参端点加入校验，getUserLeaderboard 添加 isNaN(userId) 检查
- #165 electron/backend achievements.controller.ts 缺失 isValidAchievementType 验证（main backend 有，electron 版缺失）-> 添加验证方法，updateProgress/unlockAchievement 加入校验，getUserAchievementsById 添加 isNaN(userId) 检查
- #166 electron/backend community.service.ts createComment 缺 post 存在性验证 -> 添加 post 查询及 NotFoundException
- #167 electron/backend community.service.ts toggleLike 缺 post 存在性验证 + 查询效率低（调用 findPostById 加载全部关联）-> 添加 post 存在性检查，改为 select: ['likesCount'] 仅查询计数字段
- #168 electron/backend community.service.ts findAllPosts scope/category 冲突 Bug -> 改为 effectiveScope = filters?.category || scope 统一处理，避免 where + andWhere 双重条件冲突
- #169 electron/backend course-reviews.service.ts createReview 缺评分验证（1-5 范围 + 整数）和 userId 校验 -> 添加 BadRequestException 防御检查
- #170 electron/backend course-reviews.service.ts getReviewsByUser 缺分页（find 无限制）-> 改为 findAndCount + page/pageSize 参数，同步更新 controller
- #171 electron/backend course-reviews.service.ts updateReview 静默失败（返回 null）-> 改为 NotFoundException/ForbiddenException，添加评分验证
- #172 electron/backend course-reviews.service.ts deleteReview 静默失败（返回 { success: false }）-> 改为 NotFoundException/ForbiddenException
- #173 electron/backend course-reviews.service.ts getCourseReviewStats averageRating 使用 toFixed(1) 返回字符串 -> 改为 Math.round(avg * 10) / 10 返回数字类型
- #174 backend course-reviews.controller.ts getReviewsByUser 缺 AuthGuard -> 添加 @UseGuards(AuthGuard('jwt'))

---

## 本次修复 (2026-07-01 Scan & Fix #15) -- 全部已修复

本次扫描发现 **4 个问题**（backend tsc 编译错误 + frontend-vite 构建错误），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend), 32/32 运算符测试, 15/15 画笔测试, Vite build 通过.

### 修复列表:
- #160 backend/src/app.module.ts CloudVariablesModule 类型错误（unknown 类型无法赋值给 imports 数组）-> 改为 any 类型
- #161 backend/src/common/guards/throttle.guard.ts StrictThrottlerGuard 私有字段类型转换错误（as { limit; ttl } 无法转换私有字段）-> 改为 (this as any).limit/ttl
- #162 backend/src/favorites/favorites.service.ts + electron/backend 同文件 Project 类型转换为 Record 不兼容 -> 改为 as unknown as Record<string, unknown> + sanitized as Favorite[]
- #163 frontend-vite/src/pages/python-editor/index.jsx 嵌套模板字符串（new Function 体内的反引号破坏了外层模板字符串，导致 esbuild 解析错误）-> 改为字符串拼接

---

## 本次修复 (2026-07-01 Scan & Fix #14) -- 全部已修复

本次扫描发现 **4 个问题**（electron/backend 代码执行 findAll 缺分页 + courses 路由冲突/缺分页 + users.findAll 无分页 + offlineSupport 空 catch），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend).

### 修复列表:
- #156 electron/backend code-execution.service.ts findAll 缺分页（仅 limit 无 page/pageSize，使用 getMany 而非 getManyAndCount）-> 改为完整分页：page/pageSize + skip/take + getManyAndCount；同步更新 controller 参数从 limit 改为 page/pageSize
- #156b electron/backend code-execution.service.ts getExecutionStats 内存聚合（加载全部记录到内存再 JS filter）-> 改为 SQL COUNT/CASE/AVG 聚合
- #157 electron/backend courses.service.ts getNotices/getNoticePopup 缺分页 + courses.controller.ts 与 NoticesController 路由冲突 -> 移除 course controller 中重复的 GET /notice、GET /notice/popup、DELETE /notice/:id 路由（与 NoticesController 冲突且缺认证/所有权验证），移除 service 中对应的死代码方法
- #158 electron/backend users.service.ts findAll() 无分页（find() 无限制）-> 移除该死代码方法（controller 已使用 findAllWithPagination）
- #159 electron/offlineSupport.js:550 空 catch 块吞没错误（catch (e) { /* skip */ }）-> 改为 console.error 记录错误信息

---

## 本次修复 (2026-07-01 Scan & Fix #13) -- 全部已修复

本次扫描发现 **4 个问题**（electron/backend 硬编码 JWT 密钥 + 私有项目暴露 + 收藏夹缺分页/数据泄露），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend), 15/15 画笔测试.

### 修复列表:
- #152 electron/backend auth.module.ts 硬编码 JWT 密钥 'qima-scratch-secret-key-2024' -> 改为环境变量 JWT_SECRET 模式，非开发环境强制检查，产出 JWT_SECRET/JWT_EXPIRES_IN 提供者
- #153 electron/backend jwt.strategy.ts 硬编码 JWT 密钥 + 缺 token type 验证 -> 改为环境变量模式，添加 payload.type === 'access' 校验
- #154 electron/backend projects.service.ts findAll 缺 isPublic 过滤：无 userId 时未限公开项目 -> 添加 else 子句：query.where('project.isPublic = :isPublic', { isPublic: 1 })
- #155 electron/backend favorites.service.ts findByUser 缺分页 + 无数据脱敏 + addFavorite 缺项目存在验证 -> 添加 page/pageSize 分页参数；非本人收藏项目移除 content/projectData/cloudVariables 字段；addFavorite 添加项目存在性 NotFoundException 检查

---

## 本次修复 (2026-07-01 Scan & Fix #12) -- 全部已修复

本次扫描发现 **8 个问题**（electron/backend 进度服务功能缺失 + N+1查询 + 社区删除评论bug + 认证服务缺防御检查 + || vs ??），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend), 32/32 运算符测试, 15/15 画笔测试.

### 修复列表:
- #144 electron/backend progress.service.ts getCourseProgress N+1 查询：逐个课程 fetch lessons/progress -> 批量预取 allLessons + allCompleted
- #145 electron/backend progress.service.ts getLearningStats 缺失字段：新增 VideoProgress 集成、totalVideoMinutes、averageProgressPercent、weeklyStudyMinutes、monthlyStudyMinutes、studyStreak、longestStreak、calculateStudyStreak 方法
- #146 electron/backend progress.module.ts 缺 VideoProgress 实体注册
- #147 electron/backend community.service.ts deleteComment 静默拒绝无权限删除 + community.controller.ts 忽略返回值始终返回 success -> 改为返回 { success, error } 结果，controller 正确传回客户端
- #148 electron/backend progress.service.ts getCourseProgress 旧版 completedAt || 0 脆弱日期处理 -> 改为预取数据后内存聚合，日期比较使用 ?? null 回退
- #149 backend + electron/backend study-notes.service.ts courseId/lessonId || null 使用 || 代替 ??（ID 为 0 时被 null 覆盖）-> 改为 ?? null
- #150 electron/backend auth.service.ts login 缺防御性空密码/账号检查（#28 修复未移植到 electron/backend）-> 添加 BadRequestException 检查
- #151 electron/backend auth.service.ts register 使用 password || '' 弱回退 -> 添加防御性密码非空检查

---

## 本次修复 (2026-07-01 Scan & Fix #11) -- 全部已修复

本次扫描发现 **16 个问题**（electron/backend 遗漏修复），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend), 32/32 运算符测试, 15/15 画笔测试.

### 修复列表:
- #128 electron/backend community.controller.ts checkUserLiked 缺 AuthGuard + userId 从 Query 获取
- #129 electron/backend course-reviews.controller.ts checkUserReviewed/getReviewsByUser 缺 AuthGuard + userId 从 Query 获取
- #130 backend course-reviews.controller.ts checkUserReviewed 缺 AuthGuard + userId 从 Query 获取
- #131 electron/backend community.service.ts 缺 LIKE 通配符注入防护 + sortBy 白名单 + 分页
- #132 electron/backend projects.service.ts 缺 LIKE 通配符注入防护 + 分页
- #133 electron/backend search.service.ts 缺 LIKE 通配符注入防护
- #134 electron/backend courses.service.ts 缺 LIKE 通配符注入防护 + 分页
- #135 electron/backend materials.service.ts searchMaterials 缺 LIKE 通配符注入防护
- #136 electron/backend users.service.ts search 缺 LIKE 通配符注入防护
- #137 electron/backend study-notes.service.ts 缺 LIKE 通配符注入防护 + 分页 + findByLesson 缺 isPublic 过滤
- #138 electron/backend community.controller.ts findAllPosts 缺 page/pageSize 参数
- #139 electron/backend projects.controller.ts findAll 缺 page/pageSize 参数
- #140 electron/backend courses.controller.ts getCourses 缺 page/pageSize 参数
- #141 electron/backend featured.service.ts getFeaturedContents N+1 查询 + whereInIds/findByIds 废弃 + getAllCoursesGroupedByHierarchy 缺分页
- #142 electron/backend classes.service.ts getStudentClasses whereInIds 废弃
- #143 electron/backend study-notes.controller.ts findAll 缺 page/pageSize 参数

---

## 本次修复 (2026-07-01 Scan & Fix #10) -- 全部已修复

本次扫描发现 8 个问题（2 个 `||` vs `??` 非零默认值 + 5 个 electron/backend 缺失 AuthGuard + 1 个 homework 控制器 studentId 伪造），全部修复完成。
验证通过: tsc --noEmit 零错误 (backend), tsc --noEmit 零错误 (electron/backend), Vite build 通过.

---

## 本次修复 (2026-07-01 Scan & Fix #9) -- 全部已修复

本次扫描发现 17 个问题（7 个空 catch 错误吞噬 + 4 个 `||` vs `??` 非零默认值 + 4 个 canvas 尺寸 NaN 处理 + 1 个 Counter.most_common 默认值 + 1 个 `||` 字符串默认值），全部修复完成。
验证通过: tsc --noEmit 零错误, 32/32 运算符测试, 15/15 画笔测试, 30/30 IPC 测试, Vite build 通过.

---

## 本次修复 (2026-07-01 Scan & Fix #8) -- 全部已修复

本次扫描发现 13 个问题（2 个内存泄漏 + 11 个 `||` vs `??` 空值合并），全部修复完成。
验证通过: tsc --noEmit 零错误, 32/32 运算符测试, 15/15 画笔测试, Vite build 通过.

---

## 本次修复 (2026-07-01 Scan & Fix #7) -- 全部已修复

本次扫描发现 18 个 `||` vs `??` 空值合并问题（数值 0 被 `||` 误判为 falsy 导致默认值覆盖），全部修复完成。
验证通过: tsc --noEmit 零错误, 22/22 运动积木测试, 32/32 运算符测试, 15/15 画笔测试, Vite build 通过.

---

## 本次修复 (2026-07-01 Scan & Fix #6) -- 全部已修复，详见下方已修复列表 #80-#90

本次扫描发现 11 个问题，全部修复完成。验证通过: tsc --noEmit 零错误。

---

## 本次修复 (2026-07-01 Scan & Fix #5) -- 全部已修复，详见下方已修复列表 #72-#79

本次扫描发现 8 个问题，全部修复完成。验证通过: tsc --noEmit 零错误。

---

## 本次修复 (2026-07-01 Scan & Fix #4) -- 全部已修复，详见下方已修复列表 #63-#71

本次扫描发现 9 个问题，全部修复完成。验证通过: tsc --noEmit 零错误。

---

## 本次修复 (2026-07-01 Scan & Fix #3) -- 全部已修复，详见下方已修复列表 #58-#62

本次扫描发现 5 个问题，全部修复完成。验证通过: tsc --noEmit 零错误, 32/32 前测, 15/15 前测, Vite build 通过。

---

## 本次修复 (2026-07-01 Scan & Fix #2) -- 全部已修复，详见下方已修复列表 #45-#57

本次扫描发现 13 个问题，全部修复完成。验证通过: tsc --noEmit 零错误。

---

## 本次修复 (2026-07-01 Scan & Fix) -- 全部已修复，详见下方已修复列表 #37-#44

所有扫描发现的 15 个问题已归并为 8 项修复并全部完成。验证通过: tsc --noEmit 零错误, 47/47 前端测试通过。

---

## 已修复问题 (Fixed Issues)

| # | 问题 | 修复日期 | 备注 |
|---|------|----------|------|
| 175 | backend progress.service.ts 9处 `||` vs `??` 不一致 | 2026-07-01 | electron/backend 已修复但 main backend 遗漏；移除未使用的 Between import |
| 180 | electron/backend NoticesController 缺 POST/PUT 端点 | 2026-07-01 | 从 CoursesController 迁移 createNotice/updateNotice 到 NoticesController，统一架构与 main backend 一致 |
| 181 | backend + electron/backend NoticesController 路由排序 | 2026-07-01 | 将静态路由（read-all, :id/read）移到动态路由（:id）之前，避免路由误匹配 |
| 176 | backend + electron/backend parental-report.service.ts `comment || null` | 2026-07-01 | 空字符串被错误转为 null，改为 `?? null` |
| 156 | electron/backend code-execution.service.ts findAll 缺分页 | 2026-07-01 | 改为完整分页：page/pageSize + skip/take + getManyAndCount；getExecutionStats 改用 SQL 聚合 |
| 157 | electron/backend courses 路由冲突 + getNotices 缺分页 | 2026-07-01 | 移除与 NoticesController 冲突的 GET/DELETE /notice 路由，删除 service 死代码 |
| 158 | electron/backend users.service.ts findAll() 无分页 | 2026-07-01 | 移除该死代码方法 |
| 159 | electron/offlineSupport.js 空 catch 吞没错误 | 2026-07-01 | 改为 console.error 记录错误 |
| 152 | electron/backend auth.module.ts 硬编码 JWT 密钥 | 2026-07-01 | 改为环境变量 JWT_SECRET 模式，非开发环境强制检查 |
| 153 | electron/backend jwt.strategy.ts 硬编码 JWT 密钥 + 缺 token type 验证 | 2026-07-01 | 改为环境变量模式，添加 payload.type === 'access' 校验 |
| 154 | electron/backend projects.service.ts findAll 缺 isPublic 过滤 | 2026-07-01 | 无 userId 时仅返回 isPublic=1 的项目 |
| 155 | electron/backend favorites.service.ts 缺分页/数据脱敏/项目验证 | 2026-07-01 | 添加分页；非本人项目移除敏感字段；addFavorite 验证项目存在 |
| 1 | 后端未启动 | 2024-06-25 | 生产模式已正确启动后端服务 |
| 2 | 静态服务器返回 404 | 2024-06-25 | Windows 路径解析问题已解决 |
| 3 | API URL 配置错误 | 2024-06-25 | Electron 环境使用完整 URL |
| 4 | 文件打包路径问题 | 2024-06-25 | main.js 版本和资源打包已验证 |
| 5 | main.js distPath 路径 | 2024-06-25 | 使用 `path.join(__dirname, 'dist')` |
| 6 | 端口占用 | 2024-06-25 | 默认端口: API 3000, 静态 5175 |
| 7 | app.module.ts synchronize:true 数据丢失风险 | 2026-06-30 | 改为仅开发环境同步，生产禁用 |
| 8 | app.module.ts MySQL/SQLite 配置不一致 | 2026-06-30 | 统一为 SQLite (嵌入式桌面应用) |
| 9 | community.service.ts sortBy/sortOrder SQL注入 | 2026-06-30 | 添加白名单校验 |
| 10 | courses.service.ts sortField SQL注入 | 2026-06-30 | 添加白名单校验 |
| 11 | 多个服务 LIKE 通配符注入 | 2026-06-30 | community/projects/search/materials/study-notes 添加转义 |
| 12 | competition-evaluation 缺少 submissionId 列 | 2026-06-30 | 添加列，修复 evaluateSubmission 和 submitCode 链接 |
| 13 | users.controller.ts getUserByUsername 缺少认证 | 2026-06-30 | 添加 AuthGuard |
| 14 | homework.service.ts 错误 total 计数 | 2026-06-30 | 改用 getManyAndCount |
| 15 | auth.service.ts 内存泄漏 | 2026-06-30 | 添加 revokedTokens/loginAttempts 定时清理 |
| 16 | jwt.strategy.ts 缺失生产环境检查 | 2026-06-30 | 添加 JWT_SECRET 生产环境强制检查 |
| 17 | passwordReset.service.ts 验证码泄漏 | 2026-06-30 | 不再在 API 响应中返回验证码 |
| 18 | courses.service.ts markNoticeAsRead 查询列错误 | 2026-06-30 | 使用主键 id 而非 noticeId 字符串 |
| 19 | electron/main.js 无效 Chromium 开关 | 2026-06-30 | 移除 disable-gpu-compositing/software-rasterizer |
| 20 | competition-evaluation.service.ts 错误 total 计数 | 2026-06-30 | getEvaluations/getSubmissions/getProblems 改用 getManyAndCount |
| 21 | messages.service.ts getConversationsList N+1 查询 | 2026-06-30 | 批量查询替代逐个查询 |
| 22 | organizations.service.ts getClassStudents 分页错误 | 2026-06-30 | 服务端过滤替代客户端过滤 |
| 23 | CoursesController/NoticesController 路由冲突 | 2026-06-30 | 移除 CoursesController 中重复的 notice GET/PUT 路由 |
| 24 | 云变量实时同步 | 2026-06-30 | 新增 WebSocket 网关 (CloudVariablesGateway) + socket.io 客户端集成 |
| 25 | 进程清理 | 2026-06-30 | 新增 cleanup-processes.js 脚本 + package.json prebuild hooks (electron/scripts/) |
| 26 | @nestjs/websockets / socket.io 包未安装 | 2026-07-01 | 移除类型桩(stubs); 添加 socket.io 到 dependencies; 包已全部安装; 编译通过 |
| 27 | socket.io-client 前端包未安装 | 2026-07-01 | npm install socket.io-client 完成; socket.js 动态 import 正常解析; 云变量同步已启用 |
| 28 | auth.service.ts login 缺失密码字段导致 500 | 2026-07-01 | 添加防御性检查: account/password 在 bcrypt 调用前验证非空字符串 |
| 29 | 密码最小长度测试失败 (6 vs 8) | 2026-07-01 | 确认 DTO (@MinLength(8)) 与 service (password.length < 8) 一致; 旧测试用例基于已修复代码 |
| 30 | ide/index.jsx socket.js 同时静态和动态导入导致构建警告 | 2026-07-01 | 合并 pushCloudVariableUpdate 到静态 import，移除动态 import() |
| 31 | users.service.ts DEFAULT_PASSWORD 弱密码 | 2026-07-01 | '123456' -> 'Qima@2024' (8+字符,大小写字母+数字) |
| 32 | ChangePasswordDto 弱密码校验 (MinLength 6) | 2026-07-01 | 改为 MinLength(8) + Matches 复杂度正则 (与注册一致) |
| 33 | changePassword() 缺少服务端密码复杂度验证 | 2026-07-01 | 添加防御性检查: 长度+大小写数字验证 |
| 34 | classes.service.ts findAll() 未分页 | 2026-07-01 | 改为 findAndCount + skip/take; 控制器支持 page/pageSize 参数 |
| 35 | courses.service.ts getCourseCategories() null hierarchyId | 2026-07-01 | 添加 null 检查: cat.hierarchyId ? hierarchyMap.get(...) : undefined |
| 36 | code-execution.service.ts 使用 shell:true | 2026-07-01 | 移除 executePython/executeJS/runCommand 的 shell:true; 修复 spawnSync 警告 |
| 37 | passwordReset.service.ts 密码重置缺复杂度验证 | 2026-07-01 | verifyResetCode/adminResetPassword 添加防御性密码校验; DTO 添加 Matches |
| 38 | classes.service.ts 废弃 whereInIds | 2026-07-01 | 改为 where IN (:...ids) |
| 39 | homework/competition-evaluation/code-execution 内存聚合 | 2026-07-01 | 5 个 stats 方法改用 SQL COUNT/CASE/AVG 替代 JS filter |
| 40 | community/notices/study-notes/featured findAll 缺分页 | 2026-07-01 | 4 个服务添加 page/pageSize 分页支持 |
| 41 | featured.service.ts getFeaturedContents N+1 查询 | 2026-07-01 | 批量 findBy 替代逐个 findOne |
| 42 | messages.service.ts 废弃 findByIds | 2026-07-01 | 改为 findBy({ id: In(ids) }) |
| 43 | code-execution.service.ts runCommand 超时未生效 | 2026-07-01 | 添加 setTimeout 自动杀死超时进程 |
| 44 | code-execution.service.ts MSVC 编译器不兼容 | 2026-07-01 | 移除 cl.exe，compileAndRunCpp 仅使用 g++/clang++ |
| 45 | parental-report.service.ts averageProgress 公式错误 | 2026-07-01 | 从 sum(completedLessons)/count 改为 avg((completedLessons/totalLessons)*100) |
| 46 | parental-report.service.ts lessonsCompleted 命名误导 | 2026-07-01 | 重命名为 videoLessonsCompleted，表明统计的是视频进度 |
| 47 | study-notes.service.ts findByLesson 缺 isPublic 过滤 | 2026-07-01 | 添加 isPublic: true 条件，与 findByCourse 保持一致 |
| 48 | projects.service.ts findAll 暴露私有项目 | 2026-07-01 | 无 userId 时仅返回 isPublic=1 的项目 |
| 49 | learning-report.service.ts getSkillAtlas O(n^3) 性能 | 2026-07-01 | 预构建 skillNamesByCourseId Map，O(n^3) -> O(n^2) |
| 50 | organizations.service.ts addClassToOrganization 缺班级验证 | 2026-07-01 | 添加班级和组织存在性验证 |
| 51 | organizations.service.ts addStudentToOrganization 缺用户验证 | 2026-07-01 | 添加用户和组织存在性验证 |
| 52 | organizations.service.ts removeClassFromOrganization 计数器可负数 | 2026-07-01 | 仅 classCount > 0 时递减 |
| 53 | organizations.service.ts removeStudentFromOrganization 计数器可负数 | 2026-07-01 | 仅 studentCount > 0 时递减 |
| 54 | electron/main.js MSVC cl.exe 编译器仍存在 | 2026-07-01 | 移除 cl.exe（标志不兼容），与后端 #44 保持一致 |
| 55 | favorites.service.ts findByUser 泄露私有项目内容 | 2026-07-01 | 非本人项目移除 content/projectData/cloudVariables 字段 |
| 56 | classes.service.ts applyToJoin 缺班级存在验证 | 2026-07-01 | 添加班级存在性检查 |
| 57 | passwordReset.service.ts 验证码 Map 内存泄漏 | 2026-07-01 | 构造函数中添加 setInterval 每5分钟清理过期验证码 |
| 58 | homework.service.ts getHomeworks/getSubmissions 缺分页 | 2026-07-01 | 添加 page/pageSize 参数和 skip/take 分页 |
| 59 | competition-evaluation.service.ts getEvaluations/getSubmissions/getProblems 缺分页 | 2026-07-01 | 添加 page/pageSize 参数和 skip/take 分页 |
| 60 | class-leaderboard.service.ts calculateClassScores N+1 查询 | 2026-07-01 | 批量查询 userClasses 和 leaderboard 数据 |
| 61 | notices.controller.ts userId 从 query param 获取(权限绕过) | 2026-07-01 | 改为从 JWT token (req.user.sub) 提取 userId |
| 62 | homework.controller.ts GET submissions 缺认证 | 2026-07-01 | 添加 AuthGuard('jwt')，userId 从 token 提取 |
| 63 | homework.controller.ts GET /homework/:id/submissions 缺认证 | 2026-07-01 | 添加 AuthGuard('jwt') + 教师/学生权限检查 |
| 64 | homework.controller.ts GET /submission/:id 缺认证 | 2026-07-01 | 添加 AuthGuard('jwt') + 所有权检查 (学生本人或教师) |
| 65 | competition-evaluation.controller.ts GET /competition-evaluation 及 /:id 缺认证 | 2026-07-01 | 添加 AuthGuard('jwt') |
| 66 | competition-evaluation.controller.ts GET /competition-submissions 及 /:id 缺认证 | 2026-07-01 | 添加 AuthGuard('jwt') |
| 67 | competition-evaluation.controller.ts GET /user/:competitionId/:userId 缺认证 | 2026-07-01 | 添加 AuthGuard('jwt') + 只能查看自己的提交 |
| 68 | achievements.controller.ts GET /:userId 缺认证 | 2026-07-01 | 添加 AuthGuard('jwt') |
| 69 | code-execution.service.ts findAll() 缺分页 | 2026-07-01 | 添加 page/pageSize 参数，改为 findAndCount 分页；同步更新 controller 和前端 API |
| 70 | code-execution.service.ts detectPython() 每次调用 spawnSync 阻塞事件循环 | 2026-07-01 | 添加缓存 (cachedPythonPath)，仅首次检测时调用 spawnSync |
| 71 | code-execution.service.ts detectJavaScriptRuntime() 每次调用 spawnSync 阻塞事件循环 | 2026-07-01 | 添加缓存 (cachedJSRuntime)，仅首次检测时调用 spawnSync |
| 72 | homework.controller.ts POST /homework/:id/submit studentId 可从请求体伪造 | 2026-07-01 | 改为从 JWT token (req.user.sub) 提取 studentId，忽略请求体中的值；同时添加作业存在性验证 |
| 73 | code-execution.controller.ts POST / userId 可从请求体伪造 | 2026-07-01 | 改为从 JWT token (req.user.sub) 提取 userId，忽略请求体中的值 |
| 74 | users.service.ts getLearningStats() 返回硬编码零值 | 2026-07-01 | 注入 UserCourse/UserLessonProgress/Achievement 仓库，查询真实数据；更新 UsersModule 注册实体 |
| 75 | homework.controller.ts PUT grade/ DELETE submission 缺少教师/所有权检查 | 2026-07-01 | 添加教师身份验证 (grade) 和学生/教师所有权检查 (delete) |
| 76 | community.controller.ts createPost/createComment/toggleLike userId 可从请求体伪造 | 2026-07-01 | 统一改为从 JWT token (req.user.sub) 提取 userId，忽略请求体中的值 |
| 77 | course-reviews.controller.ts createReview userId 可从请求体伪造 | 2026-07-01 | 改为从 JWT token (req.user.sub) 提取 userId，忽略请求体中的值 |
| 78 | competition-evaluation.controller.ts submitCode userId 可从请求体伪造 | 2026-07-01 | 改为从 JWT token (req.user.sub) 提取 userId，忽略请求体中的值 |
| 79 | homework.controller.ts POST /homework/:id/submit 不验证作业存在性 | 2026-07-01 | 提交前验证 homework 存在，不存在返回 404 |
| 80 | organizations.controller.ts updateOrganization/deleteOrganization 缺所有权/角色检查 | 2026-07-01 | 添加 ownerId 字段到 Organization 实体；仅所有者或 admin 可更新/删除 |
| 81 | organizations.controller.ts addStudentToOrganization 从请求体获取 userId (IDOR) | 2026-07-01 | 所有者/admin 可指定 userId，普通用户只能添加自己；添加角色和所有权检查 |
| 82 | organizations.controller.ts addClassToOrganization/removeClassFromOrganization 缺授权 | 2026-07-01 | 添加所有权检查：仅组织所有者或 admin 可管理班级 |
| 83 | organizations.controller.ts createOrganization 缺角色检查 | 2026-07-01 | 添加 RolesGuard + @Roles(1,2)；自动设置 ownerId 为当前用户 |
| 84 | parental-report.controller.ts generateReport 缺家长-学生关系验证 | 2026-07-01 | 生成报告前验证 getLinkedStudents 中是否存在该学生 |
| 85 | parental-report.controller.ts getStudentReports 缺授权 | 2026-07-01 | 学生本人或已关联家长可查看；否则返回 403 |
| 86 | parental-report.controller.ts getReportById/approveReport/rejectReport/deleteReport 缺所有权 | 2026-07-01 | 添加 parentId 所有权检查；仅报告生成者可操作 |
| 87 | follows.controller.ts GET followers/following/stats 缺认证 | 2026-07-01 | 添加 @UseGuards(AuthGuard('jwt')) |
| 88 | code-execution.controller.ts findAll/getStats 允许查看他人代码执行记录 | 2026-07-01 | 非admin强制过滤为自身 userId；添加所有权检查到 findOne/execute/update/remove；cleanup 限 admin |
| 89 | notices.service.ts markAsRead/deleteNotice 缺所有权验证 | 2026-07-01 | 添加 userId 参数，查询时同时匹配 id+userId，不匹配返回 404 |
| 90 | competition-evaluation.controller.ts getSubmission/deleteSubmission 缺所有权，evaluateSubmission 缺角色 | 2026-07-01 | 添加所有权检查；evaluateSubmission 添加 RolesGuard(1,2) |
| 91 | ide/index.jsx 渲染代码 state.direction/size/x/y/currentCostume 使用 \|\| 回退，方向0/坐标0/大小0 被误判为 falsy | 2026-07-01 | 5处改为 ?? 空值合并 |
| 92 | ide/index.jsx UI控件 selectedSpriteData.direction/size 使用 \|\| 回退，值0被默认值覆盖 | 2026-07-01 | 6处 val \|\| default → val ?? default |
| 93 | ideEnhanced/index.jsx 渲染代码 state.direction/size/x/y/currentCostume 使用 \|\| 回退，与 #91 同模式 | 2026-07-01 | 5处改为 ?? 空值合并 |
| 94 | ideEnhanced/index.jsx 解释器 getter motion_direction/looks_size 使用 \|\| 回退，方向0/大小0 错误 | 2026-07-01 | 2处改为 ?? 空值合并 |
| 95 | ScratchInterpreter.js addEventListener 内存泄漏 | 2026-07-01 | _bindEvents 改为使用命名函数引用；添加 _unbindEvents + destroy 方法；ide/index.jsx 执行完成后调用 interpreter.destroy() |
| 96 | ideEnhanced/index.jsx inline ScratchInterpreter addEventListener 内存泄漏 | 2026-07-01 | 同上模式：命名函数引用 + _unbindEvents + destroy；runAsyncCode finally 块中调用 interpreter.destroy() |
| 97 | ideEnhanced/index.jsx motion_xposition/motion_yposition 使用 \|\| 0 回退 | 2026-07-01 | 2处改为 ?? 0，与 motion_direction 保持一致 |
| 98 | ideEnhanced/index.jsx 解释器 operator_add/subtract/multiply/divide/gt/lt/mod/round/mathop 使用 \|\| 0 回退 | 2026-07-01 | 13处 a \|\| 0 / num \|\| 0 改为 ?? 0 |
| 99 | ideEnhanced/index.jsx data_changevariableby 变量值 \|\| 0 回退 | 2026-07-01 | 改为 ?? 0 |
| 100 | ideEnhanced/index.jsx 精灵排序 layer \|\| 0 回退 | 2026-07-01 | 2处改为 ?? 0 |
| 101 | ScratchInterpreter.js graphicEffects/soundEffects \|\| 0 回退 | 2026-07-01 | 2处 effects[effect] \|\| 0 改为 ?? 0 |
| 102 | ScratchInterpreter.js operator_add/subtract/multiply/divide/gt/lt/mod/round/mathop 使用 \|\| 0 回退 | 2026-07-01 | 13处改为 ?? 0 |
| 103 | ScratchInterpreter.js data_changevariableby 变量值 \|\| 0 回退 | 2026-07-01 | 改为 ?? 0 |
| 104 | ide/index.jsx 精灵排序 layer \|\| 0 回退 | 2026-07-01 | 2处改为 ?? 0 |
| 105 | ide/index.jsx graphicEffects.brightness \|\| 0 回退 | 2026-07-01 | 改为 ?? 0 |
| 106 | ide/index.jsx currentCostume \|\| 0 回退（next/prev costume） | 2026-07-01 | 2处改为 ?? 0 |
| 107 | ide/index.jsx UI显示 X/Y 坐标使用 \|\| 0 回退 | 2026-07-01 | 2处改为 ?? 0 |
| 108 | ideEnhanced/index.jsx Blockly XML 加载错误被吞没 | 2026-07-01 | catch (e) {} → console.error |
| 109 | ide/index.jsx Blockly XML 加载错误被吞没 | 2026-07-01 | catch (e) {} → console.error |
| 110 | ideEnhanced/index.jsx 云变量获取错误被吞没 | 2026-07-01 | .catch(() => {}) → .catch(e => console.error) |
| 111 | ide/index.jsx 云变量获取错误被吞没 | 2026-07-01 | .catch(() => {}) → .catch(e => console.error) |
| 112 | search/index.jsx 搜索历史获取/保存/清除错误被吞没 (3处) | 2026-07-01 | 3处 .catch(() => {}) → .catch(e => console.error) |
| 113 | competition/index.jsx maxScore \|\| 100 非零默认值 | 2026-07-01 | 2处改为 ?? 100 |
| 114 | homework/submissions.jsx totalScore \|\| 100 非零默认值 | 2026-07-01 | 改为 ?? 100 |
| 115 | backend/src/main.ts PORT \|\| 3000 (端口0为有效值) | 2026-07-01 | 改为 ?? 3000 |
| 116 | python-editor/index.jsx canvas?.width / 2 \|\| 200 NaN处理 | 2026-07-01 | 4处改为 (canvas?.width ?? 400) / 2 |
| 117 | python-editor/index.jsx Counter.most_common slice(0, n \|\| 10) | 2026-07-01 | 改为 slice(0, n)，与Python语义一致 |
| 118 | favorites/index.jsx userId \|\| '未知' | 2026-07-01 | 改为 ?? '未知' |
| 119 | competition/index.jsx status color/text \|\| 'default'/'未知' | 2026-07-01 | 2处改为 ?? 'default' / ?? '未知' |
| 120 | python-editor/index.jsx slice() step \|\| 1 非零默认值 | 2026-07-01 | step \|\| 1 -> step ?? 1（0 被 \|\| 误判为 falsy 导致默认值覆盖） |
| 121 | python-editor/index.jsx islice() stop \|\| a.length 非零默认值 | 2026-07-01 | stop \|\| a.length -> stop ?? a.length（stop=0 被误判为 falsy） |
| 122 | electron/backend community.controller.ts 缺失 AuthGuard + userId 可从请求体伪造 | 2026-07-01 | 添加 AuthGuard('jwt')；userId 改为从 JWT token 提取；添加更新/删除所有权检查 |
| 123 | electron/backend projects.controller.ts 缺失 AuthGuard + userId 可从请求体伪造 | 2026-07-01 | 添加 AuthGuard('jwt')；userId 改为从 JWT token 提取；添加更新/删除所有权检查 |
| 124 | electron/backend course-reviews.controller.ts 缺失 AuthGuard + userId 可从请求体伪造 | 2026-07-01 | 添加 AuthGuard('jwt')；userId 改为从 JWT token 提取 |
| 125 | electron/backend code-execution.controller.ts 缺失 AuthGuard + userId 可从请求体伪造 | 2026-07-01 | 添加 AuthGuard('jwt')；userId 改为从 JWT token 提取；非admin强制过滤自身记录 |
| 126 | electron/backend competition-evaluation.controller.ts 缺失 AuthGuard + userId 可从请求体伪造 | 2026-07-01 | 添加 AuthGuard('jwt')；userId 改为从 JWT token 提取；添加所有权/角色检查 |
| 127 | electron/backend homework.controller.ts studentId 可从请求体伪造 | 2026-07-01 | studentId 改为从 JWT token 提取；getSubmissions 从 token 获取学生ID；添加角色检查 |

---

## 计划功能 (Planned Features)

| # | 功能 | 状态 | 说明 |
|---|------|------|------|
| 1 | 云变量实时同步 | 已完成 | WebSocket 网关 + 客户端 socket.js 已就绪; 所有 npm 包已安装; 构建通过 |
| 2 | Scratch IDE 云变量 | 已完成 | 支持 `_cloud_` 前缀 |
| 3 | 竞赛页面 | 已完成 | 题目列表、代码提交、评测 |
| 4 | 管理后台 | 已完成 | 用户/课程/公告管理 |
| 5 | 社区功能 | 已完成 | 作品展示、点赞、评论 |

---

## 技术栈

- 后端: NestJS + TypeORM + SQLite
- 前端: React 18 + Vite + Ant Design
- 桌面: Electron 28

## 验证检查点

```bash
# 必须全部通过
grep "startStaticServer" dist-electron/win-unpacked/resources/app/main.js  # 有静态服务器
grep "localhost:3000" dist-electron/win-unpacked/resources/app/dist/assets/index-*.js  # 有 API URL
grep "<title>云屿学习平台" dist-electron/win-unpacked/resources/app/dist/index.html  # 标题正确
du -sh dist-electron/win-unpacked/resources/app/backend/node_modules  # 有依赖
```