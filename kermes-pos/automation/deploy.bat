@echo off
echo Kermes POS Deployment Script
echo ===========================
echo.

cd /d %~dp0\..
node automation/deploy.js

if %ERRORLEVEL% NEQ 0 (
  echo.
  echo Deployment failed with error code %ERRORLEVEL%
  pause
  exit /b %ERRORLEVEL%
)

echo.
echo Deployment completed successfully!
pause 