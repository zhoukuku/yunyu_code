@echo off
echo ============================================
echo   云屿学习平台
echo ============================================
echo.
echo 请确保 MySQL 已启动 (端口3306, root/root)
echo.

echo [1/3] 启动后端 (端口3000)...
start "后端" cmd /c "cd /d e:\k\meee\code\project01\backend && npm run start:dev"

echo [2/3] 启动前端 (Electron模式, 端口5174)...
start "前端" cmd /c "cd /d e:\k\meee\code\project01\frontend-vite && set ELECTRON=true && npm run dev"

echo [3/3] 启动Electron桌面应用...
timeout /t 10 /nobreak >nul
start "Electron" cmd /c "cd /d e:\k\meee\code\project01\electron && npx electron ."

echo.
echo 应用正在启动，请稍候...
echo.
pause
