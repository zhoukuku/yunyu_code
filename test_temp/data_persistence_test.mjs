// data persistence test - using node fetch
const BASE = 'http://localhost:3000/api';

async function main() {
  // Step 1: Login
  console.log('=== Step 1: Login ===');
  const loginRes = await fetch(`${BASE}/account/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ account: 'testuser1', password: 'Test@1234' }),
  });
  const loginData = await loginRes.json();
  const TOKEN = loginData.result.accessToken;
  console.log(`STATUS: ${loginRes.status}`);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': TOKEN,
  };

  // Step 2: Create project
  console.log('\n=== Step 2: POST /api/projects (Create) ===');
  const createRes = await fetch(`${BASE}/projects`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'Persistence Test Project', type: 'scratch', content: '{}', projectData: '{"sprites":[]}', isPublic: 0 }),
  });
  const createData = await createRes.json();
  console.log(`STATUS: ${createRes.status}`);
  const projectId = createData.id;
  console.log(`Project ID: ${projectId}`);

  // Step 3: List projects
  console.log('\n=== Step 3: GET /api/projects (List) ===');
  const listRes = await fetch(`${BASE}/projects?userId=262&page=1&pageSize=5`);
  const listData = await listRes.json();
  console.log(`STATUS: ${listRes.status}`);
  const found = Array.isArray(listData) ? listData.some(p => p.id === projectId) : (listData.records || []).some(p => p.id === projectId);
  console.log(`Project found in list: ${found}`);

  // Step 3b: Get single project
  console.log('\n=== Step 3b: GET /api/projects/:id (Get single) ===');
  const getRes = await fetch(`${BASE}/projects/${projectId}`);
  console.log(`STATUS: ${getRes.status}`);

  // Step 4: Update
  console.log('\n=== Step 4: PUT /api/projects/:id (Update) ===');
  const updateRes = await fetch(`${BASE}/projects/${projectId}`, {
    method: 'PUT', headers,
    body: JSON.stringify({ name: 'Updated Persistence Test', isPublic: 1 }),
  });
  console.log(`STATUS: ${updateRes.status}`);

  // Step 5: Delete
  console.log('\n=== Step 5: DELETE /api/projects/:id (Delete) ===');
  const deleteRes = await fetch(`${BASE}/projects/${projectId}`, { method: 'DELETE', headers });
  console.log(`STATUS: ${deleteRes.status}`);

  // Step 6: Verify deleted
  console.log('\n=== Step 6: GET /api/projects/:id (Verify deleted - should be 404) ===');
  const verifyRes = await fetch(`${BASE}/projects/${projectId}`);
  console.log(`STATUS: ${verifyRes.status}`);
  const verifyText = await verifyRes.text();
  console.log(`BODY: ${verifyText.substring(0, 200)}`);

  // Create project #2 for cloud vars + remix
  console.log('\n=== Create project #2 ===');
  const create2Res = await fetch(`${BASE}/projects`, {
    method: 'POST', headers,
    body: JSON.stringify({ name: 'CloudVar Test', type: 'scratch', content: '{}', projectData: '{"sprites":[]}', isPublic: 0 }),
  });
  const create2Data = await create2Res.json();
  const projectId2 = create2Data.id;
  console.log(`STATUS: ${create2Res.status}, Project ID: ${projectId2}`);

  // Step 7: Cloud variables PUT
  console.log('\n=== Step 7: PUT /api/projects/:id/cloud-variables ===');
  const cloudPutRes = await fetch(`${BASE}/projects/${projectId2}/cloud-variables`, {
    method: 'PUT', headers,
    body: JSON.stringify([{ name: 'highScore', value: '100' }, { name: 'playerName', value: 'TestPlayer' }]),
  });
  console.log(`STATUS: ${cloudPutRes.status}`);
  const cloudPutText = await cloudPutRes.text();
  console.log(`BODY: ${cloudPutText.substring(0, 300)}`);

  // Step 7b: Cloud variables GET
  console.log('\n=== Step 7b: GET /api/projects/:id/cloud-variables ===');
  const cloudGetRes = await fetch(`${BASE}/projects/${projectId2}/cloud-variables`, { headers });
  console.log(`STATUS: ${cloudGetRes.status}`);

  // Step 8: Remix
  console.log('\n=== Step 8: POST /api/projects/:id/remix ===');
  const remixRes = await fetch(`${BASE}/projects/${projectId2}/remix`, {
    method: 'POST', headers,
    body: JSON.stringify({ newName: 'Remixed Project' }),
  });
  console.log(`STATUS: ${remixRes.status}`);

  // Cleanup
  console.log('\n=== Cleanup: Delete project #2 ===');
  const cleanupRes = await fetch(`${BASE}/projects/${projectId2}`, { method: 'DELETE', headers });
  console.log(`STATUS: ${cleanupRes.status}`);

  // Summary
  console.log('\n========================================');
  console.log('SUMMARY OF STATUS CODES:');
  console.log(`  Step 1 (Login):            ${loginRes.status}`);
  console.log(`  Step 2 (Create):           ${createRes.status}`);
  console.log(`  Step 3 (List):             ${listRes.status}`);
  console.log(`  Step 3b (Get single):      ${getRes.status}`);
  console.log(`  Step 4 (Update):           ${updateRes.status}`);
  console.log(`  Step 5 (Delete):           ${deleteRes.status}`);
  console.log(`  Step 6 (Verify deleted):   ${verifyRes.status}`);
  console.log(`  Step 7 (Cloud PUT):        ${cloudPutRes.status}`);
  console.log(`  Step 7b (Cloud GET):       ${cloudGetRes.status}`);
  console.log(`  Step 8 (Remix):            ${remixRes.status}`);
  console.log(`  Cleanup (Delete #2):       ${cleanupRes.status}`);
  console.log('========================================');
}

main().catch(err => { console.error('TEST FAILED:', err.message); process.exit(1); });
