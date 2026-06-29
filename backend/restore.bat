@echo off
REM 数据库恢复脚本 - restore.bat
REM 用法: 双击运行或从命令行执行
REM
REM 恢复流程:
REM 1. 备份当前数据库(如果存在)
REM 2. 从备份文件恢复数据库

setlocal enabledelayedexpansion

set "SCRIPT_DIR=%~dp0"
set "DB_FILE=%SCRIPT_DIR%database.sqlite"
set "BACKUP_DIR=%SCRIPT_DIR%backups"
set "TIMESTAMP=%date:~0,4%%date:~5,2%%date:~8,2%_%time:~0,2%%time:~3,2%%time:~6,2%"
set "TIMESTAMP=%TIMESTAMP: =0%"
set "BACKUP_FILE="

REM 查找最新备份文件
for /f "delims=" %%i in ('dir /b /o-d "%BACKUP_DIR%\*.sqlite" 2^>nul') do (
    if not defined BACKUP_FILE set "BACKUP_FILE=%BACKUP_DIR%\%%i"
)

echo ========================================
echo         数据库恢复脚本
echo ========================================
echo.

REM 检查备份目录
if not exist "%BACKUP_DIR%" (
    echo [错误] 备份目录不存在: %BACKUP_DIR%
    echo 请先运行 backup.bat 创建备份
    pause
    exit /b 1
)

REM 检查备份文件
if not defined BACKUP_FILE (
    echo [错误] 未找到备份文件
    pause
    exit /b 1
)

echo 找到备份文件: %BACKUP_FILE%
echo.

REM 备份当前数据库(如果存在)
if exist "%DB_FILE%" (
    echo 正在备份当前数据库...
    if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"
    copy /y "%DB_FILE%" "%BACKUP_DIR%\current_before_restore_%TIMESTAMP%.sqlite" >nul
    echo 已保存当前数据库到: current_before_restore_%TIMESTAMP%.sqlite
    echo.
)

REM 恢复数据库
echo 正在恢复数据库...
copy /y "%BACKUP_FILE%" "%DB_FILE%" >nul

if exist "%DB_FILE%" (
    echo.
    echo ========================================
    echo         数据库恢复成功!
    echo ========================================
    echo 恢复文件: %BACKUP_FILE%
    echo 目标位置: %DB_FILE%
) else (
    echo.
    echo [错误] 数据库恢复失败
    pause
    exit /b 1
)

pause