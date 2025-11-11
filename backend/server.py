"""
TripRoute Backend API - Phase 1 (Simple EC2 deployment)
FastAPI server with in-memory session storage
Uses Gemini 2.5 Flash Lite with Google Search grounding
"""
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import uuid
from dotenv import load_dotenv
import os
import googlemaps
from google import genai
from google.genai import types

# Import existing modules
from gemini import CHAT_SYSTEM, STRUCTURE_SYSTEM, TripRouteRecommendations, REINFORCED_GROUNDING_RULES, WELCOME_MESSAGE, AGENT_NAME
from optimization import parse_trip, enrich_place_with_details, optimize_with_direction, Place, normalize_place_id

# Load environment variables
load_dotenv(dotenv_path="api.env")
gemini_api_key = os.getenv("GEMINI_API_KEY")
gmap_api_key = os.getenv("GMAP_API_KEY")

# Initialize Google Maps client and Gemini client (shared across all requests)
gmaps = googlemaps.Client(key=gmap_api_key)
gemini_client = genai.Client(api_key=gemini_api_key)

app = FastAPI(
    title="TripRoute API",
    description="AI-powered trip planning with route optimization",
    version="1.0.0"
)

# CORS middleware - allow frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# IN-MEMORY SESSION STORAGE (Phase 1)
# ============================================================================
sessions_db: Dict[str, Dict[str, Any]] = {}

def get_or_create_session(session_id: Optional[str] = None) -> tuple[str, Dict[str, Any]]:
    """Get existing session or create new one with welcome message."""
    if session_id and session_id in sessions_db:
        return session_id, sessions_db[session_id]

    # Create new session with welcome message
    new_session_id = session_id or str(uuid.uuid4())
    sessions_db[new_session_id] = {
        "session_id": new_session_id,
        "created_at": datetime.now().isoformat(),
        "chat_history": [
            {
                "role": "model",
                "content": WELCOME_MESSAGE,
                "timestamp": datetime.now().isoformat()
            }
        ],
        "recommendations": None,
        "enriched_places": [],
        "optimized_routes": {}
    }
    return new_session_id, sessions_db[new_session_id]

# ============================================================================
# BACKGROUND TASK: STRUCTURE EXTRACTION
# ============================================================================

async def extract_structure(session_id: str, grounding_places: list):
    """
    Background task to extract structured recommendations from conversation.
    Runs asynchronously so user can continue chatting.
    """
    try:
        session = sessions_db.get(session_id)
        if not session:
            print(f"⚠️  Session {session_id} not found for background extraction")
            return

        # Build conversation text for extraction
        conversation_text = ""
        for msg in session["chat_history"]:
            role_name = "Model" if msg["role"] == "model" else "User"
            conversation_text += f"{role_name}: {msg['content']}\n\n"

        # Use Gemini structured extraction
        extraction_prompt = f"""{STRUCTURE_SYSTEM}

Here is the full conversation history:

{conversation_text}

Extract the trip recommendations matching the schema."""

        extraction_config = types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=TripRouteRecommendations
        )

        print(f"\n🔄 [Background] Starting structure extraction for session {session_id}...")

        structured_response = gemini_client.models.generate_content(
            model='gemini-2.5-flash-lite',
            contents=extraction_prompt,
            config=extraction_config
        )

        # Parse JSON response and ENRICH with grounding data
        data = json.loads(structured_response.text)

        # If we have grounding places, match by URL and inject place_id
        if grounding_places and data.get('recommendations'):
            print(f"\n🔧 [Background] Enriching {len(data['recommendations'])} recommendations with grounding place_id...")

            # Build URL -> place_id mapping from grounding data
            url_to_place_id = {}
            for gplace in grounding_places:
                url = gplace.get('url', '')
                place_id = gplace.get('place_id', '')
                if url and place_id:
                    url_to_place_id[url] = {
                        'place_id': place_id,
                        'title': gplace.get('title', '')
                    }

            # Match recommendations by exact URL
            for rec in data['recommendations']:
                rec_url = rec.get('url', '')

                # Find matching place_id from grounding data by URL
                if rec_url in url_to_place_id:
                    place_id = url_to_place_id[rec_url]['place_id']
                    rec['place_id'] = place_id
                    print(f"  ✅ [Background] Injected place_id for {rec['name']}: {place_id}")

        # Check if we have valid recommendations
        if data.get("recommendations") and len(data["recommendations"]) > 0:
            # Enrich with Google Maps data
            meta, places = parse_trip(data)
            print(f"\n🔧 [Background] Enriching places with Google Maps API (if needed)...")
            enrich_place_with_details(gmaps, places)

            # Convert Place objects to dicts
            places_data = []
            for place in places:
                places_data.append({
                    "name": place.name,
                    "category": place.category,
                    "address": place.address,
                    "formatted_address": place.formatted_address,
                    "city": place.city,
                    "reason": place.reason,
                    "rating": place.rating,
                    "number_of_reviews": place.number_of_reviews,
                    "business_hours": place.business_hours,
                    "map_url": place.map_url,
                    "place_id": place.place_id
                })

            # Save to session
            session["recommendations"] = data
            session["enriched_places"] = places_data

            print(f"✅ [Background] Extracted {len(places_data)} recommendations for session {session_id}")
        else:
            print(f"ℹ️  [Background] No recommendations found yet for session {session_id}")

    except Exception as e:
        # No recommendations yet - this is normal during early conversation
        print(f"⚠️  [Background] No recommendations extracted for session {session_id}: {e}")

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    has_recommendations: bool
    is_new_session: bool = False
    welcome_message: Optional[str] = None

