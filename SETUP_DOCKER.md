# Docker Setup Guide for Travel Assistant

## 🐳 Docker Installation

### Windows (Recommended)

1. **Download Docker Desktop for Windows**
   - Go to: https://www.docker.com/products/docker-desktop/
   - Download Docker Desktop for Windows
   - Run the installer and follow the setup wizard

2. **Enable WSL 2 (Recommended)**
   - Docker Desktop will prompt you to enable WSL 2
   - This provides better performance and compatibility

3. **Verify Installation**
   ```powershell
   docker --version
   docker compose version
   ```

### Alternative: Install via Chocolatey
```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Docker Desktop
choco install docker-desktop
```

## 🚀 Quick Start After Docker Installation

### 1. Start Docker Desktop
- Launch Docker Desktop from Start Menu
- Wait for it to fully start (whale icon in system tray)

### 2. Navigate to Project
```powershell
cd C:\Users\maayi\PSD\travel-assistant
```

### 3. Build and Start Services
```powershell
# Development environment (recommended for first run)
docker compose -f docker-compose.dev.yml up --build

# Or production environment
docker compose up --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs

## 🔧 Manual Setup (Without Docker)

If you prefer to run without Docker, follow these steps:

### Backend Setup

1. **Install PostgreSQL**
   ```powershell
   # Using Chocolatey
   choco install postgresql
   
   # Or download from: https://www.postgresql.org/download/windows/
   ```

2. **Create Database**
   ```sql
   -- Connect to PostgreSQL as superuser
   CREATE DATABASE travel_assistant_auth;
   CREATE USER travel_user WITH PASSWORD 'travel_password';
   GRANT ALL PRIVILEGES ON DATABASE travel_assistant_auth TO travel_user;
   ```

3. **Setup Backend**
   ```powershell
   cd backend\auth-backend
   
   # Create virtual environment
   python -m venv venv
   venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   
   # Create .env file
   echo "DATABASE_URL=postgresql+asyncpg://travel_user:travel_password@localhost:5432/travel_assistant_auth" > .env
   echo "SECRET_KEY=your-secret-key-here-change-in-production" >> .env
   echo "ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173" >> .env
   
   # Setup database tables
   python setup_database.py
   
   # Start server
   python start_server.py
   ```

### Frontend Setup

1. **Install Node.js**
   ```powershell
   # Using Chocolatey
   choco install nodejs
   
   # Or download from: https://nodejs.org/
   ```

2. **Setup Frontend**
   ```powershell
   cd frontend
   
   # Install dependencies
   npm install
   
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:8001/api/v1" > .env
   
   # Start development server
   npm run dev
   ```

## 🧪 Testing the Setup

### With Docker
```powershell
# Check if services are running
docker compose ps

# Test backend health
curl http://localhost:8001/healthz

# Test API
curl -X POST http://localhost:8001/api/v1/auth/signup -H "Content-Type: application/json" -d '{"name":"Test User","email":"test@example.com","password":"testpass123"}'
```

### Without Docker
```powershell
# Test backend health
curl http://localhost:8001/healthz

# Test frontend
curl http://localhost:3000
```

## 🐛 Troubleshooting

### Docker Issues

1. **Docker not starting**
   - Restart Docker Desktop
   - Check if virtualization is enabled in BIOS
   - Ensure WSL 2 is installed and updated

2. **Port conflicts**
   ```powershell
   # Check what's using ports
   netstat -ano | findstr :8001
   netstat -ano | findstr :3000
   netstat -ano | findstr :5432
   ```

3. **Permission issues**
   - Run PowerShell as Administrator
   - Ensure Docker Desktop is running

### Manual Setup Issues

1. **PostgreSQL connection issues**
   - Check if PostgreSQL service is running
   - Verify database credentials
   - Check firewall settings

2. **Python dependency issues**
   - Use Python 3.12+
   - Create fresh virtual environment
   - Update pip: `python -m pip install --upgrade pip`

3. **Node.js issues**
   - Use Node.js 18+
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall

## 📊 Expected Output

When everything is working correctly, you should see:

### Backend Logs
```
🚀 Starting Travel Assistant Authentication Backend...
📍 Server will be available at: http://localhost:8001
📚 API documentation at: http://localhost:8001/docs
🔍 Health check at: http://localhost:8001/healthz
💾 Database: PostgreSQL
🔐 Security: JWT + bcrypt
🔧 Setting up database tables...
✅ Database tables ready!
INFO:     Started server process [1234]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Frontend Logs
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

## 🎯 Next Steps

1. **Install Docker Desktop** (recommended)
2. **Run the Docker setup** as shown above
3. **Test the application** by visiting http://localhost:3000
4. **Create a user account** through the signup form
5. **Explore the API** at http://localhost:8001/docs

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Check the logs for specific error messages
4. Ensure all ports are available (3000, 8001, 5432)

