@echo off
cd /d "%~dp0"
echo.
echo   SAANJH - PRIVATE LOCAL PREVIEW
 echo.
echo Open this in your browser after starting: http://127.0.0.1:3030
 echo.
echo This runs on your own computer. Do not put real children's sensitive details in this research build.
echo.
node --experimental-strip-types src/preview-server.ts
pause
