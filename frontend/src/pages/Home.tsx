
import { useAuth } from '../app/providers/AuthProvider'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect, useMemo } from 'react'
import { chatGPTService, type QuestionState } from '../services/chatgpt'
import { googleMapsService, type Place } from '../services/googleMaps'
import { SimpleGoogleMapFixed as SimpleGoogleMap } from '../components/SimpleGoogleMapFixed'
import { ModernGoogleMapWrapper } from '../components/ModernGoogleMapWrapper'
import { FallbackMap } from '../components/FallbackMap'
import { ApiKeyInput } from '../components/ApiKeyInput'
import { LanguageSwitcher } from '../components/LanguageSwitcher'

interface ChatMessage {
  id: string
  sender: 'user' | 'ai'
  message: string
  timestamp: string
}

const DEFAULT_PLACE_IDS = ['1', '2']

const DEFAULT_PLACE_MAP = {
  '1': {
    coordinates: { lat: 43.6532, lng: -79.3832 },
    address: '123 Queen St W, Toronto, ON',
    rating: 4.5,
    reviews: 127,
    distance: '3.2 km',
    eta: '12 min',
    types: ['bakery', 'restaurant', 'food']
  },
  '2': {
    coordinates: { lat: 43.6519, lng: -79.3867 },
    address: '456 King St E, Toronto, ON',
    rating: 4.3,
    reviews: 89,
    distance: '2.1 km',
    eta: '8 min',
    types: ['ice_cream_shop', 'bakery', 'food']
  }
} satisfies Record<string, Omit<Place, 'id' | 'name' | 'description'>>

