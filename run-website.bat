@echo off
setlocal
cd /d "%~dp0"

echo ======================================
echo Starting Technodel website...
echo Project: %CD%
echo ======================================

netstat -ano | findstr ":4040" | findstr "LISTENING" >nul
if %errorlevel%==0 (
  echo Port 4040 is already in use.
  echo The website is likely already running.
  start "" "http://localhost:4040"
  echo.
  echo Close the other server if you want this script to start a fresh one.
  pause
  exit /b 0
)

if not exist node_modules (
  echo Installing dependencies...
  call npm install
)

echo Syncing Prisma schema...
call npx prisma generate
if errorlevel 1 goto :failed
call npx prisma db push
if errorlevel 1 goto :failed

echo Starting Next.js dev server on http://localhost:4040 ...
call npm run dev
if errorlevel 1 goto :failed
exit /b 0

:failed
echo.
echo Startup failed. Read the error above.
pause
exit /b 1
