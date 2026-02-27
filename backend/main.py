# backend/main.py
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import google.generativeai as genai
import os

# Configure Gemini API key
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

app = FastAPI(title="Travel Assistant API", version="1.0.0")

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Travel Assistant API running 🚀"}

@app.get("/plan")
async def plan_trip(
    origin: str = Query(..., description="Starting city"),
    destinations: str = Query(..., description="Comma-separated destinations")
):
    dest_list = [d.strip() for d in destinations.split(",")]

    # Gemini AI call
    model = genai.GenerativeModel("gemini-1.5-flash")
    prompt = f"""
    You are a travel planner. Create a 3-day itinerary starting from {origin}, visiting {', '.join(dest_list)}.
    Provide a friendly, structured plan including must-see attractions and local tips.
    """
    response = model.generate_content(prompt)

    # Static route simulation (for now)
    route_data = [
        {"origin": origin, "destination": dest_list[0], "distance": "450 km", "duration": "5h"},
        {"origin": dest_list[0], "destination": dest_list[1], "distance": "400 km", "duration": "4.5h"},
    ]

    return {
        "ai_plan": response.text,
        "route": route_data
    }
