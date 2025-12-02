# Start Travel Assistant Backend Servers
Write-Host "Starting Travel Assistant Backend Servers..." -ForegroundColor Green
Write-Host ""

# Start Auth Backend in new window
Write-Host "Starting Auth Backend (Port 8001)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\auth-backend'; python -m uvicorn app.main:app --reload --port 8001"

# Wait a moment
Start-Sleep -Seconds 2

# Start Dashboard Backend in new window
Write-Host "Starting Dashboard Backend (Port 8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend\dashboard-api'; python -m uvicorn server:app --reload --port 8000"

Write-Host ""
Write-Host "Both servers are starting in separate windows..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Auth Backend: http://localhost:8001" -ForegroundColor White
Write-Host "Dashboard Backend: http://localhost:8000" -ForegroundColor White
Write-Host ""
Write-Host "Close the server windows to stop them." -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to exit this window (servers will continue running)..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

