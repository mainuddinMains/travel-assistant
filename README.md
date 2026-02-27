# Travel Assistant

Travel Assistant is a multi-module monorepo for AI-assisted trip planning, mapping, and user-facing dashboard experiences.

This repository currently contains:
- a production-style auth stack (`frontend` + `backend/auth-backend` + PostgreSQL + Docker)
- multiple dashboard/prototype frontends (`dashboard_code/*`)
- AI + map planning backends and scripts (`backend`, `Dashboard`, `Google_Map_Code`, `docs`)

## What To Run First

If you want one clear starting point, use this stack:
1. `frontend` (React + TypeScript)
2. `backend/auth-backend` (FastAPI auth API)
3. `docker-compose.dev.yml` for local containerized development

## Repository Layout

```text
travel-assistant/
├── frontend/                      # Main React + TS app (auth + UI flow)
├── backend/
│   ├── auth-backend/              # FastAPI auth service (JWT + refresh cookie)
│   ├── server.py                  # TravelAgent API (Gemini + Google Maps flow)
│   ├── chat.py                    # CLI/testing dual-agent travel planner
│   ├── gmaps_requests.py          # Google Maps enrichment and routing helpers
│   └── main.py                    # Simple FastAPI /plan prototype endpoint
├── dashboard_code/
│   ├── dashboard-ui/              # React dashboard prototype
│   └── vite-project/              # Additional dashboard variant/components
├── Dashboard/                     # Legacy TripRoute split backend/frontend implementation
├── Google_Map_Code/               # Python itinerary + route optimization modules
├── docs/                          # Additional copies/docs for map/AI modules
├── docker-compose.yml             # Production-like compose stack
├── docker-compose.dev.yml         # Development compose stack
└── env.example                    # Root environment variable template
```

## Tech Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query
- Auth API: FastAPI, SQLAlchemy, Alembic, JWT, PostgreSQL
- AI/Planning: Gemini/OpenAI integrations, Google Maps APIs, OR-Tools-style route flow modules
- Infra: Docker, Docker Compose, Nginx

## Prerequisites

- Node.js 18+
- Python 3.10+
- Docker + Docker Compose (for containerized run)
- API keys as needed:
  - Google Maps API key
  - Gemini or OpenAI key (depending on module)

## Environment Setup

### Root `.env` (for Docker stack)

```bash
cp env.example .env
```

Edit `.env` with real values (especially `SECRET_KEY`, API keys, and allowed origins).

### Auth backend `.env`

```bash
cd backend/auth-backend
cp .env.example .env
```

Set at minimum:
- `SECRET_KEY`
- `DATABASE_URL` (if not using default)
- CORS values if frontend origin differs

### TripRoute backend `api.env`

`backend/server.py` and `backend/chat.py` expect `backend/api.env`:

```env
GEMINI_API_KEY=your_gemini_key
GMAP_API_KEY=your_google_maps_key
```

## Run Options

### 1) Docker Development Stack (Recommended)

From repository root:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Services:
- Frontend: `http://localhost:3000`
- Auth backend: `http://localhost:8001`
- Postgres: `localhost:5432`

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

### 2) Run Main Frontend + Auth Backend Locally (No Docker)

### Start auth backend

```bash
cd backend/auth-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python start_server.py
```

Auth API:
- Base app: `http://localhost:8001`
- Docs: `http://localhost:8001/docs`
- Health: `http://localhost:8001/healthz`

### Start frontend

```bash
cd frontend
npm install
cp env.example .env
npm run dev
```

Frontend dev URL is printed by Vite (typically `http://localhost:5173`).

### 3) Run Dashboard Prototype Apps

### dashboard-ui

```bash
cd dashboard_code/dashboard-ui
npm install
npm run dev
```

### vite-project dashboard variant

```bash
cd dashboard_code/vite-project
npm install
npm run dev
```

### 4) Run TravelAgent Prototype Backend (`backend/server.py`)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
```

Important: create `backend/api.env` first (see section above).

## Key API Endpoints

### Auth Backend (`backend/auth-backend`)

With default `API_PREFIX=/api/v1`:
- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/signout`
- `GET /api/v1/auth/me`
- `GET /api/v1/users/me`
- `GET /api/v1/health`
- `GET /healthz`
- `GET /healthz/db`

### TravelAgent Backend (`backend/server.py`)

- `GET /`
- `GET /health`
- `POST /chat/init`
- `POST /chat/stream/{session_id}`
- `POST /places/select/{session_id}`
- `DELETE /places/select/{session_id}/{place_id}`
- `GET /places/selected/{session_id}`
- `GET /api/places/{place_id}/photo`
- `POST /optimize`
- `POST /routes/compute`
- `GET /sessions`
- `DELETE /sessions/{session_id}`

## Additional Modules

- `Google_Map_Code/`: itinerary generation, route optimization, time suggestions, tests
- `docs/`: additional mirrored documentation/module scripts
- `Dashboard/`: legacy TripRoute split frontend/backend logic

## Notes On Multiple Implementations

This repo contains overlapping prototypes built at different stages.

If you are unsure where to start:
1. Use `frontend` + `backend/auth-backend` + compose files for primary app flow.
2. Use `backend/server.py` and `Dashboard/` for experimental TripRoute flow.
3. Use `dashboard_code/*` for dashboard UI experiments.

## Security Notes

- Never commit `.env`, `api.env`, or real API keys.
- Do not commit generated caches (`.vite/`, `__pycache__/`).
- Rotate any key that was ever committed accidentally.

## Troubleshooting

- Port conflicts:
  - Frontend: 3000 (docker) or 5173 (vite)
  - Auth backend: 8001
  - Postgres: 5432 (dev compose), 5433 (prod compose)
- If CORS errors occur, verify `ALLOWED_ORIGINS` and frontend origin.
- If auth startup fails, ensure `SECRET_KEY` is set.
- If map/chat features fail, verify `GEMINI_API_KEY` / `GMAP_API_KEY`.

## Branch and Merge Context

Recent integration brought multiple branches into `main` (`backend`, `complete-working-code`, and bridge updates from `ai-integration`).

This README reflects the combined state now present on `main`.
