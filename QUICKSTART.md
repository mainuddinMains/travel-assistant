# 🚀 Quick Start - TripRoute

Get TripRoute running in 5 minutes!

## Prerequisites
- Python 3.11+ installed
- Gemini API key
- Google Maps API key

## Steps

### 1. Install Dependencies (1 minute)
```bash
pip install -r requirements.txt
```

### 2. Configure API Keys (2 minutes)

**IMPORTANT**: The `api.env` file must be inside the `backend/` folder, not the root!

Create `backend/api.env`:
```bash
GEMINI_API_KEY=your-gemini-key-here
GMAP_API_KEY=your-google-maps-key-here
```

**Also update** `frontend/demo.html` line 729:
```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places"></script>
```
Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual Google Maps key.

### 3. Start Backend (1 minute)
```bash
cd backend
python server.py
```

Wait for:
```
Gemini API Key: Configured
Google Maps Key: Configured
Uvicorn running on http://0.0.0.0:8000
```

### 4. Open Frontend (30 seconds)
Double-click `frontend/demo.html` or open in browser.

### 5. Test! (30 seconds)
1. Type: "I want to visit dessert shops in Toronto"
2. Click "⚡ Quick Optimize"
3. See the optimized route on the map!

## That's it! 🎉

For detailed documentation, see [SETUP_GUIDE.md](SETUP_GUIDE.md)

## Common Issues

**"Cannot connect to server"** → Backend not running (Step 3)

**"Gemini API Key: Missing"** → Create `backend/api.env` with GEMINI_API_KEY (Step 2)

**Map not loading** → Update Google Maps key in demo.html (Step 2)
