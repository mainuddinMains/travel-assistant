# TripRoute Backend

FastAPI server for AI-powered trip planning with route optimization.

## Setup

### 1. Install Dependencies

From the project root:
```bash
pip install -r requirements.txt
```

### 2. Configure API Keys

Create `api.env` file **in this backend folder**:

```bash
# backend/api.env
GEMINI_API_KEY=your-gemini-key
GMAP_API_KEY=your-google-maps-key
OPENAI_API_KEY=sk-your-openai-key  # Optional, only for chatgpt.py standalone script
```

**IMPORTANT**:
- File must be named exactly `api.env` (no .txt extension)
- Must be in the `backend/` folder
- Already ignored by .gitignore - don't commit real keys!

### 3. Run Server

From this backend folder:
```bash
python server.py
```

Or from project root:
```bash
cd backend
python server.py
```

Server will start on `http://localhost:8000`

## File Structure

```
backend/
├── api.env              ← Your API keys (create this!)
├── api.env.template     ← Template to copy from
├── server.py            ← FastAPI server (main entry point, uses Gemini)
├── gemini.py            ← Google Gemini integration module
├── chatgpt.py           ← OpenAI ChatGPT integration (optional standalone)
├── optimization.py      ← Route optimization with Google Maps
├── *.json              ← Output files (ignored by git)
└── README.md           ← This file
```

## API Endpoints

Once running, view interactive docs at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Key endpoints:
- `POST /chat` - Chat with AI travel agent
- `GET /recommendations/{session_id}` - Get place recommendations
- `POST /optimize` - Optimize route for transportation mode
- `GET /health` - Health check

## Getting API Keys

### Gemini API Key (required for server.py)
1. Go to https://aistudio.google.com/apikey
2. Sign in with Google account
3. Click "Create API key"
4. Copy to `api.env`

### Google Maps API Key (required)
1. Go to https://console.cloud.google.com/
2. Create/select project
3. Enable these APIs:
   - Places API
   - Directions API
   - Geocoding API
4. Create credentials → API Key
5. Copy to `api.env`

### OpenAI API Key (optional, only for chatgpt.py standalone)
1. Go to https://platform.openai.com/api-keys
2. Sign in or create account
3. Click "Create new secret key"
4. Copy to `api.env`

## Troubleshooting

**Server won't start:**
- Check `api.env` exists in backend folder
- Verify API keys are valid
- Ensure port 8000 is available

**"Module not found" errors:**
- Run `pip install -r requirements.txt` from project root
- Check Python version is 3.11+

**API errors:**
- Check backend terminal for detailed error messages
- Verify API keys have proper permissions/billing enabled
