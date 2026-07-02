@echo off
setlocal

echo ========================================
echo   QIMA Learning Platform - Build
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/5] Checking environment...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found
    pause
    exit /b 1
)

echo [2/5] Installing backend dependencies...
cd backend
call npm install
cd ..

echo [3/5] Installing frontend dependencies...
cd frontend-vite
call npm install
cd ..

echo [4/5] Installing Electron dependencies...
cd electron
call npm install
cd ..

echo [5/5] Building Windows package...
cd electron
call npx electron-builder --win
cd ..

echo.
echo ========================================
echo   Build complete!
echo   Output: electron\
echo   Installer: 云屿学习平台-1.0.0-Setup.exe
echo ========================================
pause
