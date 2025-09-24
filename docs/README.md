# travel-assistant
AI-powered trip planner with chatbot and route optimization

🧠 AI-Powered Itinerary Modules

This update adds core Python files that enable the generation of smart, optimized travel plans using AI and route analysis tools.

✨ Modules Overview

ai_module.py
Uses a language model (LLM) to transform user queries into structured, time-based itineraries.

google_map.py
Interfaces with the Google Maps API to fetch travel times and distance matrices between destinations.

optimizer.py
Leverages OR-Tools to compute the most efficient visit order among places (route optimization).

time_suggester.py
Recommends the best time of day (morning, afternoon, evening) to visit each place based on categories.

test_ai.py
Validates prompt generation and AI responses for various user input scenarios.

test.py
Runs an end-to-end pipeline combining all modules to simulate a full itinerary recommendation.
