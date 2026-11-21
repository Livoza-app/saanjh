@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>&1
if errorlevel 1 (
  echo Install Node.js 22 or later from https://nodejs.org/ first.
  pause
  exit /b 1
)
echo === Local structural tests ===
call npm test
if errorlevel 1 goto :failed
echo.
echo === Retrieval test cases ===
call npm run eval
if errorlevel 1 goto :failed
echo.
echo === Download first-party Gita source and import selected verses ===
call npm run import:gita
if errorlevel 1 goto :failed
echo.
echo Verification completed. The source is available locally; live AI still requires a securely configured API key.
pause
exit /b 0
:failed
echo.
echo A check failed. No live AI testing has been performed. See NEXT-STEPS.md.
pause
exit /b 1
