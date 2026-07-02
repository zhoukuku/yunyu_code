@echo off
echo ========================================
echo    QIMA Learning Platform - Start All
echo ========================================
echo.

echo [1/2] Starting backend service...
start "Backend" /d "%~dp0..\backend" cmd /k "npm run start:dev"

echo Waiting for backend to start...
timeout /t 5 /nobreak >nul

echo [2/2] Starting frontend service...
start "Frontend" /d "%~dp0..\frontend-vite" cmd /k "npm run dev"

echo.
echo ========================================
echo   Services started!
echo   Backend:  http://localhost:3000
echo   Frontend: http://localhost:5173
echo.
echo   Test account: 13713316871 / 316871
echo ========================================
echo.
pause
