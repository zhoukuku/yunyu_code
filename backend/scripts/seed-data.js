const mysql = require('mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306, user: 'root', password: 'root', database: 'yunyu_learning',
  });

  console.log('🌱 开始填充初始数据...\n');
  const DEFAULT_PASSWORD = 'Qima@2024';

  // 1. Admin user (role=1)
  const [existingAdmin] = await conn.query('SELECT id FROM users WHERE account = ?', ['admin']);
  if (existingAdmin.length === 0) {
    await conn.query(
      'INSERT INTO users (username, account, password, name, userType, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', 'admin', DEFAULT_PASSWORD, '管理员', 1, 1]
    );
    console.log('✅ 管理员: admin / Qima@2024 (角色:1)');
  } else {
    await conn.query('UPDATE users SET role = 1, userType = 1 WHERE account = ?', ['admin']);
    console.log('✅ 管理员已更新为角色1');
  }

  // 2. Teacher
  const [existingTeacher] = await conn.query('SELECT id FROM users WHERE account = ?', ['teacher']);
  if (existingTeacher.length === 0) {
    await conn.query(
      'INSERT INTO users (username, account, password, name, userType, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['teacher', 'teacher', DEFAULT_PASSWORD, '张老师', 2, 2]
    );
    console.log('✅ 教师: teacher / Qima@2024');
  }

  // 3. Student
  const [existingStudent] = await conn.query('SELECT id FROM users WHERE account = ?', ['student']);
  if (existingStudent.length === 0) {
    await conn.query(
      'INSERT INTO users (username, account, password, name, userType, role) VALUES (?, ?, ?, ?, ?, ?)',
      ['student', 'student', DEFAULT_PASSWORD, '小明', 3, 3]
    );
    console.log('✅ 学生: student / Qima@2024');
  }

  // 4. Hierarchy
  const [existingH] = await conn.query('SELECT COUNT(*) as cnt FROM hierarchy');
  if (existingH[0].cnt === 0) {
    const hierarchies = [
      ['Scratch', '图形化编程', 'Scratch创意编程'],
      ['Python', '代码编程', 'Python趣味编程'],
      ['C++', '算法竞赛', 'C++信息学奥赛'],
    ];
    for (var i = 0; i < hierarchies.length; i++) {
      var h = hierarchies[i];
      var hid = 'CAT' + (i + 1);
      await conn.query(
        'INSERT INTO hierarchy (hierarchyId, hierarchyName, standardClassifyId, standardClassifyName, themeClassifyId, themeClassifyName) VALUES (?, ?, ?, ?, ?, ?)',
        [hid, h[0], 'STD' + (i + 1), h[1], 'THM' + (i + 1), h[2]]
      );
    }
    console.log('✅ 课程分类: Scratch / Python / C++');
  }

  // 5. Courses with lessons (force re-insert by clearing first)
  await conn.query('DELETE FROM lessons');
  await conn.query('DELETE FROM courses');
  const [existingC] = await conn.query('SELECT COUNT(*) as cnt FROM courses');
  if (existingC[0].cnt === 0) {
    const [rows] = await conn.query('SELECT hierarchyId, hierarchyName FROM hierarchy');
    const hMap = {};
    rows.forEach(function(h) { hMap[h.hierarchyName] = h.hierarchyId; });

    const courses = [
      {
        name: 'Scratch入门 - 海底跑酷', hid: hMap['Scratch'] || 'CAT1',
        teacher: '张老师',
        desc: '学习Scratch图形化编程基础，制作海底跑酷游戏。通过趣味项目掌握编程思维。',
        diff: 1, total: 10, free: 1,
        lessons: [
          ['认识Scratch界面', '了解Scratch编辑器和积木区', 1, 15],
          ['让角色动起来', '学习运动积木控制角色', 2, 20],
          ['循环和重复', '掌握重复执行积木', 3, 20],
          ['条件判断', '学习如果-那么积木', 4, 20],
          ['变量和得分', '创建游戏得分系统', 5, 25],
          ['广播消息', '角色间通信协作', 6, 20],
          ['克隆和特效', '克隆技术和视觉特效', 7, 25],
          ['海底跑酷(上)', '设计背景和障碍物', 8, 30],
          ['海底跑酷(下)', '完善逻辑和音效', 9, 30],
          ['作品展示与分享', '测试优化发布作品', 10, 20],
        ]
      },
      {
        name: 'Python入门 - 趣味编程', hid: hMap['Python'] || 'CAT2',
        teacher: '李老师',
        desc: '从零开始学Python，通过趣味案例掌握编程基础。包含变量、循环、函数等核心概念。',
        diff: 1, total: 8, free: 1,
        lessons: [
          ['Hello Python!', '安装Python运行第一个程序', 1, 15],
          ['变量和数据类型', '理解变量、数字、字符串', 2, 20],
          ['条件判断', 'if-elif-else分支', 3, 20],
          ['循环结构', 'for循环和while循环', 4, 25],
          ['列表和字典', '数据容器的使用', 5, 25],
          ['函数定义', 'def函数参数返回值', 6, 25],
          ['Turtle绘图', '用turtle库绘制图形', 7, 30],
          ['综合项目', '制作Python小游戏', 8, 35],
        ]
      },
      {
        name: 'C++入门 - 信息学奥赛', hid: hMap['C++'] || 'CAT3',
        teacher: '王老师',
        desc: '从零开始系统学习C++编程，涵盖输入输出、变量、循环、数组等核心知识。',
        diff: 2, total: 8, free: 0,
        lessons: [
          ['C++开发环境', '安装编译器配置IDE', 1, 15],
          ['输入输出基础', 'cout/cin基础用法', 2, 20],
          ['变量和数据类型', 'int/float/char/string', 3, 20],
          ['条件分支', 'if-else和switch', 4, 20],
          ['循环结构', 'for/while/do-while', 5, 25],
          ['一维数组', '数组定义和使用', 6, 25],
          ['字符串处理', 'string类常用方法', 7, 25],
          ['综合练习', '解决经典算法题', 8, 35],
        ]
      },
    ];

    for (const course of courses) {
      const [result] = await conn.query(
        'INSERT INTO courses (courseName, hierarchyId, teacher, description, difficulty, totalLessons, price, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [course.name, course.hid, course.teacher, course.desc, course.diff, course.total, course.free ? 0 : 99, 1]
      );
      const courseId = result.insertId;

      for (const l of course.lessons) {
        await conn.query(
          'INSERT INTO lessons (courseId, lessonName, content, lessonOrder, duration) VALUES (?, ?, ?, ?, ?)',
          [courseId, l[0], l[1], l[2], l[3]]
        );
      }
      console.log('✅ ' + course.name + ' (' + course.lessons.length + '节课)');
    }
  }

  // 6. Notices
  const [existingN] = await conn.query('SELECT COUNT(*) as cnt FROM notices');
  if (existingN[0].cnt === 0) {
    var now = Math.floor(Date.now() / 1000);
    await conn.query(
      'INSERT INTO notices (noticeId, title, content, noticeType, popupType, contentType, sendTime) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['NOT001', '【课程上新】Scratch《海底跑酷》', '全新Scratch入门课程已上线！', 'course', 1, 1, now]
    );
    await conn.query(
      'INSERT INTO notices (noticeId, title, content, noticeType, popupType, contentType, sendTime) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['NOT002', '【新功能】课堂互动上线', '现在可以在课堂上实时互动啦！', 'system', 1, 1, now]
    );
    console.log('✅ 系统通知 x2');
  }

  // 7. Sample class
  const [existingCl] = await conn.query('SELECT COUNT(*) as cnt FROM classes');
  if (existingCl[0].cnt === 0) {
    await conn.query(
      'INSERT INTO classes (className, teacherId, lastCourseName, studentNum, totalCourseNum, hadCourseNum, isEnd) VALUES (?, ?, ?, ?, ?, ?, ?)',
      ['Scratch初级班', 2, 'Scratch入门 - 海底跑酷', 5, 10, 3, false]
    );
    console.log('✅ 班级: Scratch初级班 (5名学生)');
  }

  await conn.end();
  console.log('\n🎉 数据填充完成！');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  管理员: admin  / Qima@2024');
  console.log('  教师:   teacher / Qima@2024');
  console.log('  学生:   student / Qima@2024');
  console.log('  课程:   3门 (共26节课)');
  console.log('  班级:   1个');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

seed().catch(function(e) { console.error(e.message); process.exit(1); });
