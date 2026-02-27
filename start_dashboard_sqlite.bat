@echo off
echo Starting Dashboard Backend Server (SQLite)...
echo.
cd /d "%~dp0Dashboard\backend_logic_chat"
echo Current directory: %CD%
echo.
echo Starting server on port 8000...
python server.py
pause

