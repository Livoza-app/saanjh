@echo off
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Node.js 22+ is required. Download from https://nodejs.org/
  pause
  exit /b 1
)
start "" http://127.0.0.1:3030
node --experimental-strip-types src/server.ts
pause
