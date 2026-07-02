@echo off
cd /d "%~dp0"
echo Starting Electron desktop app...
node run-electron.js .
pause
