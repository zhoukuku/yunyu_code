@echo off
setlocal

echo ========================================
echo   YunYu Learning Platform - Build
echo ========================================
echo.

cd /d "%~dp0.."

echo [1/5] Checking Node.js...
where node >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found
    pause
    exit /b 1
)
echo Node.js version:
node --version
echo.

echo [2/5] Installing Electron dependencies...
call npm install
echo.

echo [3/5] Building backend...
cd ..\backend
call npm install
call npm run build
cd ..\electron
echo.

echo [4/5] Building frontend...
cd ..\frontend-vite
call npm install
call npm run build
cd ..\electron
echo.

echo [5/5] Preparing Electron resources...

REM Clean and recreate dist directory (frontend output)
if exist dist rmdir /s /q dist
mkdir dist
xcopy /e /y ..\frontend-vite\dist dist\

REM Clean and recreate backend directory
if exist backend rmdir /s /q backend
mkdir backend\dist
mkdir backend\node_modules

REM Copy only production-necessary backend files
xcopy /e /y ..\backend\dist backend\dist\
xcopy /y ..\backend\package.json backend\
xcopy /e /y ..\backend\node_modules backend\node_modules\

REM Copy backend seed/utility scripts (in scripts/ subdir)
if exist ..\backend\scripts (
    mkdir backend\scripts
    xcopy /e /y ..\backend\scripts backend\scripts\
)

echo.

echo [Build] Starting electron-builder...
call npm run build:win

echo.
echo ========================================
echo   Build complete!
echo   Output: %~dp0..\ (electron directory)
echo   File:   云屿学习平台-1.0.0-Setup.exe
echo ========================================
pause
