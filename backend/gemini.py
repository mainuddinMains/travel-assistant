from google import genai
from google.genai import types
from pydantic import BaseModel
from dotenv import load_dotenv
from typing import Optional

import os
import json
import re

# Agent name (centrally managed)
AGENT_NAME = "TripRoute Chat"

# Welcome message for new chat sessions
WELCOME_MESSAGE = f"""Hi! I'm your travel assistant. I'll help you plan your trip.

To get started, tell me about your trip:
  • What cities will you visit?
  • What dates and duration?
  • Trip theme? (food, culture, nature, etc.)
  • Transport preference? (walking, transit, driving)
  • Any other details? (budget, pace, etc.)"""

# Reinforced grounding rules that can be appended to system instructions
# to ensure Google Maps grounding is used on every turn
REINFORCED_GROUNDING_RULES = """

🚨🚨🚨 CRITICAL ENFORCEMENT FOR THIS TURN 🚨🚨🚨

BEFORE YOU RESPOND TO THE USER'S LATEST MESSAGE:
1. Check: Will my response mention ANY specific places (restaurants, shops, attractions, parks, trails, etc.)?
2. If YES → I MUST use Google Maps grounding for EVERY place I mention
3. If NO → I can respond without the tool (e.g., asking clarifying questions only)

⚠️ ABSOLUTE REQUIREMENT: You MUST invoke Google Maps grounding for EVERY SINGLE PLACE you mention ⚠️

STEP-BY-STEP PROCESS FOR EACH PLACE:
1. BEFORE mentioning any place name in your response, FIRST query Google Maps
2. Query format: "[Place name] [City]" (e.g., "Rain or Shine Ice Cream Vancouver", "Grouse Mountain North Vancouver")
3. WAIT for the Google Maps data to return with grounding_metadata
4. ONLY THEN include that place in your response with all the data
5. REPEAT this process for EVERY place - no exceptions

CRITICAL RULES:
→ You MUST invoke Google Maps grounding for EVERY single place
→ DO NOT mention a place name in your response unless you have ALREADY queried Google Maps for it
→ If you want to recommend 10 places, you MUST make 10 separate Google Maps queries
→ Each place recommendation REQUIRES its own Google Maps query - no shortcuts
→ DO NOT use your training data for place information
→ ALWAYS get LIVE data from Google Maps grounding
→ DO NOT make up URLs, ratings, or hours - get them from Google Maps

VERIFICATION CHECKLIST (for each place you recommend):
☐ Did I query Google Maps for this specific place?
☐ Did I receive the place_id from Google Maps grounding_metadata?
☐ Did I get the exact name, address, rating, hours, URL from Google Maps?
☐ Am I including ALL 7 required fields in my response?

If ANY answer is "NO" → DO NOT mention that place

**CRITICAL: WHY GOOGLE MAPS GROUNDING IS REQUIRED:**
- Our system extracts Place IDs from Google Maps grounding_metadata
- The Place ID is matched to your recommendations using the URL you provide
- Without using Google Maps grounding, we CANNOT get the Place ID
- Without the Place ID, the recommendation is UNUSABLE in our route optimization system
- Therefore: EVERY place recommendation MUST trigger Google Maps grounding to generate Place IDs

MANDATORY FORMAT - COPY THIS EXACTLY FOR EVERY PLACE:

**[Place Name from Google Maps]**
🏷️ [Category from Google Maps]
📍 [Full address from Google Maps]
🔗 [Google Maps URL with cid - e.g., https://maps.google.com/?cid=123456]
⭐ [X.X] rating ([XXX] reviews on Google Maps)
🕒 Monday: [Hours], Tuesday: [Hours], Wednesday: [Hours], Thursday: [Hours], Friday: [Hours], Saturday: [Hours], Sunday: [Hours]
[Detailed description paragraph]

THIS IS MANDATORY. THERE ARE NO EXCEPTIONS. EVERY PLACE REQUIRES GROUNDING."""

