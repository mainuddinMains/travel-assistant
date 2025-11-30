# 🧭 Travel Assistant Backend

This backend powers the **Travel Assistant Dashboard**, a smart travel-planning API built with **FastAPI**, **Google Maps**, and **OpenAI**.  
It connects real-world distance data with AI-generated itineraries, enabling users to plan trips efficiently and creatively.

---

## 🚀 Features

✅ **FastAPI**-based REST backend  
✅ **Google Maps API** — for distances & travel time  
✅ **OpenAI API** — for AI itinerary suggestions  
✅ **.env configuration** for API keys  
✅ **CORS enabled** for frontend (React/Vite) integration  
✅ **Modular architecture** (Google Maps + AI + FastAPI)

---

## 📁 Project Structure
'''
backend/
├── main.py # 🚀 FastAPI entry point – serves endpoints (/ and /plan)
├── google_map.py # 🗺️ Handles Google Maps distance/time calculations
├── ai_module.py # 🤖 Generates itinerary text via OpenAI
├── requirements.txt # 📦 Python dependencies
├── .env # 🔑 Environment variables (API keys)
└── pycache/ # (auto-generated Python cache)
'''

## Create a virtual environment
python3 -m venv venv
source venv/bin/activate

## Install dependencies
pip install -r requirements.txt

## Add environment variables
Create a file named .env inside the backend/ folder:

GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

## ▶️ Running the Server

uvicorn main:app --reload

## Then open your browser at:
👉 http://127.0.0.1:8000

## Interactive API docs (Swagger UI) are available at:
👉 http://127.0.0.1:8000/docs

## 🧩 Future Enhancements

 Add multiple travel modes (driving, walking, transit, cycling)

 Save itineraries to database (Firebase/PostgreSQL)

 Authentication (JWT / Supabase Auth)

 Cache API results for faster performance

 Integrate real-time map visualization in frontend

 
