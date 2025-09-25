# Travel Assistant Integration Guide

## 🏗️ **System Architecture**

Your travel assistant now has **two separate backend systems** that work independently:

### **1. Authentication Backend** (NEW)
- **Location**: `travel-assistant-backend/auth-backend/`
- **Port**: `8000`
- **Purpose**: User authentication, registration, login
- **Database**: PostgreSQL
- **Technology**: FastAPI + SQLAlchemy + JWT

### **2. AI Integration Backend** (EXISTING - UNCHANGED)
- **Location**: `travel-assistant-backend/backend/`
- **Purpose**: ChatGPT integration for travel recommendations
- **Files**: `chatgpt.py`, `chatgpt_JSON.py`
- **Status**: No changes made

### **3. Frontend** (UPDATED)
- **Location**: `travel-assistant/`
- **Port**: `5173`
- **Updates**: Now connects to auth backend at port 8000

## 🚀 **How to Run the Complete System**

### **Option 1: Manual Setup**

1. **Start Authentication Backend:**
```bash
cd travel-assistant-backend/auth-backend
pip install -r requirements.txt
cp env.example .env
# Edit .env with your database credentials
uvicorn app.main:app --reload --port 8000
```

2. **Start Frontend:**
```bash
cd travel-assistant
npm install
cp env.example .env
# Edit .env to set VITE_API_BASE_URL=http://localhost:8000
npm run dev
```

3. **Run AI Backend (when needed):**
```bash
cd travel-assistant-backend/backend
python chatgpt.py
```

### **Option 2: Docker Setup**

1. **Start Auth Backend with Database:**
```bash
cd travel-assistant-backend/auth-backend
docker-compose up --build
```

2. **Start Frontend:**
```bash
cd travel-assistant
npm run dev
```

## 🔄 **Data Flow**

1. **User Registration/Login**: Frontend → Auth Backend (port 8000)
2. **User Data Storage**: Auth Backend → PostgreSQL Database
3. **Travel Recommendations**: Frontend → AI Backend (when implemented)
4. **ChatGPT Integration**: AI Backend → OpenAI API

## 📊 **Database Schema**

The auth backend creates a `users` table with:
- `id` (Primary Key)
- `name` (Unique)
- `email` (Unique)
- `password_hash`
- `age`, `gender`, `phone`
- `is_active`
- `created_at`, `updated_at`

## 🔧 **Environment Variables**

### **Auth Backend (.env)**
```env
DATABASE_URL=postgresql://username:password@localhost:5432/travel_assistant_db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### **Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_CHATGPT_API_KEY=your_chatgpt_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## ✅ **Benefits of This Architecture**

1. **No Impact on Existing Code**: Your ChatGPT integration remains untouched
2. **Independent Scaling**: Each backend can be scaled separately
3. **Clear Separation**: Authentication and AI features are isolated
4. **Easy Maintenance**: Changes to one system don't affect the other
5. **Production Ready**: Both systems can be deployed independently

## 🧪 **Testing the Integration**

1. **Start the auth backend** (port 8000)
2. **Start the frontend** (port 5173)
3. **Register a new user** through the frontend
4. **Login with the user** - should work with real database
5. **Access the main app** - should show user data from database

## 🔮 **Next Steps**

1. **Connect AI Backend**: Integrate ChatGPT with the auth system
2. **Add Trip Storage**: Save user trips to database
3. **Add User Preferences**: Store user travel preferences
4. **Deploy to Production**: Use Docker or cloud services

## 🆘 **Troubleshooting**

- **Database Connection Issues**: Check PostgreSQL is running and credentials are correct
- **CORS Errors**: Ensure frontend URL is in CORS origins in auth backend
- **Token Issues**: Check JWT secret key is set correctly
- **Port Conflicts**: Make sure ports 8000 and 5173 are available


