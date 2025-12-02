"""
db.py - Database Module for TravelAgent

SQLModel-based database layer for persisting trip data, chat messages,
enriched places, and computed routes.

Tables:
- Trip: Main trip entity with session info and trip context
- ChatMessage: Chat history for each trip
- Place: Enriched places associated with trips
- Route: Computed routes with legs and waypoints

Usage:
    from db import get_session, Trip, ChatMessage, Place, Route

    # In FastAPI endpoint
    with get_session() as session:
        trip = Trip(sessionId="abc123", cities=["Vancouver"])
        session.add(trip)
        session.commit()
"""

from sqlmodel import SQLModel, Field, create_engine, Session, Relationship
from sqlalchemy import Column, Text, JSON
from typing import Optional, List, Dict, Any
from datetime import datetime
import os
from dotenv import load_dotenv
from pathlib import Path
from contextlib import contextmanager

# Load environment variables
load_dotenv(dotenv_path=Path(__file__).parent / "api.env")

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================
# Converted from MySQL to SQLite to match auth system's database

# Use SQLite database (same as auth system)
# SQLite file will be created in the project root (same location as auth backend)
# Get the project root directory (2 levels up from this file)
_project_root = Path(__file__).parent.parent.parent
_db_path = _project_root / "travel_assistant.db"

# Convert Windows path to proper format for SQLite URL
_db_path_str = str(_db_path).replace("\\", "/")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"sqlite:///{_db_path_str}"  # Same database file as auth system
)

# Create engine with SQLite (no connection pooling needed for SQLite)
engine = create_engine(
    DATABASE_URL,
    echo=False,  # Set to True for SQL query logging
    connect_args={"check_same_thread": False},  # Allow SQLite to work with multiple threads
)


# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

@contextmanager
def get_session():
    """
    Context manager for database sessions.

    Usage:
        with get_session() as session:
            trip = session.get(Trip, trip_id)
            session.add(new_message)
            session.commit()
    """
    session = Session(engine)
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_session_dependency():
    """
    FastAPI dependency for database sessions.

    Usage:
        @app.get("/trips")
        def get_trips(session: Session = Depends(get_session_dependency)):
            return session.query(Trip).all()
    """
    with Session(engine) as session:
        yield session


# ============================================================================
# DATABASE MODELS
# ============================================================================

class Trip(SQLModel, table=True):
    """
    Main trip entity - represents a user's travel planning session.

    Each trip has:
    - A unique session ID (from frontend)
    - Trip context (cities, dates)
    - Related chat messages, places, and routes
    """
    __tablename__ = "trips"

    id: Optional[int] = Field(default=None, primary_key=True)
    sessionId: str = Field(index=True, unique=True)
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

    # Trip context (extracted from chat)
    cities: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))
    scheduleStartDate: Optional[str] = Field(default=None)  # ISO format YYYY-MM-DD
    scheduleEndDate: Optional[str] = Field(default=None)  # ISO format YYYY-MM-DD

    # Relationships
    messages: List["ChatMessage"] = Relationship(back_populates="trip")
    places: List["Place"] = Relationship(back_populates="trip")
    routes: List["Route"] = Relationship(back_populates="trip")


class ChatMessage(SQLModel, table=True):
    """
    Chat message in a trip's conversation history.

    Stores both user messages and assistant responses.
    """
    __tablename__ = "chat_messages"

    id: Optional[int] = Field(default=None, primary_key=True)
    tripId: int = Field(foreign_key="trips.id", index=True)
    role: str  # "user" or "assistant"
    content: str = Field(sa_column=Column(Text))  # Full message content (can be long)
    createdAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    trip: Optional[Trip] = Relationship(back_populates="messages")


