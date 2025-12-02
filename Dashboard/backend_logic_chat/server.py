"""
TravelAgent Backend API Server
FastAPI server with database persistence and in-memory session cache
Integrates chat.py, gmaps_requests.py, and db.py for frontend communication
"""
from fastapi import FastAPI, HTTPException, Response, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlmodel import Session, select
import json
import uuid
import asyncio
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
from db import (
    init_db,
    get_session as get_db_session,
    get_session_dependency,
    Trip,
    ChatMessage,
    Place,
    Route,
    get_or_create_trip,
    save_chat_message,
    save_enriched_place,
    update_trip_context,
    select_place as db_select_place,
    deselect_place as db_deselect_place,
    update_place_order as db_update_place_order,
    save_route as db_save_route
)

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / "api.env")
gemini_api_key = os.getenv("GEMINI_API_KEY")
gmap_api_key = os.getenv("GMAP_API_KEY")

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

# Initialize database
try:
    init_db()
except Exception as e:
    print(f"❌ Error initializing database: {e}")
    print("   Server will continue but data won't persist across restarts")

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
# IN-MEMORY SESSION CACHE
# ============================================================================
# Fast access cache for active sessions (also persisted to database)
sessions_db: Dict[str, Dict[str, Any]] = {}


def get_or_create_session(session_id: Optional[str] = None) -> tuple[str, Dict[str, Any], int]:
    """
    Get existing session or create new one.

    Returns:
        tuple: (session_id, session_dict, trip_id)
    """
    if session_id and session_id in sessions_db:
        return session_id, sessions_db[session_id], sessions_db[session_id].get("trip_id")

    # Create new session with chat history initialized
    new_session_id = session_id or str(uuid.uuid4())

    # Create trip in database
    trip_id = None
    try:
        with get_db_session() as db_session:
            trip = get_or_create_trip(db_session, new_session_id)
            trip_id = trip.id
            print(f"[Database] Trip created/retrieved: ID={trip_id}")
    except Exception as e:
        print(f"[Database] Warning: Could not create trip in database: {e}")

    sessions_db[new_session_id] = {
        "session_id": new_session_id,
        "trip_id": trip_id,  # Database trip ID
        "created_at": datetime.now().isoformat(),
        "chat_history": initialize_chat_history(),  # Initialize with welcome message
        "trip_context": None,  # Trip context (cities, dates) extracted from conversation
        "all_places": [],
        "enriched_places": [],
        "selected_places": [],
        "optimized_routes": {}
    }
    return new_session_id, sessions_db[new_session_id], trip_id

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
    placeId: str
    displayName: str
    formattedAddress: Optional[str] = None
    rating: Optional[float] = None
    userRatingCount: Optional[int] = None
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
    session_id: Optional[str] = None  # Optional session ID to persist route to database

