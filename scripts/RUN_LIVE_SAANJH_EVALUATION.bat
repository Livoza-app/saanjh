@echo off
setlocal
cd /d "%~dp0.."
echo.
echo =========================================
echo  SAANJH - PRIVATE LIVE GEMINI TEST
echo =========================================
echo Only fictional test cases will be used.
echo Your API key will be entered privately and will not be saved in this project.
echo API usage may incur charges.
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0evaluate-live-gemini-v09-windows.ps1"
set "exitcode=%ERRORLEVEL%"
echo.
if "%exitcode%"=="0" (
  echo Evaluation finished. Find your report in the .local-reports folder.
) else (
  echo Evaluation did not complete successfully. See the message above.
)
echo.
pause
exit /b %exitcode%