class PlaceDetail(BaseModel):
    name: str
    category: Optional[str] = None
    address: str
    formatted_address: Optional[str] = None
    city: str
    reason: str
    rating: Optional[float] = None
    number_of_reviews: Optional[int] = None
    business_hours: Optional[List[str]] = None
    map_url: Optional[str] = None
    place_id: Optional[str] = None

class RecommendationsResponse(BaseModel):
    session_id: str
    trip_meta: Dict[str, Any]
    places: List[PlaceDetail]

class OptimizeRequest(BaseModel):
    session_id: str
    mode: str  # "driving", "walking", "bicycling", "transit"
    departure_time: Optional[str] = None  # ISO format

class RouteResponse(BaseModel):
    session_id: str
    mode: str
    optimized_route: List[str]
    total_distance: int  # meters
    total_duration: int  # seconds
    legs: List[Dict[str, Any]]

class UpdatePlacesRequest(BaseModel):
    session_id: str
    places: List[PlaceDetail]

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "TripRoute API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check."""
    return {
        "status": "healthy",
        "active_sessions": len(sessions_db),
        "gemini_configured": bool(gemini_api_key),
        "gmaps_configured": bool(gmap_api_key)
    }

@app.post("/chat")
async def chat(request: ChatRequest, background_tasks: BackgroundTasks):
    """
    Chat with the AI travel agent (non-streaming to capture grounding metadata).
    Extracts recommendations in background so user can continue chatting.
    """
    try:
        # Get or create session
        is_new_session = request.session_id is None or request.session_id not in sessions_db
        session_id, session = get_or_create_session(request.session_id)

        # Build conversation history in Gemini format (types.Content)
        conversation_history = []
        for msg in session["chat_history"]:
            role = msg["role"]  # Already "model" or "user"
            conversation_history.append(types.Content(
                role=role,
                parts=[types.Part(text=msg["content"])]
            ))

        # Add user message WITHOUT reformulation (keep it clean)
        conversation_history.append(types.Content(
            role="user",
            parts=[types.Part(text=request.message)]
        ))

        # CRITICAL: Create a REINFORCED system instruction that's injected fresh on EVERY turn
        # This prevents context dilution where the AI forgets grounding requirements in later turns
        reinforced_system = CHAT_SYSTEM + REINFORCED_GROUNDING_RULES

        # Configure Gemini with Google Maps grounding and REINFORCED system instruction
        # Maps: place data (place_id, ratings, hours, etc.) - $25/1k
        # 1,500 RPD free (enough for most usage)
        # More cost-effective than Search ($35/1k) + Place API ($20/1k)
        config = types.GenerateContentConfig(
            tools=[
                types.Tool(google_maps=types.GoogleMaps())  # Place information with grounding_metadata
            ],
            system_instruction=reinforced_system  # Use reinforced version that's fresh each turn
        )

        # NON-STREAMING request (same as chat_reply_non_streaming in gemini.py)
        try:
            response = gemini_client.models.generate_content(
                model='gemini-2.5-flash',  # Use flash (not lite) for reliable grounding tool usage
                contents=conversation_history,
                config=config,
            )
        except Exception as e:
            print(f"\n❌ Error calling Gemini API: {e}")
            raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

        # Print full response to inspect (same as gemini.py)
        print("\n" + "="*80)
        print("🔍 DEBUG: Full Response Object (Non-Streaming)")
        print("="*80)

        # Extract grounding chunks with place data (same as gemini.py)
        grounding_places = []

        if hasattr(response, 'candidates') and response.candidates:
            print(f"\n✓ Candidates found: {len(response.candidates)}")
            candidate = response.candidates[0]

            if hasattr(candidate, 'grounding_metadata') and candidate.grounding_metadata:
                if hasattr(candidate.grounding_metadata, 'grounding_chunks') and candidate.grounding_metadata.grounding_chunks:
                    print("\n🗺️  GROUNDING CHUNKS IN GROUNDING METADATA FOUND!")

                    # Extract place_id, title, and URL from each chunk
                    for chunk in candidate.grounding_metadata.grounding_chunks:
                        place_data = {}

                        # Get place_id
                        if hasattr(chunk, 'maps') and hasattr(chunk.maps, 'place_id'):
                            place_data['place_id'] = chunk.maps.place_id

                        # Get title
                        if hasattr(chunk, 'maps') and hasattr(chunk.maps, 'title'):
                            place_data['title'] = chunk.maps.title

                        # Get URL
                        if hasattr(chunk, 'maps') and hasattr(chunk.maps, 'uri'):
                            place_data['url'] = chunk.maps.uri

                        if place_data:
                            grounding_places.append(place_data)
                            print(f"  📍 Extracted: {place_data.get('title', 'Unknown')} - Place ID: {place_data.get('place_id', 'Not found')}, URL: {place_data.get('url', 'Not found')}")
                else:
                    print("\n⚠️  No grounding_chunks in grounding_metadata")
            else:
                print("\n⚠️  No grounding_metadata in candidate")

        print("\nFull response text:")
        print(response.text)
        print("="*80 + "\n")

        assistant_reply = response.text

        # Add assistant response to conversation (same as gemini.py)
        conversation_history.append(types.Content(
            role="model",
            parts=[types.Part(text=assistant_reply)]
        ))

        # Save to chat history
        session["chat_history"].append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        })
        session["chat_history"].append({
            "role": "model",
            "content": assistant_reply,
            "timestamp": datetime.now().isoformat()
        })

        # Schedule background task to extract recommendations
        # This runs asynchronously so user can continue chatting
        background_tasks.add_task(extract_structure, session_id, grounding_places)

        # Check if recommendations already exist (from previous background extraction)
        has_recommendations = bool(session.get("enriched_places"))

        # Return JSON response immediately (not streaming, not waiting for extraction)
        return ChatResponse(
            response=assistant_reply,
            session_id=session_id,
            has_recommendations=has_recommendations,
            is_new_session=is_new_session,
            welcome_message=WELCOME_MESSAGE if is_new_session else None
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@app.get("/recommendations/{session_id}", response_model=RecommendationsResponse)
async def get_recommendations(session_id: str):
    """
    Get enriched recommendations for a session.
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]

    if not session.get("recommendations") or not session.get("enriched_places"):
        raise HTTPException(status_code=404, detail="No recommendations available. Chat first to get recommendations.")

    # Convert to response model
    places = [PlaceDetail(**place) for place in session["enriched_places"]]

    return RecommendationsResponse(
        session_id=session_id,
        trip_meta=session["recommendations"]["trip_meta"],
        places=places
    )

@app.post("/update-places")
async def update_places(request: UpdatePlacesRequest):
    """
    Update the places list in the session (after user removes or reorders places).
    """
    if request.session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[request.session_id]

    # Convert PlaceDetail objects to dict format
    places_data = [place.dict() for place in request.places]

    # Update session
    session["enriched_places"] = places_data

    # Also update recommendations list with all enriched fields
    # Note: business_hours must be converted from list to string to match RecommendationItem schema
    if session.get("recommendations"):
        session["recommendations"]["recommendations"] = [
            {
                "name": p["name"],
                "category": p.get("category"),
                "address": p["address"],
                "city": p["city"],
                "reason": p["reason"],
                "place_id": p.get("place_id"),
                "url": p.get("map_url"),
                "rating": p.get("rating"),
                "number_of_reviews": p.get("number_of_reviews"),
                "business_hours": ", ".join(p["business_hours"]) if p.get("business_hours") and isinstance(p["business_hours"], list) else p.get("business_hours")
            }
            for p in places_data
        ]

    print(f"✓ Updated places list for session {request.session_id}: {len(places_data)} places")

    return {"status": "success", "places_count": len(places_data)}

@app.post("/optimize", response_model=RouteResponse)
async def optimize_route(request: OptimizeRequest):
    """
    Optimize route for a specific transportation mode.
    Automatically called by frontend when recommendations are ready.
    """
    if request.session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[request.session_id]
    enriched_places_data = session.get("enriched_places", [])

    if not enriched_places_data:
        raise HTTPException(status_code=404, detail="No places to optimize. Get recommendations first.")

    if len(enriched_places_data) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 places to create a route")

    # Validate mode
    valid_modes = ["driving", "walking", "bicycling", "transit"]
    if request.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of: {valid_modes}")

    # Parse departure time
    if request.departure_time:
        try:
            departure_time = datetime.fromisoformat(request.departure_time.replace('Z', '+00:00'))
        except:
            departure_time = datetime.now()
    else:
        departure_time = datetime.now()

    try:
        # Convert dict data back to Place objects
        places = []
        for p_data in enriched_places_data:
            # Normalize place_id from Gemini's "places/ChIJ..." format to "ChIJ..." format
            raw_place_id = p_data.get("place_id")
            normalized_place_id = normalize_place_id(raw_place_id)

            # Use updated Place constructor that accepts optional fields
            place = Place(
                name=p_data["name"],
                address=p_data["address"],
                city=p_data["city"],
                reason=p_data["reason"],
                place_id=normalized_place_id,  # Normalized from Gemini grounding
                url=p_data.get("map_url"),
                rating=p_data.get("rating"),
                number_of_reviews=p_data.get("number_of_reviews"),
                business_hours=", ".join(p_data["business_hours"]) if p_data.get("business_hours") and isinstance(p_data["business_hours"], list) else None,
                category=p_data.get("category")
            )
            # Set formatted_address separately (not in constructor)
            place.formatted_address = p_data.get("formatted_address")
            places.append(place)

        # Optimize route
        optimized = optimize_with_direction(gmaps, places, mode=request.mode, departure_time=departure_time)

        # Save to session
        session["optimized_routes"][request.mode] = optimized

        print(f"✓ Optimized {request.mode} route for session {request.session_id}")

        return RouteResponse(
            session_id=request.session_id,
            mode=optimized["mode"],
            optimized_route=optimized["optimized_route"],
            total_distance=optimized["total_distance"],
            total_duration=optimized["total_duration"],
            legs=optimized["legs"]
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")

@app.get("/routes/{session_id}/{mode}")
async def get_route(session_id: str, mode: str):
    """
    Get a previously optimized route.
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]
    route = session.get("optimized_routes", {}).get(mode)

    if not route:
        raise HTTPException(status_code=404, detail=f"No optimized route for mode '{mode}'. Run /optimize first.")

    return route

@app.get("/welcome")
async def get_welcome_message():
    """
    Get the welcome message without creating a session.
    Useful for displaying on page load.
    """
    return {"welcome_message": WELCOME_MESSAGE}

@app.delete("/sessions/{session_id}")
async def delete_session(session_id: str):
    """
    Delete a session (clear all data).
    """
    if session_id in sessions_db:
        del sessions_db[session_id]
        return {"message": "Session deleted"}
    else:
        raise HTTPException(status_code=404, detail="Session not found")

@app.get("/sessions")
async def list_sessions():
    """
    List all active sessions (for debugging).
    """
    return {
        "total_sessions": len(sessions_db),
        "sessions": [
            {
                "session_id": sid,
                "created_at": data["created_at"],
                "messages_count": len(data["chat_history"]),
                "has_recommendations": bool(data["recommendations"])
            }
            for sid, data in sessions_db.items()
        ]
    }

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("TripRoute Backend API - Phase 1 (Gemini)")
    print("=" * 60)
    print(f"Gemini API Key: {'Configured' if gemini_api_key else 'Missing'}")
    print(f"Google Maps Key: {'Configured' if gmap_api_key else 'Missing'}")
    print("=" * 60)

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes (disable in production)
        log_level="info"
    )
