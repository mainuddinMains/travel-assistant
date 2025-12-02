@echo off
echo ========================================
echo Starting Dashboard Backend (Port 8000)
echo ========================================
echo.
cd backend\dashboard-api
python -m uvicorn server:app --reload --port 8000
pause