class Place(SQLModel, table=True):
    """
    Enriched place data from Google Maps API.

    Stores all place details for display and route computation.
    Uses camelCase to match frontend and API conventions.
    """
    __tablename__ = "places"

    id: Optional[int] = Field(default=None, primary_key=True)
    tripId: int = Field(foreign_key="trips.id", index=True)

    # Google Maps identifiers
    placeId: str = Field(index=True)  # Google Maps Place ID

    # Names (original from chat agent, official from Google)
    originalDisplayName: str  # Name from chatting agent
    displayName: str  # Official name from Google Maps

    # Addresses
    originalFormattedAddress: Optional[str] = None
    formattedAddress: Optional[str] = None

    # Ratings
    rating: Optional[float] = None
    userRatingCount: Optional[int] = None

    # Location (stored as JSON: {latitude, longitude})
    location: Optional[Dict[str, float]] = Field(default=None, sa_column=Column(JSON))

    # Place type and category
    primaryType: Optional[str] = None
    primaryTypeDisplayName: Optional[str] = None
    iconId: int = Field(default=7)  # Icon category (0-7)

    # Business info
    businessStatus: Optional[str] = None
    priceLevel: Optional[str] = None

    # URLs
    googleMapsUri: Optional[str] = None
    websiteUri: Optional[str] = None

    # Phone numbers
    nationalPhoneNumber: Optional[str] = None
    internationalPhoneNumber: Optional[str] = None

    # Opening hours (stored as JSON)
    currentOpeningHours: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    regularOpeningHours: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))

    # Photos (stored as JSON array of photo references)
    photos: Optional[List[Dict[str, Any]]] = Field(default=None, sa_column=Column(JSON))

    # Place types (stored as JSON array)
    types: Optional[List[str]] = Field(default=None, sa_column=Column(JSON))

    # Selection state
    isSelected: bool = Field(default=False)  # Whether place is in route
    selectionOrder: Optional[int] = None  # Order in route (0 = start, -1 = end)

    createdAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    trip: Optional[Trip] = Relationship(back_populates="places")


class Route(SQLModel, table=True):
    """
    Computed route between selected places.

    Stores route details including optimized order, legs, and polylines.
    """
    __tablename__ = "routes"

    id: Optional[int] = Field(default=None, primary_key=True)
    tripId: int = Field(foreign_key="trips.id", index=True)

    # Route configuration
    mode: str  # "DRIVE", "WALK", "BICYCLE", "TRANSIT"
    optimized: bool = Field(default=True)
    departureTime: Optional[str] = None  # ISO datetime string

    # Route summary
    totalDuration: Optional[int] = None  # Duration in seconds
    totalDistance: Optional[int] = None  # Distance in meters

    # Ordered place IDs (stored as JSON array)
    placeOrder: List[str] = Field(sa_column=Column(JSON))  # List of placeIds in order

    # Route legs (stored as JSON array)
    # Each leg: {duration, distanceMeters, polyline, startName, endName, steps?}
    legs: List[Dict[str, Any]] = Field(sa_column=Column(JSON))

    createdAt: datetime = Field(default_factory=datetime.utcnow)

    # Relationship
    trip: Optional[Trip] = Relationship(back_populates="routes")


# ============================================================================
# DATABASE INITIALIZATION
# ============================================================================

def init_db():
    """
    Create all database tables.

    Call this on application startup to ensure tables exist.
    """
    SQLModel.metadata.create_all(engine)
    print("[Database] ✓ Tables created/verified")


def drop_all_tables():
    """
    Drop all database tables.

    WARNING: This will delete all data! Use only for development/testing.
    """
    SQLModel.metadata.drop_all(engine)
    print("[Database] ✗ All tables dropped")


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def get_or_create_trip(session: Session, session_id: str) -> Trip:
    """
    Get existing trip by session ID or create a new one.

    Args:
        session: Database session
        session_id: Frontend session ID

    Returns:
        Trip object (existing or newly created)
    """
    from sqlmodel import select

    statement = select(Trip).where(Trip.sessionId == session_id)
    trip = session.exec(statement).first()

    if not trip:
        trip = Trip(sessionId=session_id)
        session.add(trip)
        session.commit()
        session.refresh(trip)
        print(f"[Database] Created new trip: {session_id}")

    return trip


def save_chat_message(session: Session, trip_id: int, role: str, content: str) -> ChatMessage:
    """
    Save a chat message to the database.

    Args:
        session: Database session
        trip_id: Trip ID
        role: "user" or "assistant"
        content: Message content

    Returns:
        Created ChatMessage object
    """
    message = ChatMessage(
        tripId=trip_id,
        role=role,
        content=content
    )
    session.add(message)
    session.commit()
    session.refresh(message)
    return message


