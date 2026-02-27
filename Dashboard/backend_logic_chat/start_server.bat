@echo off
cd /d "%~dp0"
echo ========================================
echo Dashboard Backend Server
echo Database: SQLite (converted from MySQL)
echo Port: 8000
echo ========================================
echo.
echo Starting server...
python server.py
pause
