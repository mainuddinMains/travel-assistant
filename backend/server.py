"""
TravelAgent Backend API Server
FastAPI server with in-memory session storage
Integrates chat.py and gmaps_requests.py for frontend communication
"""
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
import json
import uuid
import asyncio
import httpx
from concurrent.futures import ThreadPoolExecutor
from dotenv import load_dotenv
from pathlib import Path
import os

# Import backend modules
from chat import AGENT_NAME, WELCOME_MESSAGE, chatting_agent, initialize_chat_history
from gmaps_requests import (
    enrich_place_with_details,
    fetch_place_photo,
    compute_routes_drive_walk_bicycle,
    compute_routes_transit
)

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / "api.env")
gemini_api_key = os.getenv("GEMINI_API_KEY")
gmap_api_key = os.getenv("GMAP_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")
groq_api_key = os.getenv("GROQ_API_KEY")

# Treat template/placeholder values as missing configuration.
if gemini_api_key and "YOUR_GEMINI_API_KEY_HERE" in gemini_api_key:
    gemini_api_key = None
if gmap_api_key and "YOUR_GOOGLE_MAPS_API_KEY_HERE" in gmap_api_key:
    gmap_api_key = None

# Validate API keys
print("\n" + "="*60)
print("TravelAgent Backend Server - Initializing...")
print("="*60)

if not gemini_api_key:
    print("⚠️  WARNING: GEMINI_API_KEY not found in environment. Chat functionality will fail.")
else:
    print("✓ GEMINI_API_KEY loaded")

if not gmap_api_key:
    print("⚠️  WARNING: GMAP_API_KEY not found in environment. Maps functionality will fail.")
else:
    print("✓ GMAP_API_KEY loaded")

# Initialize API clients
try:
    from google import genai
    from google.genai import types
    gemini_client = genai.Client(api_key=gemini_api_key) if gemini_api_key else None
    if gemini_client:
        print("✓ Gemini AI client initialized")
except Exception as e:
    print(f"❌ Error initializing Gemini client: {e}")
    gemini_client = None

# Thread pool executor for async enrichment
executor = ThreadPoolExecutor(max_workers=5)

