from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def generate_itinerary(origin: str, destinations: list[str]):
    """Use AI to generate an itinerary for the given places."""
    prompt = f"""
    Create a short 1-day travel plan starting from {origin} and visiting:
    {', '.join(destinations)}.
    Include travel sequence and brief recommendations for each stop.
    """
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content.strip()
