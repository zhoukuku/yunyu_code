const mysql = require('mysql2/promise');

(async () => {
  try {
    // Connect without database to create it
    const conn = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root'
    });
    await conn.query('CREATE DATABASE IF NOT EXISTS yunyu_learning CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci');
    console.log('✅ 数据库 yunyu_learning 已创建');
    await conn.end();

    // Test connection to the new database
    const conn2 = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: 'root',
      database: 'yunyu_learning'
    });
    const [rows] = await conn2.query('SELECT VERSION() as v');
    console.log('✅ 连接成功！MySQL版本:', rows[0].v);
    await conn2.end();
    console.log('✅ MySQL 配置完毕，可以启动后端了');
  } catch(e) {
    console.error('❌ 连接失败:', e.message);
    console.error('请确认MySQL服务已启动（端口3306，账号root，密码root）');
  }
})();
