"""
Simple test for Gemini 3 Pro with Google Maps grounding and structured output
"""

from google import genai
from google.genai import types
from pydantic import BaseModel
from typing import List
from dotenv import load_dotenv
from pathlib import Path
import os
import json

# Load API keys
load_dotenv(dotenv_path=Path(__file__).parent / "api.env")
gemini_api_key = os.getenv("GEMINI_API_KEY")

if not gemini_api_key:
    print("Error: GEMINI_API_KEY not found in api.env")
    exit(1)

# Initialize client
client = genai.Client(api_key=gemini_api_key)

# Define structured output schema
class Place(BaseModel):
    name: str
    address: str
    rating: float
    numReviews: int

class Response(BaseModel):
    message: str
    places: List[Place]

# Configure with structured output and Google Maps grounding
config = types.GenerateContentConfig(
    tools=[types.Tool(google_search=types.GoogleMaps())]
)

# Test prompt
prompt = "This is place id. ChIJe_ROYXdxhlQRYYQ3bU2m_tE. Can you bring details with google maps grounding"

print("Testing Gemini 3 Pro with Google Maps grounding and structured output...")
print(f"\nPrompt: {prompt}\n")
print("=" * 60)

# Generate response
response = client.models.generate_content(
    model='gemini-2.5-flash',
    contents=prompt,
    config=config
)

# Parse and display
result = json.loads(response.text)
print("\nStructured Output:")
print(json.dumps(result, indent=2))

print("\n" + "=" * 60)
print("Test complete!")
