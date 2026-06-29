const { DataSource } = require('typeorm');
const bcrypt = require('bcrypt');

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [],
  synchronize: false,
  logging: false,
});

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function seed() {
  await AppDataSource.initialize();
  console.log('Database connected');

  // Ensure users table exists
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      account TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      avatar TEXT,
      userType INTEGER DEFAULT 2,
      sex INTEGER DEFAULT 0,
      nickname TEXT,
      wechatStatus INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      email TEXT,
      phone TEXT,
      role INTEGER DEFAULT 3,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Ensured users table exists');

  // Ensure students table exists
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationId INTEGER,
      userId INTEGER,
      studentNumber TEXT,
      grade TEXT,
      major TEXT,
      status INTEGER DEFAULT 1,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (organizationId) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured students table exists');

  // Ensure organizations table exists
  await AppDataSource.query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      organizationCode TEXT UNIQUE NOT NULL,
      organizationName TEXT NOT NULL,
      description TEXT,
      address TEXT,
      contactPhone TEXT,
      contactEmail TEXT,
      status INTEGER DEFAULT 1,
      logo TEXT,
      classCount INTEGER DEFAULT 0,
      studentCount INTEGER DEFAULT 0,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('Ensured organizations table exists');

  // Check if organizations exist, create default if not
  const [orgCount] = await AppDataSource.query('SELECT COUNT(*) as count FROM organizations');
  if (orgCount.count === 0) {
    await AppDataSource.query(`
      INSERT INTO organizations (organizationCode, organizationName, description, address, contactPhone, status, createdAt, updatedAt)
      VALUES
      ('INST001', '默认编程学校', '专注于少儿编程教育', '北京市朝阳区', '010-12345678', 1, datetime('now'), datetime('now'))
    `);
    console.log('Created default organization');
  }

  // Get organization id
  const [org] = await AppDataSource.query('SELECT id FROM organizations LIMIT 1');
  const organizationId = org.id;

  // Delete existing student accounts (student001-student050)
  await AppDataSource.query("DELETE FROM users WHERE username LIKE 'student%' AND username LIKE 'student___\%'");
  console.log('Cleared existing student accounts with pattern studentXXX');

  // Delete existing students records
  await AppDataSource.query('DELETE FROM students');
  console.log('Cleared existing students records');

  // Create 50 student accounts (student001 - student050)
  const password = await hashPassword('123456');
  const userValues = [];
  const studentValues = [];

  for (let i = 1; i <= 50; i++) {
    const num = String(i).padStart(3, '0');
    const username = 'student' + num;
    const account = 'student' + num + '@school.com';
    const name = '学员' + num;

    userValues.push("('" + username + "', '" + account + "', '" + password + "', '" + name + "', NULL, 2, 1, '" + name + "', 0, 1, 3, datetime('now'), datetime('now'))");
  }

  await AppDataSource.query(`
    INSERT INTO users (username, account, password, name, avatar, userType, sex, nickname, wechatStatus, status, role, createdAt, updatedAt)
    VALUES ` + userValues.join(','));
  console.log('Created 50 student user accounts (student001-student050, password: 123456)');

  // Get the inserted user ids (they should be the last 50 inserted)
  const students = await AppDataSource.query(`
    SELECT id, username FROM users
    WHERE username LIKE 'student%'
    AND username LIKE 'student___\%'
    ORDER BY id ASC
  `);

  // Create students records
  for (let i = 0; i < students.length; i++) {
    const studentNum = String(i + 1).padStart(3, '0');
    const grade = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级'][i % 6];
    const major = ['Scratch编程', 'Python编程', 'Arduino创客', 'Minecraft红石', 'Web开发'][i % 5];

    studentValues.push("(" + organizationId + ", " + students[i].id + ", 'STU" + studentNum + "', '" + grade + "', '" + major + "', 1, datetime('now'), datetime('now'))");
  }

  await AppDataSource.query(`
    INSERT INTO students (organizationId, userId, studentNumber, grade, major, status, createdAt, updatedAt)
    VALUES ` + studentValues.join(','));
  console.log('Created 50 student records');

  // Update organization student count
  await AppDataSource.query('UPDATE organizations SET studentCount = 50 WHERE id = ' + organizationId);

  // Summary
  const [userCount] = await AppDataSource.query("SELECT COUNT(*) as count FROM users WHERE username LIKE 'student%' AND username LIKE 'student___\%'");
  const [studentCount] = await AppDataSource.query('SELECT COUNT(*) as count FROM students');

  console.log('\n=== Student Seed Summary ===');
  console.log('Student users: ' + userCount.count);
  console.log('Student records: ' + studentCount.count);
  console.log('\nStudent accounts created:');
  for (let i = 1; i <= 10; i++) {
    const num = String(i).padStart(3, '0');
    console.log('  student' + num + ' (password: 123456)');
  }
  console.log('  ... (student011 - student050)');

  await AppDataSource.destroy();
  console.log('\nStudent seed completed successfully!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});