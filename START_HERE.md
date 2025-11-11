# 🚀 START HERE - TripRoute Setup

Follow these steps to get TripRoute running on your machine.

## Step 1: Install Dependencies (1 minute)

```bash
pip install -r requirements.txt
```

## Step 2: Your API Keys Are Already Configured! ✅

Your `backend/api.env` already has:
- ✅ Gemini API Key
- ✅ Google Maps API Key

These keys are **safe** - they're only used by the backend server and never exposed to the browser.

## Step 3: Start the Backend Server (30 seconds)

```bash
cd backend
python server.py
```

You should see:
```
============================================================
TripRoute Backend API - Phase 1 (Gemini)
============================================================
Gemini API Key: Configured
Google Maps Key: Configured
============================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**Keep this terminal open!** The server needs to stay running.

## Step 4: Test the Backend (Optional but Recommended)

Open a **new terminal** and run:

```bash
python test_backend.py
```

This will test:
- ✅ Backend is running
- ✅ API keys work
- ✅ Chat works
- ✅ Recommendations work
- ✅ Route optimization works

## Step 5: Configure Frontend (30 seconds)

**Your frontend is already configured!** ✅

The file `frontend/config.js` has been created with your Google Maps API key. This file is:
- ✅ Gitignored (safe from accidental commits)
- ✅ Separate from the HTML (clean separation)
- ✅ Just like backend's `api.env` approach

**For new users**: Copy `frontend/config.template.js` to `frontend/config.js` and add your key.

## Step 6: Open Frontend (10 seconds)

Simply open `frontend/demo.html` in your web browser:
- **Windows**: Double-click the file
- **Mac**: Right-click → Open With → Browser
- **Linux**: `xdg-open frontend/demo.html`

## Step 7: Test the App! 🎉

1. **Chat**: Type "I want to visit dessert shops in Toronto"
2. **Wait**: The AI will respond and generate recommendations
3. **Optimize**: Click "⚡ Quick Optimize" button
4. **See Route**: Watch the map show your optimized route!

## ✅ Success Checklist

- [ ] Backend terminal shows "Uvicorn running on http://0.0.0.0:8000"
- [ ] Frontend opens and shows a map (not gray)
- [ ] Chat works and bot responds
- [ ] Recommendations appear in "Suggestions For You"
- [ ] Quick Optimize button shows route on map
- [ ] Summary boxes show "Car ETA" time and distance

## 🆘 Troubleshooting

### Backend won't start
**Error**: "Gemini API Key: Missing"
- **Fix**: Check `backend/api.env` exists and has `GEMINI_API_KEY=...`

**Error**: "Address already in use"
- **Fix**: Port 8000 is taken. Edit `server.py` line 389 to use port 8001

### Frontend shows gray map
**Problem**: Map doesn't load
- **Fix**: You didn't add the Google Maps key to `demo.html` (Step 5)

### "Cannot connect to server"
**Problem**: Frontend can't reach backend
- **Fix**: Make sure backend is running (Step 3)
- **Fix**: Check backend terminal is still open and showing server logs

### No recommendations appear
**Problem**: Chat works but no recommendations
- **Fix**: Be more specific: "I want to visit dessert shops in [city name]"
- **Fix**: Continue chatting until bot understands your trip

## 📖 More Documentation

- **RUNNING_LOCALLY.md** - Detailed local development guide
- **SETUP_GUIDE.md** - Complete setup documentation
- **SETUP_CHECKLIST.md** - Detailed checklist
- **backend/README.md** - Backend-specific docs

## 🔒 Security Note

**Why manually add the Google Maps key to HTML?**

This prevents accidental commits of your API key to git. The frontend key is restricted by domain in Google Cloud Console, so it's safe for browser use but should still be handled carefully.

For production, use domain restrictions or a backend proxy (see RUNNING_LOCALLY.md).

## Next Steps

Once everything works:
- Try different cities and themes
- Explore all 4 transportation modes (driving, walking, bicycling, transit)
- Check the API docs: http://localhost:8000/docs

Enjoy building with TripRoute! 🗺️✨