class ReorderPlacesRequest(BaseModel):
    placeIds: List[str]  # Match frontend camelCase naming

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
    session_id, session, trip_id = get_or_create_session()

    print(f"\n[Chat Session] New session created: {session_id}")
    print(f"[Chat Session] ✓ Chat agent ready (Trip ID: {trip_id})")

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
        raise HTTPException(status_code=503, detail="Gemini API not initialized")

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

                                if "error" in enriched_place:
                                    print(f"  ❌ Error: {enriched_place.get('error')}")
                                    continue

                                # Save to session
                                session["enriched_places"].append(enriched_place)

                                # Extract names and ID (new consistent naming)
                                original_name = enriched_place.get('originalDisplayName', 'Unknown')
                                official_name = enriched_place.get('displayName', original_name)
                                place_id = enriched_place.get('placeId')

                                print(f"  ✅ Enriched: {official_name} (ID: {place_id})")

                                # Prepare marker data for map (using same names as enrichment output)
                                marker_data = {
                                    "type": "marker",
                                    "placeId": place_id,
                                    "displayName": official_name,
                                    "originalDisplayName": original_name,
                                    "formattedAddress": enriched_place.get('formattedAddress'),
                                    "originalFormattedAddress": enriched_place.get('originalFormattedAddress'),
                                    "rating": enriched_place.get('rating'),
                                    "userRatingCount": enriched_place.get('userRatingCount'),
                                    "location": enriched_place.get('location'),
                                    "businessStatus": enriched_place.get('businessStatus'),
                                    "primaryType": enriched_place.get('primaryType'),
                                    "primaryTypeDisplayName": enriched_place.get('primaryTypeDisplayName'),
                                    "iconId": enriched_place.get('iconId', 7),
                                    "priceLevel": enriched_place.get('priceLevel'),
                                    "currentOpeningHours": enriched_place.get('currentOpeningHours'),
                                    "googleMapsUri": enriched_place.get('googleMapsUri')
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

            # Save to database (async, non-blocking)
            trip_id = session.get("trip_id")
            if trip_id:
                try:
                    with get_db_session() as db_session:
                        # Save user message
                        save_chat_message(db_session, trip_id, "user", request.message)

                        # Save assistant response
                        save_chat_message(db_session, trip_id, "assistant", chatting_text)

                        # Update trip context
                        if trip_context:
                            update_trip_context(db_session, trip_id, trip_context)

                        # Save enriched places
                        for enriched_place in session.get("enriched_places", [])[-len(places):]:
                            if "error" not in enriched_place:
                                save_enriched_place(db_session, trip_id, enriched_place)

                        print(f"[Database] ✓ Saved chat turn to database")
                except Exception as db_err:
                    print(f"[Database] Warning: Could not save to database: {db_err}")

        except Exception as e:
            import traceback
            print(f"❌ Error in chat stream: {e}")
            print(traceback.format_exc())
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")

@app.post("/places/select/{session_id}")
async def select_place(session_id: str, place_data: Dict[str, Any]):
    """
    Add a place to the selected places list for route optimization.
    Also updates the database to persist the selection.
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]

    # Add to selected places if not already there
    place_id = place_data.get("placeId")
    place_name = place_data.get("displayName", "Unknown")

    if not any(p.get("placeId") == place_id for p in session["selected_places"]):
        session["selected_places"].append(place_data)
        print(f"[Place Selection] Added to route: {place_name}")

        # Save to database
        trip_id = session.get("trip_id")
        if trip_id and place_id:
            try:
                with get_db_session() as db_session:
                    db_select_place(db_session, trip_id, place_id)
            except Exception as e:
                print(f"[Database] Warning: Could not save place selection: {e}")

    return {
        "status": "success",
        "selected_count": len(session["selected_places"])
    }

@app.delete("/places/select/{session_id}/{place_id}")
async def deselect_place(session_id: str, place_id: str):
    """
    Remove a place from selected places list.
    Also updates the database to persist the deselection.
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]

    # Find place name before removing
    removed_place = next((p for p in session["selected_places"] if p.get("placeId") == place_id), None)

    session["selected_places"] = [p for p in session["selected_places"] if p.get("placeId") != place_id]

    if removed_place:
        print(f"[Place Selection] Removed from route: {removed_place.get('displayName', 'Unknown')}")

        # Save to database
        trip_id = session.get("trip_id")
        if trip_id:
            try:
                with get_db_session() as db_session:
                    db_deselect_place(db_session, trip_id, place_id)
            except Exception as e:
                print(f"[Database] Warning: Could not save place deselection: {e}")

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

@app.put("/places/reorder/{session_id}")
async def reorder_places(session_id: str, request: ReorderPlacesRequest):
    """
    Update the order of selected places (after drag-and-drop reorder).
    Also updates the database to persist the new order.

    Args:
        session_id: Session ID
        request: Request body with placeIds list in the new desired order
    """
    if session_id not in sessions_db:
        raise HTTPException(status_code=404, detail="Session not found")

    session = sessions_db[session_id]
    place_ids = request.placeIds  # Get placeIds from request body

    # Reorder selected_places based on place_ids order
    place_map = {p.get("placeId"): p for p in session["selected_places"]}
    reordered = [place_map[pid] for pid in place_ids if pid in place_map]

    if len(reordered) == len(session["selected_places"]):
        session["selected_places"] = reordered
        print(f"[Place Selection] Reordered {len(reordered)} places")

        # Save to database
        trip_id = session.get("trip_id")
        if trip_id:
            try:
                with get_db_session() as db_session:
                    db_update_place_order(db_session, trip_id, place_ids)
            except Exception as e:
                print(f"[Database] Warning: Could not save place reorder: {e}")

    return {
        "status": "success",
        "selected_count": len(session["selected_places"])
    }

