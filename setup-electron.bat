@echo off
setlocal

cd /d "%~dp0electron"

if not exist electron.zip (
    echo ============================================
    echo   ERROR: electron.zip not found
    echo   Place it in: %~dp0electron\
    echo ============================================
    pause
    exit /b 1
)

echo ============================================
echo [1/2] Extracting electron.zip to runtime\
echo ============================================

REM Check that PowerShell is available
where powershell >nul 2>&1
if errorlevel 1 (
    echo   ERROR: PowerShell not found. Windows 7+ required.
    pause
    exit /b 1
)

if exist runtime rmdir /s /q runtime
mkdir runtime
powershell -NoProfile -Command "Expand-Archive -Path electron.zip -DestinationPath runtime -Force"

if not exist runtime\electron.exe (
    echo   ERROR: Extraction failed - electron.exe not found in runtime\
    pause
    exit /b 1
)
echo   Done.

echo [2/2] Removing node_modules\electron
if exist node_modules\electron rmdir /s /q node_modules\electron
echo   Done.

echo ============================================
echo   Setup complete.
echo   Run "%~dp0start.bat" to launch the platform.
echo ============================================
pause
