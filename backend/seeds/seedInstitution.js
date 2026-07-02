const { DataSource } = require('typeorm');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [],
  synchronize: false,
  logging: false,
});

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  // Create institutions table if not exists
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS institutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      institutionCode TEXT UNIQUE NOT NULL,
      institutionName TEXT NOT NULL,
      description TEXT,
      address TEXT,
      contactPhone TEXT,
      status INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Ensured institutions table exists');

  // Clear existing data
  await AppDataSource.query('DELETE FROM user_courses');
  await AppDataSource.query('DELETE FROM courses');
  await AppDataSource.query('DELETE FROM users');
  await AppDataSource.query('DELETE FROM institutions');
  console.log('Existing data cleared');

  // 1. Create 3 institutions
  await AppDataSource.query(`
    INSERT INTO institutions (institutionCode, institutionName, description, address, contactPhone, status, createdAt, updatedAt)
    VALUES
    ('INST001', '北京市第一少儿编程学校', '专注于3-12岁儿童编程教育', '北京市朝阳区建国路88号', '010-12345678', 1, datetime('now'), datetime('now')),
    ('INST002', '上海市星光科技培训中心', '培养未来科技之星', '上海市浦东新区张江高科技园区', '021-87654321', 1, datetime('now'), datetime('now')),
    ('INST003', '深圳市创客梦工场', '激发创造力，点亮未来', '深圳市南山区科技园南区', '0755-98765432', 1, datetime('now'), datetime('now'))
  `);
  console.log('Created 3 institutions');

  // 2. Create 10 teacher accounts (batch insert)
  const teacherValues = [];
  for (let i = 1; i <= 10; i++) {
    teacherValues.push("('teacher" + i + "', 'teacher" + i + "@school.com', 'Qima@2024', '教师" + i + "', 3, 3, 1, datetime('now'), datetime('now'))");
  }
  await AppDataSource.query(`
    INSERT INTO users (username, account, password, name, userType, role, status, createdAt, updatedAt)
    VALUES ` + teacherValues.join(','));
  console.log('Created 10 teacher accounts');

  // 3. Create 50 student accounts (batch insert)
  const studentValues = [];
  for (let i = 1; i <= 50; i++) {
    studentValues.push("('student" + i + "', 'student" + i + "@school.com', 'Qima@2024', '学员" + i + "', 2, 2, 1, datetime('now'), datetime('now'))");
  }
  await AppDataSource.query(`
    INSERT INTO users (username, account, password, name, userType, role, status, createdAt, updatedAt)
    VALUES ` + studentValues.join(','));
  console.log('Created 50 student accounts');

  // 4. Create 15 courses (batch insert)
  const courseNames = [
    'Scratch入门课程', 'Python基础编程', 'JavaScript动画设计',
    'Arduino创客入门', 'Minecraft红石电路', 'APP Inventor手机开发',
    'Unity 3D游戏开发', 'Web前端基础', '数据结构与算法', '人工智能初探',
    'C++编程基础', 'Java面向对象编程', '计算机图形学入门', '机器人编程',
    '物联网应用开发',
  ];

  const courseValues = [];
  for (let i = 0; i < courseNames.length; i++) {
    const totalLessons = Math.floor(Math.random() * 20) + 10;
    const duration = Math.floor(Math.random() * 600) + 60;
    const difficulty = Math.floor(Math.random() * 5) + 1;
    const price = Math.floor(Math.random() * 500) + 99;
    const teacherNum = (i % 10) + 1;
    courseValues.push("('" + courseNames[i] + "', 'HIER" + String(i + 1).padStart(3, '0') + "', '" + courseNames[i] + "课程，循序渐进，轻松学习', 'https://example.com/courses/" + (i + 1) + ".jpg', " + totalLessons + ", 0, " + duration + ", " + difficulty + ", '教师" + teacherNum + "', 0, " + price + ", 1, datetime('now'))");
  }
  await AppDataSource.query(`
    INSERT INTO courses (courseName, hierarchyId, description, coverImage, totalLessons, completedLessons, duration, difficulty, teacher, studentCount, price, status, createdAt)
    VALUES ` + courseValues.join(','));
  console.log('Created 15 courses');

  // 5. Create 100 course progress records (batch insert)
  const progressStatuses = [1, 1, 1, 0];
  const progressValues = [];
  for (let i = 0; i < 100; i++) {
    const studentId = (i % 50) + 11;
    const courseId = (i % 15) + 1;
    const status = progressStatuses[Math.floor(Math.random() * progressStatuses.length)];
    const completedLessons = Math.floor(Math.random() * 21);
    const lastLessonId = completedLessons > 0 ? Math.min(completedLessons, 20) : 0;
    progressValues.push("(" + studentId + ", " + courseId + ", " + completedLessons + ", " + lastLessonId + ", " + status + ", datetime('now'))");
  }
  await AppDataSource.query(`
    INSERT INTO user_courses (userId, courseId, completedLessons, lastLessonId, status, enrolledAt)
    VALUES ` + progressValues.join(','));
  console.log('Created 100 course progress records');

  // Summary
  const [instCount] = await AppDataSource.query('SELECT COUNT(*) as count FROM institutions');
  const [teacherCount] = await AppDataSource.query("SELECT COUNT(*) as count FROM users WHERE role = 3");
  const [studentCount] = await AppDataSource.query("SELECT COUNT(*) as count FROM users WHERE role = 2");
  const [courseCount] = await AppDataSource.query('SELECT COUNT(*) as count FROM courses');
  const [progressCount] = await AppDataSource.query('SELECT COUNT(*) as count FROM user_courses');

  console.log('\n=== Seed Summary ===');
  console.log('Institutions: ' + instCount.count);
  console.log('Teachers: ' + teacherCount.count);
  console.log('Students: ' + studentCount.count);
  console.log('Courses: ' + courseCount.count);
  console.log('Course Progress: ' + progressCount.count);

  await AppDataSource.destroy();
  console.log('\nSeed completed successfully!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
