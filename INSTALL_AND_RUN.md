# Install and Run TripRoute Locally

Follow these steps to run TripRoute on your computer.

## Step 1: Install Dependencies (One-Time Setup)

Open a terminal/command prompt in the project folder and run:

```bash
pip install -r requirements.txt
```

**What this does:**
- Installs FastAPI (web framework)
- Installs Uvicorn (server)
- Installs Google Gemini SDK
- Installs Google Maps client
- Installs other utilities

**Time:** 1-2 minutes

**Expected output:**
```
Collecting fastapi==0.115.6
Downloading fastapi-0.115.6...
Installing collected packages...
Successfully installed fastapi-0.115.6 uvicorn-0.34.0 ...
```

## Step 2: Start Backend Server

```bash
cd backend
python server.py
```

**Expected output:**
```
============================================================
TripRoute Backend API - Phase 1 (Gemini)
============================================================
Gemini API Key: Configured
Google Maps Key: Configured
============================================================
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

✅ **Server is running!** Keep this terminal open.

## Step 3: Open Frontend

In your file explorer, navigate to:
```
C:\Users\DY\Desktop\Working Space\PSD\frontend
```

Double-click `demo.html`

Your browser will open with the TripRoute app!

## Step 4: Test It

1. In the chat (bottom right), type:
   ```
   I want to visit dessert shops in Toronto
   ```

2. Press Enter or click Send

3. Wait for the AI to respond and generate recommendations

4. When recommendations appear, click **"⚡ Quick Optimize"**

5. Watch the map show your optimized route!

## Troubleshooting

### "ModuleNotFoundError: No module named 'fastapi'"
→ Run Step 1 again: `pip install -r requirements.txt`

### "Gemini API Key: Missing"
→ Check `backend/api.env` has your GEMINI_API_KEY

### "This site can't be reached" in frontend
→ Make sure Step 2 (backend server) is running

### "Gray map" (Google Maps not loading)
→ Check `frontend/config.js` exists with your Google Maps key

## Stopping the Server

In the backend terminal, press:
```
Ctrl + C
```

## Restarting

Next time you want to use TripRoute:
```bash
cd backend
python server.py
```

Then open `frontend/demo.html` in browser.

That's it! No need to reinstall dependencies.
