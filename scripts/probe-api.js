/**
 * 探测正确的API路径
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const cookies = JSON.parse(fs.readFileSync(path.join(__dirname, '../scraped-data/cookies.json'), 'utf-8'));

let accessToken = null;
for (const cookie of cookies) {
  if (cookie.name === 'qima-study.accessToken') {
    accessToken = decodeURIComponent(cookie.value);
    if (accessToken.startsWith('"Bearer ')) {
      accessToken = accessToken.substring(8, accessToken.length - 1);
    }
  }
}

function apiRequest(hostname, endpoint, method = 'GET', data = null) {
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

    if (accessToken) {
      options.headers['Authorization'] = 'Bearer ' + accessToken;
    }

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
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

async function probe() {
  console.log('========================================');
  console.log('探测正确API路径');
  console.log('========================================\n');

  // 探测不同的base路径
  const basePaths = [
    '/qima-scratch/api',
    '/api/qima',
    '/prod/qima-scratch-pc/api',
    '/api'
  ];

  const endpoints = ['/auth/me', '/user/info', '/projects', '/courses'];

  for (const base of basePaths) {
    for (const ep of endpoints) {
      try {
        const path = base + ep;
        console.log('探测: ' + path);
        const res = await apiRequest('s.5aqima.com', path);
        console.log('  -> ' + res.status);
        if (res.status === 200) {
          console.log('  数据: ' + JSON.stringify(res.data).substring(0, 200));
        }
      } catch (e) {
        console.log('  -> 失败: ' + e.message.substring(0, 30));
      }
    }
  }

  // 探测根路径
  console.log('\n探测根路径...');
  try {
    const res = await apiRequest('s.5aqima.com', '/');
    console.log('/ -> ' + res.status);
  } catch (e) {
    console.log('/ -> 失败');
  }

  // 探测login路径
  console.log('\n探测登录相关路径...');
  const loginPaths = [
    '/api/auth/login',
    '/api/login',
    '/auth/login',
    '/api/v1/auth/login',
    '/api/v2/login'
  ];

  for (const p of loginPaths) {
    try {
      console.log('探测: ' + p);
      const res = await apiRequest('s.5aqima.com', p, 'POST', { username: 'test', password: 'test' });
      console.log('  -> ' + res.status);
    } catch (e) {
      console.log('  -> 失败');
    }
  }

  console.log('\n========================================');
  console.log('探测完成');
  console.log('========================================');
}

probe().catch(console.error);