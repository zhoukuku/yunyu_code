@echo off
REM Database restore script - restore.bat
REM Usage: double-click or run from command line
REM
REM Restore process:
REM 1. Backup current database (if exists)
REM 2. Restore database from backup file

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "DB_FILE=%SCRIPT_DIR%database.sqlite"
set "BACKUP_DIR=%SCRIPT_DIR%backups"

REM Generate locale-independent timestamp via WMIC
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value 2^>nul') do set "LOCALDATETIME=%%I"
if defined LOCALDATETIME (
    set "TIMESTAMP=!LOCALDATETIME:~0,8!_!LOCALDATETIME:~8,6!"
) else (
    REM Fallback: use PowerShell for timestamp
    for /f "delims=" %%I in ('powershell -NoProfile -Command "Get-Date -Format 'yyyyMMdd_HHmmss'" 2^>nul') do set "TIMESTAMP=%%I"
)
if not defined TIMESTAMP set "TIMESTAMP=unknown"

set "BACKUP_FILE="

REM Find the most recent backup file
for /f "delims=" %%i in ('dir /b /o-d "%BACKUP_DIR%\*.sqlite" 2^>nul') do (
    if not defined BACKUP_FILE set "BACKUP_FILE=%BACKUP_DIR%\%%i"
)

echo ========================================
echo         Database Restore Script
echo ========================================
echo.

REM Check backup directory
if not exist "%BACKUP_DIR%" (
    echo [ERROR] Backup directory does not exist: %BACKUP_DIR%
    echo Please run backup.bat first to create a backup.
    pause
    exit /b 1
)

REM Check backup file
if not defined BACKUP_FILE (
    echo [ERROR] No backup file found in: %BACKUP_DIR%
    pause
    exit /b 1
)

echo Found backup file: %BACKUP_FILE%
echo.

REM Backup current database (if exists)
if exist "%DB_FILE%" (
    echo Backing up current database...
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
    copy /y "%DB_FILE%" "%BACKUP_DIR%\current_before_restore_%TIMESTAMP%.sqlite" >nul
    echo Saved current database to: current_before_restore_%TIMESTAMP%.sqlite
    echo.
)

REM Restore database
echo Restoring database...
copy /y "%BACKUP_FILE%" "%DB_FILE%" >nul

if exist "%DB_FILE%" (
    echo.
    echo ========================================
    echo         Database Restored Successfully!
    echo ========================================
    echo Restored from: %BACKUP_FILE%
    echo Target:        %DB_FILE%
) else (
    echo.
    echo [ERROR] Database restore failed
    pause
    exit /b 1
)

pause
