"""
chat.py - Non-Streaming Dual-Agent Architecture for Batch Testing

This module provides a clean batch testing environment using the dual-agent architecture
from gemini_new_architecture.py. No streaming - just structured output generation.

Architecture:
1. chatting_agent: Conversational agent that returns structured JSON output
   - Returns: chatting text + trip_context + places list (name + formatted_address)

2. grounding_agent: Google Maps grounding agent that enriches places
   - Input: Places list from chatting_agent
   - Uses google_maps grounding tool to get real-time data
   - Extracts place_id from grounding_chunks
   - Returns: Enriched places with full details (rating, hours, place_id, etc.)

Key Differences from gemini_new_architecture.py:
- This is the testing/CLI version
- Integrated into chat.py for easy command-line batch testing
- Outputs results to console and saves to JSON file
"""

from google import genai
from google.genai import types
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from pathlib import Path
import os
import json
import time
import asyncio
from concurrent.futures import ThreadPoolExecutor
from gmaps_requests import enrich_place_with_details

# ============================================================================
# CONFIGURATION
# ============================================================================

AGENT_NAME = "TripRoute Chat"

WELCOME_MESSAGE = f"""Hi! I'm your travel assistant. I'll help you plan your trip.

To get started, tell me about your trip:
  • What cities will you visit?
  • What dates and duration?
  • Trip theme? (food, culture, nature, etc.)
  • Transport preference? (walking, transit, driving)
  • Any other details? (budget, pace, etc.)"""

# ============================================================================
# ASYNC ENRICHMENT HELPER
# ============================================================================


