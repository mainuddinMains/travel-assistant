# 🚀 How to Run TripRoute

Complete guide to running TripRoute on your machine.

## Quick Start (2 Steps)

### Step 1: Start Backend Server

Open a terminal/command prompt in the project folder:

```bash
cd backend
python server.py
```

**Wait for this message:**
```
============================================================
TripRoute Backend API - Phase 1 (Gemini)
============================================================
Gemini API Key: Configured
Google Maps Key: Configured
============================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Keep this terminal open!** The backend must stay running.

### Step 2: Open Frontend

Now open the frontend. Choose one method:

## Method 1: Double-Click (Easiest)

**Windows:**
1. Navigate to `frontend/` folder in File Explorer
2. Double-click `demo.html`
3. Opens in your default browser

**Mac:**
1. Navigate to `frontend/` folder in Finder
2. Double-click `demo.html`
3. Opens in your default browser

**Linux:**
1. Navigate to `frontend/` folder
2. Double-click `demo.html`
3. Or right-click → Open With → Browser

## Method 2: From Command Line

**Windows (Command Prompt):**
```cmd
cd frontend
start demo.html
```

**Windows (PowerShell):**
```powershell
cd frontend
Start-Process demo.html
```

**Mac:**
```bash
cd frontend
open demo.html
```

**Linux:**
```bash
cd frontend
xdg-open demo.html
```

## Method 3: Drag and Drop

1. Open your browser (Chrome, Firefox, Edge, etc.)
2. Drag `frontend/demo.html` into the browser window
3. Drop it

## Method 4: Using a Local Server (Recommended for Development)

This method is better for avoiding CORS issues and mimics a real web server:

**Option A - Python HTTP Server:**
```bash
cd frontend
python -m http.server 3000
```

Then open: http://localhost:3000/demo.html

**Option B - Node.js HTTP Server:**
```bash
cd frontend
npx http-server -p 3000
```

Then open: http://localhost:3000/demo.html

**Option C - VS Code Live Server:**
1. Install "Live Server" extension in VS Code
2. Right-click `demo.html`
3. Select "Open with Live Server"

## Method 5: Specify Browser

**Chrome:**
```bash
# Windows
start chrome frontend/demo.html

# Mac
open -a "Google Chrome" frontend/demo.html

# Linux
google-chrome frontend/demo.html
```

**Firefox:**
```bash
# Windows
start firefox frontend/demo.html

# Mac
open -a Firefox frontend/demo.html

# Linux
firefox frontend/demo.html
```

## Verification Checklist

After opening the HTML, verify:

✅ **Backend Running:**
- Terminal shows "Uvicorn running on http://0.0.0.0:8000"
- No errors in terminal

✅ **Frontend Loaded:**
- Map appears (not a gray box)
- Chat interface visible on right side
- No red errors in browser

✅ **Browser Console (Press F12):**
```
✓ Google Maps loaded
✓ Server is running
```

## Full Testing Flow

1. **Backend is running** → Terminal shows server logs
2. **Frontend opens** → You see the map and chat
3. **Type message:** "I want to visit dessert shops in Toronto"
4. **Wait for response** → AI responds in chat
5. **See recommendations** → Places appear in "Suggestions For You"
6. **Click "⚡ Quick Optimize"** → Route appears on map
7. **Check summary boxes** → Shows "Car ETA" with time/distance

## Troubleshooting

### "Cannot connect to server at http://localhost:8000"

**Problem:** Backend is not running
**Solution:**
```bash
cd backend
python server.py
```

### Gray Map (Google Maps not loading)

**Problem:** API key not configured
**Solution:** Check `frontend/config.js` has your Google Maps key

**Verify config.js exists:**
```bash
ls frontend/config.js
```

**If missing, create it:**
```bash
cp frontend/config.template.js frontend/config.js
# Then edit config.js and add your key
```

### Browser Shows Blank Page

**Problem:** HTML file didn't load
**Solution:**
- Make sure you're opening `demo.html` not `config.js`
- Check file path is correct
- Try Method 4 (local server)

### CORS Errors in Console

**Problem:** Browser security blocking file:// protocol
**Solution:** Use Method 4 (local server) instead

### Port 8000 Already in Use

**Problem:** Something else using port 8000
**Solution:**
1. Edit `backend/server.py` line 389
2. Change `port=8000` to `port=8001`
3. Edit `frontend/demo.html` line 694
4. Change `API_BASE = 'http://localhost:8000'` to `'http://localhost:8001'`

## Pro Tips

### Keep Both Terminals Open
```
Terminal 1: Backend Server (python server.py)
Terminal 2: Available for testing (python test_backend.py)
Browser:    Frontend (demo.html)
```

### Use Browser DevTools
- Press **F12** to open Developer Tools
- **Console tab:** See JavaScript logs and errors
- **Network tab:** See API requests to backend
- **Elements tab:** Inspect HTML/CSS

### Watch Backend Logs
The backend terminal shows useful info:
```
✓ Extracted 6 recommendations for session abc123
✓ Optimized driving route for session abc123
```

### Test Backend First
Before opening frontend:
```bash
python test_backend.py
```

This verifies:
- ✅ Backend is running
- ✅ API keys work
- ✅ Chat works
- ✅ Optimization works

## What You Should See

### Successful Startup:

**Terminal (Backend):**
```
============================================================
TripRoute Backend API - Phase 1 (Gemini)
============================================================
Gemini API Key: Configured
Google Maps Key: Configured
============================================================
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

**Browser (Frontend):**
- Left side: Google Map showing default location
- Right top: "Suggestions For You" (empty initially)
- Right bottom: Chat with greeting message
- No errors in console (F12)

### After Chatting:

**Browser shows:**
- AI responses in chat
- Recommended places in list (with ratings, addresses)
- Blue "Quick Optimize" button
- Map markers on recommended locations

**Terminal shows:**
```
✓ Extracted 6 recommendations for session abc123def
```

### After Optimizing:

**Browser shows:**
- Blue route line on map
- Numbered markers in optimized order
- Summary boxes updated with ETA/distance
- Success message in chat

**Terminal shows:**
```
✓ Optimized driving route for session abc123def
```

## Next Steps

Once running successfully:
- Try different cities: Tokyo, Paris, New York
- Test different themes: museums, restaurants, parks
- Try all transport modes: driving, walking, bicycling, transit
- Explore the API docs: http://localhost:8000/docs

## Need Help?

1. Check **Browser Console** (F12) for frontend errors
2. Check **Backend Terminal** for server errors
3. Run **test_backend.py** to verify setup
4. See **SETUP_GUIDE.md** for detailed troubleshooting
