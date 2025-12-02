@echo off
echo Starting Travel Assistant Backend Servers...
echo.

REM Start Auth Backend in new window
start "Auth Backend (Port 8001)" cmd /k "cd backend\auth-backend && python -m uvicorn app.main:app --reload --port 8001"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Dashboard Backend in new window
start "Dashboard Backend (Port 8000)" cmd /k "cd backend\dashboard-api && python -m uvicorn server:app --reload --port 8000"

echo.
echo Both servers are starting in separate windows...
echo.
echo Auth Backend: http://localhost:8001
echo Dashboard Backend: http://localhost:8000
echo.
echo Close the server windows or press Ctrl+C in each to stop them.
echo.
pause