app = FastAPI(
    title="TravelAgent API",
    description="AI-powered travel planning with route optimization",
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
# IN-MEMORY SESSION STORAGE
# ============================================================================
sessions_db: Dict[str, Dict[str, Any]] = {}


def get_or_create_session(session_id: Optional[str] = None) -> tuple[str, Dict[str, Any]]:
    """Get existing session or create new one."""
    if session_id and session_id in sessions_db:
        return session_id, sessions_db[session_id]

    # Create new session with chat history initialized
    new_session_id = session_id or str(uuid.uuid4())
    sessions_db[new_session_id] = {
        "session_id": new_session_id,
        "created_at": datetime.now().isoformat(),
        "chat_history": initialize_chat_history(),  # Initialize with welcome message
        "trip_context": None,  # Trip context (cities, dates) extracted from conversation
        "all_places": [],
        "enriched_places": [],
        "selected_places": [],
        "optimized_routes": {}
    }
    return new_session_id, sessions_db[new_session_id]

# ============================================================================
# ASYNC ENRICHMENT HELPER
# ============================================================================

async def enrich_place_async(
    api_key: str,
    place: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Async wrapper for enrich_place_with_details.

    Runs the synchronous Google Maps API calls in a thread pool executor
    to avoid blocking the event loop.

    Args:
        api_key: Google Maps API key
        place: Place dict with displayName and formattedAddress

    Returns:
        Enriched place dict with Google Maps data
    """
    loop = asyncio.get_event_loop()
    enriched_place = await loop.run_in_executor(
        executor,
        enrich_place_with_details,
        api_key,
        place
    )
    return enriched_place

# ============================================================================
# REQUEST/RESPONSE MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str

class PlaceCard(BaseModel):
    place_id: str
    name: str
    formatted_address: Optional[str] = None
    rating: Optional[float] = None
    user_rating_count: Optional[int] = None
    location: Optional[Dict[str, float]] = None

class OptimizeRequest(BaseModel):
    session_id: str
    mode: str  # "driving", "walking", "bicycling", "transit"

class RoutePlace(BaseModel):
    placeId: str
    displayName: str
    formattedAddress: str

class ComputeRouteRequest(BaseModel):
    places: List[RoutePlace]
    mode: str  # "DRIVE", "WALK", "BICYCLE", "TRANSIT"
    optimize_waypoint_order: bool = True
    departure_time: Optional[str] = None  # ISO datetime for TRANSIT

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "service": "TravelAgent API",
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

@app.post("/chat/init")
async def init_chat():
    """
    Initialize a new chat session.
    Returns session_id and welcome message.
    """
    session_id, session = get_or_create_session()

    print(f"\n[Chat Session] New session created: {session_id}")
    print(f"[Chat Session] ✓ Chat agent ready")

    return {
        "session_id": session_id,
        "welcome_message": WELCOME_MESSAGE
    }

@app.post("/chat/stream/{session_id}")
async def chat_stream(session_id: str, request: ChatRequest):
    """
    Streaming chat endpoint with async enrichment:
    1. Call chatting_agent to get structured output (chatting text + places)
    2. Start async enrichment tasks for all places
    3. Stream chatting text to user immediately
    4. Stream enriched place cards as they complete
    """
    if not gemini_client:
        async def generate_fallback():
            normalized = request.message.strip().lower()
            if normalized in {"hi", "hello", "hey", "hey there"}:
                fallback_text = (
                    "Hi! I am running in limited mode right now. "
                    "To enable full AI trip planning, add `GEMINI_API_KEY` in "
                    "`backend/api.env` and restart the backend."
                )
            else:
                fallback_text = (
                    "AI chat is not configured yet. Please add `GEMINI_API_KEY` in "
                    "`backend/api.env`, then restart the backend. "
                    "I still received your message: "
                    f"\"{request.message}\"."
                )
            yield f"data: {json.dumps({'type': 'text_chunk', 'content': fallback_text})}\n\n"
            yield f"data: {json.dumps({'type': 'text_complete', 'content': fallback_text})}\n\n"
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        return StreamingResponse(generate_fallback(), media_type="text/event-stream")

    if session_id not in sessions_db:
        raise HTTPException(
            status_code=404,
            detail=f"Session not found. Server may have restarted. Please refresh the page. (Looking for: {session_id[:8]}...)"
        )

    session = sessions_db[session_id]

    async def generate():
        try:
            # Step 1: Get AI response with structured output (1-2 seconds)
            print(f"\n[Chat Message] User: {request.message[:50]}...")
            print(f"[Chat Message] Calling Gemini AI...")

            # Call chatting_agent (synchronous, but fast ~1-2 seconds)
            chat_history, trip_context, chatting_text, places = await asyncio.to_thread(
                chatting_agent,
                gemini_client,
                session["chat_history"],
                request.message
            )

            # Update session chat history (now includes user message and AI response)
            session["chat_history"] = chat_history

            # Update session trip context
            session["trip_context"] = trip_context

            print(f"[Chat Message] ✓ AI response received ({len(places)} places)")

            # Stream trip context to frontend immediately
            if trip_context:
                yield f"data: {json.dumps({'type': 'trip_context', 'trip_context': trip_context})}\n\n"
                print(f"📍 Trip Context: {trip_context}")

            # Step 2: Start async enrichment tasks for all places (parallel with streaming)
            enrichment_tasks = []
            if places and gmap_api_key:
                print(f"🗺️  Starting enrichment for {len(places)} places...")
                for place in places:
                    task = asyncio.create_task(enrich_place_async(gmap_api_key, place))
                    enrichment_tasks.append(task)

            # Step 3 & 4: Stream text AND process enrichment results in parallel
            # This creates two truly concurrent streams

            words = chatting_text.split(' ')
            word_index = 0
            current_text = ""
            completed_tasks = set()

            # Keep streaming until both text is done AND all enrichment is done
            text_done = False
            enrichment_done = len(enrichment_tasks) == 0

            while not (text_done and enrichment_done):
                # Stream next word if not done
                if not text_done and word_index < len(words):
                    if word_index == 0:
                        current_text = words[word_index]
                    else:
                        current_text += " " + words[word_index]

                    yield f"data: {json.dumps({'type': 'text_chunk', 'content': current_text})}\n\n"
                    word_index += 1

                    if word_index >= len(words):
                        text_done = True
                        yield f"data: {json.dumps({'type': 'text_complete', 'content': chatting_text})}\n\n"
                        print(f"✓ Text streaming complete")

                # Check for completed enrichment tasks
                if enrichment_tasks and not enrichment_done:
                    for i, task in enumerate(enrichment_tasks):
                        if task.done() and i not in completed_tasks:
                            completed_tasks.add(i)

                            try:
                                enriched_place = task.result()

                                if isinstance(enriched_place, Exception):
                                    print(f"  ❌ Error enriching place {i+1}: {str(enriched_place)}")
                                    continue

                                if "_error" in enriched_place:
                                    print(f"  ❌ Error: {enriched_place.get('_error')}")
                                    continue

                                # Save to session
                                session["enriched_places"].append(enriched_place)

                                # Extract names and ID
                                # _displayName: Original name from chatting_agent (e.g., "Rain or Shine Ice Cream")
                                # displayName: Official Google Maps name (e.g., "Rain Or Shine Ice Cream")
                                original_name = enriched_place.get('_displayName', 'Unknown')
                                official_name = enriched_place.get('displayName', {}).get('text', original_name)
                                place_id = enriched_place.get('_id')

                                print(f"  ✅ Enriched: {official_name} (ID: {place_id})")

                                # Prepare marker data for map
                                # Use official name for display, but include original for text matching
                                marker_data = {
                                    "type": "marker",
                                    "place_id": place_id,
                                    "name": official_name,  # Official Google Maps name for display
                                    "original_name": original_name,  # Original name for text matching
                                    "formatted_address": enriched_place.get('_formattedAddress'),
                                    "rating": enriched_place.get('rating'),
                                    "user_rating_count": enriched_place.get('userRatingCount'),
                                    "location": enriched_place.get('location'),
                                    "business_status": enriched_place.get('businessStatus'),
                                    "primary_type": enriched_place.get('primaryTypeDisplayName', {}).get('text') if enriched_place.get('primaryTypeDisplayName') else None,
                                    "icon_id": enriched_place.get('_icon_id', 7),  # Icon category ID (0-7) from enrichment
                                    "price_level": enriched_place.get('priceLevel'),
                                    "current_opening_hours": enriched_place.get('currentOpeningHours'),
                                    "google_maps_uri": enriched_place.get('googleMapsUri')  # Official Google Maps URL
                                }

                                # Stream marker immediately when ready
                                yield f"data: {json.dumps(marker_data)}\n\n"

                            except Exception as e:
                                print(f"  ❌ Error processing enriched place {i+1}: {e}")

                    # Check if all enrichment is done
                    if len(completed_tasks) >= len(enrichment_tasks):
                        enrichment_done = True
                        print(f"✓ Enrichment complete")

                # Small delay to avoid tight loop
                await asyncio.sleep(0.02)

            # Send completion
            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            import traceback
            print(f"❌ Error in chat stream: {e}")
            print(traceback.format_exc())
            error_text = str(e)
            if "API_KEY_INVALID" in error_text or "API key not valid" in error_text:
                friendly = (
                    "Gemini API key is invalid. Update `GEMINI_API_KEY` in "
                    "`backend/api.env` with a valid Google AI Studio key, then restart backend."
                )
                yield f"data: {json.dumps({'type': 'text_chunk', 'content': friendly})}\n\n"
                yield f"data: {json.dumps({'type': 'text_complete', 'content': friendly})}\n\n"
                yield f"data: {json.dumps({'type': 'done'})}\n\n"
            else:
                yield f"data: {json.dumps({'type': 'error', 'message': error_text})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/places/select/{session_id}")
async def select_place(session_id: str, place_data: Dict[str, Any]):
    """
    Add a place to the selected places list for route optimization.
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]

    # Add to selected places if not already there
    place_id = place_data.get("place_id")
    place_name = place_data.get("name", "Unknown")

    if not any(p.get("place_id") == place_id for p in session["selected_places"]):
        session["selected_places"].append(place_data)
        print(f"[Place Selection] Added to route: {place_name}")

    return {
        "status": "success",
        "selected_count": len(session["selected_places"])
    }

@app.delete("/places/select/{session_id}/{place_id}")
async def deselect_place(session_id: str, place_id: str):
    """
    Remove a place from selected places list.
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]

    # Find place name before removing
    removed_place = next((p for p in session["selected_places"] if p.get("place_id") == place_id), None)

    session["selected_places"] = [p for p in session["selected_places"] if p.get("place_id") != place_id]

    if removed_place:
        print(f"[Place Selection] Removed from route: {removed_place.get('name', 'Unknown')}")

    return {
        "status": "success",
        "selected_count": len(session["selected_places"])
    }

@app.get("/places/selected/{session_id}")
async def get_selected_places(session_id: str):
    """
    Get all selected places for a session.
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session_id": session_id,
        "selected_places": sessions_db[session_id]["selected_places"]
    }

