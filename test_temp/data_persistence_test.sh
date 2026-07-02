#!/bin/bash
# Data Persistence Test Script
TOKEN="Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjI2MiwidXNlcm5hbWUiOiJ0ZXN0dXNlcjEiLCJ1c2VyVHlwZSI6Miwicm9sZSI6MywidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc4Mjg0NjA3MCwiZXhwIjoxNzgyODQ2OTcwfQ.BFXcG3sOJS6mIOf14AuRpEoefyx-ef22uecepjeEnEU"
BASE="http://localhost:3000/api"

echo "=========================================="
echo "DATA PERSISTENCE TEST"
echo "=========================================="

# Step 2: Create a project
echo ""
echo "=== Step 2: POST /api/projects (Create) ==="
CREATE_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"name":"Persistence Test Project","type":"scratch","content":"{}","projectData":"{\"sprites\":[]}","isPublic":0}')
CREATE_BODY=$(echo "$CREATE_RESP" | head -n -1)
CREATE_CODE=$(echo "$CREATE_RESP" | tail -n 1)
echo "STATUS: $CREATE_CODE"
echo "BODY: $CREATE_BODY"

# Extract project ID
PROJECT_ID=$(echo "$CREATE_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
if [ -z "$PROJECT_ID" ]; then
  # Try alternative extraction
  PROJECT_ID=$(echo "$CREATE_BODY" | node -e "let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>{try{console.log(JSON.parse(d).id)}catch(e){console.log('')}})" 2>/dev/null)
fi
echo "Project ID: $PROJECT_ID"

# Step 3: Read back - verify project exists
echo ""
echo "=== Step 3: GET /api/projects (List - verify exists) ==="
LIST_RESP=$(curl -s -w "\n%{http_code}" "$BASE/projects?userId=262&page=1&pageSize=5")
LIST_BODY=$(echo "$LIST_RESP" | head -n -1)
LIST_CODE=$(echo "$LIST_RESP" | tail -n 1)
echo "STATUS: $LIST_CODE"
echo "BODY (truncated): $(echo "$LIST_BODY" | head -c 300)"

# Step 3b: GET specific project
echo ""
echo "=== Step 3b: GET /api/projects/$PROJECT_ID (Get single) ==="
GET_RESP=$(curl -s -w "\n%{http_code}" "$BASE/projects/$PROJECT_ID")
GET_BODY=$(echo "$GET_RESP" | head -n -1)
GET_CODE=$(echo "$GET_RESP" | tail -n 1)
echo "STATUS: $GET_CODE"
echo "BODY: $GET_BODY"

# Step 4: Update
echo ""
echo "=== Step 4: PUT /api/projects/$PROJECT_ID (Update) ==="
UPDATE_RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE/projects/$PROJECT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"name":"Updated Persistence Test Project","isPublic":1}')
UPDATE_BODY=$(echo "$UPDATE_RESP" | head -n -1)
UPDATE_CODE=$(echo "$UPDATE_RESP" | tail -n 1)
echo "STATUS: $UPDATE_CODE"
echo "BODY: $UPDATE_BODY"

# Step 5: Delete
echo ""
echo "=== Step 5: DELETE /api/projects/$PROJECT_ID (Delete) ==="
DELETE_RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/projects/$PROJECT_ID" \
  -H "Authorization: $TOKEN")
DELETE_BODY=$(echo "$DELETE_RESP" | head -n -1)
DELETE_CODE=$(echo "$DELETE_RESP" | tail -n 1)
echo "STATUS: $DELETE_CODE"
echo "BODY: $DELETE_BODY"

# Step 6: Verify deleted (should return 404 or empty)
echo ""
echo "=== Step 6: GET /api/projects/$PROJECT_ID (Verify deleted) ==="
VERIFY_RESP=$(curl -s -w "\n%{http_code}" "$BASE/projects/$PROJECT_ID")
VERIFY_BODY=$(echo "$VERIFY_RESP" | head -n -1)
VERIFY_CODE=$(echo "$VERIFY_RESP" | tail -n 1)
echo "STATUS: $VERIFY_CODE"
echo "BODY: $VERIFY_BODY"