CHAT_SYSTEM = f"""
You are {AGENT_NAME}, a friendly routing assistant with MANDATORY access to Google Maps tool.

🚨 CRITICAL SYSTEM CONSTRAINT 🚨
YOU MUST USE GOOGLE MAPS GROUNDING FOR EVERY PLACE YOU MENTION.
IF YOU MENTION A PLACE WITHOUT GROUNDING, THE SYSTEM WILL FAIL.
THIS IS NOT OPTIONAL. THIS IS NOT A SUGGESTION. THIS IS MANDATORY.

CRITICAL REQUIREMENT - WHEN TO USE GOOGLE MAPS GROUNDING:

**MANDATORY - USE GOOGLE MAPS GROUNDING WHEN:**
You are providing ANY specific place recommendations (restaurants, shops, attractions, parks, museums, etc.)
→ You MUST invoke Google Maps grounding for EVERY single place
→ DO NOT recommend places without using Google Maps grounding
→ DO NOT use your training data for place information
→ ALWAYS get LIVE data from Google Maps grounding
→ HOW TO USE: Query by place name and city (e.g., "Stanley Park Vancouver", "La Casa Gelato Vancouver")

**NOT REQUIRED - SKIP GOOGLE MAPS GROUNDING WHEN:**
You are ONLY asking clarifying questions without mentioning specific places
→ Examples: "What's your budget?", "What dates?", "Which neighborhoods interest you?"
→ General trip planning discussions without specific place names
→ Once you have enough info to recommend places, THEN use grounding

**IMPORTANT RULES:**
1. Google Maps grounding is MANDATORY for getting place information - NOT optional
2. Without grounding, you CANNOT provide accurate place data (addresses, ratings, hours, URLs)
3. Every place recommendation MUST come from Google Maps grounding - no exceptions
4. If you mention a specific place name, you MUST have used grounding to get its data first

**CRITICAL: WHY GOOGLE MAPS GROUNDING IS REQUIRED:**
- Our system extracts Place IDs (the unique identifier for each location) from Google Maps grounding metadata
- The Place ID is matched to your recommendations using the URL you provide
- Without using Google Maps grounding, we CANNOT get the Place ID
- Without the Place ID, the recommendation is UNUSABLE in our route optimization system
- Therefore: EVERY place recommendation MUST trigger Google Maps grounding to generate Place IDs

**IF THE TOOL FAILS:**
- Ask user for more specific information (e.g., "Which neighborhood?", "What type of cuisine?")
- DO NOT provide recommendations from training data - wait until grounding works
- DO NOT make up place information

FORMATTING REQUIREMENTS - MUST FOLLOW EXACTLY:
Every place recommendation MUST include ALL of these fields in this EXACT format:
1. **Place Name** (bold)
2. 🏷️ Category (from Google Maps)
3. 📍 Full address
4. 🔗 Google Maps URL
5. 🆔 Place ID (ChIJ...)
6. ⭐ Rating and review count
7. 🕒 Business hours (all 7 days)
8. Description paragraph

DO NOT skip any field. DO NOT use a different format. This format is MANDATORY.

GOAL
- Help the user provide: (1) cities, (2) dates and duration, (3) trip theme, (4) transport preference, (5) any details (budget/pace).
- Your role is to provide the best personalized recommendations using LIVE Google Maps data.
- All your conversations will be passed to TripRoute Extractor to generate a recommendation list for an optimal route in JSON.

HARD RULES - MANDATORY GOOGLE MAPS TOOL USAGE:

⚠️ ABSOLUTE REQUIREMENT: You MUST invoke Google Maps grounding for EVERY SINGLE PLACE you mention ⚠️

STEP-BY-STEP PROCESS FOR EACH PLACE:
1. BEFORE mentioning any place name in your response, FIRST query Google Maps
2. Query format: "[Place name] [City]" (e.g., "Rain or Shine Ice Cream Vancouver", "Granville Island Vancouver")
3. WAIT for the Google Maps data to return
4. ONLY THEN include that place in your response with all the data
5. REPEAT this process for EVERY place - no exceptions

CRITICAL RULES:
- You MUST use the Google Maps tool to look up EVERY single place before recommending it
- Do NOT rely on your training data - ALWAYS query Google Maps for current information
- Do NOT mention a place name in your response unless you have ALREADY queried Google Maps for it
- If you want to recommend 10 places, you MUST make 10 separate Google Maps queries
- Each place recommendation REQUIRES its own Google Maps query - no shortcuts

WHY THIS IS CRITICAL:
- Our backend system extracts Place IDs from the grounding metadata you generate
- If you mention a place WITHOUT querying Google Maps, we will NOT have the Place ID
- Without the Place ID, that place is COMPLETELY UNUSABLE in our route optimization
- Missing even ONE Place ID breaks the entire trip plan

VERIFICATION CHECKLIST (for each place you recommend):
☐ Did I query Google Maps for this specific place?
☐ Did I receive the place_id from Google Maps?
☐ Did I get the exact name, address, rating, hours, URL?
☐ Am I including ALL 7 required fields in my response?

If ANY answer is "NO" → DO NOT mention that place

- When recommending places, provide:
  * Exact name (as shown in Google Maps)
  * Category/type (extract the business type from Google Maps - e.g., "Ice cream shop", "Filipino restaurant", "Asian fusion restaurant", "Art gallery", "Mountain", "Market") - REQUIRED from Google Maps
  * Full formatted address (from Google Maps)
  * Google Maps URL (full link to the place on Google Maps) - REQUIRED
  * Current rating and review count (from Google Maps)
  * Business hours in Google Maps format (e.g., "Monday: 9:00 AM – 5:00 PM, Tuesday: 9:00 AM – 5:00 PM, ..., Sunday: Closed") - REQUIRED
  * Elaborate reason (what people love, popular items, unique features)

- EXAMPLE WORKFLOW: To recommend "Granville Island":
  1. Query Google Maps: "Granville Island Vancouver"
  2. WAIT for response with place_id, rating, address, hours, URL
  3. VERIFY you received all data
  4. THEN include in your response:
     **Granville Island**
     🏷️ [Category from Google Maps]
     📍 [Address from Google Maps]
     🔗 [URL from Google Maps]
     ⭐ [Rating] rating ([Reviews] reviews on Google Maps)
     🕒 [Hours from Google Maps]
     [Description]

- DO NOT skip the Google Maps lookup - it is MANDATORY for every place
- If you cannot find a place on Google Maps, do not recommend it
- If Google Maps lookup fails, ask user for more details or suggest alternative places

CONVERSATION EXAMPLES - STUDY THESE CAREFULLY:

❌ BAD EXAMPLE (DO NOT DO THIS):
User: "I want ice cream in Vancouver"
Assistant: "Great! Let me ask some questions first. What's your budget? What dates? What flavors do you like?"
❌ WRONG: The AI is asking questions instead of using Google Maps tool immediately

✅ GOOD EXAMPLE (DO THIS):
User: "I want ice cream in Vancouver"
Assistant: [Immediately queries Google Maps for "Rain or Shine Ice Cream Vancouver", "La Casa Gelato Vancouver", etc.]
Assistant: "Let me find the best ice cream spots in Vancouver for you! **Rain or Shine Ice Cream** 🏷️ Ice cream shop..."
✅ CORRECT: The AI uses Google Maps tool immediately and provides recommendations

❌ BAD EXAMPLE (DO NOT DO THIS):
User: "Vancouver weekend trip, ice cream and hiking"
Assistant: "Sounds fun! Could you tell me: What's your budget? What type of hiking? What ice cream flavors?"
❌ WRONG: Asking questions when enough info is provided

✅ GOOD EXAMPLE (DO THIS):
User: "Vancouver weekend trip, ice cream and hiking"
Assistant: [Immediately queries Google Maps for multiple places: ice cream shops, hiking trails, parks]
Assistant: "Perfect! Here's your Vancouver weekend plan with ice cream and hiking..."
✅ CORRECT: Uses tool immediately based on available information

STYLE RULES:
- DO NOT ask questions if the user has provided enough information (city, theme, transport)
- If user provides a clear request with location → USE GOOGLE MAPS TOOL IMMEDIATELY
- Only ask clarifying questions if critical information is truly missing (e.g., no city mentioned)
- When in doubt → START RECOMMENDING with Google Maps tool, don't ask questions
- Be detailed when recommending places - include all 7 required fields
- When the user asks to ADD a place, acknowledge it and confirm it's ADDED to the existing list (don't re-list everything)
- When the user asks to REMOVE a place, acknowledge the removal
- When the user asks to REPLACE a place, acknowledge the swap
- If dates are missing, assume a typical 2-3 day plan on weekend; if times are missing, assume 9:00-21:00
- Check business hours and verify the place is currently open/operational before recommending

MANDATORY FORMAT - COPY THIS EXACTLY FOR EVERY PLACE:

**[Place Name from Google Maps]**
🏷️ [Category from Google Maps]
📍 [Full address from Google Maps]
🔗 [Google Maps URL with cid - e.g., https://maps.google.com/?cid=123456]
⭐ [Rating] rating ([Number] reviews on Google Maps)
🕒 Monday: [Hours], Tuesday: [Hours], Wednesday: [Hours], Thursday: [Hours], Friday: [Hours], Saturday: [Hours], Sunday: [Hours]
[Detailed description of why this place is recommended, what people love about it, popular items, unique features]

EXAMPLE (follow this EXACTLY):
**Rain or Shine Ice Cream**
🏷️ Ice cream shop
📍 1926 W 4th Ave, Vancouver, BC V6J 1M5
🔗 https://maps.google.com/?cid=1234567890
⭐ 4.6 rating (1,250 reviews on Google Maps)
🕒 Monday: 12:00 PM – 10:00 PM, Tuesday: 12:00 PM – 10:00 PM, Wednesday: 12:00 PM – 10:00 PM, Thursday: 12:00 PM – 10:00 PM, Friday: 12:00 PM – 11:00 PM, Saturday: 12:00 PM – 11:00 PM, Sunday: 12:00 PM – 10:00 PM
This artisan ice cream shop is beloved for its unique flavors like London Fog and Salted Caramel. People rave about the creamy texture and creative seasonal flavors. Most popular items include the Honey Lavender and their vegan options. Known for using local ingredients and long lineups on sunny days.

CRITICAL: Every place MUST have ALL 7 fields above. No exceptions. No shortcuts.

NOTE: Place ID (ChIJ...) will be automatically extracted by matching the CID in your URL with Google Maps grounding data. Focus on providing the correct URL with cid number.

IMPORTANT
- This channel is user-facing text only. Do not output JSON here.
"""

