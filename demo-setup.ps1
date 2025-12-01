# Travel Assistant Demo Setup Script
# Run this script to ensure everything is ready for your sprint meeting

Write-Host "🚀 Travel Assistant Demo Setup" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Green

# Check if frontend is running
Write-Host "`n📱 Checking Frontend Status..." -ForegroundColor Yellow
$frontendStatus = netstat -ano | findstr :5173
if ($frontendStatus) {
    Write-Host "✅ Frontend is running on http://localhost:5173" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend not running. Starting frontend..." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-Command", "cd frontend; npm run dev" -WindowStyle Minimized
    Start-Sleep -Seconds 5
    Write-Host "✅ Frontend should now be running on http://localhost:5173" -ForegroundColor Green
}

# Check if backend is running
Write-Host "`n🔧 Checking Backend Status..." -ForegroundColor Yellow
$backendStatus = netstat -ano | findstr :8001
if ($backendStatus) {
    Write-Host "✅ Backend is running on http://localhost:8001" -ForegroundColor Green
} else {
    Write-Host "❌ Backend not running. Starting backend..." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-Command", "cd backend/auth-backend; python start_server.py" -WindowStyle Minimized
    Start-Sleep -Seconds 3
    Write-Host "✅ Backend should now be running on http://localhost:8001" -ForegroundColor Green
}

# Display demo information
Write-Host "`n🎯 Demo Information:" -ForegroundColor Cyan
Write-Host "===================" -ForegroundColor Cyan
Write-Host "Frontend URL: http://localhost:5173" -ForegroundColor White
Write-Host "Backend API: http://localhost:8001/docs" -ForegroundColor White
Write-Host "Google Maps: ✅ Integrated" -ForegroundColor Green
Write-Host "ChatGPT AI: ✅ Integrated (Mock Service)" -ForegroundColor Green

Write-Host "`n🎬 Demo Features Ready:" -ForegroundColor Magenta
Write-Host "=======================" -ForegroundColor Magenta
Write-Host "• Interactive AI chat for trip planning" -ForegroundColor White
Write-Host "• Google Maps integration with place markers" -ForegroundColor White
Write-Host "• Question flow system for personalized recommendations" -ForegroundColor White
Write-Host "• Real-time route planning and optimization" -ForegroundColor White

Write-Host "`n🚀 Ready for Sprint Meeting!" -ForegroundColor Green
Write-Host "Open http://localhost:5173 to start the demo" -ForegroundColor Yellow