# Create a new project for cloud variables and remix tests
echo ""
echo "=== Create project #2 for cloud variable & remix tests ==="
CREATE2_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/projects" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"name":"CloudVar Test Project","type":"scratch","content":"{}","projectData":"{\"sprites\":[]}","isPublic":0}')
CREATE2_BODY=$(echo "$CREATE2_RESP" | head -n -1)
CREATE2_CODE=$(echo "$CREATE2_RESP" | tail -n 1)
echo "STATUS: $CREATE2_CODE"
echo "BODY: $CREATE2_BODY"

PROJECT2_ID=$(echo "$CREATE2_BODY" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
echo "Project2 ID: $PROJECT2_ID"

# Step 7: Test cloud variables
echo ""
echo "=== Step 7: PUT /api/projects/$PROJECT2_ID/cloud-variables ==="
CLOUD_RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE/projects/$PROJECT2_ID/cloud-variables" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '[{"name":"highScore","value":"100"},{"name":"playerName","value":"TestPlayer"}]')
CLOUD_BODY=$(echo "$CLOUD_RESP" | head -n -1)
CLOUD_CODE=$(echo "$CLOUD_RESP" | tail -n 1)
echo "STATUS: $CLOUD_CODE"
echo "BODY: $CLOUD_BODY"

# Also test GET cloud variables
echo ""
echo "=== Step 7b: GET /api/projects/$PROJECT2_ID/cloud-variables ==="
CLOUD_GET_RESP=$(curl -s -w "\n%{http_code}" "$BASE/projects/$PROJECT2_ID/cloud-variables" \
  -H "Authorization: $TOKEN")
CLOUD_GET_BODY=$(echo "$CLOUD_GET_RESP" | head -n -1)
CLOUD_GET_CODE=$(echo "$CLOUD_GET_RESP" | tail -n 1)
echo "STATUS: $CLOUD_GET_CODE"
echo "BODY: $CLOUD_GET_BODY"

# Step 8: Test remix
echo ""
echo "=== Step 8: POST /api/projects/$PROJECT2_ID/remix ==="
REMIX_RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/projects/$PROJECT2_ID/remix" \
  -H "Content-Type: application/json" \
  -H "Authorization: $TOKEN" \
  -d '{"newName":"Remixed Project Test"}')
REMIX_BODY=$(echo "$REMIX_RESP" | head -n -1)
REMIX_CODE=$(echo "$REMIX_RESP" | tail -n 1)
echo "STATUS: $REMIX_CODE"
echo "BODY: $REMIX_BODY"

# Cleanup: delete project #2
echo ""
echo "=== Cleanup: DELETE project #2 ==="
CLEANUP_RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE/projects/$PROJECT2_ID" \
  -H "Authorization: $TOKEN")
CLEANUP_CODE=$(echo "$CLEANUP_RESP" | tail -n 1)
echo "STATUS: $CLEANUP_CODE"

echo ""
echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="
echo ""
echo "SUMMARY OF STATUS CODES:"
echo "  Step 2 (Create):           $CREATE_CODE"
echo "  Step 3 (List):             $LIST_CODE"
echo "  Step 3b (Get single):      $GET_CODE"
echo "  Step 4 (Update):           $UPDATE_CODE"
echo "  Step 5 (Delete):           $DELETE_CODE"
echo "  Step 6 (Verify deleted):   $VERIFY_CODE"
echo "  Step 7 (Cloud PUT):        $CLOUD_CODE"
echo "  Step 7b (Cloud GET):       $CLOUD_GET_CODE"
echo "  Step 8 (Remix):            $REMIX_CODE"
echo "  Cleanup (Delete #2):       $CLEANUP_CODE"