@app.get("/api/places/{place_id}/photo")
async def get_place_photo(place_id: str, max_width: int = 400):
    """
    Get photo URL for a place from enriched data.

    Args:
        place_id: Google Maps Place ID
        max_width: Maximum width in pixels (default: 400, max: 4800)

    Returns:
        JSON with photo_url and place_name

    Note:
        Photo references are fetched fresh during enrichment per Google Maps Platform Terms.
        No caching of photo URLs to comply with Section 3.2.3(b) (No Caching) policy.
        Photo references can expire and must be retrieved fresh from API responses.
    """
    if not gmap_api_key:
        raise HTTPException(status_code=503, detail="Google Maps API not configured")

    # Validate max_width
    if max_width < 1 or max_width > 4800:
        raise HTTPException(status_code=400, detail="max_width must be between 1 and 4800")

    try:
        # Search through all sessions for this place's enriched data
        photo_name = None
        place_name = None

        for session_id, session in sessions_db.items():
            for enriched_place in session.get("enriched_places", []):
                if enriched_place.get("_id") == place_id:
                    # Found the enriched place
                    photos = enriched_place.get("photos", [])
                    if photos:
                        photo_name = photos[0].get("name")
                        place_name = enriched_place.get("_displayName")
                        break
            if photo_name:
                break

        if not photo_name:
            raise HTTPException(status_code=404, detail="No photo reference found for this place")

        # Construct photo URL using the photo name
        # This makes the actual API call to Google Maps Photo API ($7/1000)
        # No caching per Google Maps Platform Terms of Service
        photo_url = await asyncio.to_thread(
            fetch_place_photo,
            gmap_api_key,
            photo_name,
            max_width,
            skip_http_redirect=True
        )

        return {
            "photo_url": photo_url,
            "place_id": place_id,
            "place_name": place_name
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching photo for place {place_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch photo: {str(e)}")

@app.post("/optimize")
async def optimize_route(request: OptimizeRequest):
    """
    Optimize route for selected places with specific transportation mode.
    """
    if not gmap_api_key:
        raise HTTPException(status_code=503, detail="Google Maps API not initialized")

    if request.session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[request.session_id]
    selected_places = session.get("selected_places", [])

    if len(selected_places) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 places to create a route")

    # Validate mode
    valid_modes = ["driving", "walking", "bicycling", "transit"]
    if request.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of: {valid_modes}")

    try:
        print(f"\n[Route Optimization] Optimizing route for {len(selected_places)} places (mode: {request.mode})")

        # TODO: Implement route optimization with Google Maps Directions API
        # For now, return placeholder data
        optimized_route = {
            "session_id": request.session_id,
            "mode": request.mode,
            "optimized_route": [p["name"] for p in selected_places],
            "total_distance": 5000,  # meters (placeholder)
            "total_duration": 600,   # seconds (placeholder)
            "legs": []
        }

        # Save to session
        session["optimized_routes"][request.mode] = optimized_route

        print(f"[Route Optimization] ✓ Route optimized: {optimized_route['total_distance']/1000:.2f} km, {optimized_route['total_duration']/60:.0f} min")

        return optimized_route

    except Exception as e:
        print(f"[Route Optimization] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.post("/routes/compute")
async def compute_route(request: ComputeRouteRequest):
    """
    Compute route for a list of places.

    Supports DRIVE, WALK, BICYCLE, and TRANSIT modes.
    Returns optimized places order and leg details.
    """
    if not gmap_api_key:
        raise HTTPException(status_code=503, detail="Google Maps API not initialized")

    if len(request.places) < 2:
        raise HTTPException(status_code=400, detail="At least 2 places required")

    # Validate mode
    valid_modes = ["DRIVE", "WALK", "BICYCLE", "TRANSIT"]
    if request.mode not in valid_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode. Must be one of: {valid_modes}")

    try:
        # Convert Pydantic models to dicts
        places = [p.model_dump() for p in request.places]

        print(f"\n[Route Compute] Computing {request.mode} route for {len(places)} places (optimize={request.optimize_waypoint_order})")

        if request.mode == "TRANSIT":
            # Use transit-specific function
            result = compute_routes_transit(
                api_key=gmap_api_key,
                places=places,
                optimize_waypoint_order=request.optimize_waypoint_order,
                departure_time=request.departure_time
            )
        else:
            # Use DRIVE/WALK/BICYCLE function
            result = compute_routes_drive_walk_bicycle(
                api_key=gmap_api_key,
                places=places,
                travel_mode=request.mode,
                optimize_waypoint_order=request.optimize_waypoint_order,
                departure_time=request.departure_time
            )

        # Log summary
        total_duration = result.get("totalDuration") or result.get("duration", 0)
        total_distance = result.get("totalDistanceMeters") or result.get("distanceMeters", 0)
        print(f"[Route Compute] ✓ Route computed: {total_distance/1000:.2f} km, {total_duration/60:.0f} min")

        return result

    except Exception as e:
        print(f"[Route Compute] ❌ Error: {e}")
        raise HTTPException(status_code=500, detail=f"Route computation failed: {str(e)}")


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
                "selected_places_count": len(data["selected_places"])
            }
            for sid, data in sessions_db.items()
        ]
    }

