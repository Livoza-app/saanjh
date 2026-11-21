@echo off
cd /d "%~dp0"
set "SAANJH_QA_CASES=50"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\qa-live-windows.ps1"
echo.
pause
