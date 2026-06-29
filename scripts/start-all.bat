@echo off
echo ========================================
echo 奇码科技学习平台 - 启动脚本
echo ========================================
echo.

echo [1/2] 启动后端服务...
cd /d "%~dp0..\backend"
start "Backend" cmd /k "npm run start:dev"

echo 等待后端启动...
timeout /t 5 /nobreak > nul

echo [2/2] 启动前端服务...
cd /d "%~dp0..\frontend"
start "Frontend" cmd /k "npm start"

echo.
echo ========================================
echo 服务已启动！
echo 后端: http://localhost:3000
echo 前端: http://localhost:8000
echo.
echo 测试账号: 13713316871 / 316871
echo ========================================
echo.
pause