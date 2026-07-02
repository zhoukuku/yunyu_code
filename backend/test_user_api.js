const http = require('http');

const BASE_HOST = 'localhost';
const BASE_PORT = 3000;
const BASE_PATH = '/api';
let accessToken = '';
let refreshToken = '';
let testUserId = null;
const results = [];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
  results.push(`[${new Date().toISOString()}] ${msg}`);
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const options = {
      method,
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: BASE_PATH + path,
      headers: { 'Content-Type': 'application/json' }
    };
    if (token) {
      options.headers['Authorization'] = token;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, body: json });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function testRegister() {
  log('=== TEST: Register ===');
  const uniqueId = Date.now();
  const res = await request('POST', '/account/register', {
    username: `testuser_${uniqueId}`,
    account: `test_${uniqueId}`,
    password: 'Test1234',
    name: 'Test User',
    role: 3
  });

  // Accept 200 or 201, and handle nested body structure
  const result = res.body.result || res.body.body?.result;
  const id = result?.id;
  if (id) {
    testUserId = id;
    log(`PASS: Register succeeded, userId=${testUserId}`);
    return true;
  }
  log(`FAIL: Register failed - status=${res.status}, body=${JSON.stringify(res.body)}`);
  return false;
}

async function testLogin() {
  log('=== TEST: Login ===');
  const uniqueId = Date.now();
  // First register as admin (role: 1) for full CRUD access
  await request('POST', '/account/register', {
    username: `logintest_${uniqueId}`,
    account: `logintest_${uniqueId}`,
    password: 'Test1234',
    name: 'Login Test User',
    role: 1
  });

  // Then login
  const res = await request('POST', '/account/login', {
    account: `logintest_${uniqueId}`,
    password: 'Test1234'
  });

  // Handle nested response: body.result.accessToken or body.body.result.accessToken
  const result = res.body.result || res.body.body?.result;
  if (result?.accessToken) {
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;
    log(`PASS: Login succeeded, accessToken=${accessToken.substring(0, 30)}...`);
    return true;
  }
  log(`FAIL: Login failed - status=${res.status}, body=${JSON.stringify(res.body)}`);
  return false;
}

async function testUserCRUD() {
  log('=== TEST: User CRUD (Read) ===');
  const res = await request('GET', '/users', null, accessToken);

  // Handle nested body structure
  const result = res.body.result || res.body.body?.result;
  const records = result?.records || result;
  if (res.status === 200 && records) {
    const count = Array.isArray(records) ? records.length : 'N/A';
    log(`PASS: Get users succeeded, count=${count}`);
  } else {
    log(`FAIL: Get users failed - status=${res.status}, body=${JSON.stringify(res.body)}`);
  }

  log('=== TEST: User CRUD (Update) ===');
  if (testUserId) {
    const res2 = await request('PUT', `/users/${testUserId}`, { nickname: 'UpdatedNick' }, accessToken);
    const result2 = res2.body.result || res2.body.body?.result;
    if (res2.status === 200) {
      log(`PASS: Update user succeeded`);
    } else {
      log(`FAIL: Update user failed - status=${res2.status}, body=${JSON.stringify(res2.body)}`);
    }
  }

  log('=== TEST: User CRUD (Delete) ===');
  const delId = Date.now();
  const regRes = await request('POST', '/account/register', {
    username: `deluser_${delId}`,
    account: `deluser_${delId}`,
    password: 'Test1234',
    name: 'Delete Test User',
    role: 3
  });

  const regResult = regRes.body.result || regRes.body.body?.result;
  if (regResult?.id) {
    const delUserId = regResult.id;
    const delRes = await request('DELETE', `/users/${delUserId}`, null, accessToken);
    if (delRes.status === 200) {
      log(`PASS: Delete user succeeded`);
    } else {
      log(`FAIL: Delete user failed - status=${delRes.status}, body=${JSON.stringify(delRes.body)}`);
    }
  }
}

async function testTokenRefresh() {
  log('=== TEST: Token Refresh ===');
  if (!refreshToken) {
    log('FAIL: No refresh token available');
    return;
  }

  const res = await request('POST', '/account/refresh', { refreshToken }, null);
  const result = res.body.result || res.body.body?.result;
  if (res.status === 200 && result?.accessToken) {
    log(`PASS: Token refresh succeeded`);
  } else {
    log(`FAIL: Token refresh failed - status=${res.status}, body=${JSON.stringify(res.body)}`);
  }
}

async function testGetProfile() {
  log('=== TEST: Get Profile ===');
  // Try /users/profile/me first (from UsersController)
  let res = await request('GET', '/users/profile/me', null, accessToken);
  let result = res.body.result || res.body.body?.result;

  if (res.status === 200 && result) {
    log(`PASS: Get profile succeeded, userId=${result.id}`);
    return;
  }

  // Fallback to /user/detail (from AuthController)
  log('Trying /user/detail endpoint...');
  res = await request('GET', '/user/detail', null, accessToken);
  result = res.body.result || res.body.body?.result;

  if (res.status === 200 && result) {
    log(`PASS: Get profile succeeded via /user/detail, userId=${result.id}`);
  } else {
    log(`FAIL: Get profile failed - status=${res.status}, body=${JSON.stringify(res.body)}`);
  }
}

async function runAllTests() {
  log('Starting User API Tests...');
  log(`Target: http://${BASE_HOST}:${BASE_PORT}${BASE_PATH}`);

  await testRegister();
  await testLogin();
  await testGetProfile();
  await testUserCRUD();
  await testTokenRefresh();

  log('=== All Tests Completed ===');
  console.log('\n--- TEST RESULTS ---');
  console.log(results.join('\n'));

  const fs = require('fs');
  fs.writeFileSync('e:/k/meee/code/project01/testResults', results.join('\n'));
  log('Results written to testResults');
}

runAllTests().catch(err => {
  log(`FATAL ERROR: ${err.message}`);
  console.log('\n--- TEST RESULTS ---');
  console.log(results.join('\n'));
});