# 🌍 Travel Assistant Dashboard

The **Travel Assistant Dashboard** is a modern and responsive web interface built with **React**, **Vite**, and **Tailwind CSS**.  
It helps users track ongoing travels, store wishlist destinations, analyze trip insights, and manage travel-related preferences — all within a clean and intuitive UI.

---

# ✨ Features Overview

## 📊 Dashboard Overview  
Shows key travel metrics such as:
- **Total Trips**
- **Distance Traveled**
- **AI Recommendations**

---

## 🌍 Active Travel  
This section displays your **current travel status**, including:

- **Country**
- **City**
- **Current Status** (e.g., “Currently Traveling ✈️”)

Useful for tracking ongoing trips or syncing real-time location in the future.

---

## ⭐ Wishlist  
Save places you want to visit in the future, grouped by country.

### Example Wishlist:
- **Japan

- **Shibuya Crossing
-- **Osaka Castle
- **Australia
-- **Sydney Opera House

### Wishlist Features:
- Add a **country**
- Add a **place**
- Automatically group places under their respective country
- Displays wishlist as a clean list

More features like edit/delete can be added later.

---

# 🎨 Tech Stack

- **React (Vite)** — Fast and modern frontend build environment  
- **Tailwind CSS** — Utility-first styling  
- **React Router DOM** — Navigation across pages  
- **JavaScript (ES6+)**  

### Planned Integrations:
- Google Maps API  
- Backend (Supabase / Firebase / Express.js)  
- AI-powered route suggestions  
- User authentication  
- Persistent storage  

---

## 📁 Project Structure
```
Below is the complete structure of the **frontend** folder exactly as pushed to GitHub:
frontend/
travel-assistant/
├── dashboard_code/                   ## 🌟 Main Vite + React frontend
│   ├── public/                      # Static public assets
│   │   └── vite.svg                 # Default Vite logo
│   ├── src/                         # Core application source code
│   │   ├── assets/                  # App-specific static assets
│   │   │   └── react.svg            # React logo asset
│   │   ├── components/              # 💎 Reusable UI components
│   │   │   ├── Card.jsx             # Info/statistics card
│   │   │   ├── Navbar.jsx           # Top nav bar
│   │   │   └── Sidebar.jsx          # Left-side navigation menu
│   │   ├── layout/                  # Page layout wrappers
│   │   │   └── DashboardLayout.jsx  # Main layout: Sidebar + Navbar + Page
│   │   ├── pages/                   # 📄 App main pages
│   │   │   ├── Home.jsx             # Dashboard overview + active travel
│   │   │   ├── Analytics.jsx        # Analytics + insights page
│   │   │   └── Settings.jsx         # User preferences page
│   │   ├── App.jsx                  # Entry point: routing and layout
│   │   ├── App.css                  # Component-level styles
│   │   ├── main.jsx                 # React app mount root
│   │   └── index.css                # Global Tailwind imports
│   ├── .gitignore                   # Git ignored files
│   ├── index.html                   # HTML template
│   ├── package.json                 # NPM project metadata + dependencies
│   ├── postcss.config.js           # PostCSS setup for Tailwind
│   ├── tailwind.config.js         # Tailwind configuration
│   ├── vite.config.js              # Vite build setup
│   └── README.md                    # 📘 Project documentation

```

To run this project locally:

## Clone the repo
git clone https://github.com/mainuddinMains/travel-assistant.git

## Go to the dashboard frontend directory
cd travel-assistant/dashboard-app/vite-project

## Install all dependencies
npm install

## Start local development server
npm run dev

### 📁 Google_map_Code
---
## 🧭 Google Map + AI Itinerary Modules

This folder powers the **AI-driven itinerary generation** and **travel route optimization** parts of the project.  
Each script has a dedicated role — from generating trip plans using language models to fetching routes via Google Maps and optimizing visits with OR-Tools.

### 🧩 Module Overview

| File | Description |
|------|--------------|
| **ai_module.py** | Uses a language model (LLM) like GPT to parse user travel queries and generate a structured itinerary (e.g., day-by-day plan). |
| **google_map.py** | Connects to the Google Maps API to calculate distances, travel times, and directions between destinations. |
| **optimizer.py** | Uses Google OR-Tools to find the most efficient route across multiple destinations (TSP-style optimization). |
| **time_suggester.py** | Suggests the best time slots to visit each place based on its category (e.g., landmarks in morning, nightlife in evening). |
| **test_ai.py** | Unit tests for verifying prompt consistency and AI itinerary formatting. |
| **test.py** | Integrates all modules into a single workflow for testing complete travel recommendation functionality. |

---

🧠 **In future**, these scripts can be connected to the dashboard via a Flask/FastAPI backend to:
- Generate real-time travel plans  
- Display optimized routes on an interactive map  
- Sync AI itineraries with the user’s wishlist

---
