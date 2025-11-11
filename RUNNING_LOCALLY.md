# Running TripRoute Locally (Development Only)

This guide is for running TripRoute on your local machine for development/testing.

## Important Security Note

⚠️ **Never commit API keys to git!** The frontend requires a Google Maps API key to be added manually by each developer.

## Setup Steps

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Backend Configuration

The backend API keys are in `backend/api.env` (already configured):
```bash
OPENAI_API_KEY=your-key
GMAP_API_KEY=your-key
```

### 3. Frontend Configuration

**You must manually add your Google Maps API key to the frontend:**

1. Open `frontend/demo.html` in a text editor
2. Find line ~688: `<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY..."`
3. Replace `YOUR_GOOGLE_MAPS_API_KEY` with your actual Google Maps key
4. **DO NOT commit this change to git!**

### 4. Start Backend Server

```bash
cd backend
python server.py
```

Wait for:
```
✓ OpenAI API Key: Configured
✓ Google Maps Key: Configured
Uvicorn running on http://0.0.0.0:8000
```

### 5. Open Frontend

Open `frontend/demo.html` in your browser (after adding your API key in step 3).

## Security Best Practices

### For Development:
- Keep API keys in `backend/api.env` (gitignored)
- Manually add Google Maps key to `demo.html` (don't commit)
- Use HTTP referrer restrictions on your Google Maps API key

### For Production:
- **Option 1: API Key Restrictions**
  - Restrict Google Maps API key to your domain in Google Cloud Console
  - Set HTTP referrer restrictions

- **Option 2: Backend Proxy (Recommended)**
  - Move all Google Maps calls to backend
  - Frontend calls your backend, backend calls Google Maps
  - Frontend never sees the API key

- **Option 3: Environment Variables**
  - Use environment variables at build time
  - Configure CI/CD to inject keys during deployment
  - Never commit keys to repository

## Why This Setup?

**Backend Keys (`backend/api.env`):**
- ✅ Safe: Never exposed to browser
- ✅ Gitignored automatically
- ✅ Server-side only

**Frontend Keys (Manual in `demo.html`):**
- ⚠️ Exposed to browser (visible in HTML)
- ⚠️ Can be restricted by domain/referrer
- ⚠️ Requires manual setup (prevents accidental commits)
- ✅ Each developer uses their own key

## Recommended: Use Backend Proxy

For better security, proxy Google Maps requests through your backend:

1. Frontend calls: `POST /api/geocode` (your backend)
2. Backend calls: Google Maps API with server key
3. Frontend never sees the API key

This is the most secure approach for production.

## Testing

1. **Test Backend:**
   ```bash
   curl http://localhost:8000/health
   ```

2. **Test Chat:**
   ```bash
   curl -X POST http://localhost:8000/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "I want to visit Tokyo"}'
   ```

3. **Test Frontend:**
   - Open browser console (F12)
   - Should see: "✓ Server is running"
   - Should see Google Maps loaded (not gray box)

## Troubleshooting

**"Cannot connect to server"**
- Backend not running → Run `python backend/server.py`

**Map shows gray box**
- API key not added to demo.html
- Or API key invalid/restricted

**"Referer not allowed"**
- Add `http://localhost` to allowed referrers in Google Cloud Console
- Or disable referrer restrictions for development

## Next Steps

See `SETUP_GUIDE.md` for detailed documentation.
