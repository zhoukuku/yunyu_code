const initSqlJs = require('sql.js');
const fs = require('fs');

const DB_PATH = 'e:/k/meee/code/project01/backend/database.sqlite';

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr, count) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

async function seed() {
  // Initialize sql.js
  const SQL = await initSqlJs();

  // Load existing database
  let db;
  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }
  console.log('Database loaded');

  // Ensure user_courses table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS user_courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      courseId INTEGER NOT NULL,
      completedLessons INTEGER DEFAULT 0,
      lastLessonId INTEGER DEFAULT 0,
      status INTEGER DEFAULT 1,
      enrolledAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (courseId) REFERENCES courses(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured user_courses table exists');

  // Ensure user_lesson_progress table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS user_lesson_progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId INTEGER NOT NULL,
      lessonId INTEGER NOT NULL,
      isCompleted INTEGER DEFAULT 0,
      completedAt TEXT,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (lessonId) REFERENCES lessons(id) ON DELETE CASCADE
    )
  `);
  console.log('Ensured user_lesson_progress table exists');

  // Clear existing course progress data
  db.run('DELETE FROM user_lesson_progress');
  db.run('DELETE FROM user_courses');
  console.log('Cleared existing course progress data');

  // Get all students with their userIds
  const studentsResult = db.exec(`
    SELECT s.id as studentId, s.userId, u.username
    FROM students s
    JOIN users u ON s.userId = u.id
    WHERE s.status = 1
  `);
  const students = studentsResult.length > 0 ? studentsResult[0].values.map(row => ({
    studentId: row[0],
    userId: row[1],
    username: row[2]
  })) : [];
  console.log(`Found ${students.length} active students`);

  // Get all available courses
  const coursesResult = db.exec('SELECT id, courseName, totalLessons FROM courses WHERE status = 1');
  const courses = coursesResult.length > 0 ? coursesResult[0].values.map(row => ({
    id: row[0],
    courseName: row[1],
    totalLessons: row[2]
  })) : [];
  console.log(`Found ${courses.length} available courses`);

  // Ensure lessons exist for all courses
  for (const course of courses) {
    const lessonCountResult = db.exec(`SELECT COUNT(*) as count FROM lessons WHERE courseId = ${course.id}`);
    const lessonCount = lessonCountResult.length > 0 ? lessonCountResult[0].values[0][0] : 0;

    if (lessonCount === 0) {
      console.log(`Creating ${course.totalLessons} lessons for course ${course.id} (${course.courseName})...`);
      const stmt = db.prepare('INSERT INTO lessons (courseId, lessonName, lessonOrder, duration, isCompleted, createdAt) VALUES (?, ?, ?, ?, 0, datetime("now"))');

      for (let i = 1; i <= course.totalLessons; i++) {
        const duration = randomInt(15, 45);
        stmt.run([course.id, `课时${i}`, i, duration]);
      }
      stmt.free();
      console.log(`  Created ${course.totalLessons} lessons`);
    }
  }

  // Get all lessons for later reference
  const allLessonsResult = db.exec('SELECT id, courseId, lessonOrder FROM lessons ORDER BY courseId, lessonOrder');
  const allLessons = allLessonsResult.length > 0 ? allLessonsResult[0].values.map(row => ({
    id: row[0],
    courseId: row[1],
    lessonOrder: row[2]
  })) : [];

  const lessonsByCourse = {};
  for (const lesson of allLessons) {
    if (!lessonsByCourse[lesson.courseId]) {
      lessonsByCourse[lesson.courseId] = [];
    }
    lessonsByCourse[lesson.courseId].push(lesson);
  }
  console.log(`Total lessons loaded: ${allLessons.length}`);

  let totalUserCourses = 0;
  let totalLessonProgress = 0;

  // Build batch insert values for user_courses
  const userCourseValues = [];
  const lessonProgressValues = [];

  // For each student, randomly assign 3-5 courses
  for (const student of students) {
    // Randomly select 3-5 courses
    const courseCount = randomInt(3, 5);
    const selectedCourses = randomChoice(courses, courseCount);

    for (const course of selectedCourses) {
      // Random progress: 0 to totalLessons
      const completedLessons = randomInt(0, course.totalLessons);

      // Insert user_course record
      userCourseValues.push(`(${student.userId}, ${course.id}, ${completedLessons}, 0, 1, datetime('now'))`);
      totalUserCourses++;

      // Generate lesson progress for completed lessons
      if (completedLessons > 0 && lessonsByCourse[course.id]) {
        const completedLessonRecords = lessonsByCourse[course.id].slice(0, completedLessons);
        const daysAgo = randomInt(1, 30);

        for (const lesson of completedLessonRecords) {
          lessonProgressValues.push(`(${student.userId}, ${lesson.id}, 1, datetime('now', '-${daysAgo} days'), datetime('now'), datetime('now'))`);
          totalLessonProgress++;
        }
      }
    }
  }

  // Batch insert user_courses
  console.log(`Inserting ${userCourseValues.length} user course records...`);
  if (userCourseValues.length > 0) {
    db.run(`INSERT INTO user_courses (userId, courseId, completedLessons, lastLessonId, status, enrolledAt) VALUES ${userCourseValues.join(',')}`);
  }
  console.log('User courses inserted');

  // Batch insert lesson progress
  console.log(`Inserting ${lessonProgressValues.length} lesson progress records...`);
  if (lessonProgressValues.length > 0) {
    db.run(`INSERT INTO user_lesson_progress (userId, lessonId, isCompleted, completedAt, createdAt, updatedAt) VALUES ${lessonProgressValues.join(',')}`);
  }
  console.log('Lesson progress inserted');

  // Save database to file
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(DB_PATH, buffer);
  console.log('Database saved');

  // Summary
  console.log('\n=== Course Progress Seed Summary ===');
  console.log(`Students processed: ${students.length}`);
  console.log(`User course records created: ${totalUserCourses}`);
  console.log(`Lesson progress records created: ${totalLessonProgress}`);

  // Show sample data
  const samplesResult = db.exec(`
    SELECT u.username, c.courseName, uc.completedLessons, c.totalLessons
    FROM user_courses uc
    JOIN users u ON uc.userId = u.id
    JOIN courses c ON uc.courseId = c.id
    ORDER BY u.id, c.id
    LIMIT 10
  `);

  console.log('\nSample output:');
  if (samplesResult.length > 0) {
    for (const row of samplesResult[0].values) {
      const username = row[0];
      const courseName = row[1];
      const completed = row[2];
      const total = row[3];
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      console.log(`  ${username} - ${courseName}: ${completed}/${total} (${progress}%)`);
    }
  }

  db.close();
  console.log('\nCourse progress seed completed successfully!');
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
