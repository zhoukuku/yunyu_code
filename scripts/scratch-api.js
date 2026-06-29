/**
 * API端点探测脚本
 * 探测scratch.5aqima.com的API接口
 */

const https = require('https');

const BASE_URL = 'scratch.5aqima.com';

// 推测的API端点列表
const API_ENDPOINTS = [
  // === 项目相关 ===
  '/api/projects',
  '/api/projects/list',
  '/api/projects/recent',
  '/api/projects/featured',
  '/api/projects/popular',
  '/api/projects/following',
  '/api/projects/1',

  // 项目操作
  '/api/project/new',
  '/api/project/save',
  '/api/project/delete',
  '/api/project/{id}',
  '/api/project/{id}/remix',
  '/api/project/{id}/love',
  '/api/project/{id}/favorite',
  '/api/project/{id}/unlove',
  '/api/project/{id}/unfavorite',
  '/api/project/{id}/comments',
  '/api/project/{id}/comment',
  '/api/project/{id}/collaborators',
  '/api/project/{id}/history',

  // === 用户相关 ===
  '/api/users',
  '/api/users/list',
  '/api/users/1',
  '/api/users/search',
  '/api/user/{id}',
  '/api/user/{username}',

  // 用户操作
  '/api/user/profile',
  '/api/user/settings',
  '/api/user/{id}/projects',
  '/api/user/{id}/favorites',
  '/api/user/{id}/loved',
  '/api/user/{id}/remixes',
  '/api/user/{id}/followers',
  '/api/user/{id}/following',
  '/api/user/{id}/follow',
  '/api/user/{id}/unfollow',
  '/api/user/{id}/stats',

  // === 认证相关 ===
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/api/auth/current',
  '/api/auth/token',
  '/api/auth/refresh',
  '/api/auth/password/reset',
  '/api/auth/password/change',

  // === 课程相关 ===
  '/api/courses',
  '/api/courses/list',
  '/api/courses/popular',
  '/api/courses/1',
  '/api/course/{id}',
  '/api/course/{id}/lessons',
  '/api/course/{id}/enroll',
  '/api/course/{id}/progress',

  // === 搜索 ===
  '/api/search',
  '/api/search/projects',
  '/api/search/users',
  '/api/search/all',
  '/api/search?q=test',

  // === 管理后台 ===
  '/api/admin',
  '/api/admin/dashboard',
  '/api/admin/users',
  '/api/admin/projects',
  '/api/admin/comments',
  '/api/admin/reports',
  '/api/admin/stats',
  '/api/admin/settings',

  // === 消息/通知 ===
  '/api/messages',
  '/api/messages/unread',
  '/api/message/send',
  '/api/notifications',
  '/api/notifications/unread',

  // === 标签/分类 ===
  '/api/tags',
  '/api/tag/{name}',
  '/api/tag/{name}/projects',

  // === 统计 ===
  '/api/stats',
  '/api/stats/projects',
  '/api/stats/users',
  '/api/stats/engagement',

  // === 探索/发现 ===
  '/api/explore',
  '/api/explore/projects',
  '/api/explore/users',
  '/api/featured',
  '/api/curated',

  // === 关注动态 ===
  '/api/activity',
  '/api/activity/following',
  '/api/activity/recent',
];

function request(endpoint, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: BASE_URL,
      port: 443,
      path: endpoint,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    const req = https.request(options, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', err => {
      reject(err);
    });

    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function discoverAPIs() {
  console.log('🔍 开始探测API端点...\n');
  console.log(`目标: https://${BASE_URL}\n`);

  const results = {};
  const successEndpoints = [];
  const errorEndpoints = [];

  for (const endpoint of API_ENDPOINTS) {
    process.stdout.write(`测试: ${endpoint.padEnd(50)} `);

    try {
      const result = await request(endpoint);
      results[endpoint] = {
        success: true,
        status: result.status,
        data: result.data,
        headers: result.headers
      };
      successEndpoints.push(endpoint);
      console.log(`✓ ${result.status}`);
    } catch (e) {
      results[endpoint] = {
        success: false,
        error: e.message
      };
      errorEndpoints.push(endpoint);
      console.log(`✗ ${e.message.substring(0, 30)}`);
    }
  }

  // 保存完整结果
  const report = {
    timestamp: '2026-06-15',
    baseUrl: BASE_URL,
    summary: {
      total: API_ENDPOINTS.length,
      success: successEndpoints.length,
      failed: errorEndpoints.length
    },
    successEndpoints,
    failedEndpoints: errorEndpoints,
    results
  };

  const fs = require('fs');
  const path = require('path');
  fs.writeFileSync(
    path.join(__dirname, '../scraped-data/api-report.json'),
    JSON.stringify(report, null, 2)
  );

  console.log('\n========================================');
  console.log('📊 API探测完成!');
  console.log('========================================');
  console.log(`总计: ${API_ENDPOINTS.length}`);
  console.log(`成功: ${successEndpoints.length}`);
  console.log(`失败: ${errorEndpoints.length}`);
  console.log(`报告: scraped-data/api-report.json`);
  console.log('\n成功端点:');
  successEndpoints.forEach(e => console.log(`  ✓ ${e}`));
  console.log('========================================');

  return results;
}

discoverAPIs().catch(console.error);