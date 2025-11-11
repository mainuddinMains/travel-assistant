# TripRoute Frontend

Modern, responsive web interface for TripRoute AI travel planner.

## Setup

### 1. Configure API Key

The frontend needs a Google Maps API key to display maps. This is stored in a separate config file (just like the backend's `api.env`).

**If `config.js` doesn't exist:**
```bash
# Copy the template
cp config.template.js config.js

# Edit config.js and add your Google Maps API key
```

**Structure of `config.js`:**
```javascript
const FRONTEND_CONFIG = {
    GOOGLE_MAPS_API_KEY: 'your-google-maps-key-here'
};
```

### 2. Open in Browser

Simply open `demo.html` in your browser:
```bash
# Windows
start demo.html

# Mac
open demo.html

# Linux
xdg-open demo.html
```

## File Structure

```
frontend/
├── config.js           ← Your API key (gitignored, create this!)
├── config.template.js  ← Template to copy from
├── demo.html           ← Main application
└── README.md           ← This file
```

## How It Works

### Security Architecture

**Backend API Keys** (`backend/api.env`):
- OpenAI API key - Server-side only ✅
- Google Maps API key - Used for route optimization ✅
- Never exposed to browser ✅

**Frontend API Key** (`frontend/config.js`):
- Google Maps API key - Used for map display
- Loaded at runtime from separate file
- Gitignored to prevent accidental commits ✅
- Can be restricted by domain in Google Cloud Console

### Why Separate Config File?

This approach mimics the backend's `api.env` pattern:

1. **Security**: Not hardcoded in HTML
2. **Gitignored**: Won't be committed accidentally
3. **Flexible**: Easy to update without touching HTML
4. **Clean**: Separation of config from code

### Dynamic Loading

The frontend loads Google Maps dynamically:

```javascript
// 1. Load config.js (contains API key)
<script src="config.js"></script>

// 2. JavaScript dynamically creates Google Maps script tag
const script = document.createElement('script');
script.src = `https://maps.googleapis.com/maps/api/js?key=${FRONTEND_CONFIG.GOOGLE_MAPS_API_KEY}&libraries=places`;

// 3. Map initializes after Google Maps loads
```

This ensures:
- API key comes from config, not hardcoded
- Helpful error messages if config is missing
- Graceful fallback if Maps fails to load

## Features

### Modern Design (Figma-inspired)
- 2-column grid layout
- Clean, minimal aesthetic
- Blue color scheme (#2563eb)
- Smooth animations and transitions

### Components

**Left Column:**
- 🗺️ Google Maps view
- 📊 4 Summary boxes (Car/Transit ETA, Print, Export)

**Right Column:**
- 📍 Places list with optimization banner
- 💬 AI chat interface

### Interactions

1. **Chat**: Talk to AI travel agent
2. **Recommendations**: Get curated place suggestions
3. **Quick Optimize**: One-click route optimization
4. **Map Visualization**: See optimized routes
5. **Summary Stats**: View ETA and distance

## API Integration

The frontend connects to the backend at `http://localhost:8000`:

- `POST /chat` - Send messages to AI
- `GET /recommendations/{session_id}` - Fetch places
- `POST /optimize` - Optimize routes

All backend communication is secure - API keys stay on the server.

## Development

### Testing

1. **Check config exists:**
   ```bash
   ls -la config.js
   ```

2. **View in browser console (F12):**
   ```
   ✓ Google Maps loaded
   ✓ Server is running
   ```

3. **Test chat:**
   - Type message
   - Bot should respond
   - No errors in console

### Common Issues

**"Frontend config not loaded"**
- `config.js` doesn't exist
- Copy from `config.template.js`

**"Google Maps API key not configured"**
- `config.js` still has placeholder `YOUR_GOOGLE_MAPS_API_KEY_HERE`
- Add your actual key

**Map shows gray box**
- API key is invalid
- Or billing not enabled in Google Cloud Console

**"Cannot connect to server"**
- Backend is not running
- Start: `cd backend && python server.py`

## Production Deployment

### Option 1: Domain Restrictions (Recommended)
1. Go to Google Cloud Console
2. Edit your Google Maps API key
3. Add "Application restrictions" → "HTTP referrers"
4. Add your production domain: `https://yourdomain.com/*`
5. Deploy with same `config.js` pattern

### Option 2: Backend Proxy (Most Secure)
1. Move all Google Maps calls to backend
2. Frontend calls: `POST /api/geocode` (your backend)
3. Backend calls: Google Maps API (server-side)
4. Frontend never sees API key

### Option 3: Build-Time Injection
1. Use build tools (Webpack, Vite, etc.)
2. Inject API key from environment variables
3. `process.env.GOOGLE_MAPS_KEY`
4. Build process creates `config.js` automatically

## Troubleshooting

### Browser Console Errors

```
Failed to load config.js
→ File doesn't exist, copy from config.template.js

Google Maps API key not configured
→ Edit config.js and add your key

Failed to load Google Maps
→ Check key is valid and billing is enabled
```

### Network Errors

```
Cannot connect to server at http://localhost:8000
→ Backend not running, start: python backend/server.py

CORS error
→ Backend CORS is configured, check if backend is accessible
```

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers ✅

## Performance

- Lazy loads Google Maps after config
- Optimized CSS with modern properties
- Minimal JavaScript, no frameworks
- Fast initial load

## Next Steps

- Add user authentication
- Implement backend proxy for Maps API
- Add service worker for offline support
- Progressive Web App (PWA) features
