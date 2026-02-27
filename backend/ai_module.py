import google.generativeai as genai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini API
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

def generate_itinerary(origin: str, destinations: list[str]):
    """Use Gemini to generate a natural language itinerary for the given places."""
    prompt = f"""
    You are a travel planner AI. Create a short, friendly 1-day travel plan.
    Starting from {origin}, visit the following places: {', '.join(destinations)}.
    Include the visit order, short recommendations for each stop, and estimated time of day.
    """

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content(prompt)

    return response.text.strip()