def save_enriched_place(session: Session, trip_id: int, place_data: Dict[str, Any]) -> Place:
    """
    Save an enriched place to the database.
    Updates existing place if it already exists for this trip.

    Args:
        session: Database session
        trip_id: Trip ID
        place_data: Enriched place dict from gmaps_requests.enrich_place_with_details()

    Returns:
        Created or updated Place object
    """
    from sqlmodel import select
    
    place_id = place_data.get("placeId")
    if not place_id:
        raise ValueError("placeId is required in place_data")
    
    # Check if place already exists for this trip
    statement = select(Place).where(Place.tripId == trip_id).where(Place.placeId == place_id)
    existing_place = session.exec(statement).first()
    
    if existing_place:
        # Update existing place with new data
        existing_place.originalDisplayName = place_data.get("originalDisplayName", existing_place.originalDisplayName)
        existing_place.displayName = place_data.get("displayName", existing_place.displayName)
        existing_place.originalFormattedAddress = place_data.get("originalFormattedAddress") or existing_place.originalFormattedAddress
        existing_place.formattedAddress = place_data.get("formattedAddress") or existing_place.formattedAddress
        existing_place.rating = place_data.get("rating") or existing_place.rating
        existing_place.userRatingCount = place_data.get("userRatingCount") or existing_place.userRatingCount
        existing_place.location = place_data.get("location") or existing_place.location
        existing_place.primaryType = place_data.get("primaryType") or existing_place.primaryType
        existing_place.primaryTypeDisplayName = place_data.get("primaryTypeDisplayName") or existing_place.primaryTypeDisplayName
        existing_place.iconId = place_data.get("iconId", existing_place.iconId)
        existing_place.businessStatus = place_data.get("businessStatus") or existing_place.businessStatus
        existing_place.priceLevel = place_data.get("priceLevel") or existing_place.priceLevel
        existing_place.googleMapsUri = place_data.get("googleMapsUri") or existing_place.googleMapsUri
        existing_place.websiteUri = place_data.get("websiteUri") or existing_place.websiteUri
        existing_place.nationalPhoneNumber = place_data.get("nationalPhoneNumber") or existing_place.nationalPhoneNumber
        existing_place.internationalPhoneNumber = place_data.get("internationalPhoneNumber") or existing_place.internationalPhoneNumber
        existing_place.currentOpeningHours = place_data.get("currentOpeningHours") or existing_place.currentOpeningHours
        existing_place.regularOpeningHours = place_data.get("regularOpeningHours") or existing_place.regularOpeningHours
        existing_place.photos = place_data.get("photos") or existing_place.photos
        existing_place.types = place_data.get("types") or existing_place.types
        
        session.commit()
        session.refresh(existing_place)
        return existing_place
    else:
        # Create new place
        place = Place(
            tripId=trip_id,
            placeId=place_id,
            originalDisplayName=place_data.get("originalDisplayName", ""),
            displayName=place_data.get("displayName", ""),
            originalFormattedAddress=place_data.get("originalFormattedAddress"),
            formattedAddress=place_data.get("formattedAddress"),
            rating=place_data.get("rating"),
            userRatingCount=place_data.get("userRatingCount"),
            location=place_data.get("location"),
            primaryType=place_data.get("primaryType"),
            primaryTypeDisplayName=place_data.get("primaryTypeDisplayName"),
            iconId=place_data.get("iconId", 7),
            businessStatus=place_data.get("businessStatus"),
            priceLevel=place_data.get("priceLevel"),
            googleMapsUri=place_data.get("googleMapsUri"),
            websiteUri=place_data.get("websiteUri"),
            nationalPhoneNumber=place_data.get("nationalPhoneNumber"),
            internationalPhoneNumber=place_data.get("internationalPhoneNumber"),
            currentOpeningHours=place_data.get("currentOpeningHours"),
            regularOpeningHours=place_data.get("regularOpeningHours"),
            photos=place_data.get("photos"),
            types=place_data.get("types"),
        )
        session.add(place)
        session.commit()
        session.refresh(place)
        return place


def update_trip_context(session: Session, trip_id: int, trip_context: Dict[str, Any]) -> Trip:
    """
    Update trip context (cities, dates) from chat agent output.

    Args:
        session: Database session
        trip_id: Trip ID
        trip_context: Trip context dict from chatting agent

    Returns:
        Updated Trip object
    """
    trip = session.get(Trip, trip_id)
    if trip:
        if trip_context.get("cities"):
            trip.cities = trip_context["cities"]
        if trip_context.get("scheduleStartDate"):
            trip.scheduleStartDate = trip_context["scheduleStartDate"]
        if trip_context.get("scheduleEndDate"):
            trip.scheduleEndDate = trip_context["scheduleEndDate"]
        trip.updatedAt = datetime.utcnow()
        session.commit()
        session.refresh(trip)
    return trip


