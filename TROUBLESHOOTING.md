# TripRoute Troubleshooting Guide

## ❌ "This site can't be reached" Error

This error means the backend server isn't running. Here's how to fix it:

### Problem: Dependencies Not Installed

**Symptom:** When running `python server.py`, you see:
```
ModuleNotFoundError: No module named 'fastapi'
```

**Solution:** Install dependencies first!

```bash
# Navigate to project root
cd C:\Users\DY\Desktop\Working Space\PSD

# Install all dependencies
pip install -r requirements.txt
```

This installs:
- fastapi (web framework)
- uvicorn (ASGI server)
- google-genai (Gemini integration)
- googlemaps (Google Maps API)
- pydantic, python-dotenv (utilities)

**Wait for installation to complete.** It may take 1-2 minutes.

### After Installing Dependencies

```bash
# Navigate to backend folder
cd backend

# Start the server
python server.py
```

**You should see:**
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
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Server is now running!**

### Verify It's Working

**Test 1: Visit in browser**
```
http://localhost:8000/health
```

Should show:
```json
{
  "status": "healthy",
  "active_sessions": 0,
  "gemini_configured": true,
  "gmaps_configured": true
}
```

**Test 2: Run test script**
```bash
python test_backend.py
```

Should show all tests passing.

## Other Common Issues

### Issue: "Address already in use"

**Symptom:**
```
ERROR: [Errno 10048] error while attempting to bind on address ('0.0.0.0', 8000)
```

**Cause:** Port 8000 is already being used by another program.

**Solution 1:** Find and stop the other program using port 8000

**Windows:**
```cmd
# Find what's using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with the number from above)
taskkill /PID <PID> /F
```

**Solution 2:** Use a different port

Edit `backend/server.py` line 389:
```python
# Change from:
port=8000

# To:
port=8001
```

Then edit `frontend/demo.html` line 694:
```javascript
// Change from:
const API_BASE = 'http://localhost:8000';

// To:
const API_BASE = 'http://localhost:8001';
```

### Issue: "Gemini API Key: Missing"

**Symptom:** Server starts but shows:
```
Gemini API Key: Missing
```

**Solution:** Check `backend/api.env` file exists and has your key:
```bash
# Should contain:
GEMINI_API_KEY=your-gemini-key-here
GMAP_API_KEY=your-google-maps-key-here
```

### Issue: Python not found

**Symptom:**
```
'python' is not recognized as an internal or external command
```

**Solution:** Try `python3` instead:
```bash
python3 server.py
```

Or install Python from: https://www.python.org/downloads/

### Issue: pip not working

**Symptom:**
```
'pip' is not recognized as an internal or external command
```

**Solution:** Use:
```bash
python -m pip install -r requirements.txt
```

### Issue: Permission denied

**Symptom:**
```
PermissionError: [Errno 13] Permission denied
```

**Solution:** Run as administrator or use:
```bash
pip install --user -r requirements.txt
```

## Step-by-Step Checklist

Follow these steps in order:

### 1. ✅ Check Python Version
```bash
python --version
```
Should be Python 3.11 or higher.

### 2. ✅ Install Dependencies
```bash
pip install -r requirements.txt
```
Wait for completion, no errors.

### 3. ✅ Verify API Keys
```bash
cat backend/api.env
```
Should have both keys (GEMINI_API_KEY and GMAP_API_KEY).

### 4. ✅ Start Backend
```bash
cd backend
python server.py
```
Should show "Uvicorn running on http://0.0.0.0:8000"

### 5. ✅ Test Backend
Open new terminal:
```bash
python test_backend.py
```
Should show "ALL TESTS PASSED!"

### 6. ✅ Open Frontend
Open `frontend/demo.html` in browser.

### 7. ✅ Test Full Flow
1. Type: "I want to visit Toronto"
2. Get recommendations
3. Click "Quick Optimize"
4. See route on map

## Still Having Issues?

### Check Logs

**Backend logs:** Look at the terminal where you ran `python server.py`
- Shows API requests
- Shows errors in detail

**Frontend logs:** Press F12 in browser
- Console tab shows JavaScript errors
- Network tab shows API requests

### Common Error Messages

**"Connection refused"**
→ Backend isn't running. Start with `python server.py`

**"CORS error"**
→ Backend CORS is configured. Make sure backend is on port 8000

**"Module not found"**
→ Dependencies not installed. Run `pip install -r requirements.txt`

**"Invalid API key"**
→ Check your Gemini or Google Maps API key is correct

**"Billing not enabled"**
→ Enable billing in Google Cloud Console

### System Requirements

Ensure you have:
- ✅ Python 3.11 or higher
- ✅ pip (Python package manager)
- ✅ Internet connection (for API calls)
- ✅ Valid Gemini API key
- ✅ Valid Google Maps API key
- ✅ Google Cloud billing enabled

## Getting Help

If still stuck:
1. **Check terminal output** for specific error messages
2. **Check browser console** (F12) for frontend errors
3. **Run test script** (`python test_backend.py`) to isolate issue
4. **Copy error message** and search online
5. **Check API status**:
   - Google Cloud Status: https://status.cloud.google.com/
   - Google Maps: https://status.cloud.google.com/

## Quick Commands Reference

```bash
# Install dependencies
pip install -r requirements.txt

# Start backend
cd backend
python server.py

# Test backend
python test_backend.py

# Check Python version
python --version

# Check installed packages
pip list

# Upgrade pip
python -m pip install --upgrade pip
```
