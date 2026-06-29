/**
 * 使用Playwright获取的Token访问API
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const OUTPUT_DIR = path.join(__dirname, '../scraped-data');

// 从cookies.json读取token
const cookies = JSON.parse(fs.readFileSync(path.join(OUTPUT_DIR, 'cookies.json'), 'utf-8'));

let accessToken = null;
let refreshToken = null;

// 解析tokens
for (const cookie of cookies) {
  if (cookie.name === 'qima-study.accessToken') {
    // 解码URL编码的token
    accessToken = decodeURIComponent(cookie.value);
    // 移除 "Bearer " 前缀（如果存在）
    if (accessToken.startsWith('"Bearer ')) {
      accessToken = accessToken.substring(8, accessToken.length - 1);
    }
  }
  if (cookie.name === 'qima-study.refreshToken') {
    refreshToken = decodeURIComponent(cookie.value);
    if (refreshToken.startsWith('"Bearer ')) {
      refreshToken = refreshToken.substring(8, refreshToken.length - 1);
    }
  }
}

console.log('Access Token: ' + (accessToken ? accessToken.substring(0, 50) + '...' : 'null'));
console.log('Refresh Token: ' + (refreshToken ? refreshToken.substring(0, 50) + '...' : 'null'));

function apiRequest(hostname, endpoint, method = 'GET', data = null, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname,
      port: 443,
      path: endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Origin': 'https://s.5aqima.com',
        'Referer': 'https://s.5aqima.com/'
      }
    };

    if (token) {
      options.headers['Authorization'] = 'Bearer ' + token;
    }

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

async function fetchData() {
  console.log('\n📊 开始获取数据...\n');

  // 测试不同的域名和端点
  const tests = [
    { host: 'scratch.5aqima.com', path: '/api/auth/me' },
    { host: 'scratch.5aqima.com', path: '/api/projects/list' },
    { host: 's.5aqima.com', path: '/api/auth/me' },
    { host: 's.5aqima.com', path: '/api/projects/list' },
    { host: 's.5aqima.com', path: '/api/user/302487/projects' },
    { host: 'scratch.5aqima.com', path: '/api/courses' },
  ];

  for (const test of tests) {
    try {
      console.log('请求: ' + test.host + test.path);
      const res = await apiRequest(test.host, test.path, 'GET', null, accessToken);
      console.log('  状态: ' + res.status);
      if (res.status === 200) {
        const dataStr = JSON.stringify(res.data).substring(0, 300);
        console.log('  数据: ' + dataStr);
      } else if (res.data && res.data.msg) {
        console.log('  消息: ' + res.data.msg);
      }
    } catch (e) {
      console.log('  失败: ' + e.message);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('使用Token访问API');
  console.log('========================================\n');

  await fetchData();

  console.log('\n========================================');
  console.log('完成');
  console.log('========================================');
}

main().catch(console.error);