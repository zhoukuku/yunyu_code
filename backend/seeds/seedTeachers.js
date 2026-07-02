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

  // Create users table if not exists
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

  // Delete existing teacher accounts first
  await AppDataSource.query("DELETE FROM users WHERE username LIKE 'teacher%'");
  console.log('Cleared existing teacher accounts');

  // Create 10 teacher accounts
  const teacherValues = [];
  for (let i = 1; i <= 10; i++) {
    teacherValues.push("('teacher" + i + "', 'teacher" + i + "', '123456', '教师" + i + "', NULL, 2, 1, '教师" + i + "', 0, datetime('now'), datetime('now'), 1, 2)");
  }
  await AppDataSource.query(`
    INSERT INTO users (username, account, password, name, avatar, userType, sex, nickname, wechatStatus, createdAt, updatedAt, status, role)
    VALUES ` + teacherValues.join(','));
  console.log('Created 10 teacher accounts (teacher1-teacher10, password: 123456)');

  // Summary
  const [teacherCount] = await AppDataSource.query("SELECT COUNT(*) as count FROM users WHERE role = 2");
  console.log('\n=== Seed Summary ===');
  console.log('Teachers: ' + teacherCount.count);

  await AppDataSource.destroy();
  console.log('\nTeacher seed completed successfully!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
