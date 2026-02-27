@echo off
echo ========================================
echo Starting Dashboard Backend Server
echo Database: SQLite (converted from MySQL)
echo Port: 8000
echo ========================================
echo.
cd /d %~dp0
echo Starting server...
python server.py
pause

