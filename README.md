# Travel Assistant - Intelligent Trip Planning Application

## 🌟 Overview

**Travel Assistant** is a modern, AI-powered trip planning application that combines intelligent chat, interactive maps, and personalized recommendations. Built with a modular architecture, it provides a seamless user experience for planning and optimizing travel experiences.

### Key Features

- **🤖 AI-Powered Chat**: Intelligent conversation system for trip planning with ChatGPT integration
- **🗺️ Interactive Maps**: Real-time Google Maps integration with route planning and place recommendations
- **🔐 Secure Authentication**: JWT-based user authentication with bcrypt password hashing
- **⚡ Modern Stack**: React + Vite frontend, FastAPI backend, PostgreSQL database
- **🐳 Docker Ready**: Complete containerization for reliable development and deployment

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Tech Stack](#-tech-stack)
3. [Quick Start](#-quick-start)
4. [Installation](#-installation)
5. [Configuration](#-configuration)
6. [Running the Application](#-running-the-application)
7. [Development](#-development)
8. [Security](#-security)
9. [Troubleshooting](#-troubleshooting)
10. [API Documentation](#-api-documentation)

---

## ✨ Features

### Backend (Auth Service)
- **FastAPI-based REST API** with async support
- **JWT authentication** with refresh tokens
- **PostgreSQL database** integration with SQLAlchemy ORM
- **Alembic migrations** for database schema management
- **Health checks** for service monitoring
- **Automatic database initialization**
- **Configurable via environment variables**

### Frontend
- **React 18** with TypeScript for type safety
- **Vite** for lightning-fast development experience
- **TailwindCSS** for modern, responsive UI design
- **React Hook Form + Zod** for robust form validation
- **i18n support** with react-i18next
- **Google Maps integration** with interactive routing
- **ChatGPT integration** for AI-powered recommendations
- **Travel-themed design** with micro-interactions and animations

### Infrastructure
- **PostgreSQL 15** database (containerized)
- **Nginx** reverse proxy for production
- **Docker Compose** for orchestration
- **Separate configs** for development and production
- **Health checks** for all services
- **Volume persistence** for database data

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI 0.115.2
- **Runtime**: Python 3.12+
- **Database**: PostgreSQL 15 with asyncpg
- **ORM**: SQLAlchemy 2.0 with async support
- **Migrations**: Alembic 1.13.3
- **Authentication**: JWT with python-jose
- **Validation**: Pydantic 2.9
- **ASGI Server**: Uvicorn 0.30.6

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite 5.0
- **Styling**: TailwindCSS 3.x
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios
- **i18n**: react-i18next
- **State Management**: React Context API

### DevOps
- **Containerization**: Docker 24+
- **Orchestration**: Docker Compose v2
- **Reverse Proxy**: Nginx Alpine
- **Database**: PostgreSQL 15 Alpine

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** installed and running ([Download](https://www.docker.com/products/docker-desktop/))
- **Docker Compose** v2 (included with Docker Desktop)
- **Google Maps API Key** (optional, for maps functionality) ([Get Key](https://console.cloud.google.com/))
- **ChatGPT API Key** (optional, for AI features) ([Get Key](https://platform.openai.com/))

### 1-Minute Setup

```bash
# Clone the repository
git clone <repository-url>
cd travel-assistant

# Setup environment variables
.\setup-env.ps1  # Windows PowerShell
./setup-env.sh   # Unix/Linux/macOS

# Start the application
docker compose -f docker-compose.dev.yml up --build

# Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:8001/docs
```

That's it! 🎉

---

## 📦 Installation

### Docker Installation

#### Windows (Recommended)

1. **Download Docker Desktop** from [docker.com](https://www.docker.com/products/docker-desktop/)
2. **Run the installer** and follow the setup wizard
3. **Enable WSL 2** when prompted (recommended for better performance)
4. **Verify installation**:
   ```powershell
   docker --version
   docker compose version
   ```

#### Alternative: Install via Chocolatey
```powershell
# Install Chocolatey (if not already installed)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# Install Docker Desktop
choco install docker-desktop
```

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

#### macOS
```bash
# Install via Homebrew
brew install --cask docker

# Or download from docker.com
```

### Manual Setup (Without Docker)

#### Backend Setup

1. **Install PostgreSQL**:
   ```bash
   # Windows (Chocolatey)
   choco install postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE travel_assistant_auth;
   CREATE USER travel_user WITH PASSWORD 'travel_password';
   GRANT ALL PRIVILEGES ON DATABASE travel_assistant_auth TO travel_user;
   ```

3. **Setup Python Environment**:
   ```bash
   cd backend/auth-backend
   
   # Create virtual environment
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   
   # Install dependencies
   pip install -r requirements.txt
   ```

4. **Configure Environment**:
   ```bash
   # Create .env file
   cp ../env.example .env
   
   # Edit .env with your database credentials
   # DATABASE_URL=postgresql+asyncpg://travel_user:travel_password@localhost:5432/travel_assistant_auth
   ```

5. **Initialize Database**:
   ```bash
   # Run migrations
   alembic upgrade head
   ```

6. **Start Server**:
   ```bash
   python start_server.py
   ```

#### Frontend Setup

1. **Install Node.js** (v18+ recommended):
   ```bash
   # Download from nodejs.org
   # Or use package manager
   ```

2. **Setup Frontend**:
   ```bash
   cd frontend
   
   # Install dependencies
   npm install
   
   # Create .env file
   cp ../env.example .env
   
   # Edit .env with your configuration
   # VITE_API_BASE_URL=http://localhost:8001/api/v1
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

---

## ⚙️ Configuration

### Environment Variables

The application uses environment variables for configuration. Create a `.env` file in the project root:

```env
# API Keys (Required for full functionality)
VITE_CHATGPT_API_KEY=your_chatgpt_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend Configuration
DATABASE_URL=postgresql+asyncpg://travel_user:travel_password@db:5432/travel_assistant_auth
SECRET_KEY=your-super-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
API_PREFIX=/api/v1
LOG_LEVEL=INFO
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:8001/api/v1
VITE_NODE_ENV=development

# Database Configuration (Docker)
POSTGRES_DB=travel_assistant_auth
POSTGRES_USER=travel_user
POSTGRES_PASSWORD=travel_password
```

### Automated Setup

#### Windows PowerShell
```powershell
# Run the setup script
.\setup-env.ps1

# Or use secure setup
.\setup-secure-env.ps1
```

#### Unix/Linux/macOS
```bash
# Make scripts executable
chmod +x setup-env.sh setup-secure-env.sh

# Run the setup script
./setup-env.sh

# Or use secure setup
./setup-secure-env.sh
```

### API Keys Setup

#### Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Distance Matrix API
4. Create credentials (API Key)
5. **Restrict the API key** for security:
   - HTTP referrers: `http://localhost:3000/*`, `http://localhost:5173/*`
   - API restrictions: Enable only Maps/Places APIs

#### ChatGPT API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new secret key
5. **Set usage limits** in dashboard
6. Copy the key (it won't be shown again)

---

## 🏃 Running the Application

### Docker (Recommended)

#### Development Mode
```bash
# Start all services in development mode
docker compose -f docker-compose.dev.yml up --build

# Run in detached mode
docker compose -f docker-compose.dev.yml up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose -f docker-compose.dev.yml down
```

#### Production Mode
```bash
# Start all services in production mode
docker compose up --build

# Run in detached mode
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Health Check**: http://localhost:8001/healthz

### Useful Docker Commands

```bash
# Check service status
docker compose ps

# View logs for specific service
docker compose logs auth-backend
docker compose logs frontend
docker compose logs db

# Restart a service
docker compose restart auth-backend

# Rebuild specific service
docker compose build auth-backend

# Clean up (remove containers, networks, volumes)
docker compose down -v

# Validate configuration
docker compose config
```

### Without Docker

#### Start Backend
```bash
cd backend/auth-backend
python start_server.py
```

#### Start Frontend
```bash
cd frontend
npm run dev
```

---

## 💻 Development

### Project Structure

```
travel-assistant/
├── backend/
│   ├── auth-backend/
│   │   ├── app/
│   │   │   ├── api/v1/endpoints/  # API routes
│   │   │   ├── core/              # Configuration
│   │   │   ├── db/                # Database setup
│   │   │   ├── models/            # SQLAlchemy models
│   │   │   ├── schemas/           # Pydantic schemas
│   │   │   └── utils/             # Utilities
│   │   ├── alembic/               # Database migrations
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── README.md
├── frontend/
│   ├── src/
│   │   ├── app/                   # App configuration
│   │   ├── components/            # React components
│   │   ├── pages/                 # Page components
│   │   ├── services/              # API services
│   │   └── styles/                # CSS/styles
│   ├── Dockerfile
│   └── package.json
├── nginx/
│   └── nginx.conf                 # Nginx configuration
├── docker-compose.yml             # Production config
├── docker-compose.dev.yml         # Development config
├── .env.example                   # Environment template
├── setup-env.ps1                  # Windows setup script
├── setup-env.sh                   # Unix setup script
└── README.md                      # This file
```

### Development Workflow

1. **Make changes** to your code
2. **Test locally** with Docker or manual setup
3. **Commit changes** with descriptive messages
4. **Push to repository**
5. **Deploy** to production environment

### Code Quality

```bash
# Backend linting
cd backend/auth-backend
pylint app/

# Frontend linting
cd frontend
npm run lint

# Type checking (Frontend)
npm run type-check

# Format code
npm run format
```

### Database Migrations

```bash
# Create a new migration
cd backend/auth-backend
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# In Docker
docker compose exec auth-backend alembic upgrade head
```

### Testing

```bash
# Backend tests
cd backend/auth-backend
pytest

# Frontend tests
cd frontend
npm test

# Run all tests
npm run test:all
```

---

## 🔒 Security

### Best Practices

#### API Keys
- ✅ **DO**: Store in environment variables
- ✅ **DO**: Use `.env` files for local development
- ✅ **DO**: Keep `.env` files in `.gitignore`
- ✅ **DO**: Restrict API keys to specific domains/IPs
- ✅ **DO**: Rotate API keys regularly
- ❌ **DON'T**: Hardcode in source code
- ❌ **DON'T**: Commit `.env` files
- ❌ **DON'T**: Share API keys in chat/email

#### Google Maps API Security
- Enable **HTTP referrer restrictions**
- Enable **API restrictions** (only needed APIs)
- Use **different keys** for dev/prod environments
- Monitor **usage and abuse**

#### JWT Security
- Use **strong secret keys** (32+ characters)
- Set **appropriate expiration times**
- Implement **refresh token rotation**
- Use **HTTPS in production**

#### Database Security
- Use **strong passwords**
- Restrict **network access**
- Enable **SSL/TLS connections**
- Regular **backups**

### Security Checklist

Before deploying:
- [ ] API keys stored in environment variables
- [ ] `.env` file not committed to Git
- [ ] Google Maps API has proper restrictions
- [ ] ChatGPT API has usage limits
- [ ] Secret keys are randomly generated
- [ ] HTTPS enabled in production
- [ ] CORS properly configured
- [ ] Database credentials secured
- [ ] Logs don't contain sensitive data

### Incident Response

If API keys are compromised:
1. **Immediately** revoke the compromised key
2. Generate new API keys
3. Update environment variables
4. Deploy with new keys
5. Monitor for unauthorized usage

---

## 🐛 Troubleshooting

### Common Issues

#### Docker Issues

**Docker not starting**
- Restart Docker Desktop
- Check if virtualization is enabled in BIOS
- Ensure WSL 2 is installed and updated (Windows)
- Verify Docker Desktop is running

**Port conflicts**
```bash
# Check what's using ports
netstat -ano | findstr :8001  # Windows
lsof -i :8001                 # Unix/Linux/macOS

# Windows: Find and kill process
netstat -ano | findstr :8001
taskkill /PID <process_id> /F
```

**Permission issues**
- Run PowerShell as Administrator (Windows)
- Add user to docker group (Linux): `sudo usermod -aG docker $USER`
- Ensure Docker Desktop is running

**Build failures**
```bash
# Clean up and rebuild
docker compose down -v
docker system prune -a
docker compose up --build
```

#### Database Issues

**Connection refused**
- Check if PostgreSQL service is running
- Verify database credentials in `.env`
- Check firewall settings
- Ensure database container is healthy: `docker compose ps db`

**Migration errors**
```bash
# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up db
docker compose exec auth-backend alembic upgrade head
```

#### API Issues

**API keys not working**
- Verify API keys are correct in `.env`
- Check API key restrictions in provider dashboard
- Ensure APIs are enabled in Google Cloud Console
- Rebuild containers after changing `.env`

**Frontend can't connect to backend**
- Check CORS configuration in `ALLOWED_ORIGINS`
- Verify backend is running: `curl http://localhost:8001/healthz`
- Check network connectivity between containers
- Review logs: `docker compose logs auth-backend`

#### Frontend Issues

**Build errors**
```bash
# Clear cache and rebuild
cd frontend
rm -rf node_modules dist
npm install
npm run build
```

**Environment variables not loading**
- Ensure `.env` file is in project root
- Verify variable names start with `VITE_` for Vite
- Restart development server
- Rebuild containers if using Docker

### Getting Help

1. Check the logs: `docker compose logs -f`
2. Review error messages carefully
3. Search for similar issues in documentation
4. Verify all prerequisites are installed
5. Ensure ports are available

---

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/signup
Create a new user account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### POST /api/v1/auth/login
Authenticate an existing user.

**Request Body:**
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

#### GET /api/v1/users/me
Get current user information (requires authentication).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com"
}
```

### Health Check

#### GET /healthz
Check service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T12:00:00Z"
}
```

### Interactive API Documentation

Visit http://localhost:8001/docs for:
- **Swagger UI**: Interactive API testing interface
- **ReDoc**: Readable API documentation
- **Try it out**: Test endpoints directly in the browser

---

## 📊 Expected Output

### Successful Startup

When everything is working correctly, you should see:

#### Backend Logs
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

#### Frontend Logs
```
  VITE v5.0.0  ready in 500 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

#### Docker Services
```
NAME                         STATUS    PORTS
travel_assistant_db          running   5433:5432
travel_assistant_auth_backend running  8001:8001
travel_assistant_frontend    running   3000:80
```

---

## 🎯 Next Steps

After successful setup:

1. **Create a user account** through the signup form at http://localhost:3000
2. **Explore the API** at http://localhost:8001/docs
3. **Test the chat interface** and AI recommendations
4. **Try the interactive maps** with route planning
5. **Customize** the configuration for your needs
6. **Deploy** to production when ready

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write/update tests
5. Submit a pull request

---

## 📄 License

This project is licensed under the MIT License.

---

## 📞 Support

For issues, questions, or suggestions:
- Check the troubleshooting section
- Review the logs
- Verify all prerequisites
- Open an issue on GitHub

---

## 🎉 Acknowledgments

Built with:
- FastAPI - Modern Python web framework
- React - Popular JavaScript library
- PostgreSQL - Powerful open-source database
- Docker - Containerization platform
- Google Maps API - Location services
- OpenAI ChatGPT - AI capabilities
- TailwindCSS - Utility-first CSS framework

---

**Happy Travel Planning! ✈️🌍🗺️**
