/**
 * 从 m2.5aqima.com 获取所有数据
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '../scraped-data');
const API_HOST = 'm2.5aqima.com';

const cookies = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'cookies.json'), 'utf-8'));

let accessToken = null;
for (const cookie of cookies) {
  if (cookie.name === 'qima-study.accessToken') {
    accessToken = decodeURIComponent(cookie.value);
    if (accessToken.startsWith('"Bearer ')) {
      accessToken = accessToken.substring(8, accessToken.length - 1);
    }
  }
}

function apiRequest(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: API_HOST,
      port: 443,
      path: endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://s.5aqima.com',
        'Referer': 'https://s.5aqima.com/',
        'Authorization': 'Bearer ' + accessToken
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function fetchAll() {
  console.log('========================================');
  console.log('从 m2.5aqima.com 获取完整数据');
  console.log('========================================\n');

  const results = {};

  // 1. 用户详情
  console.log('👤 获取用户详情...');
  try {
    const res = await apiRequest('/user/detail');
    results.user = res;
    console.log('  状态: ' + res.status);
    if (res.status === 200 && res.data) {
      console.log('  用户: ' + JSON.stringify(res.data).substring(0, 300));
    }
  } catch (e) {
    console.log('  失败: ' + e.message);
  }

  // 2. 班级列表
  console.log('\n📚 获取班级列表...');
  try {
    const res = await apiRequest('/teacher/class');
    results.classes = res;
    console.log('  状态: ' + res.status);
    if (res.status === 200 && res.data) {
      const dataStr = JSON.stringify(res.data).substring(0, 500);
      console.log('  数据: ' + dataStr);
    }
  } catch (e) {
    console.log('  失败: ' + e.message);
  }

  // 3. 课程包
  console.log('\n📖 获取课程包...');
  try {
    const res = await apiRequest('/teacher/classify/theme_course/combo');
    results.courses = res;
    console.log('  状态: ' + res.status);
    if (res.status === 200 && res.data) {
      const dataStr = JSON.stringify(res.data).substring(0, 500);
      console.log('  数据: ' + dataStr);
    }
  } catch (e) {
    console.log('  失败: ' + e.message);
  }

  // 4. 横幅
  console.log('\n🎯 获取横幅...');
  try {
    const res = await apiRequest('/home/banner');
    results.banners = res;
    console.log('  状态: ' + res.status);
  } catch (e) {
    console.log('  失败: ' + e.message);
  }

  // 5. 通知
  console.log('\n📢 获取通知...');
  try {
    const res = await apiRequest('/notice');
    results.notices = res;
    console.log('  状态: ' + res.status);
  } catch (e) {
    console.log('  失败: ' + e.message);
  }

  // 6. 字典
  console.log('\n📖 获取字典/层级...');
  try {
    const res = await apiRequest('/dict/hierarchy');
    results.dict = res;
    console.log('  状态: ' + res.status);
  } catch (e) {
    console.log('  失败: ' + e.message);
  }

  // 保存结果
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'm2-api-data.json'),
    JSON.stringify(results, null, 2)
  );

  console.log('\n========================================');
  console.log('✅ 数据获取完成!');
  console.log('文件: m2-api-data.json');
  console.log('========================================');
}

fetchAll().catch(console.error);