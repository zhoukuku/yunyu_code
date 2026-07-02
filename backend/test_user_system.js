const http = require('http');

const BASE_URL = 'http://localhost:3000/api';
const results = [];

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
  results.push(`[${new Date().toISOString()}] ${msg}`);
}

function request(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const fullPath = path.startsWith('/') ? path : '/' + path;
    const urlStr = base + fullPath;
    const url = new URL(urlStr);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    if (token) {
      options.headers['Authorization'] = token;
    }
    if (body) {
      const bodyStr = JSON.stringify(body);
      options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
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
  log('=== TEST: Register (Create User) ===');
  const uniqueId = Date.now();
  const res = await request('POST', '/account/register', {
    username: `user_${uniqueId}`,
    account: `acc_${uniqueId}`,
    password: 'Test1234',
    name: 'Test User',
    role: 3
  });

  if ((res.status === 200 || res.status === 201) && res.body.result?.id) {
    log(`PASS: Register succeeded, userId=${res.body.result.id}`);
    return { success: true, userId: res.body.result.id };
  }
  log(`FAIL: Register failed - status=${res.status}, body=${JSON.stringify(res.body)}`);
  return { success: false };
}

async function testRole() {
  log('=== TEST: Role Assignment ===');
  // First register a new user to test role update
  const uniqueId = Date.now();
  const registerRes = await request('POST', '/account/register', {
    username: `roleuser_${uniqueId}`,
    account: `roleuser_${uniqueId}`,
    password: 'Test1234',
    name: 'Role Test User',
    role: 3
  });

  if ((registerRes.status !== 200 && registerRes.status !== 201) || !registerRes.body.result?.id) {
    log(`FAIL: Cannot create user for role test - status=${registerRes.status}`);
    return { success: false };
  }

  const userId = registerRes.body.result.id;
  log(`Created test user for role update: userId=${userId}`);

  // Register an admin user for testing
  const adminRegRes = await request('POST', '/account/register', {
    username: `admin_${uniqueId}`,
    account: `admin_${uniqueId}`,
    password: 'Test1234',
    name: 'Test Admin',
    role: 1  // role 1 = admin
  });

  if ((adminRegRes.status !== 200 && adminRegRes.status !== 201) || !adminRegRes.body.result?.id) {
    log(`FAIL: Cannot create admin user for role test`);
    return { success: false };
  }

  log(`Created admin user for role test: userId=${adminRegRes.body.result.id}`);

  // Login as admin
  const loginRes = await request('POST', '/account/login', {
    account: `admin_${uniqueId}`,
    password: 'Test1234'
  });

  if ((loginRes.status !== 200 && loginRes.status !== 201) || !loginRes.body.result?.accessToken) {
    log(`FAIL: Admin login failed - status=${loginRes.status}, body=${JSON.stringify(loginRes.body)}`);
    return { success: false };
  }

  const adminToken = loginRes.body.result.accessToken;
  log(`Admin login succeeded`);

  // Update user role (requires admin)
  const updateRoleRes = await request('PUT', `/users/${userId}/role`, { role: 2 }, adminToken);

  if (updateRoleRes.status === 200) {
    log(`PASS: Role update succeeded for user ${userId}`);
    return { success: true };
  }
  log(`INFO: Role update - status=${updateRoleRes.status}, body=${JSON.stringify(updateRoleRes.body)}`);
  return { success: false };
}

async function testBatchImport() {
  log('=== TEST: Batch Import ===');
  // Create and login as admin
  const uniqueId = Date.now();
  await request('POST', '/account/register', {
    username: `admin_batch_${uniqueId}`,
    account: `admin_batch_${uniqueId}`,
    password: 'Test1234',
    name: 'Batch Admin',
    role: 1
  });

  const loginRes = await request('POST', '/account/login', {
    account: `admin_batch_${uniqueId}`,
    password: 'Test1234'
  });

  if ((loginRes.status !== 200 && loginRes.status !== 201) || !loginRes.body.result?.accessToken) {
    log(`FAIL: Admin login failed for batch import`);
    return { success: false };
  }

  const adminToken = loginRes.body.result.accessToken;
  log(`Admin logged in for batch import`);

  // Test batch create with JSON body
  const batchData = {
    accounts: [
      { username: `batch1_${Date.now()}`, account: `batch1_${Date.now()}`, name: 'Batch User 1', role: 3 },
      { username: `batch2_${Date.now()}`, account: `batch2_${Date.now()}`, name: 'Batch User 2', role: 3 },
      { username: `batch3_${Date.now()}`, account: `batch3_${Date.now()}`, name: 'Batch User 3', role: 3 },
    ]
  };

  const batchRes = await request('POST', '/users/batch-create', batchData, adminToken);

  if (batchRes.status === 200) {
    const result = batchRes.body.result;
    log(`PASS: Batch import succeeded - success: ${result.success?.length || 0}, failed: ${result.failed?.length || 0}`);
    return { success: true, result };
  }
  log(`FAIL: Batch import failed - status=${batchRes.status}, body=${JSON.stringify(batchRes.body)}`);
    // Check if route exists - if 404 with "Cannot POST" it may be server build issue
    if (batchRes.status === 404) {
      log(`INFO: batch-create route not found - server may be running old build`);
    }
  return { success: false };
}

async function testBatchImportCSV() {
  log('=== TEST: Batch Import via File (CSV) ===');
  // Create and login as admin
  const uniqueId = Date.now();
  await request('POST', '/account/register', {
    username: `admin_csv_${uniqueId}`,
    account: `admin_csv_${uniqueId}`,
    password: 'Test1234',
    name: 'CSV Admin',
    role: 1
  });

  const loginRes = await request('POST', '/account/login', {
    account: `admin_csv_${uniqueId}`,
    password: 'Test1234'
  });

  if ((loginRes.status !== 200 && loginRes.status !== 201) || !loginRes.body.result?.accessToken) {
    log(`FAIL: Admin login failed for CSV batch import`);
    return { success: false };
  }

  const adminToken = loginRes.body.result.accessToken;

  // Create a simple CSV content
  const csvContent = `username,account,name,role
csvuser1_${Date.now()},csvacc1_${Date.now()},CSV User 1,3
csvuser2_${Date.now()},csvacc2_${Date.now()},CSV User 2,3`;

  return new Promise((resolve) => {
    const boundary = '----FormBoundary' + Date.now();
    const body = Buffer.from(
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="users.csv"\r\n` +
      `Content-Type: text/csv\r\n\r\n` +
      `${csvContent}\r\n` +
      `--${boundary}--\r\n`
    );

    const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
    const url = new URL(base + '/users/batch-create/file');
    const options = {
      method: 'POST',
      hostname: url.hostname,
      port: url.port,
      path: url.pathname,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
        'Authorization': adminToken,
        'Content-Length': body.length,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (res.statusCode === 200) {
            log(`PASS: CSV batch import succeeded`);
            resolve({ success: true });
          } else {
            log(`FAIL: CSV batch import - status=${res.statusCode}, body=${JSON.stringify(json)}`);
            resolve({ success: false });
          }
        } catch {
          log(`FAIL: CSV batch import parse error - status=${res.statusCode}`);
          resolve({ success: false });
        }
      });
    });
    req.on('error', (err) => {
      log(`FAIL: CSV batch import request error: ${err.message}`);
      resolve({ success: false });
    });
    req.write(body);
    req.end();
  });
}

async function runAllTests() {
  log('========================================');
  log('Starting User System Tests...');
  log(`Target: ${BASE_URL}`);
  log('========================================');

  const testResults = {
    register: await testRegister(),
    role: await testRole(),
    batchImport: await testBatchImport(),
    batchImportCSV: await testBatchImportCSV(),
  };

  log('========================================');
  log('All Tests Completed');
  log('========================================');
  log(`Summary:`);
  log(`  - Create User: ${testResults.register.success ? 'PASS' : 'FAIL'}`);
  log(`  - Role Assignment: ${testResults.role.success ? 'PASS' : 'FAIL'}`);
  log(`  - Batch Import (JSON): ${testResults.batchImport.success ? 'PASS' : 'FAIL'}`);
  log(`  - Batch Import (CSV): ${testResults.batchImportCSV.success ? 'PASS' : 'FAIL'}`);
  log('========================================');

  // Write to file
  const fs = require('fs');
  fs.writeFileSync('e:/k/meee/code/project01/testResults', results.join('\n'));
  log('Results written to e:/k/meee/code/project01/testResults');

  return testResults;
}

runAllTests().catch(err => {
  log(`FATAL ERROR: ${err.message}`);
  const fs = require('fs');
  fs.writeFileSync('e:/k/meee/code/project01/testResults', results.join('\n'));
});