export function Home() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()

  useEffect(() => {
    const apiKey = import.meta.env.VITE_CHATGPT_API_KEY
    const useBackend = import.meta.env.VITE_USE_BACKEND_API === 'true'
    const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (useBackend) {
      chatGPTService.setUseBackend(true)
      setApiStatus('configured')
    } else if (apiKey && apiKey !== 'your_chatgpt_api_key_here') {
      chatGPTService.setApiKey(apiKey)
      setApiStatus('configured')
    } else {
      setApiStatus('mock')
    }

    if (googleMapsApiKey && googleMapsApiKey !== 'your_google_maps_api_key_here') {
      googleMapsService.setApiKey(googleMapsApiKey)
      setApiKey(googleMapsApiKey)
      setUseGoogleMaps(true)
    } else {
      setUseGoogleMaps(false)
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
  const defaultPlaces = useMemo<Place[]>(() => [
    {
      id: '1',
      name: t('home.samplePlaces.ruru.name'),
      description: t('home.samplePlaces.ruru.description'),
      ...DEFAULT_PLACE_MAP['1']
    },
    {
      id: '2',
      name: t('home.samplePlaces.bangBang.name'),
      description: t('home.samplePlaces.bangBang.description'),
      ...DEFAULT_PLACE_MAP['2']
    }
  ], [t])
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [showRoute, setShowRoute] = useState(false)
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null)
  const [useGoogleMaps, setUseGoogleMaps] = useState(true)
  const [useWrapperMaps, setUseWrapperMaps] = useState(true)
  const [googleMapsError, setGoogleMapsError] = useState(false)
  const [apiKey, setApiKey] = useState<string>('')
  const [showApiKeyInput, setShowApiKeyInput] = useState(false)
  const [recommendedPlaces, setRecommendedPlaces] = useState<Place[]>(defaultPlaces)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setRecommendedPlaces(prev =>
      prev.map(place => {
        if (!DEFAULT_PLACE_IDS.includes(place.id)) {
          return place
        }

        if (place.id === '1') {
          return {
            ...place,
            name: t('home.samplePlaces.ruru.name'),
            description: t('home.samplePlaces.ruru.description')
          }
        }

        if (place.id === '2') {
          return {
            ...place,
            name: t('home.samplePlaces.bangBang.name'),
            description: t('home.samplePlaces.bangBang.description')
          }
        }

        return place
      })
    )
  }, [t])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  useEffect(() => {
    if (chatMessages.length === 0) {
      const initialMessage: ChatMessage = {
        id: '1',
        sender: 'ai',
        message: t('home.chatInitial'),
        timestamp: new Date().toLocaleTimeString()
      }
      setChatMessages([initialMessage])
    }
  }, [chatMessages.length, t])

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
      const currentQuestionState = chatGPTService.getQuestionState()
      setQuestionState(currentQuestionState)

      const response = await chatGPTService.sendMessage([
        ...chatMessages.map(msg => ({
          role: msg.sender === 'user' ? ('user' as const) : ('assistant' as const),
          content: msg.message
        })),
        { role: 'user', content: currentInput }
      ])

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: response.message,
        timestamp: new Date().toLocaleTimeString()
      }

      setChatMessages(prev => [...prev, aiResponse])

      if (response.recommendations && response.recommendations.length > 0) {
        const searchQuery = response.recommendations[0].split(' - ')[0]
        const places = await googleMapsService.searchPlacesMock(searchQuery)
        setRecommendedPlaces(prev => [...prev, ...places])
      }
    } catch (error) {
      console.error('Error sending message:', error)
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: t('home.chatError'),
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
  }

  const toggleRoute = () => {
    setShowRoute(prev => !prev)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-travel-neutral-lightest to-travel-neutral-light/20">
      {showApiKeyInput && (
        <ApiKeyInput 
          onApiKeySet={handleApiKeySet}
          currentApiKey={apiKey}
        />
      )}
      <header className="bg-white shadow-travel-md border-b border-travel-neutral-light/30 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4 py-4">
            <h1 className="text-xl font-heading font-semibold bg-gradient-to-r from-travel-primary to-travel-primaryLight bg-clip-text text-transparent">
              ✈️ {t('nav.appName')} · {t('nav.welcome', { name: user?.name ?? '' })}
            </h1>
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              <button 
                className="btn transition-smooth hover-lift" 
                onClick={() => { logout(); nav('/login') }}
              >
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-8rem)]">
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-travel-lg border border-travel-neutral-light/20 overflow-hidden hover-lift transition-smooth">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-travel-neutral-light/20 bg-gradient-to-r from-white to-travel-neutral-lightest/50">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-heading font-semibold text-travel-neutral flex items-center gap-2">
                    <span className="text-2xl">🗺️</span> {t('home.interactiveMap')}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setUseWrapperMaps(!useWrapperMaps)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all duration-300 font-medium hover:scale-105 ${
                        useWrapperMaps 
                          ? 'bg-gradient-to-r from-travel-primary to-travel-primaryLight text-white shadow-travel-md' 
                          : 'bg-travel-neutral-lightest text-travel-neutral hover:bg-travel-neutral-light/30'
                      }`}
                    >
                      {useWrapperMaps ? `🗺️ ${t('home.toggleWrapper')}` : `🗺️ ${t('home.toggleLegacy')}`}
                    </button>
                    {recommendedPlaces.length >= 2 && (
                      <button
                        onClick={toggleRoute}
                        className={`px-3 py-1.5 text-sm rounded-full transition-all duration-300 font-medium hover:scale-105 ${
                          showRoute 
                            ? 'bg-gradient-to-r from-travel-secondary to-travel-secondaryLight text-white shadow-travel-md' 
                            : 'bg-travel-neutral-lightest text-travel-neutral hover:bg-travel-neutral-light/30'
                        }`}
                      >
                        {showRoute ? `🛣️ ${t('home.toggleRouteHide')}` : `🛣️ ${t('home.toggleRouteShow')}`}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex-1 p-4" style={{ minHeight: '500px' }}>
                {useGoogleMaps && !googleMapsError && apiKey ? (
                  useWrapperMaps ? (
                    <ModernGoogleMapWrapper
                      places={recommendedPlaces}
                      onPlaceClick={handlePlaceClick}
                      showRoute={showRoute}
                      className="w-full h-full"
                      apiKey={apiKey}
                    />
                  ) : (
                    <SimpleGoogleMap
                      places={recommendedPlaces}
                      onPlaceClick={handlePlaceClick}
                      showRoute={showRoute}
                      className="w-full h-full"
                      onError={() => {
                        setGoogleMapsError(true)
                      }}
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

          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-travel-lg border border-travel-neutral-light/20 overflow-hidden hover-lift transition-smooth">
              <div className="p-4 border-b border-travel-neutral-light/20 bg-gradient-to-r from-white to-travel-neutral-lightest/50">
                <h2 className="text-lg font-heading font-semibold text-travel-neutral flex items-center gap-2">
                  <span className="text-2xl">📍</span> {t('home.recommendedPlaces')}
                </h2>
              </div>
              <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                {recommendedPlaces.map((place, index) => (
                  <div 
                    key={place.id} 
                    id={`place-${place.id}`}
                    onClick={() => setSelectedPlace(place)}
                    className={`border-2 rounded-xl p-4 transition-all duration-300 cursor-pointer group ${
                      selectedPlace?.id === place.id 
                        ? 'ring-4 ring-travel-primary/30 bg-gradient-to-br from-travel-primary/5 to-white border-travel-primary shadow-travel-md scale-[1.02]' 
                        : 'border-travel-neutral-light/30 bg-white hover:border-travel-primary/50 hover:bg-travel-neutral-lightest/50 hover:shadow-travel-sm'
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-heading font-semibold text-travel-neutral group-hover:text-travel-primary transition-colors">{place.name}</h3>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          removePlace(place.id);
                        }}
                        className="text-travel-accent hover:text-red-700 hover:scale-110 transition-all duration-200"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-sm text-travel-neutral/80 mb-3 leading-relaxed">{place.description}</p>
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-yellow-500">⭐ {place.rating}</span>
                        <span className="text-gray-500">{t('home.reviewsLabel', { count: place.reviews })}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-travel-primary font-semibold">⏱️ {place.eta}</div>
                        <div className="text-travel-neutral/60">📍 {place.distance}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-travel-lg border border-travel-neutral-light/20 flex flex-col h-96 overflow-hidden hover-lift transition-smooth">
              <div className="p-4 border-b border-travel-neutral-light/20 bg-gradient-to-r from-white to-travel-neutral-lightest/50">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-heading font-semibold text-travel-neutral flex items-center gap-2">
                    <span className="text-2xl">🤖</span> {t('home.travelAgent')}
                  </h2>
                  <div className="flex items-center space-x-2">
                    {apiStatus === 'configured' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-travel-secondary to-travel-secondaryLight text-white shadow-travel-sm">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0ল-4-4আ1 1 0 011.414-1.414L8 12.586l7.293-7.293আ1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {t('home.mapStatusConfigured')}
                      </span>
                    )}
                    {apiStatus === 'mock' && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-travel-neutral-light to-[#E5BCA3] text-travel-neutral shadow-travel-sm">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98ল5.58-9.92zM11 13আ1 1 0 11-2 0লয1 1 0 012 0zm-1-8আ1 1 0 00-1 1v3আ1 1 0 002 0V6আ1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {t('home.mapStatusMock')}
                      </span>
                    )}
                  </div>
                </div>
                {!questionState.isComplete && (
                  <div className="mt-3 animate-slide-up">
                    <div className="flex justify-between text-xs text-travel-neutral mb-2">
                      <span className="font-semibold">{t('home.tripProgress')}</span>
                      <span className="font-semibold text-travel-primary">{t('home.tripProgressSteps', { count: questionState.currentQuestion })}</span>
                    </div>
                    <div className="w-full bg-travel-neutral-lightest rounded-full h-2.5 overflow-hidden">
                      <div 
                        className="progress-fill h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${(questionState.currentQuestion / 6) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gradient-to-b from-white to-travel-neutral-lightest/30">
                {chatMessages.map((message) => (
                  <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}>
                    <div className={`max-w-xs px-4 py-3 rounded-2xl shadow-travel-sm transition-all duration-300 hover:scale-[1.02] ${
                      message.sender === 'user' 
                        ? 'bg-gradient-to-r from-travel-primary to-travel-primaryLight text-white shadow-travel-md' 
                        : 'bg-white text-travel-neutral border border-travel-neutral-light/30'
                    }`}>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.message}</p>
                      <p className="text-xs opacity-70 mt-2">{message.timestamp}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              <div className="p-4 border-t border-travel-neutral-light/20 bg-white">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                    placeholder={isLoading ? t('home.thinkingPlaceholder') : t('home.askPlaceholder')}
                    disabled={isLoading}
                    className="flex-1 input text-sm"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={isLoading || !chatInput.trim()}
                    className="btn btn-primary px-3 disabled:opacity-50 disabled:cursor-not-allowed transition-smooth"
                  >
                    {isLoading ? (
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938ল3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-travel-lg border border-travel-neutral-light/20 overflow-hidden hover-lift transition-smooth">
              <div className="p-4 border-b border-travel-neutral-light/20 bg-gradient-to-r from-white to-travel-neutral-lightest/50">
                <h2 className="text-lg font-heading font-semibold text-travel-neutral flex items-center gap-2">
                  <span className="text-2xl">✨</span> {t('home.features')}
                </h2>
              </div>
              <div className="p-4 space-y-4 text-sm">
                <div className="p-3 rounded-xl bg-gradient-to-br from-travel-primary/5 to-transparent transition-all duration-300 hover:shadow-travel-sm">
                  <h3 className="font-heading font-semibold text-travel-neutral mb-2 flex items-center gap-2">
                    <span className="text-lg">🤖</span> {t('home.travelAgent')}
                  </h3>
                  <p className="text-travel-neutral/80 leading-relaxed">{t('home.chatbotDescription')}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-travel-secondary/5 to-transparent transition-all duration-300 hover:shadow-travel-sm">
                  <h3 className="font-heading font-semibold text-travel-neutral mb-2 flex items-center gap-2">
                    <span className="text-lg">📍</span> {t('home.recommendedPlaces')}
                  </h3>
                  <p className="text-travel-neutral/80 leading-relaxed">{t('home.placesDescription')}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-travel-accent/5 to-transparent transition-all duration-300 hover:shadow-travel-sm">
                  <h3 className="font-heading font-semibold text-travel-neutral mb-2 flex items-center gap-2">
                    <span className="text-lg">🗺️</span> {t('home.interactiveMap')}
                  </h3>
                  <p className="text-travel-neutral/80 leading-relaxed">{t('home.mapDescription')}</p>
                </div>
                <div className="p-3 rounded-xl bg-gradient-to-br from-travel-neutral-light/20 to-transparent transition-all duration-300 hover:shadow-travel-sm">
                  <h3 className="font-heading font-semibold text-travel-neutral mb-2 flex items-center gap-2">
                    <span className="text-lg">🔗</span> {t('home.integrationReady')}
                  </h3>
                  <p className="text-travel-neutral/80 leading-relaxed">{t('home.integrationDescription')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
