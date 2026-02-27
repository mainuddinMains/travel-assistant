@echo off
echo ========================================
echo Starting Auth Backend (Port 8001)
echo ========================================
echo.
cd backend\auth-backend
python -m uvicorn app.main:app --reload --port 8001
pause

