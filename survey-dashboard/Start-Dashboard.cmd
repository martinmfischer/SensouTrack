@echo off
cd /d "%~dp0.."
call npm run survey:build
if errorlevel 1 (pause & exit /b 1)
start "" "http://127.0.0.1:5174"
call npm run survey:start
pause
