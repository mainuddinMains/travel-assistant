# TripRoute Setup Guide

Complete guide to run the TripRoute demo with backend integration.

## Prerequisites

- **Python 3.11+** installed
- **Gemini API Key** (for AI-powered recommendations)
- **Google Maps API Key** (for places and directions)
- Modern web browser

## Step 1: Install Python Dependencies

Open a terminal in the project directory and run:

```bash
pip install -r requirements.txt
```

This installs:
- FastAPI (web framework)
- Uvicorn (ASGI server)
- Google Gemini SDK
- Google Maps Python client
- Other utilities

## Step 2: Configure API Keys

Create a file named `api.env` in the `backend/` directory:

```bash
# backend/api.env

GEMINI_API_KEY=your-gemini-api-key-here
GMAP_API_KEY=your-google-maps-api-key-here
```

### Getting API Keys:

**Gemini API Key:**
1. Go to https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click "Create API key"
4. Copy and paste into `api.env`

**Google Maps API Key:**
1. Go to https://console.cloud.google.com/
2. Create a new project (or select existing)
3. Enable these APIs:
   - Places API
   - Directions API
   - Geocoding API
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy and paste into `api.env`

⚠️ **Important**: Never commit `api.env` to git with real keys!

## Step 3: Start the Backend Server

Navigate to the backend directory and run:

```bash
cd backend
python server.py
```

You should see:

```
============================================================
TripRoute Backend API - Phase 1 (Gemini)
============================================================
Gemini API Key: Configured
Google Maps Key: Configured
============================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete.
```

The server is now running at `http://localhost:8000`

## Step 4: Open the Frontend

Open `frontend/demo.html` in your web browser:

**Option A - Direct File Open:**
```bash
# Just double-click demo.html or open in browser
```

**Option B - Using a Local Server (recommended):**
```bash
cd frontend
python -m http.server 3000
# Then open http://localhost:3000/demo.html
```

## Step 5: Test the Application

### Test Flow:

1. **Chat with the AI:**
   - Type: "I want to visit Toronto"
   - Bot responds: "Wonderful! What is the theme of your trip?"
   - Type: "I'd like to visit as many dessert shops as I can"

2. **Get Recommendations:**
   - Bot will generate 5-6 dessert shop recommendations
   - Places appear in the "Suggestions For You" section
   - Map shows all locations with numbered markers

3. **Optimize Route:**
   - Click "⚡ Quick Optimize" button (uses driving mode)
   - Or click "🗺️ Choose Mode" for other options
   - Map shows optimized route with directions
   - Summary boxes update with ETA and distance

4. **Explore Features:**
   - Click on map markers to see place details
   - View optimized route on the map
   - Check Car ETA in summary boxes

## API Endpoints Reference

The backend provides these endpoints:

### Health Check
```http
GET http://localhost:8000/health
```

### Chat
```http
POST http://localhost:8000/chat
Content-Type: application/json

{
  "message": "I want to visit dessert shops in Toronto",
  "session_id": "optional-session-id"
}
```

### Get Recommendations
```http
GET http://localhost:8000/recommendations/{session_id}
```

### Optimize Route
```http
POST http://localhost:8000/optimize
Content-Type: application/json

{
  "session_id": "your-session-id",
  "mode": "driving",
  "departure_time": "2025-11-05T10:00:00Z"
}
```

Supported modes: `driving`, `walking`, `bicycling`, `transit`

## Troubleshooting

### Backend won't start:

**Problem**: "Gemini API Key: Missing"
- Solution: Create `backend/api.env` with your Gemini key

**Problem**: "Google Maps Key: Missing"
- Solution: Add GMAP_API_KEY to `backend/api.env`

**Problem**: `ModuleNotFoundError: No module named 'fastapi'`
- Solution: Run `pip install -r requirements.txt`

### Frontend connection issues:

**Problem**: "Cannot connect to server at http://localhost:8000"
- Solution: Make sure backend server is running (`python backend/server.py`)
- Check console for server output

**Problem**: CORS errors in browser console
- Solution: Server already has CORS enabled, but if issues persist, check browser console for specific error

**Problem**: Map not loading
- Solution: You need to add your Google Maps API key to demo.html line 729:
  ```html
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
  ```

### Chat/Recommendations not working:

**Problem**: Bot responds but no recommendations appear
- Solution: Be specific about location and theme. Try: "I want dessert shops in [City]"

**Problem**: "No recommendations available" error
- Solution: Chat more with the bot until it has enough info to generate recommendations

## Architecture Overview

```
┌─────────────────┐
│  demo.html      │
│  (Frontend)     │
└────────┬────────┘
         │ HTTP Requests
         │
         v
┌─────────────────┐
│  server.py      │
│  FastAPI Server │
└────────┬────────┘
         │
         ├─────> Gemini API (with Google Search)
         │
         └─────> Google Maps API (Places + Directions)
```

### Data Flow:

1. **User sends message** → Frontend POST to `/chat`
2. **Backend processes** → Calls Gemini with Google Search grounding and conversation history
3. **Gemini responds** → Returns natural language response with real-time search data
4. **Structure extraction** → Gemini extracts structured recommendations (JSON)
5. **Google Maps enrichment** → Fetches place details (ratings, hours, etc.)
6. **Frontend displays** → Shows recommendations with optimize button
7. **User optimizes** → Frontend POST to `/optimize` with mode
8. **Route calculation** → Google Directions API finds best route
9. **Map visualization** → Shows optimized path on Google Maps

## Development Tips

### Enable Auto-Reload:
The server already has `reload=True` enabled, so code changes will automatically restart the server.

### View Active Sessions:
```bash
curl http://localhost:8000/sessions
```

### Clear a Session:
```bash
curl -X DELETE http://localhost:8000/sessions/{session-id}
```

### Test API with curl:
```bash
# Health check
curl http://localhost:8000/health

# Chat
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "I want to visit Tokyo"}'
```

## Next Steps

- Add user authentication (Phase 2)
- Integrate DynamoDB for persistent storage
- Deploy to AWS EC2
- Add more transportation modes
- Export routes to Google Maps app
- Print/PDF itinerary generation

## Support

For issues or questions, check:
- Backend logs: Look at terminal where `python server.py` is running
- Frontend errors: Check browser Developer Tools console (F12)
- API docs: Visit http://localhost:8000/docs when server is running
