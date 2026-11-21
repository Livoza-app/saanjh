@echo off
cd /d "%~dp0"
node --experimental-strip-types scripts/qa-offline.ts
echo.
pause
