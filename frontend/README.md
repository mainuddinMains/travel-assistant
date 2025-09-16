
# Travel Planning App

A comprehensive travel planning application with AI-powered recommendations, interactive maps, and personalized itineraries.

## 🚀 Features

### ✅ Implemented
- **Multi-language Support** (English, Spanish, Hindi) - Complete translations
- **User Authentication** (Signup/Login with validation)
- **Protected Routes** with authentication
- **Travel Planning Interface** with:
  - Interactive map placeholder (ready for Google Maps integration)
  - AI chatbot interface (ready for ChatGPT integration)
  - Recommended places list with ratings and reviews
  - Route optimization display
- **Responsive Design** with Tailwind CSS
- **Docker Support** for containerization

### 🔄 Ready for Integration
- **ChatGPT API** integration for AI travel recommendations
- **Google Maps API** integration for interactive maps and directions
- **Backend API** integration for user data and place management
- **Database** integration for user preferences and saved itineraries

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + TanStack Query
- **Internationalization**: i18next
- **Containerization**: Docker + Docker Compose
- **API Integration**: ChatGPT API, Google Maps API (ready)

## 🚀 Quick Start

### Local Development
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build

# Access the app at http://localhost:3000
```

## 🔑 Test Credentials
- **Login password**: `abc12345`
- **Any name** works for login

## 📁 Project Structure

```
src/
├── app/                 # App-level providers and routing
│   ├── providers/      # Auth context provider
│   └── router.tsx      # Route configuration
├── components/         # Reusable UI components
│   └── forms/         # Form components
├── features/          # Feature-specific code
│   ├── auth/         # Authentication logic
│   └── i18n/         # Internationalization
├── pages/            # Route components
│   ├── Home.tsx      # Main travel planning interface
│   ├── Login.tsx     # Login page
│   ├── Signup.tsx    # Registration page
│   └── LanguageGate.tsx # Language selection
├── services/         # API integration services
│   ├── chatgpt.ts    # ChatGPT API service
│   └── googleMaps.ts # Google Maps API service
├── lib/             # Utilities
└── styles/          # Global styles
```

## 🔧 API Integration Setup

### Environment Variables
Copy `env.example` to `.env` and configure:

```env
VITE_CHATGPT_API_KEY=your_chatgpt_api_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
VITE_API_BASE_URL=http://localhost:3001
```

### ChatGPT Integration
The `chatGPTService` is ready for integration:
- Set API key: `chatGPTService.setApiKey(apiKey)`
- Send messages: `chatGPTService.sendMessage(messages)`
- Mock implementation available for development

### Google Maps Integration
The `googleMapsService` is ready for integration:
- Set API key: `googleMapsService.setApiKey(apiKey)`
- Search places: `googleMapsService.searchPlaces(query)`
- Get directions: `googleMapsService.getDirections(origin, destination)`
- Mock implementation available for development

## 🐳 Docker Configuration

### Dockerfile
Multi-stage build with Nginx for production deployment.

### Docker Compose
Includes services for:
- **Frontend**: React app (port 3000)
- **Backend**: Node.js API (port 3001) - placeholder
- **Database**: PostgreSQL (port 5432) - placeholder

### Nginx Configuration
- Client-side routing support
- Static asset caching
- API proxy configuration
- Security headers

## 👥 Team Integration

### Frontend Developer
- ✅ UI/UX implementation complete
- ✅ API service interfaces ready
- ✅ Docker configuration ready

### Backend Developer
- 🔄 API endpoints needed for:
  - User authentication
  - Place recommendations
  - Itinerary management
  - User preferences

### AI/ML Developer
- 🔄 ChatGPT API integration
- 🔄 Travel recommendation algorithms
- 🔄 Natural language processing

### Maps Developer
- 🔄 Google Maps API integration
- 🔄 Route optimization
- 🔄 Place search and details

## 🧪 Testing & Deployment

### Local Testing
```bash
# Development server
npm run dev          # Runs on http://localhost:5173/5174/5175

# Production preview
npm run preview      # Runs on http://localhost:4173

# Docker deployment
docker-compose up    # Runs on http://localhost:3000
```

### Test Credentials
- **Login password**: `abc12345`
- **Any name** works for login

### Complete Testing Flow
1. **Language Selection**: Choose EN/ES/HI → All content translates
2. **Authentication**: Login with any name + `abc12345`
3. **Main App**: Test chatbot, remove places, check responsive design
4. **Language Switching**: Change language anytime from any page

### Production Deployment
- **Vercel**: `npx vercel --yes`
- **Netlify**: `npx netlify deploy --prod --dir=dist`
- **Docker**: Use provided Dockerfile and docker-compose.yml

## 📱 App Flow & Website Output

### User Journey
1. **Language Selection** → Choose preferred language (EN/ES/HI)
2. **Authentication** → Sign up or login with `abc12345`
3. **Travel Planning** → Main interface with:
   - Chat with AI travel agent
   - View recommended places
   - Interactive map with routes
   - Manage itinerary

### Website Features
- **Language Selection Page**: Clean interface with 3 language options
- **Login Page**: Form with name/password, test credentials work
- **Signup Page**: Complete registration form with validation
- **Main Travel App**: 3-column layout with map, places, and chatbot
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Real-time Translation**: All content changes language instantly

## 🔮 Next Steps

1. **Backend Integration**: Connect to your teammate's API
2. **ChatGPT Integration**: Add real AI responses
3. **Google Maps Integration**: Add interactive maps
4. **Database Integration**: User data persistence
5. **Advanced Features**: Itinerary sharing, offline support

## 🐛 Development Notes

- MSW (Mock Service Worker) is used for API mocking in development
- All API services have mock implementations for testing
- Environment variables are prefixed with `VITE_` for client-side access
- Docker configuration includes proxy setup for backend integration
