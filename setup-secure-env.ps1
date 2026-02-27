#!/usr/bin/env pwsh
# Secure Environment Setup Script for Travel Assistant
# This script helps you set up environment variables securely

Write-Host "🔐 Travel Assistant - Secure Environment Setup" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

# Check if .env already exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Setup cancelled." -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "🔑 Please enter your API keys securely:" -ForegroundColor Cyan

# Get Google Maps API Key
do {
    $googleMapsKey = Read-Host "Enter your Google Maps API Key (required)"
    if ([string]::IsNullOrWhiteSpace($googleMapsKey)) {
        Write-Host "❌ Google Maps API Key is required!" -ForegroundColor Red
    }
} while ([string]::IsNullOrWhiteSpace($googleMapsKey))

# Get ChatGPT API Key
do {
    $chatgptKey = Read-Host "Enter your ChatGPT/OpenAI API Key (required)"
    if ([string]::IsNullOrWhiteSpace($chatgptKey)) {
        Write-Host "❌ ChatGPT API Key is required!" -ForegroundColor Red
    }
} while ([string]::IsNullOrWhiteSpace($chatgptKey))

# Generate secure secret key for backend
$secretKey = -join ((1..64) | ForEach {Get-Random -InputObject (33..126) | ForEach {[char]$_}})

Write-Host ""
Write-Host "🔧 Creating secure .env file..." -ForegroundColor Yellow

# Create .env file
$envContent = @"
# Travel Assistant Environment Variables
# Generated on $(Get-Date)

# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=$googleMapsKey

# ChatGPT API Configuration
VITE_CHATGPT_API_KEY=$chatgptKey

# Backend API Configuration
VITE_USE_BACKEND_API=true
VITE_API_BASE_URL=http://localhost:8001/api/v1

# Environment
VITE_NODE_ENV=production

# Database Configuration (for Docker)
DATABASE_URL=postgresql+asyncpg://travel_user:travel_password@db:5432/travel_assistant_auth
SECRET_KEY=$secretKey
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
API_PREFIX=/api/v1
ENV=production
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173,http://localhost
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8

Write-Host "✅ .env file created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "🔒 Security Notes:" -ForegroundColor Cyan
Write-Host "  • Your .env file is automatically ignored by Git" -ForegroundColor White
Write-Host "  • API keys are now stored securely" -ForegroundColor White
Write-Host "  • Never commit .env files to version control" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Run: docker compose up --build" -ForegroundColor White
Write-Host "  2. Visit: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Important: Keep your .env file secure and never share it!" -ForegroundColor Red



