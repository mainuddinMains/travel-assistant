# ✅ TripRoute Setup Checklist

Follow this checklist to ensure everything is configured correctly.

## Prerequisites
- [ ] Python 3.11+ installed
  - Check: `python --version` (should show 3.11 or higher)

## Backend Setup

### 1. Dependencies
- [ ] Installed Python packages
  - Run: `pip install -r requirements.txt`
  - Check: No error messages

### 2. API Keys Configuration
- [ ] Created `backend/api.env` file (must be in backend folder, not root!)
- [ ] Added OpenAI API key
  - Format: `OPENAI_API_KEY=sk-...`
  - Get from: https://platform.openai.com/api-keys
- [ ] Added Google Maps API key
  - Format: `GMAP_API_KEY=...`
  - Get from: https://console.cloud.google.com/
- [ ] Enabled Google APIs:
  - [ ] Places API
  - [ ] Directions API
  - [ ] Geocoding API

### 3. Backend Server
- [ ] Started server: `cd backend && python server.py`
- [ ] Saw "✓ OpenAI API Key: Configured"
- [ ] Saw "✓ Google Maps Key: Configured"
- [ ] Server running on http://localhost:8000
- [ ] Tested health endpoint:
  - Visit: http://localhost:8000/health
  - Should show: `{"status": "healthy", ...}`

## Frontend Setup

### 1. Google Maps API Key
- [ ] Opened `frontend/demo.html` in editor
- [ ] Found line ~690: `<script src="https://maps.googleapis.com/maps/api/js?key=..."`
- [ ] Replaced `YOUR_GOOGLE_MAPS_API_KEY` with actual key
- [ ] Saved file

### 2. Open Frontend
- [ ] Opened `frontend/demo.html` in browser
- [ ] Map loads (not gray square)
- [ ] No errors in browser console (F12)

## Test Complete Flow

### 1. Chat
- [ ] Type message: "I want to visit dessert shops in Toronto"
- [ ] Bot responds with travel agent message
- [ ] Continue chat until bot generates recommendations
- [ ] "Suggestions For You" section shows places

### 2. Route Optimization
- [ ] Click "⚡ Quick Optimize" button
- [ ] Button shows "⏳ Optimizing..."
- [ ] Map shows blue route line
- [ ] "Car ETA" summary box updates with time/distance
- [ ] Button shows "✓ Optimized!"

### 3. Map Interaction
- [ ] Click on numbered markers
- [ ] Info window shows place details
- [ ] Can zoom and pan map

## Troubleshooting

If any checkbox fails, see solutions:

### Backend Issues
**Dependencies won't install:**
- Upgrade pip: `python -m pip install --upgrade pip`
- Try: `pip install -r requirements.txt --no-cache-dir`

**API keys not detected:**
- Check file name is exactly `api.env` (not `api.env.txt`)
- Check file is in `backend/` directory
- No spaces around `=` in env file
- Keys have no quotes around them

**Server won't start:**
- Check error message in terminal
- Make sure port 8000 is not in use
- Try different port: Edit `server.py` line 389, change `port=8000` to `port=8001`

### Frontend Issues
**Map not loading:**
- Check browser console (F12) for errors
- Verify Google Maps API key in `demo.html`
- Ensure billing is enabled on Google Cloud project

**"Cannot connect to server":**
- Backend must be running
- Check backend terminal is showing server logs
- Try manually: http://localhost:8000/health

**No recommendations appearing:**
- Be specific in chat: mention city and theme
- Check backend terminal for "✓ Extracted N recommendations"
- Check browser console for API errors

## Success Criteria

✅ **You're ready when:**
1. Backend server starts without errors
2. Frontend loads with working map
3. Can chat and get recommendations
4. Can optimize route and see it on map
5. Summary boxes show route statistics

## Files Changed

Summary of files you should have modified:
1. ✅ Created: `backend/api.env` (your API keys)
2. ✅ Updated: `frontend/demo.html` line ~690 (Google Maps key)

## Next Steps

Once everything works:
- [ ] Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed documentation
- [ ] Explore other transportation modes (walking, transit, bicycling)
- [ ] Try different cities and themes
- [ ] Check API documentation: http://localhost:8000/docs

## Getting Help

Still stuck? Check:
1. **Backend terminal** - Look for error messages
2. **Browser console** (F12) - Look for JavaScript errors
3. **API docs** - http://localhost:8000/docs
4. **GitHub issues** - Report bugs with error messages
