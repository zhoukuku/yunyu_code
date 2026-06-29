@echo off
chcp 65001 >nul
echo ================================
echo QIMA Platform - Dev Mode
echo ================================
echo.

cd /d "%~dp0.."

echo [1/4] Starting Backend (port 3000)...
start "Backend" cmd /k "cd backend ^&^& npm run start:dev"

echo [2/4] Waiting for backend...
timeout /t 5 /nobreak >nul

echo [3/4] Starting Frontend (port 5173)...
start "Frontend" cmd /k "cd frontend-vite ^&^& npm run dev"

echo [4/4] Starting Electron...
timeout /t 8 /nobreak >nul
start "" "electron\node_modules\.bin\electron.cmd" .

echo.
echo ================================
echo Dev environment started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173
echo ================================
pause