def get_trip_places(session: Session, trip_id: int) -> List[Place]:
    """
    Get all places for a trip.

    Args:
        session: Database session
        trip_id: Trip ID

    Returns:
        List of Place objects
    """
    from sqlmodel import select

    statement = select(Place).where(Place.tripId == trip_id)
    return session.exec(statement).all()


def get_selected_places(session: Session, trip_id: int) -> List[Place]:
    """
    Get selected places for a trip (places in the route).

    Args:
        session: Database session
        trip_id: Trip ID

    Returns:
        List of selected Place objects ordered by selectionOrder
    """
    from sqlmodel import select

    statement = (
        select(Place)
        .where(Place.tripId == trip_id)
        .where(Place.isSelected == True)
        .order_by(Place.selectionOrder)
    )
    return session.exec(statement).all()


def select_place(session: Session, trip_id: int, place_id: str) -> Optional[Place]:
    """
    Mark a place as selected for the route.

    Args:
        session: Database session
        trip_id: Trip ID
        place_id: Google Maps Place ID

    Returns:
        Updated Place object, or None if not found
    """
    from sqlmodel import select

    # Find the place
    statement = select(Place).where(Place.tripId == trip_id).where(Place.placeId == place_id)
    place = session.exec(statement).first()

    if place:
        # Get current max selection order
        max_order_stmt = (
            select(Place)
            .where(Place.tripId == trip_id)
            .where(Place.isSelected == True)
            .order_by(Place.selectionOrder.desc())
        )
        last_selected = session.exec(max_order_stmt).first()
        next_order = (last_selected.selectionOrder + 1) if last_selected and last_selected.selectionOrder is not None else 0

        # Update place
        place.isSelected = True
        place.selectionOrder = next_order
        session.commit()
        session.refresh(place)
        print(f"[Database] ✓ Place selected: {place.displayName} (order: {next_order})")

    return place


def deselect_place(session: Session, trip_id: int, place_id: str) -> Optional[Place]:
    """
    Unmark a place from the route selection.

    Args:
        session: Database session
        trip_id: Trip ID
        place_id: Google Maps Place ID

    Returns:
        Updated Place object, or None if not found
    """
    from sqlmodel import select

    # Find the place
    statement = select(Place).where(Place.tripId == trip_id).where(Place.placeId == place_id)
    place = session.exec(statement).first()

    if place:
        old_order = place.selectionOrder
        place.isSelected = False
        place.selectionOrder = None

        # Reorder remaining selected places to fill the gap
        if old_order is not None:
            reorder_stmt = (
                select(Place)
                .where(Place.tripId == trip_id)
                .where(Place.isSelected == True)
                .where(Place.selectionOrder > old_order)
            )
            for p in session.exec(reorder_stmt).all():
                p.selectionOrder = p.selectionOrder - 1

        session.commit()
        session.refresh(place)
        print(f"[Database] ✓ Place deselected: {place.displayName}")

    return place


def update_place_order(session: Session, trip_id: int, place_ids: List[str]) -> List[Place]:
    """
    Update the selection order of places based on a new order.

    Args:
        session: Database session
        trip_id: Trip ID
        place_ids: List of Place IDs in the new order

    Returns:
        List of updated Place objects
    """
    from sqlmodel import select

    updated_places = []
    for index, place_id in enumerate(place_ids):
        statement = select(Place).where(Place.tripId == trip_id).where(Place.placeId == place_id)
        place = session.exec(statement).first()
        if place:
            place.isSelected = True
            place.selectionOrder = index
            updated_places.append(place)

    session.commit()
    print(f"[Database] ✓ Updated order for {len(updated_places)} places")
    return updated_places


def save_route(session: Session, trip_id: int, route_data: Dict[str, Any]) -> Route:
    """
    Save a computed route to the database.

    Args:
        session: Database session
        trip_id: Trip ID
        route_data: Route data from route computation API

    Returns:
        Created Route object
    """
    route = Route(
        tripId=trip_id,
        mode=route_data.get("mode", "DRIVE"),
        optimized=route_data.get("optimized", True),
        departureTime=route_data.get("departureTime"),
        totalDuration=route_data.get("totalDuration"),
        totalDistance=route_data.get("totalDistance"),
        placeOrder=route_data.get("placeOrder", []),
        legs=route_data.get("legs", [])
    )
    session.add(route)
    session.commit()
    session.refresh(route)
    print(f"[Database] ✓ Route saved: {route.mode}, {len(route.legs)} legs")
    return route