async def enrich_place_async(
    executor: ThreadPoolExecutor, api_key: str, place: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Async wrapper for enrich_place_with_details.

    Runs the synchronous Google Maps API calls in a thread pool executor
    to avoid blocking the event loop.

    Args:
        executor: ThreadPoolExecutor for running sync functions
        api_key: Google Maps API key
        place: Place dict with displayName and formattedAddress

    Returns:
        Enriched place dict with Google Maps data
    """
    loop = asyncio.get_event_loop()
    enriched_place = await loop.run_in_executor(
        executor, enrich_place_with_details, api_key, place
    )
    return enriched_place


# ============================================================================
# TYPEWRITER EFFECT HELPER
# ============================================================================


def print_typewriter(text: str, delay: float = 0.05):
    """
    Print text with a typewriter effect (like ChatGPT).

    Prints word by word to preserve formatting and avoid spacing issues.

    Args:
        text: Text to print
        delay: Delay between words in seconds (default: 0.05 = ~20 words/sec)
    """
    words = text.split(" ")
    for i, word in enumerate(words):
        # Print word with space (except for last word)
        if i < len(words) - 1:
            print(word, end=" ", flush=True)
        else:
            print(word, flush=True)

        # Add delay between words
        time.sleep(delay)
    print()  # Final newline


# ============================================================================
# PYDANTIC MODELS (for structured output)
# ============================================================================


class TripContext(BaseModel):
    """Trip context extracted from chatting_agent interaction"""

    cities: Optional[List[str]] = (
        None  # List of city names (e.g., ["Vancouver", "Seattle"])
    )
    schedule_start_date: Optional[str] = (
        None  # Start date in ISO format YYYY-MM-DD (e.g., "2024-12-20")
    )
    schedule_end_date: Optional[str] = (
        None  # End date in ISO format YYYY-MM-DD (e.g., "2024-12-22")
    )


class Place(BaseModel):
    """Place structure for each recommended place from chatting_agent"""

    displayName: str
    formattedAddress: str


class ChattingAgentOutput(BaseModel):
    """Structured output from chatting_agent"""

    trip_context: TripContext
    chatting: str = Field(
        description="Conversational response formatted in Markdown. Use ## for main sections (e.g., '## Ice Cream Recommendations'), ### for subsections (e.g., '### Day 1'), **bold** for place names and emphasis, and - for bullet lists. Keep it clean and easily readable."
    )
    places: List[Place]  # List of places mentioned


# ============================================================================
# CHATTING AGENT (Non-Streaming with Structured Output)
# ============================================================================


def get_chatting_agent_system_prompt() -> str:
    """
    Generate system prompt with current date context.
    This allows the AI to properly interpret relative dates like "Friday" or "next week".
    """
    from datetime import datetime

    today = datetime.now()
    today_str = today.strftime("%Y-%m-%d")
    day_of_week = today.strftime("%A")

    return f"""
You are {AGENT_NAME}, a friendly travel assistant.

**CURRENT DATE CONTEXT:**
- Today is {day_of_week}, {today_str}
- Use this to interpret relative dates (e.g., "this Friday" = the upcoming Friday from today, "next weekend" = the following weekend)
- When parsing dates, always use {today_str} as the reference point for "today"

Your role:
- Have natural conversations with users about their trip
- Collect trip details: cities, dates, duration, theme, transport preferences
- Provide personalized travel recommendations
- Answer questions about places, activities, and logistics

IMPORTANT INSTRUCTIONS:

1. **Conversation Flow:**
   - Ask clarifying questions when needed (city, dates, preferences)
   - Build recommendations based on user's interests
   - Be conversational and helpful

2. **Markdown Formatting:**
   Your chatting text will be rendered using marked.js with standard Markdown parsing.
   Format your responses using clean, readable, well-organized Markdown:
   - Use ## for main section headers (e.g., "## Ice Cream Recommendations")
   - Use ### for subsections (e.g., "### Day 1: Friday")
   - Use **bold** for place names and important emphasis
   - Use - for bullet lists
   - Use numbered lists (1., 2., 3.) for itineraries or ordered steps
   ```

3. **Place Recommendations:**
   - When recommending places, provide the name and a brief description
   - Keep descriptions concise (1-2 sentences per place)
   - Focus on why each place matches their interests
   - Use **bold** to highlight place names in your chatting text (e.g., "**Rain or Shine Ice Cream**")
   - DO NOT include detailed data like ratings, reviews, or hours (this will be added automatically)

4. **Route Planning:**
   - Suggest a logical order for visiting places with their schedule
   - Consider proximity and transportation mode
   - Provide helpful tips for the itinerary

5. **What NOT to do:**
   - Don't call google_maps tool (this is handled separately)
   - Don't include ratings, reviews, hours, or addresses in chatting text (automated separately)
   - Don't worry about place validation (handled automatically)
   - Don't use # (single hash) for headers - use ## or ### instead for better visual hierarchy

**STRUCTURED OUTPUT REQUIREMENTS:**

For the structured JSON output, you MUST include:
1. **trip_context**: Extract and maintain cities and schedule dates from the ENTIRE conversation history

   **IMPORTANT: This is stateful - always reflect the CURRENT state of the trip based on ALL messages:**
   - Review the entire conversation history to understand the current trip plan
   - If the user changes cities or dates mid-conversation, update to reflect the NEW information
   - If the user adds more cities, include ALL cities in the list
   - If the user removes a city, exclude it from the list
   - If the user changes dates, use the LATEST dates mentioned

   Fields:
   - **cities**: List of city names the user currently plans to visit (e.g., ["Vancouver", "Seattle"])
     * Extract ALL cities from the conversation history
     * Use proper capitalized city names (e.g., "Vancouver", not "vancouver")
     * Maintain the order the user mentioned them
     * If user changes their city list (adds/removes), reflect the CURRENT list
     * If no cities mentioned in entire conversation, set to null

   - **schedule_start_date** and **schedule_end_date**: Trip dates as ISO strings YYYY-MM-DD (e.g., "2024-12-20", "2024-12-22")
     * Parse natural language dates from conversation (e.g., "Friday morning" → "2024-12-20", "Sunday night" → "2024-12-22")
     * If user says relative dates like "this Friday to Sunday", infer actual calendar dates based on today's date
     * If user changes dates later in conversation, use the LATEST dates mentioned
     * schedule_end_date must be same as or after schedule_start_date
     * Must be strings in ISO format (YYYY-MM-DD), not date objects
     * If no dates mentioned in entire conversation, set both to null

2. **chatting**: Your conversational response text formatted in Markdown
   - **MAXIMUM 10 PLACES** - Only mention and recommend at most 10 specific places in your response
   - Focus on quality over quantity - recommend the best, most relevant places for the user's request

3. **places**: Array of place objects - CRITICAL REQUIREMENT:
   - **MAXIMUM 10 PLACES** - Include at most 10 places in this array
   - **MUST MATCH chatting text** - Every place in this array must be mentioned in the chatting text, and every place mentioned in chatting must be in this array
   - If you bold a place name in chatting (e.g., "**Rain or Shine Ice Cream**"), it MUST appear in the places array
   - **Each place should appear only ONCE in the array** - avoid duplicates even if mentioned multiple times in chatting
   - **Both chatting and places must have the same number of places (max 10)**

   **What to INCLUDE (specific, visit-able places with proper names):**
   - Restaurants, cafes, shops, businesses (e.g., "Rain or Shine Ice Cream", "Blue Water Cafe")
   - Named parks and attractions (e.g., "Stanley Park", "Granville Island Public Market")
   - Museums, galleries, cultural sites (e.g., "Museum of Anthropology", "Vancouver Art Gallery")
   - Specific landmarks and viewpoints (e.g., "Prospect Point Lookout", "Lions Gate Bridge", "Gastown Steam Clock)
   - Named trails and outdoor sites (e.g., "Grouse Grind Trail", "Seawall", "Quarry Rock Trail")
   - Named beaches and natural features (e.g., "Kitsilano Beach", "English Bay Beach")
   - Specific buildings and structures (e.g., "Science World", "Canada Place")

   **What to EXCLUDE (generic locations without specific names):**
   - ❌ Street addresses as place names (e.g., "4800 Stanley Park Dr", "1234 Main St")
   - ❌ Streets or roads (e.g., "Robson Street", "Main Street", "Commercial Drive", "Stanley Park Drive")
   - ❌ General neighborhoods or districts (e.g., "Downtown", "Gastown", "West End", "Yaletown")
   - ❌ Regions or areas (e.g., "North Shore", "East Vancouver")
   - ❌ Cities or countries (e.g., "Vancouver", "Canada", "Seattle")
   - ❌ Generic references (e.g., "the beach", "the park", "a viewpoint", "downtown area")

   **WRONG Examples (DO NOT USE):**
   - ❌ "4800 Stanley Park Dr" (this is a street address, not a place name)
   - ❌ "1926 W 4th Ave" (this is a street address)
   - ❌ "Robson Street" (this is a street, not a specific business)

   **CORRECT Examples (USE THESE):**
   - ✅ "Stanley Park" (proper place name)
   - ✅ "Rain or Shine Ice Cream" (business name with address in formattedAddress field)
   - ✅ "Prospect Point Lookout" (specific landmark within Stanley Park)
   - ✅ "Gastown Steam Clock" (specific landmark within Gastown)
   - Each place object must have:
     * **displayName**: The exact place name as it appears in your chatting text (e.g., "Rain or Shine Ice Cream", "Stanley Park")
       - **CRITICAL**: Use the PLACE NAME, not a street address
       - Example: "Stanley Park" NOT "4800 Stanley Park Dr"
       - Example: "Rain or Shine Ice Cream" NOT "1926 W 4th Ave"
     * **formattedAddress**: Full address OR general location for parks/landmarks
       - For businesses: Include street, city, province/state, postal code, country
         Example: "1926 W 4th Ave, Vancouver, BC V6J 1M5, Canada"
       - For parks/landmarks: Use the general location
         Example: "Stanley Park, Vancouver, BC, Canada"
   - The places array enables automatic enrichment with real-time data (ratings, hours, photos, etc.)

Your goal is to have engaging conversations and provide thoughtful recommendations.
The technical details (grounding, validation, real-time data) are handled by the system.
"""


def chatting_agent(
    client: genai.Client, chat_history: List[types.Content], user_text: str
) -> tuple[List[types.Content], Dict]:
    """
    chatting_agent: User-facing conversational agent (Non-Streaming with Structured Output)
    """
    # Add user message to history
    chat_history.append(types.Content(role="user", parts=[types.Part(text=user_text)]))

    # Simple approach without structured output - just get text response
    try:
        response = client.models.generate_content(
            model="gemini-1.5-flash-8b",
            contents=chat_history,
        )
        response_text = response.text
    except Exception as e:
        error_msg = str(e)
        if "image" in error_msg.lower():
            response_text = "I apologize, but there seems to be an issue with the AI service. Please try again."
        else:
            response_text = f"I apologize, but I encountered an error: {error_msg}"

    # Try to parse as JSON for structured output, fallback to plain text
    try:
        structured_output = json.loads(response_text)
        trip_context = structured_output.get("trip_context", {})
        chatting = structured_output.get("chatting", response_text)
        places = structured_output.get("places", [])
    except (json.JSONDecodeError, AttributeError):
        # Not JSON, use as plain text response
        trip_context = {}
        chatting = response_text
        places = []

    # Add response to history
    chat_history.append(types.Content(role="model", parts=[types.Part(text=chatting)]))

    return chat_history, trip_context, chatting, places


# ============================================================================
# HELPER FUNCTION: INITIALIZE CHAT HISTORY (FOR SERVER.PY)
# ============================================================================


def initialize_chat_history() -> list:
    """Initialize chat history with welcome message."""
    chat_history = [
        types.Content(role="model", parts=[types.Part(text=WELCOME_MESSAGE)])
    ]
    return chat_history


# ============================================================================
# CLI INTERFACE (FOR TESTING)
# ============================================================================


async def run_cli_chat_async(client: genai.Client, gmap_api_key: str = None):
    """
    CLI interface for batch testing using DUAL-AGENT architecture with async enrichment.

    Reference: gemini_new_architecture.py

    DUAL-AGENT APPROACH (Non-Streaming with Async Enrichment):
    1. chatting_agent: Generate structured output (chatting text + places list with name + formatted_address)
    2. Start async enrichment tasks for all places
    3. Display chatting response with typewriter effect (concurrently with enrichment)
    4. Collect and display enriched results
    """

    # Create thread pool executor for running sync functions
    executor = ThreadPoolExecutor(max_workers=5)

    # State tracking
    chat_history = []
    all_places = []  # All enriched places across conversation
    structured_output_history = []  # Track all structured outputs from chatting_agent
    current_trip_context = None

    # Display welcome
    print("\n" + "=" * 80)
    print(f"{AGENT_NAME} - DUAL-AGENT ARCHITECTURE (Async Batch Testing)")
    print("=" * 80)
    print(f"\n{WELCOME_MESSAGE}")
    print("\nType 'quit' or 'exit' to finish.\n")

    # Add welcome to history
    chat_history.append(
        types.Content(role="model", parts=[types.Part(text=WELCOME_MESSAGE)])
    )

    # Main conversation loop
    while True:
        try:
            user_text = input("\nYou: ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\n\nFinishing conversation...")
            break

        # Exit conditions
        if not user_text or user_text.lower() in ["quit", "exit", "done", "finish"]:
            print("\n📝 Conversation complete!")
            break

        # ====================================================================
        # CHATTING AGENT: Chat with user (returns structured output)
        # ====================================================================
        print("\n💬 chatting_agent:")
        print("-" * 80)

        chat_history, trip_context, chatting, places = chatting_agent(
            client, chat_history, user_text
        )

        # Save structured output to history
        structured_output_history.append(
            {
                "user_message": user_text,
                "trip_context": trip_context,
                "chatting": chatting,
                "places": places,
            }
        )

        # ====================================================================
        # ASYNC ENRICHMENT: Start enrichment tasks and print text concurrently
        # ====================================================================

        # Start enrichment tasks if places exist
        enrichment_tasks = []
        if places:
            place_names = [p["displayName"] for p in places]
            print(f"📝 Places Mentioned: {', '.join(place_names)}")
            print(f"\n🗺️  Starting enrichment for {len(places)} places...")

            # Create async tasks for all places
            for place in places:
                task = enrich_place_async(executor, gmap_api_key, place)
                enrichment_tasks.append(task)

        # Display chatting response with typewriter effect (while enrichment runs)
        print_typewriter(chatting, delay=0.05)

        # Update current trip context
        if trip_context:
            cities = trip_context.get("cities")
            start_date = trip_context.get("schedule_start_date")
            end_date = trip_context.get("schedule_end_date")

            cities_str = ", ".join(cities) if cities else "Not specified"
            schedule_str = (
                f"{start_date} to {end_date}"
                if start_date and end_date
                else "Not specified"
            )

            print(f"\n📍 Trip Context: {cities_str} | {schedule_str}")

        # Wait for enrichment to complete and display results
        if enrichment_tasks:
            print(f"\n⏳ Waiting for enrichment to complete...")
            print("-" * 80)

            # Gather all enrichment results
            enriched_places = await asyncio.gather(
                *enrichment_tasks, return_exceptions=True
            )

            # Display enriched places
            for i, enriched_place in enumerate(enriched_places):
                if isinstance(enriched_place, Exception):
                    print(
                        f"\n  ❌ Error enriching place {i + 1}: {str(enriched_place)}"
                    )
                    all_places.append({"_error": str(enriched_place)})
                elif "_error" not in enriched_place:
                    all_places.append(enriched_place)
                    # Use _displayName (clean string) for display
                    display_name = enriched_place.get("_displayName", "Unknown")
                    print(f"\n  ✅ Enriched: {display_name}")
                    print(f"     Place ID: {enriched_place.get('_id')}")
                    print(
                        f"     Rating: {enriched_place.get('rating')} ({enriched_place.get('userRatingCount')} reviews)"
                    )
                else:
                    print(f"\n  ❌ Error: {enriched_place.get('_error')}")
                    all_places.append(enriched_place)

            print("-" * 80)
            print()

    # Cleanup executor
    executor.shutdown(wait=True)

    # Final summary
    if all_places:
        print(f"\n{'=' * 80}")
        print(f"SUMMARY - Total Places Enriched: {len(all_places)}")
        print(f"{'=' * 80}")

        for i, place in enumerate(all_places, 1):
            # Use _displayName and _formattedAddress (clean strings) for display
            display_name = place.get("_displayName", "Unknown")
            print(f"\n{i}. {display_name}")

            # Address
            formatted_address = place.get("_formattedAddress")
            if formatted_address:
                print(f"   Address: {formatted_address}")

            # Place ID
            if place.get("_id"):
                print(f"   Place ID: {place['_id']}")

            # Rating
            if place.get("rating"):
                print(
                    f"   Rating: {place['rating']} ({place.get('userRatingCount', 0)} reviews)"
                )

            # Type
            if place.get("primaryType"):
                print(f"   Type: {place['primaryType']}")

            # Maps URL
            if place.get("googleMapsUri"):
                print(f"   Maps: {place['googleMapsUri']}")

            # Error
            if place.get("_error"):
                print(f"   ❌ Error: {place['_error']}")

        print(f"\n{'=' * 80}")

        # Save enriched places to JSON file
        output_file = Path(__file__).parent / "chat_enriched_places.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_places, f, ensure_ascii=False, indent=2)
        print(f"\n✅ Enriched places saved to: {output_file}")
    else:
        print("\n[No places detected. Goodbye!]")

    # Save structured output history to JSON file
    if structured_output_history:
        history_file = Path(__file__).parent / "chat_structured_output_history.json"
        with open(history_file, "w", encoding="utf-8") as f:
            json.dump(structured_output_history, f, ensure_ascii=False, indent=2)
        print(f"✅ Structured output history saved to: {history_file}")
        print(f"   Total turns: {len(structured_output_history)}")


# ============================================================================
# ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    load_dotenv(dotenv_path=Path(__file__).parent / "api.env")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    gmap_api_key = os.getenv("GMAP_API_KEY")

    if not gemini_api_key:
        print("Error: GEMINI_API_KEY not found in api.env")
        print("Please add your Gemini API key to api.env file:")
        print("GEMINI_API_KEY=your_key_here")
        exit(1)

    if not gmap_api_key:
        print("Error: GMAP_API_KEY not found in api.env")
        print("Please add your Google Maps API key to api.env file:")
        print("GMAP_API_KEY=your_key_here")
        exit(1)

    # Initialize client
    client = genai.Client(api_key=gemini_api_key)

    # Run CLI chat with async approach
    asyncio.run(run_cli_chat_async(client, gmap_api_key))

# Vancouver, Friday morning to Sunday night, try the best ice cream scoop shops as many as possible and if there is sightseeing that I should not miss on my way, recommend attractions. I'd like to hike a mountain and bike at a park. I have a car.