@app.get("/api/places/{place_id}/photo")
async def get_place_photo(place_id: str, max_width: int = 400):
    """
    Get photo URL for a place from enriched data.

    Args:
        place_id: Google Maps Place ID
        max_width: Maximum width in pixels (default: 400, max: 4800)

    Returns:
        JSON with photoUrl and placeName

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

        # First check in-memory sessions
        for session_id, session in sessions_db.items():
            for enriched_place in session.get("enriched_places", []):
                if enriched_place.get("placeId") == place_id:
                    # Found the enriched place
                    photos = enriched_place.get("photos", [])
                    if photos:
                        photo_name = photos[0].get("name")
                        place_name = enriched_place.get("originalDisplayName")
                        break
            if photo_name:
                break

        # If not found in memory, check database
        if not photo_name:
            try:
                with get_db_session() as db_session:
                    statement = select(Place).where(Place.placeId == place_id)
                    place = db_session.exec(statement).first()
                    if place and place.photos:
                        photo_name = place.photos[0].get("name") if isinstance(place.photos[0], dict) else None
                        place_name = place.displayName or place.originalDisplayName
            except Exception as db_err:
                print(f"[Photo] Error querying database for place {place_id}: {db_err}")

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
            "photoUrl": photo_url,
            "placeId": place_id,
            "placeName": place_name
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
    Uses Google Maps Directions API with optimize_waypoint_order=True.
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

        # Convert places to format expected by route computation
        places_for_route = []
        for place in selected_places:
            places_for_route.append({
                "placeId": place.get("placeId"),
                "displayName": place.get("displayName", "Unknown"),
                "formattedAddress": place.get("formattedAddress") or place.get("originalFormattedAddress") or ""
            })

        # Convert mode to uppercase format expected by route computation
        mode_map = {
            "driving": "DRIVE",
            "walking": "WALK",
            "bicycling": "BICYCLE",
            "transit": "TRANSIT"
        }
        route_mode = mode_map.get(request.mode, "DRIVE")

        # Compute optimized route with Google Maps API
        if route_mode == "TRANSIT":
            # Use transit-specific function
            result = compute_routes_transit(
                api_key=gmap_api_key,
                places=places_for_route,
                optimize_waypoint_order=True,
                departure_time=None
            )
        else:
            # Use DRIVE/WALK/BICYCLE function
            result = compute_routes_drive_walk_bicycle(
                api_key=gmap_api_key,
                places=places_for_route,
                travel_mode=route_mode,
                optimize_waypoint_order=True,
                departure_time=None
            )

        # Extract route data
        total_duration = result.get("totalDuration") or result.get("duration", 0)
        total_distance = result.get("totalDistanceMeters") or result.get("distanceMeters", 0)
        legs = result.get("legs", [])
        
        # Extract placeOrder from the optimized places array
        optimized_places = result.get("places", [])
        if optimized_places:
            # The places array is already in optimized order
            place_order = [p.get("placeId") for p in optimized_places if p.get("placeId")]
        else:
            # Fallback to original order if optimization didn't change order
            place_order = [place.get("placeId") for place in selected_places]

        # Prepare response
        optimized_route = {
            "sessionId": request.session_id,
            "mode": request.mode,
            "placeOrder": place_order,  # List of place IDs in optimized order
            "totalDistance": total_distance,
            "totalDuration": total_duration,
            "legs": legs
        }

        # Save to session
        session["optimized_routes"][request.mode] = optimized_route

        # Save to database
        trip_id = session.get("trip_id")
        if trip_id:
            try:
                route_data = {
                    "mode": route_mode,
                    "optimized": True,
                    "departureTime": None,
                    "totalDuration": total_duration,
                    "totalDistance": total_distance,
                    "placeOrder": place_order,
                    "legs": legs
                }
                with get_db_session() as db_session:
                    db_save_route(db_session, trip_id, route_data)
            except Exception as e:
                print(f"[Database] Warning: Could not save optimized route: {e}")

        print(f"[Route Optimization] ✓ Route optimized: {total_distance/1000:.2f} km, {total_duration/60:.0f} min")

        return optimized_route

    except Exception as e:
        import traceback
        print(f"[Route Optimization] ❌ Error: {e}")
        print(traceback.format_exc())
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

        # Save route to database if session_id provided
        if request.session_id and request.session_id in sessions_db:
            trip_id = sessions_db[request.session_id].get("trip_id")
            if trip_id:
                try:
                    # Prepare route data for database
                    route_data = {
                        "mode": request.mode,
                        "optimized": request.optimize_waypoint_order,
                        "departureTime": request.departure_time,
                        "totalDuration": total_duration,
                        "totalDistance": total_distance,
                        "placeOrder": [p.placeId for p in request.places],
                        "legs": result.get("legs", [])
                    }
                    with get_db_session() as db_session:
                        db_save_route(db_session, trip_id, route_data)
                except Exception as e:
                    print(f"[Database] Warning: Could not save route: {e}")

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
# DASHBOARD API ENDPOINTS (Database-backed)
# ============================================================================

@app.get("/trips")
async def list_trips():
    """
    List all trips from the database.

    Returns summary information for each trip (for dashboard display).
    """
    try:
        with get_db_session() as db_session:
            statement = select(Trip).order_by(Trip.createdAt.desc())
            trips = db_session.exec(statement).all()

            return {
                "total_trips": len(trips),
                "trips": [
                    {
                        "id": trip.id,
                        "sessionId": trip.sessionId,
                        "createdAt": trip.createdAt.isoformat() if trip.createdAt else None,
                        "updatedAt": trip.updatedAt.isoformat() if trip.updatedAt else None,
                        "cities": trip.cities,
                        "scheduleStartDate": trip.scheduleStartDate,
                        "scheduleEndDate": trip.scheduleEndDate
                    }
                    for trip in trips
                ]
            }
    except Exception as e:
        print(f"[Dashboard] Error listing trips: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list trips: {str(e)}")


@app.get("/trips/{trip_id}")
async def get_trip(trip_id: int):
    """
    Get full trip details including messages, places, and routes.
    """
    try:
        with get_db_session() as db_session:
            # Get trip
            trip = db_session.get(Trip, trip_id)
            if not trip:
                raise HTTPException(status_code=404, detail="Trip not found")

            # Get messages
            messages_stmt = select(ChatMessage).where(ChatMessage.tripId == trip_id).order_by(ChatMessage.createdAt)
            messages = db_session.exec(messages_stmt).all()

            # Get places
            places_stmt = select(Place).where(Place.tripId == trip_id)
            places = db_session.exec(places_stmt).all()

            # Get routes
            routes_stmt = select(Route).where(Route.tripId == trip_id).order_by(Route.createdAt.desc())
            routes = db_session.exec(routes_stmt).all()

            return {
                "trip": {
                    "id": trip.id,
                    "sessionId": trip.sessionId,
                    "createdAt": trip.createdAt.isoformat() if trip.createdAt else None,
                    "updatedAt": trip.updatedAt.isoformat() if trip.updatedAt else None,
                    "cities": trip.cities,
                    "scheduleStartDate": trip.scheduleStartDate,
                    "scheduleEndDate": trip.scheduleEndDate
                },
                "messages": [
                    {
                        "id": msg.id,
                        "role": msg.role,
                        "content": msg.content,
                        "createdAt": msg.createdAt.isoformat() if msg.createdAt else None
                    }
                    for msg in messages
                ],
                "places": [
                    {
                        "id": place.id,
                        "placeId": place.placeId,
                        "displayName": place.displayName,
                        "originalDisplayName": place.originalDisplayName,
                        "formattedAddress": place.formattedAddress,
                        "rating": place.rating,
                        "userRatingCount": place.userRatingCount,
                        "location": place.location,
                        "primaryType": place.primaryType,
                        "primaryTypeDisplayName": place.primaryTypeDisplayName,
                        "iconId": place.iconId,
                        "businessStatus": place.businessStatus,
                        "priceLevel": place.priceLevel,
                        "googleMapsUri": place.googleMapsUri,
                        "isSelected": place.isSelected,
                        "selectionOrder": place.selectionOrder
                    }
                    for place in places
                ],
                "routes": [
                    {
                        "id": route.id,
                        "mode": route.mode,
                        "optimized": route.optimized,
                        "departureTime": route.departureTime,
                        "totalDuration": route.totalDuration,
                        "totalDistance": route.totalDistance,
                        "placeOrder": route.placeOrder,
                        "legs": route.legs,
                        "createdAt": route.createdAt.isoformat() if route.createdAt else None
                    }
                    for route in routes
                ]
            }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Dashboard] Error getting trip {trip_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get trip: {str(e)}")


@app.delete("/trips/{trip_id}")
async def delete_trip(trip_id: int):
    """
    Delete a trip and all associated data from the database.
    """
    try:
        with get_db_session() as db_session:
            trip = db_session.get(Trip, trip_id)
            if not trip:
                raise HTTPException(status_code=404, detail="Trip not found")

            # Delete associated data (cascading would be better but doing manually for now)
            # Delete messages
            messages_stmt = select(ChatMessage).where(ChatMessage.tripId == trip_id)
            for msg in db_session.exec(messages_stmt).all():
                db_session.delete(msg)

            # Delete places
            places_stmt = select(Place).where(Place.tripId == trip_id)
            for place in db_session.exec(places_stmt).all():
                db_session.delete(place)

            # Delete routes
            routes_stmt = select(Route).where(Route.tripId == trip_id)
            for route in db_session.exec(routes_stmt).all():
                db_session.delete(route)

            # Delete trip
            session_id = trip.sessionId
            db_session.delete(trip)
            db_session.commit()

            # Also remove from in-memory cache
            if session_id in sessions_db:
                del sessions_db[session_id]

            print(f"[Dashboard] ✓ Deleted trip {trip_id} (session: {session_id})")

            return {"message": f"Trip {trip_id} deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Dashboard] Error deleting trip {trip_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to delete trip: {str(e)}")


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