def get_latest_route(session: Session, trip_id: int, mode: Optional[str] = None) -> Optional[Route]:
    """
    Get the most recent route for a trip, optionally filtered by mode.

    Args:
        session: Database session
        trip_id: Trip ID
        mode: Optional transport mode filter (DRIVE, WALK, BICYCLE, TRANSIT)

    Returns:
        Most recent Route object, or None if not found
    """
    from sqlmodel import select

    statement = select(Route).where(Route.tripId == trip_id)
    if mode:
        statement = statement.where(Route.mode == mode)
    statement = statement.order_by(Route.createdAt.desc())

    return session.exec(statement).first()


def get_all_routes(session: Session, trip_id: int) -> List[Route]:
    """
    Get all routes for a trip.

    Args:
        session: Database session
        trip_id: Trip ID

    Returns:
        List of Route objects ordered by creation time (newest first)
    """
    from sqlmodel import select

    statement = (
        select(Route)
        .where(Route.tripId == trip_id)
        .order_by(Route.createdAt.desc())
    )
    return session.exec(statement).all()


def get_chat_messages(session: Session, trip_id: int) -> List[ChatMessage]:
    """
    Get all chat messages for a trip.

    Args:
        session: Database session
        trip_id: Trip ID

    Returns:
        List of ChatMessage objects ordered by creation time
    """
    from sqlmodel import select

    statement = (
        select(ChatMessage)
        .where(ChatMessage.tripId == trip_id)
        .order_by(ChatMessage.createdAt)
    )
    return session.exec(statement).all()


def place_to_dict(place: Place) -> Dict[str, Any]:
    """
    Convert a Place database object to a dict format used by the frontend/session.

    Args:
        place: Place database object

    Returns:
        Dictionary with place data in format expected by frontend
    """
    return {
        "placeId": place.placeId,
        "displayName": place.displayName,
        "originalDisplayName": place.originalDisplayName,
        "formattedAddress": place.formattedAddress or place.originalFormattedAddress,
        "originalFormattedAddress": place.originalFormattedAddress,
        "rating": place.rating,
        "userRatingCount": place.userRatingCount,
        "location": place.location,
        "businessStatus": place.businessStatus,
        "primaryType": place.primaryType,
        "primaryTypeDisplayName": place.primaryTypeDisplayName,
        "iconId": place.iconId,
        "priceLevel": place.priceLevel,
        "currentOpeningHours": place.currentOpeningHours,
        "googleMapsUri": place.googleMapsUri,
        "websiteUri": place.websiteUri,
        "nationalPhoneNumber": place.nationalPhoneNumber,
        "internationalPhoneNumber": place.internationalPhoneNumber,
        "photos": place.photos,
        "types": place.types
    }


# ============================================================================
# MAIN (for testing)
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("TravelAgent Database Module")
    print("=" * 60)

    print(f"\nDatabase URL: {DATABASE_URL}")

    # Initialize tables
    print("\nInitializing database tables...")
    init_db()

    # Test connection
    print("\nTesting database connection...")
    with get_session() as session:
        # Create a test trip
        test_trip = Trip(
            sessionId="test-session-123",
            cities=["Vancouver", "Seattle"],
            scheduleStartDate="2024-12-20",
            scheduleEndDate="2024-12-22"
        )
        session.add(test_trip)
        session.commit()
        session.refresh(test_trip)
        print(f"✓ Created test trip: ID={test_trip.id}, Session={test_trip.sessionId}")

        # Query it back
        from sqlmodel import select
        statement = select(Trip).where(Trip.sessionId == "test-session-123")
        found_trip = session.exec(statement).first()
        print(f"✓ Retrieved trip: {found_trip.cities}, {found_trip.scheduleStartDate} to {found_trip.scheduleEndDate}")

        # Clean up test data
        session.delete(found_trip)
        session.commit()
        print("✓ Cleaned up test data")

    print("\n" + "=" * 60)
    print("Database module ready!")
    print("=" * 60)