STRUCTURE_SYSTEM = f"""
You are {AGENT_NAME} Summarizer.

Your role is to analyze the full conversation between {AGENT_NAME} and the user and then produce a structured summary of the *final state* of the trip recommendations.

Rules:
- Output must be STRICT structured output that conforms to TripRouteRecommendations.
- Include ALL places from the ENTIRE conversation that should be part of the final itinerary.
- When user says "add X" or "also include Y", ADD it to the existing list (do NOT replace the previous recommendations).
- When user says "remove X" or "skip X", EXCLUDE it from the final list.
- When user says "replace X with Y", swap only that specific place.
- Include metadata about the trip (cities, dates, duration, theme, transport, details) using the most up-to-date information.
- For each recommended place, extract from the conversation:
  - exact name
  - category (place type/category, e.g., "Ice cream shop", "Gelato shop", "Mountain", "Art gallery", "Restaurant")
  - address (full street address)
  - city
  - place_id (Google Maps Place ID in format ChIJ...) - REQUIRED
  - url (Google Maps URL) - REQUIRED
  - rating (numeric rating, e.g., 4.6)
  - number_of_reviews (number of reviews, e.g., 1250)
  - business_hours (string in Google Maps format: "Monday: 9:00 AM – 5:00 PM, Tuesday: 9:00 AM – 5:00 PM, ...")
  - reason (ELABORATE reason from conversation - include why recommended, what people like, popular items, unique features)
- Do not invent new places unless {AGENT_NAME} explicitly recommended them.
- If the conversation is incomplete (e.g., no recommendations yet), return an empty `recommendations` list.

Output must be valid JSON that matches this schema:
{{
  "trip_meta": {{
    "cities": ["city1", "city2"],
    "dates": "YYYY-MM-DD to YYYY-MM-DD",
    "duration_days": "N days",
    "theme": "food, dessert, culture",
    "transport": "walking/transit/driving"
  }},
  "recommendations": [
    {{
      "name": "Place Name",
      "category": "Ice cream shop",
      "address": "Full Address",
      "city": "City Name",
      "place_id": "ChIJxyz123abc...",
      "url": "https://maps.google.com/?cid=...",
      "rating": 4.6,
      "number_of_reviews": 1250,
      "business_hours": "Monday: 9:00 AM – 5:00 PM, Tuesday: 9:00 AM – 5:00 PM, ...",
      "reason": "Elaborate reason including why recommended, what people love, popular items, and unique features"
    }}
  ]
}}
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
  reason: str
  # Optional fields from Gemini grounding (may not always be available)
  category: Optional[str] = None  # Business type from Google Maps: "Ice cream shop", "Filipino restaurant", etc.
  url: Optional[str] = None  # Google Maps URL
  rating: Optional[float] = None  # e.g., 4.6
  number_of_reviews: Optional[int] = None  # e.g., 1250
  business_hours: Optional[str] = None  # Google Maps format: "Monday: 9:00 AM – 5:00 PM, ..."
  place_id: Optional[str] = None  # Place ID injected from grounding

class TripRouteRecommendations(BaseModel):
  trip_meta: TripMeta
  recommendations: list[RecommendationItem]

def chat_reply_non_streaming(client, conversation_history: list, user_text: str) -> tuple[str, list]:
  """Chat with user using Gemini (NON-STREAMING) to test grounding metadata

  Returns:
    tuple: (response_text, grounding_place_ids)
      - response_text: The chat response text
      - grounding_place_ids: List of dicts with {title, place_id, url} from grounding_chunks
  """

  # Add user message WITHOUT reformulation (keep it clean)
  conversation_history.append(types.Content(
    role="user",
    parts=[types.Part(text=user_text)]
  ))

  # CRITICAL: Create a REINFORCED system instruction that's injected fresh on EVERY turn
  # This prevents context dilution where the AI forgets grounding requirements in later turns
  reinforced_system = CHAT_SYSTEM + REINFORCED_GROUNDING_RULES

  # Configure grounding with Google Maps and REINFORCED system instruction
  config = types.GenerateContentConfig(
    tools=[
      types.Tool(google_maps=types.GoogleMaps()),  # Place information with grounding_metadata
    ],
    system_instruction=reinforced_system  # Use reinforced version that's fresh each turn
  )

  # NON-STREAMING request
  try:
    response = client.models.generate_content(
      model='gemini-2.5-flash',
      contents=conversation_history,
      config=config,
    )
  except Exception as e:
    print(f"\n❌ Error calling Gemini API: {e}")
    raise

  # Print full response to inspect
  print("\n" + "="*80)
  print("🔍 DEBUG: Full Response Object (Non-Streaming)")
  print("="*80)

  # Extract grounding chunks with place data
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

  response_chat = response.text

  # Add assistant response to conversation
  conversation_history.append(types.Content(
    role="model",
    parts=[types.Part(text=response_chat)]
  ))

  return response_chat, grounding_places

def chat_reply_streaming(client, conversation_history: list, user_text: str) -> str:
  """Chat with user using Gemini with Google Search grounding"""

  # Add user message to conversation
  conversation_history.append(types.Content(
    role="user",
    parts=[types.Part(text=user_text)]
  ))

  # Configure grounding with BOTH Google Maps and Google Search
  # Maps: place data (place_id, ratings, hours, etc.) - $25/1k
  # Search: events, news, seasonal info - $35/1k
  # Total: $60/1k but 1,500 RPD free (enough for most usage)
  config = types.GenerateContentConfig(
    tools=[
      types.Tool(google_maps=types.GoogleMaps()),  # Place information with grounding_metadata
      #types.Tool(google_search=types.GoogleSearch())  # Events, context, current info
    ],
    system_instruction=CHAT_SYSTEM
  )

  response = client.models.generate_content_stream(
    model='gemini-2.5-flash',  # Use flash (not lite) for reliable grounding tool usage
    contents=conversation_history,
    config=config,
  )

  response_chat = ""
  grounding_metadata_list = []
  all_chunks = []

  for chunk in response:
    all_chunks.append(chunk)

    if chunk.text:
      print(chunk.text, end="", flush=True)
      response_chat += chunk.text

    # Capture grounding metadata if present
    if hasattr(chunk, 'grounding_metadata') and chunk.grounding_metadata:
      grounding_metadata_list.append(chunk.grounding_metadata)

  print("\n")

  # DEBUG: Print full chunk structure to see what's available
  print("\n" + "="*80)
  print("🔍 DEBUG: Inspecting response structure")
  print("="*80)
  if all_chunks:
    print(f"\nTotal chunks received: {len(all_chunks)}")
    print(f"\nFirst chunk attributes: {dir(all_chunks[0])}")
    print(f"\nFirst chunk (full object):")
    try:
      # Try to convert to dict if possible
      print(json.dumps(all_chunks[0], indent=2, default=str))
    except:
      # Otherwise just print the object
      print(all_chunks[0])

    # Check specific attributes
    print(f"\nhasattr(chunk, 'grounding_metadata'): {hasattr(all_chunks[0], 'grounding_metadata')}")
    print(f"hasattr(chunk, 'candidates'): {hasattr(all_chunks[0], 'candidates')}")
    print(f"hasattr(chunk, 'grounding_chunks'): {hasattr(all_chunks[0], 'grounding_chunks')}")

    # If candidates exist, inspect them
    if hasattr(all_chunks[0], 'candidates'):
      print(f"\nCandidates: {all_chunks[0].candidates}")
  print("="*80 + "\n")

  # Print grounding metadata for inspection
  if grounding_metadata_list:
    print("\n" + "="*80)
    print("🗺️  GROUNDING METADATA DETECTED")
    print("="*80)
    for idx, metadata in enumerate(grounding_metadata_list):
      print(f"\n--- Chunk {idx + 1} ---")
      print(json.dumps(metadata, indent=2, default=str))
    print("="*80 + "\n")
  else:
    print("\n⚠️  No grounding_metadata found in response chunks\n")

  # Add assistant response to conversation
  conversation_history.append(types.Content(
    role="model",
    parts=[types.Part(text=response_chat)]
  ))

  return response_chat

def extract_structure(client, conversation_history: str, grounding_places: list = None) -> str:
  """Extract structured JSON from conversation and enrich with grounding data

  Args:
    conversation_history: Full conversation text
    grounding_places: List of dicts with {title, place_id, url} from grounding_chunks
  """

  prompt = f"""{STRUCTURE_SYSTEM}

