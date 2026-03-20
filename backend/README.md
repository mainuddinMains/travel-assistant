# Trip Planning API Backend

This backend API integrates the structured trip planning system from `chatgpt_JSON.py` with the frontend travel assistant chatbot.

## Features

- **Structured Trip Planning**: Collects trip details through a guided question flow
- **Intelligent Chat**: Uses the TripRoute Chat system for personalized recommendations
- **Structured Output**: Generates structured JSON responses with trip metadata and recommendations
- **Session Management**: Maintains conversation state across multiple requests
- **CORS Support**: Ready for frontend integration

## Quick Start

### 1. Install Dependencies

```bash
cd travel-assistant-backend/backend
pip install -r requirements.txt
```

### 2. Configure OpenAI API Key

Set your OpenAI API key in `backend/api.env` or your shell environment:

```env
OPENAI_API_KEY=your-openai-api-key-here
```

### 3. Start the Server

```bash
python start_trip_planning_api.py
```

The server will start on `http://localhost:5001`

## API Endpoints

### POST /api/trip-planning/chat

Send a chat message with structured trip planning.

**Request:**
```json
{
  "message": "I want to visit some dessert places in Toronto",
  "tripDetails": {
    "cities": ["Toronto"],
    "dates": "March 15-18, 2024",
    "duration": "3 days",
    "theme": "dessert tour",
    "transport": "walking",
    "additionalDetails": "budget-friendly options"
  }
}
```

**Response:**
```json
{
  "message": "Toronto is amazing! I've curated some great dessert spots for you...",
  "recommendations": [
    "Ruru Baked - Artisanal bakery with fresh bread and pastries",
    "Bang Bang Ice Cream & Bakery - Creative ice cream flavors"
  ],
  "structuredData": {
    "trip_meta": {
      "cities": ["Toronto"],
      "dates": "March 15-18, 2024",
      "duration_days": "3 days",
      "theme": "dessert tour",
      "transport": "walking"
    },
    "recommendations": [
      {
        "name": "Ruru Baked",
        "address": "123 Queen St W, Toronto, ON",
        "city": "Toronto",
        "reason": "top-rated artisanal bakery with many reviews"
      }
    ]
  }
}
```

### POST /api/trip-planning/initialize

Initialize trip planning with user details.

**Request:**
```json
{
  "cities": ["Toronto", "Montreal"],
  "dates": "March 15-18, 2024",
  "duration": "3 days",
  "theme": "food & culture",
  "transport": "public transit",
  "additionalDetails": "family-friendly activities"
}
```

### GET /api/trip-planning/status

Get current trip planning status.

**Response:**
```json
{
  "status": "active",
  "trip_details": {
    "cities": ["Toronto"],
    "dates": "March 15-18, 2024",
    "duration": "3 days",
    "theme": "dessert tour",
    "transport": "walking",
    "additionalDetails": ""
  },
  "conversation_count": 4
}
```

### GET /health

Health check endpoint.

## Frontend Integration

### 1. Enable Backend API

In your `.env` file:

```env
VITE_USE_BACKEND_API=true
```

### 2. The frontend will automatically:

- Use the backend API when `VITE_USE_BACKEND_API=true`
- Fall back to direct OpenAI API if backend is unavailable
- Use mock service if no API keys are configured

## Architecture

```
Frontend (React) 
    ↓ HTTP requests
Backend API (Flask)
    ↓ calls
chatgpt_JSON.py (Structured System)
    ↓ uses
OpenAI API
```

## Key Components

### 1. Trip Planning Flow
- Collects trip details through guided questions
- Validates input and provides examples
- Progress tracking with visual indicators

### 2. Structured Conversation System
- **TripRoute Chat**: User-facing conversational AI
- **TripRoute Summarizer**: Generates structured JSON output
- Maintains conversation context and history

### 3. Session Management
- Stores conversation state per session
- Maintains trip details and chat history
- Supports multiple concurrent users

## Development

### Running in Development Mode

```bash
python start_trip_planning_api.py
```

### Testing the API

```bash
# Test health endpoint
curl http://localhost:5001/health

# Test chat endpoint
curl -X POST http://localhost:5001/api/trip-planning/chat \
  -H "Content-Type: application/json" \
  -H "X-Session-ID: test-session" \
  -d '{"message": "I want to visit Toronto for dessert places"}'
```

## Production Deployment

1. Set `FLASK_ENV=production`
2. Use a production WSGI server (e.g., Gunicorn)
3. Configure proper CORS settings
4. Use Redis or database for session storage
5. Set up proper logging and monitoring

## Troubleshooting

### Common Issues

1. **Import Error**: Make sure all dependencies are installed
2. **API Key Error**: Verify OpenAI API key is set correctly
3. **CORS Error**: Check CORS configuration for frontend domain
4. **Session Issues**: Clear browser storage or use different session ID

### Logs

The server provides detailed console logs for debugging:
- API requests and responses
- OpenAI API calls
- Error messages and stack traces


