var mysql = require('mysql2/promise');
(async () => {
  var conn = await mysql.createConnection({host:'localhost',port:3306,user:'root',password:'root',database:'yunyu_learning'});
  await conn.query('DELETE FROM lessons');
  await conn.query('DELETE FROM courses');
  console.log('Cleared courses and lessons');
  await conn.end();
})();
