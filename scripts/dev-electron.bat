@echo off
echo ================================
echo QIMA Platform - Dev Mode
echo ================================
echo.

cd /d "%~dp0.."

echo [1/4] Starting Backend (port 3000)...
start "Backend" /d "%~dp0..\backend" cmd /k "npm run start:dev"

echo [2/4] Waiting for backend...
timeout /t 5 /nobreak >nul

echo [3/4] Starting Frontend (port 5174, Electron mode)...
start "Frontend" /d "%~dp0..\frontend-vite" cmd /k "set ELECTRON=true && npm run dev"

echo [4/4] Starting Electron...
timeout /t 8 /nobreak >nul
start "" /d "%~dp0.." "electron\node_modules\.bin\electron.cmd" .

echo.
echo ================================
echo Dev environment started!
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5174
echo ================================
pause
