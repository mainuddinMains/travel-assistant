#!/bin/bash
# Secure Environment Setup Script for Travel Assistant
# This script helps you set up environment variables securely

echo "🔐 Travel Assistant - Secure Environment Setup"
echo "==============================================="

# Check if .env already exists
if [ -f ".env" ]; then
    echo "⚠️  .env file already exists!"
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "❌ Setup cancelled."
        exit 1
    fi
fi

echo ""
echo "🔑 Please enter your API keys securely:"

# Get Google Maps API Key
while true; do
    read -p "Enter your Google Maps API Key (required): " googleMapsKey
    if [ ! -z "$googleMapsKey" ]; then
        break
    fi
    echo "❌ Google Maps API Key is required!"
done

# Get ChatGPT API Key
while true; do
    read -p "Enter your ChatGPT/OpenAI API Key (required): " chatgptKey
    if [ ! -z "$chatgptKey" ]; then
        break
    fi
    echo "❌ ChatGPT API Key is required!"
done

# Generate secure secret key for backend
secretKey=$(openssl rand -base64 64 | tr -d '\n')

echo ""
echo "🔧 Creating secure .env file..."

# Create .env file
cat > .env << EOF
# Travel Assistant Environment Variables
# Generated on $(date)

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
EOF

echo "✅ .env file created successfully!"
echo ""
echo "🔒 Security Notes:"
echo "  • Your .env file is automatically ignored by Git"
echo "  • API keys are now stored securely"
echo "  • Never commit .env files to version control"
echo ""
echo "🚀 Next steps:"
echo "  1. Run: docker compose up --build"
echo "  2. Visit: http://localhost:3000"
echo ""
echo "⚠️  Important: Keep your .env file secure and never share it!"



