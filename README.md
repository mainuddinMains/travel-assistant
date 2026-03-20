# Travel Assistant

An AI-powered trip planning application that combines conversational AI, Google Maps integration, and route optimization to help users discover places and plan itineraries.

The repository now keeps a single frontend implementation in `frontend/`, based on the latest dashboard UI.

## Features

- **AI Chat** — Conversational trip planning powered by Google Gemini with streaming responses (SSE)
- **Place Discovery** — Real-time place enrichment via Google Places API (ratings, photos, hours, reviews)
- **Route Optimization** — Multi-waypoint route planning across driving, walking, bicycling, and transit
- **Interactive Maps** — Google Maps with markers, clickable place cards, and color-coded polylines
- **Authentication** — JWT-based auth with HttpOnly refresh cookies and bcrypt password hashing
- **Multi-language Support** — i18next internationalization

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                React Dashboard SPA (port 3000/5173)          │
│  - Auth flow + dashboard views                               │
│  - Maps, chat, analytics, active trip panels                 │
│  - Frontend talks to auth API (:8001) and travel API (:8000) │
└────────────┬─────────────────────────────┬───────────────────┘
             │ JWT Bearer                  │ JWT Bearer
     ┌───────▼────────┐           ┌────────▼──────────────────┐
     │  Auth Backend  │           │  TravelAgent Backend      │
     │  FastAPI :8001 │           │  FastAPI :8000            │
     │  PostgreSQL    │           │  Gemini AI + Google Maps  │
     │  JWT tokens    │           │  In-memory sessions       │
     └────────────────┘           └──────────┬────────────────┘
                                             │
                                   ┌─────────▼──────────┐
                                   │  Google APIs       │
                                   │  - Places API      │
                                   │  - Routes API      │
                                   │  - Maps JS API     │
                                   └────────────────────┘
```

### Data Flow

```
User types message
  → POST /chat/stream/{session_id}
  → Gemini extracts trip context + place list (~1-2s)
  → Async enrichment: Places API fetches details in parallel
  → SSE stream: text chunks → trip_context → place markers → done
  → Frontend: updates chat, TripMeta, PlaceCard list, Map markers
  → User selects places → POST /places/select
  → User clicks "Compute Route" → POST /routes/compute
  → Google Routes API returns polyline data
  → Map draws color-coded polylines; RoutePlanning shows summary
```

## Repository Layout

```text
travel-assistant/
├── frontend/                      # Canonical frontend (latest dashboard UI)
│   └── src/
│       ├── components/            # Dashboard widgets, chat, map canvas
│       ├── pages/                 # Home, Chat, ActiveTrip, Analytics
│       └── App.jsx                # Main app shell
├── backend/
│   ├── auth-backend/              # FastAPI authentication service
│   │   └── app/
│   │       ├── api/v1/endpoints/  # auth.py, users.py
│   │       ├── db/                # session.py (AsyncEngine)
│   │       ├── models/            # user.py (SQLAlchemy ORM)
│   │       ├── schemas/           # Pydantic request/response models
│   │       ├── utils/             # auth.py (JWT helpers, password hashing)
│   │       └── core/              # config.py (settings via pydantic-settings)
│   ├── server.py                  # TravelAgent streaming API (port 8000)
│   ├── chat.py                    # Dual-agent planner (Gemini + enrichment)
│   ├── gmaps_requests.py          # Google Maps API client functions
│   ├── optimizer.py               # Route optimization helpers
│   ├── main.py                    # Simple FastAPI /plan prototype endpoint
│   └── requirements.txt
├── Dashboard/                     # Legacy backend-only TripRoute logic
├── Google_Map_Code/               # Python itinerary + route optimization modules
├── docs/                          # Additional copies/docs for map/AI modules
├── docker-compose.yml             # Production-like compose stack
├── docker-compose.dev.yml         # Development compose stack
└── env.example                    # Root environment variable template
```

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS |
| Routing | React Router DOM 7 |
| Charts / Maps | Recharts, `@react-google-maps/api` |
| Auth Backend | FastAPI, SQLAlchemy 2 (async), Alembic, Uvicorn |
| Database | PostgreSQL 15 (prod), SQLite (dev fallback) |
| Auth | JWT via python-jose (HS256), bcrypt via passlib |
| AI | Google Gemini API (`google-generativeai`) |
| Maps (server) | Google Places API, Google Routes API |
| Infrastructure | Docker, Docker Compose, Nginx |

## Prerequisites

- Node.js 18+
- Python 3.10+
- Docker + Docker Compose (for containerized run)
- API keys:
  - Google Maps API key (Places API, Routes API, Maps JS API enabled)
  - Gemini API key (or OpenAI key for alternative modules)

## Environment Setup

### Root `.env` (for Docker stack)

```bash
cp env.example .env
```

Edit `.env` with real values. Key variables:

| Variable | Description |
|---|---|
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API key (used by frontend) |
| `VITE_API_BASE_URL` | Auth backend URL, e.g. `http://localhost:8001/api/v1` |
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT signing secret — use a random string of 32+ characters |
| `CORS_ALLOWED_ORIGINS` | Comma-separated frontend origins |

### Auth Backend `.env`

