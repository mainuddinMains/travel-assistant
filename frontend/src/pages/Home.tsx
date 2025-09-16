
import { useAuth } from '../app/providers/AuthProvider'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { chatGPTService, type ChatMessage as APIChatMessage, type TripDetails, type QuestionState } from '../services/chatgpt'
import { googleMapsService, type Place } from '../services/googleMaps'
import { SimpleGoogleMap } from '../components/SimpleGoogleMap'
import { ModernGoogleMap } from '../components/ModernGoogleMap'
import { FallbackMap } from '../components/FallbackMap'
import { ApiKeyInput } from '../components/ApiKeyInput'

// Place interface is now imported from googleMaps service

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  message: string
  timestamp: string
}

export function Home() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  
  console.log('Home component rendered, user:', user)

  // Initialize ChatGPT API key and backend
  useEffect(() => {
    const apiKey = import.meta.env.VITE_CHATGPT_API_KEY
    const useBackend = import.meta.env.VITE_USE_BACKEND_API === 'true'
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    console.log('Environment API key:', apiKey ? 'Present' : 'Missing')
    console.log('API key value:', apiKey === 'your_chatgpt_api_key_here' ? 'Placeholder (not configured)' : 'Configured')
    console.log('Use backend API:', useBackend)
    console.log('Google Maps API key:', googleMapsApiKey ? 'Present' : 'Missing')
    
    if (useBackend) {
      chatGPTService.setUseBackend(true)
      setApiStatus('configured')
      console.log('✅ Using backend API for trip planning')
    } else if (apiKey && apiKey !== 'your_chatgpt_api_key_here') {
      chatGPTService.setApiKey(apiKey)
      setApiStatus('configured')
      console.log('✅ ChatGPT API key configured successfully')
    } else {
      setApiStatus('mock')
      console.warn('⚠️ ChatGPT API key not configured, will use mock service')
    }

    // Initialize Google Maps service
    if (googleMapsApiKey && googleMapsApiKey !== 'your_google_maps_api_key_here') {
      googleMapsService.setApiKey(googleMapsApiKey)
      setApiKey(googleMapsApiKey)
      setUseGoogleMaps(true)
      console.log('✅ Google Maps API key configured successfully')
      
      // Auto-fallback timer - if Google Maps doesn't load within 10 seconds, use fallback
      const fallbackTimer = setTimeout(() => {
        if (!googleMapsError && !forceFallback) {
          console.log('🔄 Auto-fallback: Google Maps taking too long, switching to fallback map')
          setAutoFallback(true)
        }
      }, 10000)

      return () => clearTimeout(fallbackTimer)
    } else {
      setUseGoogleMaps(false)
      console.warn('⚠️ Google Maps API key not configured, will use fallback map')
      setShowApiKeyInput(true)
    }
  }, [])
  const [chatInput, setChatInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [apiStatus, setApiStatus] = useState<'loading' | 'configured' | 'mock'>('loading')
  const [questionState, setQuestionState] = useState<QuestionState>({
    currentQuestion: 0,
    answers: {},
    isComplete: false
  })
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [showRoute, setShowRoute] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [useGoogleMaps, setUseGoogleMaps] = useState(true)
  const [useModernMaps, setUseModernMaps] = useState(false)
  const [googleMapsError, setGoogleMapsError] = useState(false)
  const [forceFallback, setForceFallback] = useState(false)
  const [autoFallback, setAutoFallback] = useState(false)
  const [apiKey, setApiKey] = useState<string>('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>([
    {
      id: '1',
      name: 'Ruru Baked',
      description: 'Artisanal bakery known for fresh bread and pastries. Popular breakfast spot with outdoor seating.',
      rating: 4.5,
      reviews: 127,
      distance: '3.2 km',
      eta: '12 min',
      coordinates: { lat: 43.6532, lng: -79.3832 },
      address: '123 Queen St W, Toronto, ON',
      types: ['bakery', 'restaurant', 'food']
    },
    {
      id: '2',
      name: 'Bang Bang Ice Cream & Bakery',
      description: 'Creative ice cream flavors with unique Asian-inspired desserts and fresh baked goods.',
      rating: 4.3,
      reviews: 89,
      distance: '2.1 km',
      eta: '8 min',
      coordinates: { lat: 43.6519, lng: -79.3867 },
      address: '456 King St E, Toronto, ON',
      types: ['ice_cream_shop', 'bakery', 'food']
    }
  ])
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  // Initialize chat with first question
  useEffect(() => {
    if (chatMessages.length === 0) {
      const initialMessage: ChatMessage = {
        id: '1',
        sender: 'ai',
        message: "Hi! I'm your travel agent. Let's plan your perfect trip! First, which cities are you planning to visit?\n\n*Examples: Toronto, Montreal, Vancouver*",
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages([initialMessage])
    }
  }, [])

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: chatInput,
      timestamp: new Date().toLocaleTimeString()
    }

    setChatMessages(prev => [...prev, userMessage])
    const currentInput = chatInput
    setChatInput('')
    setIsLoading(true)

    try {
      // Update question state from service
      const currentQuestionState = chatGPTService.getQuestionState()
      setQuestionState(currentQuestionState)
      
      // Send message to ChatGPT service
      console.log('Sending message to ChatGPT service:', currentInput)
      const response = await chatGPTService.sendMessage([
        ...chatMessages.map(msg => ({
          role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.message
        })),
        { role: 'user', content: currentInput }
      ])
      console.log('ChatGPT response:', response)
      
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: response.message,
        timestamp: new Date().toLocaleTimeString()
      }

      setChatMessages(prev => [...prev, aiResponse])

      // If there are recommendations, search for places
      if (response.recommendations && response.recommendations.length > 0) {
        const searchQuery = response.recommendations[0].split(' - ')[0] // Get place name
        const places = await googleMapsService.searchPlacesMock(searchQuery)
        setRecommendedPlaces(prev => [...prev, ...places])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  const removePlace = (id: string) => {
    setRecommendedPlaces(prev => prev.filter(place => place.id !== id))
  }

  const handlePlaceClick = (place: Place) => {
    setSelectedPlace(place)
    // Scroll to the place in the recommended places list
    const element = document.getElementById(`place-${place.id}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleApiKeySet = (newApiKey: string) => {
    setApiKey(newApiKey)
    setUseGoogleMaps(true)
    setShowApiKeyInput(false)
    googleMapsService.setApiKey(newApiKey)
    console.log('✅ API key set from input:', newApiKey.substring(0, 10) + '...')
  }

  const toggleRoute = () => {
    setShowRoute(prev => !prev)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* API Key Input Modal */}
      {showApiKeyInput && (
        <ApiKeyInput 
          onApiKeySet={handleApiKeySet}
          currentApiKey={apiKey}
        />
      )}
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              {t('travelPlanner')} - {t('welcome')}, {user?.name}
            </h1>
            <button 
              className="btn" 
              onClick={() => { logout(); nav('/login') }}
            >
{t('logout')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          
          {/* Map Section - Left */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{t('interactiveMap')}</h2>
                  <div className="flex gap-2">
                    {recommendedPlaces.length >= 2 && (
                      <button
                        onClick={toggleRoute}
                        className={`px-3 py-1 text-sm rounded-full transition-colors ${
                          showRoute 
                            ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {showRoute ? '🛣️ Hide Route' : '🛣️ Show Route'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4" style={{ minHeight: '500px' }}>
                {useGoogleMaps && !googleMapsError && !forceFallback && !autoFallback ? (
                  useModernMaps ? (
                    <ModernGoogleMap
                      places={recommendedPlaces}
                      onPlaceClick={handlePlaceClick}
                      showRoute={showRoute}
                      className="w-full h-full"
                    />
                  ) : (
                    <SimpleGoogleMap
                      places={recommendedPlaces}
                      onPlaceClick={handlePlaceClick}
                      showRoute={showRoute}
                      className="w-full h-full"
                    />
                  )
                ) : (
                  <FallbackMap
                    places={recommendedPlaces}
                    onPlaceClick={handlePlaceClick}
                    showRoute={showRoute}
                    className="w-full h-full"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            
            {/* Recommended Places */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">{t('recommendedPlaces')}</h2>
              </div>
              <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                {recommendedPlaces.map((place, index) => (
                  <div 
                    key={place.id} 
                    id={`place-${place.id}`}
                    onClick={() => setSelectedPlace(place)}
                    className={`border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer ${
                      selectedPlace?.id === place.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{place.name}</h3>
                      <button 
                        onClick={() => removePlace(place.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{place.description}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-2">
                        <span>⭐ {place.rating}</span>
                        <span>({place.reviews} reviews)</span>
                      </div>
                      <div className="text-right">
                        <div>To next: {place.eta}</div>
                        <div>{place.distance}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chatbot */}
            <div className="bg-white rounded-lg shadow-sm border flex flex-col h-96">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold">{t('travelAgent')}</h2>
                  <div className="flex items-center space-x-2">
                    {apiStatus === 'configured' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        ChatGPT API
                      </span>
                    )}
                    {apiStatus === 'mock' && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Demo Mode
                      </span>
                    )}
                  </div>
                </div>
                {/* Question Progress Indicator */}
                {!questionState.isComplete && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Trip Planning Progress</span>
                      <span>{questionState.currentQuestion}/6 questions</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(questionState.currentQuestion / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg ${
                      message.sender === 'user' 
                        ? 'bg-blue-500 text-white' 
                        : 'bg-gray-100 text-gray-900'
                    }`}>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder={isLoading ? "AI is thinking..." : t('askAboutPlaces')}
                    disabled={isLoading}
                    className="flex-1 input text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !chatInput.trim()}
                    className="btn btn-primary px-3 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Documentation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">{t('features')}</h2>
              </div>
              <div className="p-4 space-y-3 text-sm">
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{t('travelAgent')}</h3>
                  <p className="text-gray-600">{t('chatbotDescription')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{t('recommendedPlaces')}</h3>
                  <p className="text-gray-600">{t('placesDescription')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">{t('interactiveMap')}</h3>
                  <p className="text-gray-600">{t('mapDescription')}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Integration Ready</h3>
                  <p className="text-gray-600">{t('integrationReady')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