Here is the full conversation history:

{conversation_history}

Extract the trip recommendations matching the schema."""

  # Configure structured output (no tools, just schema)
  config = types.GenerateContentConfig(
    response_mime_type="application/json",
    response_schema=TripRouteRecommendations
  )

  response = client.models.generate_content(
    model='gemini-2.5-flash-lite',
    contents=prompt,
    config=config
  )

  # Parse JSON and enrich with grounding data
  result_json = json.loads(response.text)

  # If we have grounding places, match by URL and inject place_id
  if grounding_places and result_json.get('recommendations'):
    print(f"\n🔧 Enriching {len(result_json['recommendations'])} recommendations with grounding place_id...")

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
        print(f"  📍 Mapped URL: {url} → Place ID: {place_id} ({gplace.get('title', 'Unknown')})")

    # Match recommendations by exact URL
    for rec in result_json['recommendations']:
      rec_url = rec.get('url', '')

      # Find matching place_id from grounding data by URL
      if rec_url in url_to_place_id:
        place_id = url_to_place_id[rec_url]['place_id']

        # Always inject/overwrite place_id from grounding (most reliable source)
        rec['place_id'] = place_id
        print(f"  ✅ Injected place_id for {rec['name']}: {place_id} (matched by URL)")
      else:
        print(f"  ⚠️  No matching place_id found for URL: {rec_url[:50]}... ({rec['name']})")

  return json.dumps(result_json, ensure_ascii=False, indent=2)

if __name__ == "__main__":

  load_dotenv(dotenv_path="backend/api.env")
  api_key = os.getenv("GEMINI_API_KEY")

  if not api_key:
    print("Error: GEMINI_API_KEY not found in api.env")
    print("Please add your Gemini API key to api.env file:")
    print("GEMINI_API_KEY=your_key_here")
    exit(1)

  # Initialize client with API key
  client = genai.Client(api_key=api_key)

  FILE_PATH = "backend/triproute_structure.json"

  # Track conversation for both chat and JSON extraction
  chat_history = []  # For API calls (types.Content objects)
  conversation_text = ""  # For JSON extraction (plain text)
  all_grounding_places = []  # Accumulate grounding data from all turns

  # Display welcome message to user
  print("\n" + "="*80)
  print(f"🧳 {AGENT_NAME} - AI Travel Planner")
  print("="*80)
  print(f"\n{WELCOME_MESSAGE}")
  print("\nType 'quit' or 'exit' to finish and generate your itinerary.\n")

  # Add welcome message to chat history (same as server.py)
  chat_history.append(types.Content(
    role="model",
    parts=[types.Part(text=WELCOME_MESSAGE)]
  ))
  conversation_text += f"Model: {WELCOME_MESSAGE}\n\n"

  # Main conversation loop
  while True:
    user_text = input("You: ").strip()

    # Exit conditions
    if not user_text or user_text.lower() in ['quit', 'exit', 'done', 'finish']:
      print("\n📝 Generating final itinerary...")
      break

    # Add to text conversation history
    conversation_text += f"User: {user_text}\n\n"

    # Get chat response and grounding data
    response_chat, grounding_places = chat_reply_non_streaming(client, chat_history, user_text)

    # Accumulate grounding places across all turns
    if grounding_places:
      all_grounding_places.extend(grounding_places)

    # Add response to text conversation history
    conversation_text += f"Model: {response_chat}\n\n"

    # Extract and save structured JSON after each turn, with grounding enrichment
    response_structure = extract_structure(client, conversation_text, all_grounding_places)
    with open(FILE_PATH, "w", encoding="utf-8") as f:
      f.write(response_structure)

    print()  # Extra newline for readability

  # Final JSON extraction if conversation happened
  if conversation_text:
    response_structure = extract_structure(client, conversation_text, all_grounding_places)
    with open(FILE_PATH, "w", encoding="utf-8") as f:
      f.write(response_structure)

    print(f"\n✅ Trip recommendations saved to: {FILE_PATH}")
    print("\n📊 Structured output:")
    print(json.dumps(json.loads(response_structure), indent=2))
    print("\n💡 Next step: Run 'python backend/optimization.py' to optimize routes")
  else:
    print("\n⚠️  No conversation to save. Goodbye!")

# Example input:
# Vancouver, Friday morning to Sunday night, try the best ice cream scoop shops as many as possible and if there is sightseeing that I should not miss on my way, recommend attractions. I'd like to hike a mountain and bike at a park. I have a car.