class SimpleChatMessage(BaseModel):
    role: str
    content: str

class SimpleChatRequest(BaseModel):
    messages: List[SimpleChatMessage]

@app.post("/chat/gemini")
async def gemini_chat_proxy(request: SimpleChatRequest):
    """
    Proxy endpoint: streams a Gemini response back as SSE.
    Runs server-side to avoid browser quota/CORS restrictions.
    """
    if not gemini_client:
        async def no_key():
            yield f"data: {json.dumps({'type': 'error', 'message': 'GEMINI_API_KEY not set in backend/api.env'})}\n\n"
        return StreamingResponse(no_key(), media_type="text/event-stream")

    async def generate():
        try:
            from google.genai import types as gtypes

            # Separate system message from conversation
            system_prompt = None
            history = []
            for m in request.messages:
                if m.role == "system":
                    system_prompt = m.content
                else:
                    gemini_role = "model" if m.role == "assistant" else "user"
                    history.append({"role": gemini_role, "parts": [{"text": m.content}]})

            config = gtypes.GenerateContentConfig(
                system_instruction=system_prompt,
                max_output_tokens=512,
                temperature=0.7,
            )

            stream = await gemini_client.aio.models.generate_content_stream(
                model="gemini-2.0-flash",
                contents=history,
                config=config,
            )
            async for chunk in stream:
                text = chunk.text
                if text:
                    yield f"data: {json.dumps({'type': 'text', 'content': text})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


