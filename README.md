# Travel Assistant

## Overview
**Travel Assistant** is a modular streamline trip planning and management.  
It combines an authentication backend, a modern React frontend, and a PostgreSQL database into a unified system, orchestrated via Docker Compose.  

The application provides:
- A scalable backend service (FastAPI) for authentication and user management.
- A frontend interface (React + Vite + Tailwind) for user interaction.
- Persistent data storage with PostgreSQL.
- A container-first architecture for reliable local development and production deployment.

---

## Features
### Backend (Auth Service)
- **FastAPI-based REST API** with JWT authentication.
- User registration and login endpoints.
- Database integration with PostgreSQL using SQLAlchemy & Alembic migrations.
- Async database session management.
- Configurable via environment variables (`.env`).

### Frontend
- React + Vite + TypeScript project.
- TailwindCSS for modern responsive UI.
- React Query for API data fetching and caching.
- Form validation with React Hook Form + Zod.
- i18n support with `react-i18next`.

### Infrastructure
- PostgreSQL database (containerized).
- Nginx-based frontend serving in production.
- Separate Docker Compose configs for **development** and **production**.
- Health checks for all services.

---

## Project Constraints and Scope
- **Implemented**: Authentication, database schema for users, frontend scaffolding, Dockerized deployment.
- **Not Implemented Yet**:
  - Trip planning APIs (beyond authentication prototype).
  - External travel API integrations (flights, hotels, etc.).
  - Full role-based access control and advanced features.
- **Constraint**: Current setup assumes Docker is installed and running; deployment outside containers requires manual adjustments.

---

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy, Alembic, Pydantic, JWT (Python 3.12)
- **Frontend**: React 18, Vite, TailwindCSS, TypeScript
- **Database**: PostgreSQL 15 (containerized)
- **Reverse Proxy**: Nginx (production build)
- **Containerization**: Docker, Docker Compose

---

## Installation and Setup

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) (latest)
- [Docker Compose](https://docs.docker.com/compose/)

### Clone Repository
```bash
git clone <repository-url>
cd travel-assistant

