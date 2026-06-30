@echo off
chcp 65001 >nul
echo ============================================
echo   Yunyu Learning Platform
echo ============================================
echo.
echo Make sure MySQL is running (port 3306, root/root)
echo.

echo [1/3] Starting backend (port 3000)...
start "Backend" cmd /c "cd /d e:\k\meee\code\project01\backend && npm run start:dev"

echo [2/3] Starting frontend (Electron mode, port 5174)...
start "Frontend" cmd /c "cd /d e:\k\meee\code\project01\frontend-vite && set ELECTRON=true && npm run dev"

echo [3/3] Starting Electron app...
timeout /t 12 /nobreak >nul
start "Electron" cmd /c "cd /d e:\k\meee\code\project01\electron && npx electron ."

echo.
echo App is starting, please wait...
echo Login: admin / admin123
echo.
pause
