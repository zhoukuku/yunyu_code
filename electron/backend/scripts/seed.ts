/**
 * 数据初始化脚本 - 添加更多课程、用户和班级数据
 */

import { DataSource, Repository } from 'typeorm';
import { Hierarchy, Course, Lesson, Notice } from '../src/entities/course.entity';
import { User } from '../src/entities/user.entity';
import { Homework, HomeworkSubmission } from '../src/entities/homework.entity';
import * as bcrypt from 'bcrypt';

const dataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [Hierarchy, Course, Lesson, Notice, User, Homework, HomeworkSubmission],
  synchronize: true,
});

async function seed() {
  console.log('========================================');
  console.log('添加课程数据');
  console.log('========================================\n');

  await dataSource.initialize();
  console.log('✓ 数据库连接成功');

  const hierarchyRepo = dataSource.getRepository(Hierarchy);
  const courseRepo = dataSource.getRepository(Course);
  const lessonRepo = dataSource.getRepository(Lesson);
  const noticeRepo = dataSource.getRepository(Notice);
  const userRepo = dataSource.getRepository(User);

  // 1. 创建课程层级（忽略已存在）
  console.log('\n📖 创建/检查课程层级...');
  const hierarchies = [
    { hierarchyId: '21', hierarchyName: 'Scratch', standardClassifyId: '1', standardClassifyName: '正式课', themeClassifyId: '3', themeClassifyName: '试听课' },
    { hierarchyId: '32', hierarchyName: 'Python', standardClassifyId: '1', standardClassifyName: '正式课', themeClassifyId: '3', themeClassifyName: '试听课' },
    { hierarchyId: '22', hierarchyName: 'C++', standardClassifyId: '1', standardClassifyName: '正式课', themeClassifyId: '3', themeClassifyName: '试听课' },
    { hierarchyId: '35', hierarchyName: '其他', standardClassifyId: '1', standardClassifyName: '正式课', themeClassifyId: '3', themeClassifyName: '试听课' },
  ];

  for (const h of hierarchies) {
    const existing = await hierarchyRepo.findOne({ where: { hierarchyId: h.hierarchyId } });
    if (!existing) {
      const hierarchy = hierarchyRepo.create(h);
      await hierarchyRepo.save(hierarchy);
      console.log('  ✓ 新增: ' + h.hierarchyName);
    } else {
      console.log('  - 已存在: ' + h.hierarchyName);
    }
  }

  // 2. 创建课程 - 扩展课程列表
  console.log('\n📚 创建课程...');
  const courses = [
    // Scratch课程
    { courseName: 'Scratch零基础入门', hierarchyId: '21', description: '通过趣味案例学习编程基础，培养逻辑思维', coverImage: 'https://resources.5aqima.com/cover/coursePackage/02ea5f9e13c14bf7bbccce46f632c33c.png', totalLessons: 20, completedLessons: 5, duration: 600, difficulty: 1, teacher: '李老师', studentCount: 156, price: 0, status: 1 },
    { courseName: 'Scratch进阶提高', hierarchyId: '21', description: '深入学习复杂逻辑和游戏设计', coverImage: 'https://resources.5aqima.com/cover/coursePackage/41a3b3bb66ec43a98e5b5776e703bccf.jpg', totalLessons: 30, completedLessons: 0, duration: 900, difficulty: 2, teacher: '李老师', studentCount: 89, price: 299, status: 1 },
    { courseName: 'Scratch游戏制作', hierarchyId: '21', description: '从零开始制作完整的游戏项目', coverImage: 'https://resources.5aqima.com/cover/coursePackage/c3af9adcd4ec4c049c2ed84990f614ed.jpg', totalLessons: 25, completedLessons: 0, duration: 750, difficulty: 3, teacher: '王老师', studentCount: 67, price: 399, status: 1 },
    { courseName: 'Scratch创意动画', hierarchyId: '21', description: '用Scratch创作有趣的动画故事', coverImage: 'https://resources.5aqima.com/cover/coursePackage/6ce6504026374d83b3b90b44ec501d03.png', totalLessons: 15, completedLessons: 0, duration: 450, difficulty: 1, teacher: '李老师', studentCount: 112, price: 199, status: 1 },
    { courseName: 'Scratch乐器模拟', hierarchyId: '21', description: '制作音乐和声音互动项目', coverImage: 'https://resources.5aqima.com/cover/coursePackage/02ea5f9e13c14bf7bbccce46f632c33c.png', totalLessons: 12, completedLessons: 0, duration: 360, difficulty: 2, teacher: '王老师', studentCount: 45, price: 249, status: 1 },
    { courseName: 'Scratch物理模拟', hierarchyId: '21', description: '学习物理概念并模拟物理现象', coverImage: 'https://resources.5aqima.com/cover/coursePackage/41a3b3bb66ec43a98e5b5776e703bccf.jpg', totalLessons: 18, completedLessons: 0, duration: 540, difficulty: 3, teacher: '李老师', studentCount: 38, price: 349, status: 1 },

    // Python课程
    { courseName: 'Python趣味编程', hierarchyId: '32', description: '用Python制作有趣的小程序和游戏', coverImage: 'https://resources.5aqima.com/cover/coursePackage/6ce6504026374d83b3b90b44ec501d03.png', totalLessons: 40, completedLessons: 0, duration: 1200, difficulty: 2, teacher: '张老师', studentCount: 234, price: 599, status: 1 },
    { courseName: 'Python人工智能入门', hierarchyId: '32', description: '了解AI基本概念，动手实现简单AI', coverImage: 'https://resources.5aqima.com/cover/coursePackage/02ea5f9e13c14bf7bbccce46f632c33c.png', totalLessons: 20, completedLessons: 0, duration: 600, difficulty: 3, teacher: '张老师', studentCount: 123, price: 699, status: 1 },
    { courseName: 'Python数据分析', hierarchyId: '32', description: '学习数据处理和可视化', coverImage: 'https://resources.5aqima.com/cover/coursePackage/41a3b3bb66ec43a98e5b5776e703bccf.jpg', totalLessons: 25, completedLessons: 0, duration: 750, difficulty: 3, teacher: '张老师', studentCount: 89, price: 799, status: 1 },
    { courseName: 'Python网络爬虫', hierarchyId: '32', description: '学习网页数据抓取技术', coverImage: 'https://resources.5aqima.com/cover/coursePackage/c3af9adcd4ec4c049c2ed84990f614ed.jpg', totalLessons: 18, completedLessons: 0, duration: 540, difficulty: 3, teacher: '赵老师', studentCount: 156, price: 599, status: 1 },
    { courseName: 'Python图像处理', hierarchyId: '32', description: '使用PIL库处理图片和生成图像', coverImage: 'https://resources.5aqima.com/cover/coursePackage/6ce6504026374d83b3b90b44ec501d03.png', totalLessons: 15, completedLessons: 0, duration: 450, difficulty: 2, teacher: '张老师', studentCount: 78, price: 499, status: 1 },
    { courseName: 'Python游戏开发', hierarchyId: '32', description: '使用Pygame开发2D游戏', coverImage: 'https://resources.5aqima.com/cover/coursePackage/02ea5f9e13c14bf7bbccce46f632c33c.png', totalLessons: 30, completedLessons: 0, duration: 900, difficulty: 3, teacher: '赵老师', studentCount: 145, price: 899, status: 1 },

    // C++课程
    { courseName: 'C++程序设计基础', hierarchyId: '22', description: '系统学习C++语法和算法基础', coverImage: 'https://resources.5aqima.com/cover/coursePackage/41a3b3bb66ec43a98e5b5776e703bccf.jpg', totalLessons: 50, completedLessons: 0, duration: 1500, difficulty: 3, teacher: '陈老师', studentCount: 45, price: 899, status: 1 },
    { courseName: 'C++竞赛入门', hierarchyId: '22', description: '为信息学奥赛做准备', coverImage: 'https://resources.5aqima.com/cover/coursePackage/c3af9adcd4ec4c049c2ed84990f614ed.jpg', totalLessons: 60, completedLessons: 0, duration: 1800, difficulty: 4, teacher: '陈老师', studentCount: 28, price: 1299, status: 1 },
    { courseName: '代码西游记', hierarchyId: '22', description: 'C++短期课，通过故事学习编程', coverImage: 'https://resources.5aqima.com/cover/coursePackage/6ce6504026374d83b3b90b44ec501d03.png', totalLessons: 10, completedLessons: 0, duration: 300, difficulty: 1, teacher: '陈老师', studentCount: 89, price: 199, status: 1 },
    { courseName: 'C++数据结构', hierarchyId: '22', description: '深入学习链表、树、图等数据结构', coverImage: 'https://resources.5aqima.com/cover/coursePackage/41a3b3bb66ec43a98e5b5776e703bccf.jpg', totalLessons: 40, completedLessons: 0, duration: 1200, difficulty: 4, teacher: '陈老师', studentCount: 35, price: 1199, status: 1 },
    { courseName: 'C++算法设计', hierarchyId: '22', description: '排序、搜索、动态规划等经典算法', coverImage: 'https://resources.5aqima.com/cover/coursePackage/c3af9adcd4ec4c049c2ed84990f614ed.jpg', totalLessons: 45, completedLessons: 0, duration: 1350, difficulty: 4, teacher: '陈老师', studentCount: 42, price: 1299, status: 1 },

    // 其他课程
    { courseName: 'HTML5网页制作', hierarchyId: '35', description: '学习HTML标签和网页结构', coverImage: 'https://resources.5aqima.com/cover/coursePackage/02ea5f9e13c14bf7bbccce46f632c33c.png', totalLessons: 20, completedLessons: 0, duration: 600, difficulty: 1, teacher: '王老师', studentCount: 178, price: 399, status: 1 },
    { courseName: 'CSS3网页美化', hierarchyId: '35', description: '学习CSS样式和动画效果', coverImage: 'https://resources.5aqima.com/cover/coursePackage/41a3b3bb66ec43a98e5b5776e703bccf.jpg', totalLessons: 20, completedLessons: 0, duration: 600, difficulty: 2, teacher: '王老师', studentCount: 134, price: 399, status: 1 },
    { courseName: 'JavaScript入门', hierarchyId: '35', description: '学习网页交互脚本编程', coverImage: 'https://resources.5aqima.com/cover/coursePackage/c3af9adcd4ec4c049c2ed84990f614ed.jpg', totalLessons: 25, completedLessons: 0, duration: 750, difficulty: 2, teacher: '赵老师', studentCount: 98, price: 499, status: 1 },
    { courseName: 'Arduino创客编程', hierarchyId: '35', description: '硬件控制与物联网基础', coverImage: 'https://resources.5aqima.com/cover/coursePackage/6ce6504026374d83b3b90b44ec501d03.png', totalLessons: 16, completedLessons: 0, duration: 480, difficulty: 2, teacher: '孙老师', studentCount: 56, price: 699, status: 1 },
    { courseName: 'Scratch与Arduino', hierarchyId: '35', description: '结合Scratch控制硬件设备', coverImage: 'https://resources.5aqima.com/cover/coursePackage/02ea5f9e13c14bf7bbccce46f632c33c.png', totalLessons: 12, completedLessons: 0, duration: 360, difficulty: 2, teacher: '孙老师', studentCount: 34, price: 499, status: 1 },
  ];

  // 示例PPT URL（使用Office Online Viewer）
  const samplePptUrls = [
    'https://view.officeapps.live.com/op/embed.aspx?src=https://hackmd.io/%40nosubmit/HJ9XhQ9h4',
    'https://view.officeapps.live.com/op/embed.aspx?src=https://storage.googleapis.com/nrgames/Scratch%20Tutorial.pptx',
  ];

  // 示例视频URL（使用公开的示例视频）
  const sampleVideoUrls = [
    'https://www.bilibili.com/video/BV1r4411R7d5/',  // Scratch入门视频示例
    'https://www.bilibili.com/video/BV1r4411R7d5/',
  ];

  // Scratch课程课时（名称+内容）
  const scratchLessons = [
    { name: '认识Scratch编程环境', content: '了解Scratch界面布局，包括舞台区、角色区、脚本区。学会添加角色和背景，掌握基本操作。本节课将通过趣味案例引导学员熟悉Scratch编程环境。' },
    { name: '角色的移动和旋转', content: '学习使用移动、旋转积木控制角色。理解坐标系统，掌握向右移动、向左移动、旋转等基本动作。完成小猫走方形的练习。' },
    { name: '循环结构初体验', content: '理解循环的概念，学习使用"重复执行"积木实现角色的连续动作。通过让角色画正方形来体会循环的便利。' },
    { name: '等待和重复执行', content: '区分"等待"和"重复执行"的区别，学会控制角色动作的节奏。理解循环中停顿的重要性。' },
    { name: '角色外观控制', content: '学习切换造型、改变大小、显示/隐藏等外观控制积木。制作角色变大变小的动画效果。' },
    { name: '背景切换', content: '学会切换背景、过渡效果，让动画更加生动。制作简单的场景切换动画。' },
    { name: '键盘控制', content: '使用"按键...不放"积木实现键盘控制角色移动。制作可以上下左右控制的小游戏。' },
    { name: '鼠标交互', content: '学习鼠标点击、鼠标位置等交互功能。制作跟随鼠标移动的互动效果。' },
    { name: '碰撞检测', content: '使用"碰到..."积木实现碰撞检测，为游戏开发打下基础。制作吃苹果的小游戏。' },
    { name: '广播消息', content: '理解消息广播和接收机制，实现角色之间的通信。制作多角色协作的动画。' },
    { name: '变量基础', content: '学习变量的创建、赋值和使用，理解变量在编程中的作用。制作计分系统。' },
    { name: '计分系统', content: '利用变量制作计分系统，学习积分增加、显示。完善吃苹果游戏的分数显示。' },
    { name: '计时器', content: '使用计时器功能，制作限时游戏。学习时间控制的基本方法。' },
    { name: '造型切换动画', content: '通过快速切换造型实现帧动画效果。制作角色跑步的动画。' },
    { name: '声音播放', content: '学习播放声音、设置音量的方法。为游戏添加背景音乐和音效。' },
    { name: '画笔功能', content: '使用画笔积木绘制图形，学习抬笔、落笔、盖章等。创作个性化的画作。' },
    { name: '克隆技术', content: '理解克隆的概念，学会使用克隆积木创建多个角色副本。制作分身效果。' },
    { name: '自制积木', content: '学习创建自定义积木，提高代码复用性。封装常用功能为自定义积木。' },
    { name: '复杂游戏逻辑', content: '综合运用所学知识，设计复杂游戏逻辑。开发完整的射击游戏。' },
    { name: '项目整合与调试', content: '完成完整项目，学习调试技巧。优化游戏性能和用户体验。' },
    { name: '高级运动控制', content: '学习更精细的运动控制，如平滑移动、抛物线运动。实现高级运动效果。' },
    { name: '物理模拟初步', content: '模拟重力、弹跳等基本物理现象。制作跳跳球游戏。' },
    { name: '坐标变换', content: '深入理解坐标系统，实现坐标变换效果。制作旋转炮台游戏。' },
    { name: '消息传递机制', content: '复杂场景下的消息传递与协调。实现多角色复杂交互。' },
    { name: '状态机设计', content: '使用状态机思想设计游戏逻辑。管理游戏中的多种状态。' },
    { name: '多人协作模式', content: '学习多人游戏的基本原理。实现双人对战游戏。' },
    { name: '云变量应用', content: '了解云变量的概念和使用。实现网络排行榜功能。' },
    { name: '高级碰撞算法', content: '学习更精确的碰撞检测算法。实现复杂的碰撞逻辑。' },
    { name: '游戏AI设计', content: '设计简单的游戏AI。实现敌人自动追踪和躲避。' },
    { name: '项目优化技巧', content: '学习优化游戏性能的方法。减少卡顿，提升流畅度。' },
    { name: '高级动画效果', content: '制作复杂的动画效果。实现粒子特效和过渡效果。' },
    { name: '数据持久化', content: '学习保存和读取数据。实现游戏进度的保存。' },
    { name: '自定义编辑器', content: '制作关卡编辑器。让用户自定义游戏内容。' },
    { name: '跨课程项目实战', content: '综合Scratch知识完成大型项目。培养项目管理能力。' },
    { name: '作品发布与分享', content: '学习发布和分享作品。创建作品展示页面。' },
  ];

  // Python课程课时（名称+内容）
  const pythonLessons = [
    { name: 'Python环境搭建', content: '安装Python和VS Code编辑器，配置开发环境。学会使用命令行运行Python程序。' },
    { name: '第一个Python程序', content: '编写并运行Hello World程序，了解Python基本语法。学会使用print函数输出内容。' },
    { name: '变量和数据类型', content: '学习变量命名规则，掌握整数、浮点数、字符串等基本数据类型。理解变量的概念。' },
    { name: '运算符与表达式', content: '学习算术运算符、比较运算符、逻辑运算符的使用。完成各种表达式练习。' },
    { name: '条件语句if', content: '掌握if、elif、else语句，实现条件判断。制作猜数字游戏。' },
    { name: '循环语句for', content: '学习for循环的语法和range函数的使用。遍历数字序列。' },
    { name: '循环语句while', content: '掌握while循环和循环条件。理解无限循环的危害。' },
    { name: 'break和continue', content: '学习循环控制语句break和continue。优化循环逻辑。' },
    { name: '列表基础', content: '创建列表、访问元素、切片操作。存储多个数据。' },
    { name: '列表操作', content: '学习添加、删除、修改列表元素。实现待办事项程序。' },
    { name: '元组', content: '了解元组与列表的区别，学习元组的基本操作。不可变序列的使用。' },
    { name: '字典入门', content: '创建字典、访问字典元素。键值对的数据结构。' },
    { name: '字典操作', content: '学习字典的增删改查操作。制作通讯录程序。' },
    { name: '字符串处理', content: '学习字符串的拼接、切片、格式化。处理用户输入。' },
    { name: '字符串格式化', content: '掌握f-string和format格式化方法。输出精美的格式。' },
    { name: '函数定义', content: '学习函数的定义和调用。封装重复代码。' },
    { name: '函数参数', content: '掌握位置参数、关键字参数、默认参数。灵活传递参数。' },
    { name: '返回值', content: '使用return返回函数结果。函数间的数据传递。' },
    { name: '作用域', content: '理解局部变量和全局变量的区别。避免变量冲突。' },
    { name: '递归函数', content: '理解递归概念，编写递归函数。计算阶乘和斐波那契数列。' },
    { name: '匿名函数', content: '学习lambda表达式的使用。简化函数定义。' },
    { name: '内置函数', content: '学习常用内置函数如len、max、min、sum等。利用现成工具。' },
    { name: '文件操作', content: '学习读取和写入文本文件。保存程序数据。' },
    { name: '异常处理', content: '使用try-except处理程序异常。让程序更健壮。' },
    { name: '类和对象', content: '理解面向对象编程，学习类的定义和对象的创建。封装数据和行为。' },
    { name: '继承与多态', content: '学习类的继承和方法重写。代码复用和扩展。' },
    { name: '模块导入', content: '学习导入和使用模块。使用他人编写的代码。' },
    { name: '常用标准库', content: '了解os、sys、math等常用标准库。提高开发效率。' },
    { name: '数据处理基础', content: '使用列表和字典进行数据处理。分析学生成绩。' },
    { name: 'Pygame入门', content: '搭建Pygame开发环境，了解游戏窗口创建。开启游戏开发之旅。' },
    { name: '游戏循环', content: '理解游戏循环原理，实现游戏主循环。保持游戏运行。' },
    { name: '事件处理', content: '处理键盘、鼠标等用户输入事件。响应玩家操作。' },
    { name: '精灵与碰撞', content: '使用精灵实现游戏对象和碰撞检测。检测物体相遇。' },
    { name: '声音与特效', content: '在游戏中添加音效和视觉效果。提升游戏体验。' },
    { name: 'AI实现基础', content: '实现简单的游戏AI，如追逐和躲避。让游戏更有挑战。' },
    { name: '机器学习入门', content: '了解机器学习基本概念，使用scikit-learn进行简单分类。' },
    { name: '数据可视化', content: '使用matplotlib库绘制图表，可视化数据分析结果。' },
    { name: '网络编程基础', content: '学习socket编程，实现简单的TCP/UDP通信。' },
    { name: '数据库操作', content: '使用SQLite数据库，实现数据的增删改查操作。' },
    { name: '多线程编程', content: '学习threading模块，实现多线程程序。提高程序效率。' },
    { name: 'GUI编程入门', content: '使用tkinter库创建图形用户界面。桌面应用程序开发。' },
    { name: '图像识别基础', content: '使用PIL库处理图像，实现简单的图像处理功能。' },
    { name: '自然语言处理', content: '了解NLP基础，使用jieba分词库进行中文分词。' },
    { name: 'API接口调用', content: '学习调用第三方API，获取网络数据。' },
    { name: '项目部署与发布', content: '学习打包和发布Python程序。分享你的作品。' },
  ];

  // C++课程课时（名称+内容）
  const cppLessons = [
    { name: 'C++开发环境', content: '安装Visual Studio或Dev-C++，配置C++开发环境。编写第一个程序。' },
    { name: 'Hello World', content: '编写第一个C++程序，理解程序结构。学会使用iostream输出。' },
    { name: '数据类型', content: '学习整型、浮点型、字符型等基本数据类型。理解内存占用。' },
    { name: '变量与常量', content: '掌握变量声明、初始化和const常量。理解常量的不可变性。' },
    { name: '运算符', content: '学习算术运算符、关系运算符、逻辑运算符。表达式求值。' },
    { name: '输入输出', content: '使用cin和cout进行标准输入输出。交互式程序设计。' },
    { name: 'if语句', content: '掌握if-else条件判断语句。分支程序设计。' },
    { name: 'switch语句', content: '学习switch-case多分支语句。多条件判断。' },
    { name: 'for循环', content: '掌握for循环的语法和使用场景。计数循环。' },
    { name: 'while循环', content: '学习while循环和循环条件。条件循环。' },
    { name: 'do-while循环', content: '掌握do-while循环的特点和应用。先执行后判断。' },
    { name: 'break与continue', content: '学习循环控制语句break和continue。控制循环流程。' },
    { name: '数组', content: '学习一维数组的声明、初始化和使用。批量数据处理。' },
    { name: '字符数组', content: '掌握字符数组和字符串处理。C风格字符串。' },
    { name: '字符串处理', content: '学习C风格字符串的常用函数。字符串操作。' },
    { name: '函数基础', content: '函数的定义、声明和调用。代码封装。' },
    { name: '函数参数传递', content: '理解值传递和引用传递。内存操作。' },
    { name: '函数重载', content: '学习同名函数的不同参数形式。多态基础。' },
    { name: '递归', content: '理解递归原理，编写递归函数。阶乘和汉诺塔。' },
    { name: '作用域与生存期', content: '理解变量作用域和生命周期。内存管理基础。' },
    { name: '指针基础', content: '学习指针的概念和基本操作。地址操作。' },
    { name: '指针与数组', content: '理解指针与数组的关系。指针运算。' },
    { name: '动态内存分配', content: '使用new和delete进行动态内存管理。堆内存使用。' },
    { name: '结构体', content: '学习结构体的定义和使用。自定义数据类型。' },
    { name: '共用体', content: '理解共用体的特点和用途。节省内存。' },
    { name: '枚举类型', content: '学习枚举的定义和使用。限定取值范围。' },
    { name: '文件操作', content: '使用fstream进行文件读写。数据持久化。' },
    { name: '类与对象', content: '理解面向对象，学习类的定义。封装数据和函数。' },
    { name: '构造函数', content: '学习构造函数的定义和调用。对象初始化。' },
    { name: '析构函数', content: '理解析构函数的作用。资源释放。' },
    { name: '类的封装', content: '掌握访问控制符public、private、protected。信息隐藏。' },
    { name: '继承基础', content: '学习类的继承和方法重写。代码复用。' },
    { name: '多态', content: '理解多态的概念和实现。接口重用。' },
    { name: '虚函数', content: '学习虚函数和纯虚函数。运行时多态。' },
    { name: '模板基础', content: '学习函数模板和类模板。泛型编程。' },
    { name: 'STL容器', content: '了解vector、map、set等STL容器。高效数据结构。' },
    { name: '迭代器', content: '学习迭代器的使用。遍历容器。' },
    { name: '算法', content: '学习STL常用算法如sort、find等。常用算法实现。' },
    { name: '智能指针', content: '理解智能指针的作用和使用。自动内存管理。' },
    { name: '移动语义', content: '学习移动构造函数和移动赋值运算符。优化性能。' },
    { name: 'Lambda表达式', content: '学习Lambda表达式的语法和使用。匿名函数。' },
    { name: '类型推导', content: '理解auto和decltype的用法。编译时类型推导。' },
    { name: '委托构造函数', content: '学习构造函数委托。代码复用。' },
    { name: '移动构造函数', content: '掌握移动构造函数的实现。资源转移。' },
    { name: '友元函数', content: '理解友元函数的作用。访问私有成员。' },
    { name: '运算符重载', content: '学习重载运算符。自定义运算行为。' },
    { name: '设计模式入门', content: '了解单例、工厂等常用设计模式。' },
    { name: '竞赛算法进阶', content: '学习竞赛中常用的进阶算法。' },
    { name: '高级数据结构', content: '学习线段树、平衡树等高级数据结构。' },
  ];

  // 其他课程课时（名称+内容）
  const otherLessons = [
    { name: '课程介绍与环境准备', content: '介绍课程内容和学习目标，配置开发环境。' },
    { name: '基本概念讲解', content: '讲解核心概念和基础知识。打好学习基础。' },
    { name: '语法基础', content: '学习基本语法规则。编写正确代码。' },
    { name: '核心功能', content: '深入学习核心功能模块。掌握关键技术。' },
    { name: '实践练习', content: '通过练习巩固所学知识。动手实践。' },
    { name: '综合应用', content: '综合运用多种技术。融会贯通。' },
    { name: '项目实战', content: '完成实际项目开发。积累项目经验。' },
    { name: '常见问题解答', content: '解答学习中的常见问题。扫清学习障碍。' },
    { name: '进阶技巧', content: '学习高级技巧和最佳实践。提升开发效率。' },
    { name: '性能优化', content: '优化程序性能。减少资源消耗。' },
  ];

  for (const c of courses) {
    const existing = await courseRepo.findOne({ where: { courseName: c.courseName } });
    if (!existing) {
      const course = courseRepo.create(c);
      await courseRepo.save(course);

      // 根据课程类型选择课时模板
      let lessonTemplates;
      if (c.hierarchyId === '21') {
        lessonTemplates = scratchLessons;
      } else if (c.hierarchyId === '32') {
        lessonTemplates = pythonLessons;
      } else if (c.hierarchyId === '22') {
        lessonTemplates = cppLessons;
      } else {
        lessonTemplates = otherLessons;
      }

      // 为每个课程创建课时
      for (let i = 1; i <= c.totalLessons; i++) {
        const lessonTemplate = lessonTemplates[(i - 1) % lessonTemplates.length];
        const lessonData: any = {
          courseId: course.id,
          lessonName: `第${i}课: ${lessonTemplate.name}`,
          lessonOrder: i,
          content: lessonTemplate.content,
          videoUrl: sampleVideoUrls[0], // 为所有课程添加占位视频URL
          duration: Math.floor(Math.random() * 20) + 20, // 20-40分钟
          isCompleted: i <= c.completedLessons ? 1 : 0,
        };
        // 给Scratch课程前两课添加PPT
        if (c.hierarchyId === '21' && i <= 2 && samplePptUrls.length > 0) {
          lessonData.pptUrl = samplePptUrls[i - 1];
        }
        const lesson = lessonRepo.create(lessonData);
        await lessonRepo.save(lesson);
      }
      console.log('  ✓ ' + c.courseName + ` (${c.totalLessons}课时)`);
    } else {
      console.log('  - 已存在: ' + c.courseName);
    }
  }

  // 3. 创建通知
  console.log('\n📢 创建通知...');
  const notices = [
    {
      noticeId: '216',
      title: '【课程上新】C++短期课《代码西游记》',
      content: '全新C++趣味编程课程，通过西游记故事学习编程，适合零基础入门！',
      noticeType: '课程',
      popupType: 3,
      contentType: 2,
      sendTime: Date.now() - 86400000,
      popupStartTime: Date.now() - 86400000,
      popupEndTime: Date.now() + 86400000 * 7,
    },
    {
      noticeId: '214',
      title: '【新功能】课堂互动',
      content: '新增实时课堂互动功能，老师可以在线演示，学生可以同步操作！',
      noticeType: '功能',
      popupType: 3,
      contentType: 2,
      sendTime: Date.now() - 86400000 * 7,
      popupStartTime: Date.now() - 86400000 * 7,
      popupEndTime: Date.now() + 86400000,
    },
  ];

  for (const n of notices) {
    const existing = await noticeRepo.findOne({ where: { noticeId: n.noticeId } });
    if (!existing) {
      const notice = noticeRepo.create(n);
      await noticeRepo.save(notice);
      console.log('  ✓ ' + n.title);
    } else {
      console.log('  - 已存在: ' + n.title);
    }
  }

  // 4. 创建更多测试用户
  console.log('\n👤 创建测试用户...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const teachers = [
    { username: 'teacher_li', account: 'li.teacher@test.com', name: '李老师', classes: ['Scratch零基础入门', 'Scratch进阶提高', 'Scratch创意动画'] },
    { username: 'teacher_wang', account: 'wang.teacher@test.com', name: '王老师', classes: ['Scratch游戏制作', 'Scratch乐器模拟', 'HTML5网页制作', 'CSS3网页美化'] },
    { username: 'teacher_zhang', account: 'zhang.teacher@test.com', name: '张老师', classes: ['Python趣味编程', 'Python人工智能入门', 'Python数据分析'] },
    { username: 'teacher_zhao', account: 'zhao.teacher@test.com', name: '赵老师', classes: ['Python网络爬虫', 'Python游戏开发', 'JavaScript入门'] },
    { username: 'teacher_chen', account: 'chen.teacher@test.com', name: '陈老师', classes: ['C++程序设计基础', 'C++竞赛入门', '代码西游记', 'C++数据结构', 'C++算法设计'] },
    { username: 'teacher_sun', account: 'sun.teacher@test.com', name: '孙老师', classes: ['Arduino创客编程', 'Scratch与Arduino'] },
  ];

  const students = [
    { username: 'student', account: 'student@test.com', name: '测试学生' },
    { username: 'student_zhang', account: 'zhang.student@test.com', name: '张同学' },
    { username: 'student_wang', account: 'wang.student@test.com', name: '王同学' },
    { username: 'student_li', account: 'li.student@test.com', name: '李同学' },
    { username: 'student_chen', account: 'chen.student@test.com', name: '陈同学' },
    { username: 'student_zhao', account: 'zhao.student@test.com', name: '赵同学' },
    { username: 'student_sun', account: 'sun.student@test.com', name: '孙同学' },
    { username: 'student_wu', account: 'wu.student@test.com', name: '吴同学' },
    { username: 'student_zhou', account: 'zhou.student@test.com', name: '周同学' },
    { username: 'student_wu2', account: 'wu2.student@test.com', name: '吴同学2' },
  ];

  // 创建教师账号
  for (const t of teachers) {
    const existing = await userRepo.findOne({ where: { account: t.account } });
    if (!existing) {
      const teacher = userRepo.create({
        username: t.username,
        account: t.account,
        password: hashedPassword,
        name: t.name,
        role: 3,
        userType: 2,
        status: 1,
      });
      await userRepo.save(teacher);
      console.log(`  ✓ 教师账号: ${t.account} / password123 (${t.name})`);
    } else {
      console.log(`  - 已存在: ${t.account}`);
    }
  }

  // 创建学生账号
  for (const s of students) {
    const existing = await userRepo.findOne({ where: { account: s.account } });
    if (!existing) {
      const student = userRepo.create({
        username: s.username,
        account: s.account,
        password: hashedPassword,
        name: s.name,
        role: 2,
        userType: 2,
        status: 1,
      });
      await userRepo.save(student);
      console.log(`  ✓ 学生账号: ${s.account} / password123 (${s.name})`);
    } else {
      console.log(`  - 已存在: ${s.account}`);
    }
  }

  // 创建管理员账号
  const adminUser = await userRepo.findOne({ where: { account: 'admin@test.com' } });
  const adminByUsername = await userRepo.findOne({ where: { username: 'admin' } });
  if (!adminUser && !adminByUsername) {
    const admin = userRepo.create({
      username: 'admin',
      account: 'admin@test.com',
      password: hashedPassword,
      name: '系统管理员',
      role: 1,
      userType: 2,
      status: 1,
    });
    await userRepo.save(admin);
    console.log('  ✓ 管理员账号: admin@test.com / password123');
  } else {
    console.log('  - 已存在: admin@test.com 或 admin 用户');
  }

  // 创建/更新测试管理员账号 (admin / admin)
  const hashedPasswordAdmin = await bcrypt.hash('admin', 10);
  const existingAdmin = await userRepo.findOne({ where: { account: 'admin' } });
  if (existingAdmin) {
    existingAdmin.password = hashedPasswordAdmin;
    existingAdmin.username = 'admin';
    existingAdmin.name = '管理员';
    existingAdmin.role = 1;
    existingAdmin.userType = 1;
    existingAdmin.status = 1;
    await userRepo.save(existingAdmin);
    console.log('  ✓ 管理员账号已更新: admin / admin');
  } else {
    const byUsername = await userRepo.findOne({ where: { username: 'admin' } });
    if (!byUsername) {
      const newAdmin = userRepo.create({
        username: 'admin',
        account: 'admin',
        password: hashedPasswordAdmin,
        name: '管理员',
        role: 1,
        userType: 1,
        status: 1,
      });
      await userRepo.save(newAdmin);
      console.log('  ✓ 管理员账号已创建: admin / admin');
    } else {
      console.log('  - admin 用户名已被占用');
    }
  }

  // 5. 创建示例作业
  console.log('\n📝 创建示例作业...');
  const homeworkRepo = dataSource.getRepository(Homework);
  const submissionRepo = dataSource.getRepository(HomeworkSubmission);

  const homeworks = [
    {
      title: 'Scratch基础练习 - 角色移动',
      description: '使用Scratch实现一个能够响应键盘方向键控制的角色移动程序。要求：\n1. 角色能够上下左右移动\n2. 移动边界不能超出舞台\n3. 添加适当的移动动画效果',
      courseId: 1,
      teacherId: 1,
      teacherName: '李老师',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      totalScore: 100,
      status: 1,
    },
    {
      title: 'Scratch进阶 - 制作一个射击游戏',
      description: '使用Scratch制作一个完整的射击游戏。\n要求：\n1. 玩家控制飞船或角色\n2. 有敌机或敌人出现\n3. 可以发射子弹\n4. 有分数显示\n5. 有游戏结束条件',
      courseId: 2,
      teacherId: 1,
      teacherName: '李老师',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
      totalScore: 100,
      status: 1,
    },
    {
      title: 'Python基础 - 猜数字游戏',
      description: '使用Python编写一个猜数字游戏。\n要求：\n1. 程序随机生成1-100的数字\n2. 用户输入猜测的数字\n3. 程序提示猜大了还是猜小了\n4. 记录猜测次数\n5. 猜对后显示恭喜消息和猜测次数',
      courseId: 3,
      teacherId: 3,
      teacherName: '张老师',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5天后
      totalScore: 100,
      status: 1,
    },
    {
      title: 'Python进阶 - 学生成绩管理系统',
      description: '使用Python编写一个简单的学生成绩管理系统。\n要求：\n1. 能够添加学生信息（姓名、成绩）\n2. 能够查看所有学生成绩\n3. 能够计算平均分、最高分、最低分\n4. 数据保存在文件中',
      courseId: 3,
      teacherId: 3,
      teacherName: '张老师',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10天后
      totalScore: 100,
      status: 1,
    },
    {
      title: 'C++基础 - 实现排序算法',
      description: '使用C++实现以下排序算法：\n1. 冒泡排序\n2. 选择排序\n3. 快速排序\n\n要求：\n1. 每种排序算法用独立函数实现\n2. 生成随机数组进行测试\n3. 输出排序前后的数组\n4. 计算并显示每种排序的执行时间',
      courseId: 5,
      teacherId: 5,
      teacherName: '陈老师',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天后
      totalScore: 100,
      status: 1,
    },
    {
      title: 'C++进阶 - 链表操作',
      description: '使用C++实现单向链表的基本操作：\n1. 创建链表\n2. 在链表末尾添加节点\n3. 在指定位置插入节点\n4. 删除指定位置的节点\n5. 遍历并输出链表内容',
      courseId: 5,
      teacherId: 5,
      teacherName: '陈老师',
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14天后
      totalScore: 100,
      status: 1,
    },
  ];

  for (const hw of homeworks) {
    const existing = await homeworkRepo.findOne({ where: { title: hw.title } });
    if (!existing) {
      const homework = homeworkRepo.create(hw);
      await homeworkRepo.save(homework);
      console.log('  ✓ ' + hw.title);

      // 为部分作业创建一些示例提交
      const studentIds = [2, 3, 4, 5]; // 学生用户ID
      const randomStudents = studentIds.sort(() => Math.random() - 0.5).slice(0, Math.floor(Math.random() * 3) + 1);

      for (const studentId of randomStudents) {
        const student = await userRepo.findOne({ where: { id: studentId } });
        if (student) {
          const submission = submissionRepo.create({
            homeworkId: homework.id,
            studentId: studentId,
            content: `这是${student.name}的作业提交。\n\n完成了基本要求：\n1. 阅读并理解了题目要求\n2. 编写了相应的代码\n3. 进行了测试验证\n\n请老师批阅！`,
            submittedAt: new Date(Date.now() - Math.floor(Math.random() * 5) * 24 * 60 * 60 * 1000),
            status: 1,
          });
          await submissionRepo.save(submission);
        }
      }
    } else {
      console.log('  - 已存在: ' + hw.title);
    }
  }

  console.log('\n========================================');
  console.log('✅ 数据初始化完成!');
  console.log('========================================');

  await dataSource.destroy();
}

seed().catch(console.error);