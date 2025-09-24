from openai import OpenAI
from pydantic import BaseModel
from dotenv import load_dotenv
import os

load_dotenv(dotenv_path="api.env")
api_key = os.getenv("OPENAI_API_KEY")


client = OpenAI(
  api_key=api_key
)

CHAT_SYSTEM = """
You are TripRoute Chat, a friendly routing assistant.

GOAL
- Help the user provide: (1) cities, (2) dates and duration, (3) trip theme, (4) transport preference, (5) any details (budget/pace).
- Your role is to limit to provide the best personalized recommendations, add/remove a place, and revise the recommendations.
- All your conversations will be passed to TripRoute Extractor to generate a recommendation list for an optimal route in JSON, but that's not your role.

HARD RULES:
- Produce a concise recommendation list with a exact name, address, brief reason why you recommend of the place when recommending places.
- Do not provide places' hyperlinks or URLs before the user wants
- Recommend must-go places or top-rated places with many reviews in the Google Maps Reviews.
- All the recommendations need very sound and solid reasons.

STYLE
- If you don't think you can personalize the recommendations well, ask the user more questions.
- Be concise when recommending places (name, address, reason why you recommend).
- Offer tiny examples (“Seoul → Busan”, “3 days”, “waling/transit/driving”, “ice cream & cafés”).
- When the user asks to add/remove/pin, acknowledge and proceed.
- If dates are missing, assume a typical 2-3 day plan on weekend; if times are missing, assume 9:00-21:00.
- Take the open and closed hours into accounts when recommending places.

IMPORTANT
- This channel is user-facing text only. Do not output JSON here.
"""

STRUCTURE_SYSTEM = """
You are TripRoute Summarizer.

Your role is to analyze the full conversation between TripRoute Chat and the user and then produce a structured summary of the *final state* of the trip recommendations.

Rules:
- Output must be STRICT structured output that conforms to TripRouteRecommendations.
- Focus on the most recent recommendations given by TripRoute Chat. If the user removed, changed, or added places later, only reflect the final version if earlier recommendations were overridden or updated, exclude them.
- Include metadata about the trip (cities, dates, duration, theme, transport, details) using the most up-to-date information.
- For each recommended place, include:
  - exact name
  - address
  - city
  - brief reason for recommendation (as phrased in the conversation, e.g., “top-rated ice cream shop with many reviews”).
- Do not invent new places unless TripRoute Chat explicitly recommended them.
- If the conversation is incomplete (e.g., no recommendations yet), return an empty `recommendations` list.
"""

class TripMeta(BaseModel):
  cities: list[str]
  dates: str  # e.g., "2025-10-12 to 2025-10-14"
  duration_days: str  # e.g., "3 days"
  theme: str  # e.g., "food, dessert, culture"
  transport: str

class RecommendationItem(BaseModel):
  name: str
  address: str
  city: str
  reason: str  # Why this place is recommended

class TripRouteRecommendations(BaseModel):
  trip_meta: TripMeta
  recommendations: list[RecommendationItem]

messages_chat = [{"role": "system", "content": CHAT_SYSTEM}]
messages_json = [{"role": "system", "content": STRUCTURE_SYSTEM}]

def chat_reply_streaming(user_text: str) -> str:
  messages_chat.append({"role": "user", "content": user_text})
  
  with client.responses.create(
      model="gpt-5-nano",
      tools=[{"type": "web_search"}],
      input=messages_chat,
      stream=True,
    ) as stream:
    response_chat = ""
    
    for event in stream:
      if event.type == "response.output_text.delta":
        print(event.delta, end="", flush=True)
        response_chat += event.delta
    print("\n")

  messages_chat.append({"role": "assistant", "content": response_chat})

  return response_chat

def structure_reply(user_text: str, response_chat: str) -> str:
  messages_json.append(
    {
      "role": "user", "content": user_text,
      "role": "assistant", "content": response_chat
    }
  )
  
  response = client.responses.parse(
      model="gpt-5-nano",
      input=messages_json,
      text_format=TripRouteRecommendations,
  )

  response_json = response.output_text

  return response_json
    
if __name__ == "__main__":
  
  user_text = input("""
TA : Hi, I am your travel agent, 
     I can assist you to plan your trip.
     1. What cities will you visit?
     2. What dates and duration?
     3. What is your trip theme? (e.g., food, dessert, culture, nature, shopping, etc.)
     4. What is your transport preference? (e.g., walking, transit, driving)
     5. Any other details? (e.g., budget, pace, etc.)
You: """).strip()
  while user_text:
    response_chat = chat_reply_streaming(user_text)
    response_structure = structure_reply(user_text, response_chat)
    user_text = input("\nYou: ").strip()

# Vancouver, Friday morning to Sunday night, The best ice cream scoop shops, I have a car.