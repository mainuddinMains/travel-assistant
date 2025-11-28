# TravelAgent - Chat-Based Travel Recommendation System

This folder contains an alternative implementation of the travel recommendation system using a chat-based architecture with Google Maps integration.

## Architecture

**Dual-Agent System:**
1. **Chatting Agent** - Conversational AI that collects trip details and generates recommendations
2. **Google Maps Enrichment** - Enriches places with real-time data (ratings, hours, addresses)

## Files

### Backend
- `chat.py` - Main chat interface with dual-agent architecture (non-streaming, batch testing)
  - Uses Gemini 2.5 Flash for conversational recommendations
  - Outputs structured JSON with trip context and places
  - Supports async enrichment for multiple places

- `gmaps_requests.py` - Google Maps API client functions
  - Text Search API (free tier for Place IDs)
  - Place Details API (enterprise tier for full data)
  - Compute Routes API (for route optimization)
  - Helper function: `enrich_place_with_details()` - complete place enrichment

- `api.env` - Environment configuration (API keys)

### Frontend
- `index.html` - Full-featured web interface
  - Three-panel layout: Map | Places List | Chat
  - Google Maps integration with route visualization
  - Drag-and-drop place reordering
  - Multi-modal route optimization (driving, transit, walking, bicycling)
  - Real-time chat interface

## How to Run

### Backend (CLI Testing)
```bash
cd backend
python chat.py
```

### Backend + Frontend (Full Application)
1. Start the backend server (requires server.py - not included here)
2. Open `frontend/index.html` in a browser
3. Configure `frontend/config.js` with your Google Maps API key

## Key Features

- **Conversational AI**: Natural language trip planning
- **Real-time Enrichment**: Live Google Maps data for places
- **Route Optimization**: Multi-modal route planning with waypoint optimization
- **Interactive Map**: Visual route display with markers and directions
- **Drag-and-Drop**: Manually reorder places
- **Transit Details**: Step-by-step transit instructions with bus/train lines

## API Requirements

Required API keys in `backend/api.env`:
- `GEMINI_API_KEY` - Google AI API for Gemini models
- `GMAP_API_KEY` - Google Maps Platform (Places API + Directions API)

## Related Files

This implementation is separate from the main TripRoute project (in the PSD folder), which uses:
- `server.py` - Production FastAPI server
- `demo.html` - Production frontend
- `gemini.py` / `chatgpt.py` - Standalone recommendation scripts
- `optimization.py` - Route optimization engine
