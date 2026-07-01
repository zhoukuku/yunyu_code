@echo off
setlocal

echo ============================================
echo   Yunyu Learning Platform
echo ============================================
echo.

echo [0] Cleaning old Vite processes on port 5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo   Done.

echo [1/4] Building backend...
cd /d "e:\k\meee\code\project01\backend"
start "Build" /wait cmd /c "npm run build 2>&1"
echo   Backend build done.

echo [2/4] Starting backend on port 3000...
start "Backend" cmd /c "cd /d e:\k\meee\code\project01\backend && set JWT_SECRET=yunyu-dev-secret && npm run start:dev"

echo [3/4] Starting frontend on port 5174...
start "Frontend" cmd /c "cd /d e:\k\meee\code\project01\frontend-vite && set ELECTRON=true && npm run dev"

echo [4/4] Waiting 15s for services...
timeout /t 15 /nobreak >nul

echo Launching Electron desktop app...
start "Electron" cmd /c "cd /d e:\k\meee\code\project01\electron && node run-electron.js ."

echo.
echo ============================================
echo   Login: admin / admin123
echo ============================================
pause
