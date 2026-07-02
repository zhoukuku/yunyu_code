@echo off
echo ================================
echo QIMA Learning Platform - Launcher
echo ================================
echo.

cd /d "%~dp0.."

echo [1/3] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found!
    echo Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b 1
)
node --version
echo.

echo [2/3] Checking Electron dependencies...
cd electron
if not exist "node_modules" (
    echo Installing Electron...
    call npm install
)
cd ..
echo.

echo [3/3] Starting Electron app...
cd electron
start "" node run-electron.js .
cd ..

echo.
echo App should be starting...
pause
