import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { User } from '../entities/user.entity';
import { Course, Lesson } from '../entities/course.entity';

interface SeedUser {
  username: string;
  account: string;
  password: string;
  name: string;
  avatar: string;
  userType: number;
  sex: number;
  nickname: string;
  role: number;
  status: number;
}

interface SeedCourse {
  courseName: string;
  hierarchyId: string;
  description: string;
  coverImage: string;
  totalLessons: number;
  completedLessons: number;
  duration: number;
  difficulty: number;
  teacher: string;
  studentCount: number;
  price: number;
  status: number;
}

interface SeedLesson {
  lessonName: string;
  duration: number;
}

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async seedIfEmpty(): Promise<void> {
    const userRepo = this.dataSource.getRepository(User);

    const userCount = await userRepo.count();
    if (userCount > 0) {
      this.logger.log(`数据库已有 ${userCount} 个用户，跳过种子数据初始化`);
      return;
    }

    this.logger.log('数据库为空，开始初始化种子数据...');

    try {
      await this.seedUsers();
      await this.seedCoursesAndLessons();
      this.logger.log('种子数据初始化完成！');
    } catch (error) {
      this.logger.error('种子数据初始化失败', error instanceof Error ? error.stack : String(error));
      throw error;
    }
  }

  private async seedUsers(): Promise<User[]> {
    const userRepo = this.dataSource.getRepository(User);

    const users: SeedUser[] = [
      // userType: 1=学生, 2=教师; role: 1=管理员, 2=教师, 3=学生
      { username: 'teacher_zhang', account: 'zhangsan', password: 'Qima@2024', name: '张三', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', userType: 2, sex: 1, nickname: '张老师', role: 2, status: 1 },
      { username: 'teacher_li', account: 'lisi', password: 'Qima@2024', name: '李四', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', userType: 2, sex: 1, nickname: '李老师', role: 2, status: 1 },
      { username: 'teacher_wang', account: 'wangwu', password: 'Qima@2024', name: '王五', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', userType: 2, sex: 1, nickname: '王老师', role: 2, status: 1 },
      { username: 'student_xiaoming', account: 'xiaoming', password: 'Qima@2024', name: '小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaoming', userType: 1, sex: 1, nickname: '小明同学', role: 3, status: 1 },
      { username: 'student_xiaohong', account: 'xiaohong', password: 'Qima@2024', name: '小红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohong', userType: 1, sex: 2, nickname: '小红同学', role: 3, status: 1 },
      { username: 'student_xiaohua', account: 'xiaohua', password: 'Qima@2024', name: '小华', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaohua', userType: 1, sex: 2, nickname: '小华同学', role: 3, status: 1 },
      { username: 'student_tom', account: 'tom', password: 'Qima@2024', name: 'Tom', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=tom', userType: 1, sex: 1, nickname: 'Tom', role: 3, status: 1 },
      { username: 'student_jerry', account: 'jerry', password: 'Qima@2024', name: 'Jerry', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=jerry', userType: 1, sex: 1, nickname: 'Jerry', role: 3, status: 1 },
      { username: 'admin', account: 'admin', password: 'Admin@2024', name: '管理员', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin', userType: 2, sex: 1, nickname: '管理员', role: 1, status: 1 },
      { username: 'student_amy', account: 'amy', password: 'Qima@2024', name: 'Amy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=amy', userType: 1, sex: 2, nickname: 'Amy同学', role: 3, status: 1 },
    ];

    const savedUsers: User[] = [];
    for (const userData of users) {
      const user = userRepo.create({
        ...userData,
        password: userData.password,
      });
      const saved = await userRepo.save(user);
      savedUsers.push(saved);
      this.logger.log(`创建用户: ${userData.username} (${userData.account})`);
    }

    this.logger.log(`已创建 ${savedUsers.length} 个用户`);
    return savedUsers;
  }

  private async seedCoursesAndLessons(): Promise<void> {
    const courseRepo = this.dataSource.getRepository(Course);
    const lessonRepo = this.dataSource.getRepository(Lesson);

    const courses: SeedCourse[] = [
      { courseName: 'Python 编程基础', hierarchyId: 'HI001', description: '从零开始学习 Python 编程，掌握基本语法和编程思想。', coverImage: 'https://picsum.photos/seed/python/400/300', totalLessons: 12, completedLessons: 0, duration: 600, difficulty: 1, teacher: '张三', studentCount: 128, price: 0, status: 1 },
      { courseName: 'JavaScript 入门与进阶', hierarchyId: 'HI002', description: '系统学习 JavaScript 语言，包括 ES6+ 新特性、前端开发实战。', coverImage: 'https://picsum.photos/seed/javascript/400/300', totalLessons: 20, completedLessons: 0, duration: 1200, difficulty: 2, teacher: '李四', studentCount: 256, price: 99, status: 1 },
      { courseName: '数据结构与算法', hierarchyId: 'HI003', description: '深入学习常见数据结构（链表、树、图）和算法（排序、搜索、动态规划）。', coverImage: 'https://picsum.photos/seed/dsa/400/300', totalLessons: 30, completedLessons: 0, duration: 1800, difficulty: 4, teacher: '王五', studentCount: 180, price: 199, status: 1 },
      { courseName: '机器学习基础', hierarchyId: 'HI004', description: '介绍机器学习核心概念、常用算法（线性回归、决策树、神经网络）及 Python 实现。', coverImage: 'https://picsum.photos/seed/ml/400/300', totalLessons: 25, completedLessons: 0, duration: 1500, difficulty: 3, teacher: '张三', studentCount: 95, price: 299, status: 1 },
      { courseName: 'Web 前端开发实战', hierarchyId: 'HI005', description: '基于 React + TypeScript + Tailwind CSS 构建现代化 Web 应用。', coverImage: 'https://picsum.photos/seed/webdev/400/300', totalLessons: 18, completedLessons: 0, duration: 1080, difficulty: 2, teacher: '李四', studentCount: 142, price: 149, status: 1 },
      { courseName: '数据库设计与优化', hierarchyId: 'HI006', description: '学习关系型数据库设计、SQL 查询优化、索引原理及 NoSQL 应用。', coverImage: 'https://picsum.photos/seed/database/400/300', totalLessons: 15, completedLessons: 0, duration: 900, difficulty: 3, teacher: '王五', studentCount: 88, price: 129, status: 1 },
      { courseName: 'C++ 程序设计', hierarchyId: 'HI007', description: '面向对象编程基础、C++ 标准库、多线程编程入门。', coverImage: 'https://picsum.photos/seed/cpp/400/300', totalLessons: 22, completedLessons: 0, duration: 1320, difficulty: 3, teacher: '张三', studentCount: 76, price: 0, status: 1 },
      { courseName: '算法竞赛入门', hierarchyId: 'HI008', description: '为零基础学生设计的算法竞赛入门课程，涵盖基础算法和竞赛技巧。', coverImage: 'https://picsum.photos/seed/algorithm/400/300', totalLessons: 16, completedLessons: 0, duration: 960, difficulty: 2, teacher: '王五', studentCount: 210, price: 0, status: 1 },
    ];

    const lessonTemplates: Record<string, SeedLesson[]> = {
      'Python 编程基础': [
        { lessonName: 'Python 简介与环境搭建', duration: 30 },
        { lessonName: '变量与数据类型', duration: 45 },
        { lessonName: '运算符与表达式', duration: 40 },
        { lessonName: '条件语句 if-else', duration: 50 },
        { lessonName: '循环语句 for/while', duration: 55 },
        { lessonName: '列表与元组', duration: 60 },
        { lessonName: '字典与集合', duration: 55 },
        { lessonName: '函数定义与调用', duration: 50 },
        { lessonName: '模块与包', duration: 40 },
        { lessonName: '文件操作', duration: 45 },
        { lessonName: '面向对象编程基础', duration: 60 },
        { lessonName: '异常处理与调试', duration: 45 },
      ],
      'JavaScript 入门与进阶': [
        { lessonName: 'JavaScript 简介', duration: 30 },
        { lessonName: '变量与数据类型', duration: 45 },
        { lessonName: '函数与作用域', duration: 55 },
        { lessonName: 'ES6+ 新特性', duration: 60 },
        { lessonName: '数组方法 map/filter/reduce', duration: 50 },
        { lessonName: 'Promise 与异步编程', duration: 60 },
        { lessonName: 'async/await 详解', duration: 45 },
        { lessonName: 'DOM 操作基础', duration: 55 },
        { lessonName: '事件处理', duration: 50 },
        { lessonName: 'Fetch API 与网络请求', duration: 55 },
        { lessonName: '模块化 (ES Module)', duration: 45 },
        { lessonName: 'TypeScript 入门', duration: 60 },
        { lessonName: 'React 组件基础', duration: 65 },
        { lessonName: 'Hooks 用法详解', duration: 70 },
        { lessonName: '状态管理 Context', duration: 55 },
        { lessonName: '路由 react-router', duration: 50 },
        { lessonName: '表单处理与验证', duration: 55 },
        { lessonName: 'CSS-in-JS 与 Tailwind', duration: 60 },
        { lessonName: '组件库使用', duration: 50 },
        { lessonName: '项目实战与部署', duration: 90 },
      ],
      '数据结构与算法': [
        { lessonName: '算法复杂度分析', duration: 60 },
        { lessonName: '数组与链表', duration: 65 },
        { lessonName: '栈与队列', duration: 55 },
        { lessonName: '哈希表原理', duration: 60 },
        { lessonName: '树与二叉树', duration: 70 },
        { lessonName: '二叉搜索树', duration: 65 },
        { lessonName: '平衡二叉树 AVL', duration: 70 },
        { lessonName: '红黑树简介', duration: 60 },
        { lessonName: '堆与优先队列', duration: 55 },
        { lessonName: '图的基础概念', duration: 60 },
        { lessonName: '图的遍历 BFS/DFS', duration: 65 },
        { lessonName: '最短路径算法', duration: 70 },
        { lessonName: '最小生成树', duration: 65 },
        { lessonName: '排序算法基础', duration: 60 },
        { lessonName: '高级排序算法', duration: 65 },
        { lessonName: '二分查找与扩展', duration: 55 },
        { lessonName: '动态规划入门', duration: 70 },
        { lessonName: '经典 DP 问题', duration: 75 },
        { lessonName: '贪心算法', duration: 60 },
        { lessonName: '回溯与分支限界', duration: 70 },
        { lessonName: '字符串匹配算法', duration: 60 },
        { lessonName: '并查集', duration: 55 },
        { lessonName: '线段树', duration: 65 },
        { lessonName: '树状数组', duration: 55 },
        { lessonName: '单调栈与单调队列', duration: 50 },
        { lessonName: '计算几何基础', duration: 60 },
        { lessonName: '概率与期望', duration: 55 },
        { lessonName: '矩阵快速幂', duration: 50 },
        { lessonName: '竞赛技巧与策略', duration: 45 },
      ],
      '机器学习基础': [
        { lessonName: '机器学习概述', duration: 45 },
        { lessonName: '线性代数回顾', duration: 60 },
        { lessonName: '概率与统计基础', duration: 55 },
        { lessonName: '线性回归', duration: 65 },
        { lessonName: '逻辑回归', duration: 60 },
        { lessonName: '正则化', duration: 50 },
        { lessonName: '决策树', duration: 60 },
        { lessonName: '随机森林', duration: 55 },
        { lessonName: '朴素贝叶斯', duration: 50 },
        { lessonName: '支持向量机', duration: 65 },
        { lessonName: '神经网络基础', duration: 70 },
        { lessonName: '反向传播算法', duration: 65 },
        { lessonName: '卷积神经网络 CNN', duration: 70 },
        { lessonName: '循环神经网络 RNN', duration: 65 },
        { lessonName: 'LSTM 与 GRU', duration: 60 },
        { lessonName: '模型评估与调优', duration: 55 },
        { lessonName: '特征工程', duration: 60 },
        { lessonName: '集成学习', duration: 55 },
        { lessonName: '降维与聚类', duration: 60 },
        { lessonName: '强化学习入门', duration: 65 },
        { lessonName: '迁移学习', duration: 55 },
        { lessonName: '联邦学习简介', duration: 50 },
        { lessonName: 'AutoML 概述', duration: 45 },
        { lessonName: '实战项目：图像分类', duration: 90 },
        { lessonName: '实战项目：文本分类', duration: 90 },
      ],
      'Web 前端开发实战': [
        { lessonName: '前端开发环境搭建', duration: 40 },
        { lessonName: 'HTML5 新特性', duration: 50 },
        { lessonName: 'CSS3 核心概念', duration: 55 },
        { lessonName: 'Flexbox 与 Grid', duration: 60 },
        { lessonName: 'Tailwind CSS 入门', duration: 55 },
        { lessonName: 'React 基础', duration: 65 },
        { lessonName: 'JSX 与组件', duration: 60 },
        { lessonName: 'Props 与 State', duration: 55 },
        { lessonName: 'useState 与 useEffect', duration: 60 },
        { lessonName: '自定义 Hooks', duration: 55 },
        { lessonName: 'Context 与状态管理', duration: 60 },
        { lessonName: 'React Router', duration: 50 },
        { lessonName: '表单处理', duration: 55 },
        { lessonName: 'HTTP 请求与 Axios', duration: 55 },
        { lessonName: 'Ant Design 组件库', duration: 60 },
        { lessonName: 'ECharts 数据可视化', duration: 55 },
        { lessonName: '项目架构设计', duration: 50 },
        { lessonName: '项目实战与部署', duration: 120 },
      ],
      '数据库设计与优化': [
        { lessonName: '数据库概述', duration: 40 },
        { lessonName: 'SQL 基础查询', duration: 60 },
        { lessonName: 'SQL 聚合函数', duration: 55 },
        { lessonName: '表连接与子查询', duration: 65 },
        { lessonName: '索引原理', duration: 60 },
        { lessonName: '索引优化策略', duration: 55 },
        { lessonName: '事务与隔离级别', duration: 65 },
        { lessonName: '锁机制', duration: 60 },
        { lessonName: '视图与存储过程', duration: 55 },
        { lessonName: '触发器与事件', duration: 50 },
        { lessonName: '数据库设计范式', duration: 60 },
        { lessonName: 'ER 图设计', duration: 55 },
        { lessonName: '慢查询分析与优化', duration: 60 },
        { lessonName: 'NoSQL 简介', duration: 45 },
        { lessonName: 'Redis 应用场景', duration: 55 },
      ],
      'C++ 程序设计': [
        { lessonName: 'C++ 简介与环境搭建', duration: 35 },
        { lessonName: '基本语法与数据类型', duration: 50 },
        { lessonName: '控制结构', duration: 45 },
        { lessonName: '函数与递归', duration: 55 },
        { lessonName: '数组与指针', duration: 60 },
        { lessonName: '结构体与联合体', duration: 50 },
        { lessonName: '类与对象', duration: 65 },
        { lessonName: '构造与析构函数', duration: 55 },
        { lessonName: '继承与多态', duration: 65 },
        { lessonName: '虚函数与抽象类', duration: 60 },
        { lessonName: '模板与泛型编程', duration: 55 },
        { lessonName: 'STL 容器', duration: 60 },
        { lessonName: 'STL 算法', duration: 55 },
        { lessonName: '智能指针', duration: 50 },
        { lessonName: '异常处理', duration: 45 },
        { lessonName: '文件 I/O', duration: 50 },
        { lessonName: '多线程编程', duration: 65 },
        { lessonName: '网络编程基础', duration: 60 },
        { lessonName: '设计模式入门', duration: 55 },
        { lessonName: 'C++11/14/17 新特性', duration: 60 },
        { lessonName: '编译与调试技巧', duration: 50 },
        { lessonName: '项目实战：HTTP 服务器', duration: 90 },
      ],
      '算法竞赛入门': [
        { lessonName: '竞赛简介与环境配置', duration: 30 },
        { lessonName: 'C++ 快速入门', duration: 50 },
        { lessonName: '输入输出技巧', duration: 40 },
        { lessonName: '时间复杂度分析', duration: 45 },
        { lessonName: '空间复杂度分析', duration: 35 },
        { lessonName: '枚举与模拟', duration: 50 },
        { lessonName: '排序算法实现', duration: 55 },
        { lessonName: '二分查找实现', duration: 50 },
        { lessonName: 'STL 使用技巧', duration: 60 },
        { lessonName: '链表操作', duration: 55 },
        { lessonName: '栈与队列应用', duration: 55 },
        { lessonName: 'BFS 与 DFS', duration: 65 },
        { lessonName: '简单动态规划', duration: 60 },
        { lessonName: '贪心算法基础', duration: 55 },
        { lessonName: '数论基础', duration: 60 },
        { lessonName: '组合数学基础', duration: 55 },
      ],
    };

    const savedCourses: Course[] = [];
    for (const courseData of courses) {
      const course = courseRepo.create(courseData);
      const saved = await courseRepo.save(course);
      savedCourses.push(saved);
      this.logger.log(`创建课程: ${course.courseName}`);
    }
    this.logger.log(`已创建 ${savedCourses.length} 门课程`);

    let totalLessons = 0;
    for (const course of savedCourses) {
      const template = lessonTemplates[course.courseName];
      if (template) {
        for (let i = 0; i < template.length; i++) {
          const lesson = lessonRepo.create({
            courseId: course.id,
            lessonName: template[i].lessonName,
            lessonOrder: i + 1,
            duration: template[i].duration,
            isCompleted: 0,
            videoUrl: `https://example.com/videos/course${course.id}/lesson${i + 1}.mp4`,
            content: `这是课程《${course.courseName}》的第 ${i + 1} 课时：${template[i].lessonName} 的内容。`,
            pptUrl: `https://example.com/ppts/course${course.id}/lesson${i + 1}.pdf`,
          });
          await lessonRepo.save(lesson);
          totalLessons++;
        }
      }
    }
    this.logger.log(`已创建 ${totalLessons} 个课时`);
  }
}
