from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from google_map import get_distance_and_time
from ai_module import generate_itinerary

app = FastAPI(title="Travel Assistant API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Travel Assistant API running 🚀"}

@app.get("/plan")
def plan_trip(
    origin: str = Query(..., description="Starting location"),
    destinations: str = Query(..., description="Comma-separated list of destinations")
):
    """Generate trip plan using Google Maps and AI."""
    destination_list = [d.strip() for d in destinations.split(",")]

    map_data = get_distance_and_time(origin, destination_list)
    itinerary = generate_itinerary(origin, destination_list)

    return {
        "origin": origin,
        "destinations": destination_list,
        "map_data": map_data,
        "ai_itinerary": itinerary
    }
