# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**TripRoute** is an AI-powered travel planner that uses Gemini AI for trip recommendations with Google Maps APIs for route optimization. The system generates personalized travel recommendations through conversational AI, then optimizes routes across multiple transportation modes (driving, walking, bicycling, transit).

## Architecture

### Two-Stage Pipeline

1. **Recommendation Engine** (`backend/server.py` using `backend/gemini.py`)
   - **Production/API Version** (`server.py`): Uses Gemini 2.5 Flash Lite with Google Search grounding (fast, 1-2 seconds)
   - **Standalone Scripts** (optional):
     - `chatgpt.py`: OpenAI GPT-5-mini with web search tools (slower, 10-30+ seconds)
     - `gemini.py`: Direct Gemini testing (faster, same as server.py)
   - Dual-system architecture:
     - **TripRoute Chat**: User-facing conversational agent that collects trip details (cities, dates, theme, transport preferences) and provides recommendations
     - **TripRoute Summarizer**: Extracts structured data from conversations using Pydantic models with structured output
   - Outputs to `backend/triproute_recommendations.json` (standalone scripts only)
   - Maintains conversation history for chat and JSON extraction

2. **Route Optimization Engine** (`backend/optimization.py`)
   - Enriches recommended places with Google Maps Place Details API
   - Optimizes waypoint ordering using Google Maps Directions API with `optimize_waypoints=True`
   - Generates optimized routes for all 4 transportation modes
   - Special handling for transit mode: performs initial driving optimization to determine waypoint order, then fetches detailed transit directions leg-by-leg
   - Outputs to 4 JSON files: `direction_driving.json`, `direction_walking.json`, `direction_bicycling.json`, `direction_transit.json`

### Data Flow

**Production (server.py):**
```
User → Frontend → /chat API → Gemini Chat → Gemini Summarizer → Session Storage
                                                                        ↓
                                               Google Maps Place Details → Place Enrichment
                                                                        ↓
                                               /optimize API → Route Optimization → JSON Response
```

**Standalone Scripts (chatgpt.py/gemini.py):**
```
User Input → AI Chat → AI Summarizer → triproute_recommendations.json
                                                 ↓
                        Google Maps Place Details API → Place Enrichment → Route Optimization → Direction JSONs
```

## Development Commands

### Running the Application

**Production API Server** (recommended):
```bash
cd backend
python server.py
```
Then open `frontend/demo.html` in browser for full application with Gemini integration.

**Standalone Testing** (optional, for direct CLI testing):
```bash
# Gemini version (faster, Google Search grounding)
python backend/gemini.py

# OpenAI version (slower, web search)
python backend/chatgpt.py

# Optimize routes (requires existing recommendations from above)
python backend/optimization.py
```

### Full Workflow

**For production use:**
1. Run `python backend/server.py` to start API server (uses Gemini)
2. Open `frontend/demo.html` to interact with the app
3. Chat generates recommendations and optimizes routes automatically

**For standalone testing:**
1. Run `gemini.py` (or `chatgpt.py`) to chat with AI and generate recommendations
2. Run `optimization.py` to enrich places and generate optimized routes for all transport modes

## Environment Configuration

Required API keys in `api.env`:
- `GEMINI_API_KEY`: Google AI API access for Gemini models (required for `server.py` and `gemini.py`)
- `GMAP_API_KEY`: Google Maps Platform API (requires Places API and Directions API enabled)
- `OPENAI_API_KEY`: OpenAI API access for GPT models (optional, only for `chatgpt.py` standalone script)

**Note**: The `api.env` file is tracked in git but should contain placeholder keys only. Never commit real API keys.

**Production requirement**: Only `GEMINI_API_KEY` and `GMAP_API_KEY` are needed for `server.py`.

## Key Technical Details

### AI Integration

**Production Server** (`server.py` with Gemini):
- Uses Google Generative AI SDK with streaming (`generate_content_stream`)
- Model: `gemini-2.5-flash-lite` for both chat and structured extraction
- Google Search grounding for real-time, up-to-date place information (fast: 1-2 seconds)
- Structured output uses Pydantic models with JSON schema: `TripRouteRecommendations`, `TripMeta`, `RecommendationItem`
- Session-based conversation history stored in memory
- Automatic place enrichment with Google Maps data after extraction

**Standalone Scripts:**

*Gemini Version* (`gemini.py`):
- Same as server.py implementation
- Model: `gemini-2.5-flash-lite`
- Outputs to `triproute_recommendations.json`

*OpenAI Version* (`chatgpt.py`, optional):
- Uses OpenAI Responses API with streaming
- Models: `gpt-5-mini` for chat, `gpt-5-nano` for structured extraction
- Web search tool enabled (slower: 10-30+ seconds)
- Outputs to `triproute_recommendations.json`

### Google Maps Optimization

**Place Enrichment** (`enrich_place_with_details`):
- Queries: `find_place` (text search) → `place` (details)
- Fetches: address, business hours, rating, review count, map URL

**Route Optimization** (`optimize_with_direction`):
- Transit mode requires special handling due to API limitations
- All modes support future `departure_time` (datetime object)
- Returns: optimized waypoint order, total distance/duration, detailed leg-by-leg directions
- Step normalization handles nested transit steps (bus/subway/train details)

### Data Structures

**Place Class** (`optimization.py:10-27`):
- Core: name, address, city, reason
- Enriched: place_id, formatted_address, business_hours, rating, number_of_reviews, map_url

**Direction Output**:
- Top level: mode, optimized_route (addresses), total_distance (meters), total_duration (seconds)
- Legs: start/end location/address, distance, duration, steps[]
- Steps: mode, locations, distance, duration, transit_details (for TRANSIT steps)

## Project Status

- Backend: Functional chat-based recommendation system and route optimization
- Frontend: Placeholder (not yet implemented)
- Docs: Placeholder (not yet implemented)

## Constraints and Considerations

- Google Maps Directions API has a 10-waypoint limit for actual interactive maps (not enforced in API responses)
- Transit directions require future departure times (validates `> now() - 5 minutes`)
- Recommendation quality depends on Gemini's Google Search grounding accessing current Google Maps reviews and ratings
- No caching mechanism currently implemented (see comment at `optimization.py:253`)
- Server uses in-memory session storage (Phase 1); DynamoDB integration planned for Phase 2