```bash
cd backend/auth-backend
cp .env.example .env
```

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./travel_assistant.db` | Database connection |
| `SECRET_KEY` | — | JWT signing key (required) |
| `ALGORITHM` | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `15` | Access token lifetime |
| `REFRESH_TOKEN_EXPIRE_DAYS` | `7` | Refresh token lifetime |
| `ALLOWED_ORIGINS` | — | CORS allowed origins |
| `API_PREFIX` | `/api/v1` | Route prefix |

### TravelAgent Backend `api.env`

`backend/server.py` and `backend/chat.py` both read `backend/api.env`:

```env
GEMINI_API_KEY=your_gemini_key
GMAP_API_KEY=your_google_maps_key
```

### Frontend `.env`

```bash
cd frontend
cp .env.example .env
```

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Auth backend base URL |
| `VITE_DASHBOARD_API_URL` | Travel backend base URL |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API key |

## Run Options

### 1) Docker Development Stack (Recommended)

```bash
docker compose -f docker-compose.dev.yml up --build
```

Services:
- Frontend: `http://localhost:3000`
- Auth API: `http://localhost:8001` — docs at `/docs`
- PostgreSQL: `localhost:5432`

Stop:

```bash
docker compose -f docker-compose.dev.yml down
```

### 2) Local Development (No Docker)

**Auth Backend**

```bash
cd backend/auth-backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python start_server.py
# http://localhost:8001  |  docs: /docs  |  health: /healthz
```

**TravelAgent Backend**

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python server.py
# http://localhost:8000  |  health: /health
```

**Frontend**

```bash
cd frontend
npm install
npm run dev
# http://localhost:5173
```

## API Reference

### Auth Backend (`/api/v1`)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/signup` | Register with email, name, password |
| `POST` | `/auth/login` | Login — returns access token + sets HttpOnly refresh cookie |
| `POST` | `/auth/refresh` | Issue new access token from refresh cookie |
| `POST` | `/auth/signout` | Clear refresh cookie |
| `GET` | `/users/me` | Get current user profile (requires `Authorization: Bearer <token>`) |
| `GET` | `/healthz` | Liveness check |
| `GET` | `/healthz/db` | Database connectivity check |

### TravelAgent Backend

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/chat/init` | Initialize new chat session |
| `POST` | `/chat/stream/{session_id}` | Stream AI response as Server-Sent Events |
| `POST` | `/places/select/{session_id}` | Add place to route planning |
| `DELETE` | `/places/select/{session_id}/{place_id}` | Remove place from route |
| `GET` | `/places/selected/{session_id}` | Get selected places |
| `POST` | `/optimize` | Optimize waypoint order |
| `POST` | `/routes/compute` | Compute route between places |
| `GET` | `/api/places/{place_id}/photo` | Fetch place photo URL |
| `GET` | `/sessions` | List all sessions |
| `DELETE` | `/sessions/{session_id}` | Delete session |
| `GET` | `/health` | Health check |

### Chat Stream Events (SSE)

```typescript
{ type: 'trip_context', trip_context: { cities: string[], dates: [string, string], themes: string[], transport_preference: string } }
{ type: 'text_chunk',    content: string }        // Streamed word-by-word
{ type: 'text_complete', content: string }        // Full AI response
{ type: 'marker', placeId: string, displayName: string, formattedAddress: string,
                  location: { latitude: number, longitude: number },
                  rating: number, userRatingCount: number, ... }
{ type: 'done' }
{ type: 'error', message: string }
```

### Route Computation

```typescript
// POST /routes/compute — Request
{
  places: [{ placeId: string, displayName: string, formattedAddress: string }],
  mode: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT',
  optimize_waypoint_order: boolean,
  departure_time?: string   // ISO datetime, TRANSIT only
}

// Response
{
  legs: [{ duration: number, distanceMeters: number, polyline: string, startName: string, endName: string }],
  totalDuration: number,    // seconds
  totalDistance: number,    // meters
  placeOrder: string[]      // Optimized place IDs
}
```

## Authentication Flow

```
Signup:
  POST /auth/signup { email, name, password }
  → Hash password (bcrypt)
  → Store user in database
  → Return { access_token, user }

Login:
  POST /auth/login { email, password }
  → Verify password
  → Issue access_token (JWT, 15-min expiry)
  → Set HttpOnly refresh cookie (7-day expiry)
  → Return { access_token, user }

Protected request:
  Authorization: Bearer <access_token>
  → Verify JWT signature + expiration
  → Load user from database or return 401

Token refresh:
  POST /auth/refresh  (with refresh cookie)
  → Verify refresh token
  → Issue new access_token
```

## Database Schema

**Users** (PostgreSQL / SQLite)

| Column | Type | Notes |
|---|---|---|
| `id` | UUID | Primary key |
| `email` | string | Unique, indexed |
| `name` | string | |
| `hashed_password` | string | bcrypt |
| `is_active` | boolean | Default `true` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

## Port Reference

| Service | Port |
|---|---|
| Frontend | 3000 (Docker) / 5173 (Vite dev) |
| Auth Backend | 8001 |
| TravelAgent Backend | 8000 |
| PostgreSQL | 5432 (dev), 5433 (prod) |

## Security Notes

- Set `SECRET_KEY` to a long, random string (minimum 32 characters) before deploying.
- Set `AUTH_COOKIE_SECURE=true` in production (requires HTTPS).
- Restrict `ALLOWED_ORIGINS` to your actual frontend domain.
- Never commit `.env`, `api.env`, or any file containing real API keys.
- Rotate any key that was ever accidentally committed.

## Troubleshooting

- **Port conflicts** — see Port Reference above; adjust compose file if needed.
- **CORS errors** — verify `ALLOWED_ORIGINS` matches the frontend origin exactly.
- **Auth startup fails** — ensure `SECRET_KEY` is set in the auth backend `.env`.
- **Map/chat features fail** — verify `GEMINI_API_KEY` and `GMAP_API_KEY` in `backend/api.env`.
- **Database errors** — confirm `DATABASE_URL` is reachable and the schema has been created.

## Notes on Multiple Implementations

This repo now keeps a single supported frontend in `frontend/`.

Other legacy frontend implementations were removed from the working tree. Backend-side experimental modules under `Dashboard/` and `Google_Map_Code/` remain for reference.

## License

Saint Louis University — Academic Project
