@echo off
chcp 65001 >nul
echo ========================================
echo   奇码科技学习平台 - 打包构建
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/5] 检查环境...
where node >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到 Node.js
    pause
    exit /b 1
)

echo [2/5] 安装后端依赖...
cd backend
call npm install
cd ..

echo [3/5] 安装前端依赖...
cd frontend-vite
call npm install
cd ..

echo [4/5] 安装 Electron 依赖...
cd electron
call npm install
cd ..

echo [5/5] 构建 Windows 安装包...
cd electron
call npx electron-builder --win

echo.
echo ========================================
echo   构建完成！
echo   安装包位于: electron\release\
echo ========================================
pause