@app.post("/chat/groq")
async def groq_chat_proxy(request: SimpleChatRequest):
    """
    Proxy endpoint: streams a Groq (Llama) response back as SSE.
    Returns text chunks + place markers (geocoded via Google Maps).
    """
    if not groq_api_key:
        async def no_key():
            yield f"data: {json.dumps({'type': 'error', 'message': 'GROQ_API_KEY not set in backend/api.env'})}\n\n"
        return StreamingResponse(no_key(), media_type="text/event-stream")

    async def generate():
        # Separate system message from conversation history
        system_content = ""
        conv_messages = []
        for m in request.messages:
            if m.role == "system":
                system_content = m.content
            else:
                conv_messages.append({"role": m.role, "content": m.content})

        # Inject JSON instruction into system prompt
        json_instruction = (
            "\n\nIMPORTANT: Always respond in this exact JSON format only — no extra text outside the JSON:\n"
            '{"response": "your travel advice here", "places": ['
            '{"name": "Place Name", "description": "1-2 sentence description", "city": "City", "country": "Country"}'
            "]}\n"
            "Include up to 5 real, specific places from your response. If none, use empty array []."
        )
        enhanced_system = system_content + json_instruction

        payload = {
            "model": "llama-3.1-8b-instant",
            "messages": [{"role": "system", "content": enhanced_system}] + conv_messages,
            "stream": False,
            "max_tokens": 1024,
            "temperature": 0.7,
        }
        headers = {
            "Authorization": f"Bearer {groq_api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=60.0) as client:
                # Step 1: Get structured JSON response from Groq
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    json=payload,
                    headers=headers,
                )
                if resp.status_code != 200:
                    err = resp.json().get("error", {}).get("message", "Groq error")
                    yield f"data: {json.dumps({'type': 'error', 'message': err})}\n\n"
                    return

                raw_content = resp.json()["choices"][0]["message"]["content"].strip()

                # Parse JSON (handle markdown code blocks)
                if raw_content.startswith("```"):
                    raw_content = raw_content.split("```")[1]
                    if raw_content.startswith("json"):
                        raw_content = raw_content[4:]
                    raw_content = raw_content.strip()

                try:
                    parsed = json.loads(raw_content)
                    response_text = parsed.get("response", raw_content)
                    places = parsed.get("places", [])
                except json.JSONDecodeError:
                    response_text = raw_content
                    places = []

                # Step 2: Stream text word by word
                words = response_text.split(" ")
                for word in words:
                    yield f"data: {json.dumps({'type': 'text', 'content': word + ' '})}\n\n"
                    await asyncio.sleep(0.025)

                # Step 3: Geocode places and stream markers
                if places and gmap_api_key:
                    for place in places[:5]:
                        try:
                            name = place.get("name", "")
                            city = place.get("city", "")
                            country = place.get("country", "")
                            query = ", ".join(filter(None, [name, city, country]))

                            geo = await client.get(
                                "https://maps.googleapis.com/maps/api/geocode/json",
                                params={"address": query, "key": gmap_api_key},
                                timeout=10.0,
                            )
                            geo_data = geo.json()
                            if geo_data.get("status") == "OK":
                                loc = geo_data["results"][0]["geometry"]["location"]
                                addr = geo_data["results"][0].get("formatted_address", query)
                                yield f"data: {json.dumps({'type': 'marker', 'name': name, 'lat': loc['lat'], 'lng': loc['lng'], 'description': place.get('description', ''), 'address': addr})}\n\n"
                        except Exception as geo_err:
                            print(f"Geocoding error for '{place.get('name')}': {geo_err}")

                yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")


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

# ============================================================================
# SERVER STARTUP
# ============================================================================

if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("TravelAgent Backend API")
    print("=" * 60)
    print(f"Gemini API Key: {'Configured' if gemini_api_key else 'Missing'}")
    print(f"Google Maps Key: {'Configured' if gmap_api_key else 'Missing'}")
    print("=" * 60)

    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,  # Auto-reload on code changes
        log_level="info"
    )
