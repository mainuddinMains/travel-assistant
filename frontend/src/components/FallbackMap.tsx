import React from 'react'
import { useTranslation } from 'react-i18next'
import { type Place } from '../services/googleMaps'

interface FallbackMapProps {
  places: Place[]
  onPlaceClick?: (place: Place) => void
  showRoute?: boolean
  className?: string
  style?: React.CSSProperties
}

export function FallbackMap({ 
  places, 
  onPlaceClick,
  showRoute = false,
  className = "w-full h-96",
  style
}: FallbackMapProps) {
  const { t } = useTranslation()
  
  const handlePlaceClick = (place: Place) => {
    if (onPlaceClick) {
      onPlaceClick(place)
    }
  }

  return (
    <div 
      className={`${className} relative bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg overflow-hidden`}
      style={{ minHeight: '400px', minWidth: '300px', ...style }}
    >
      {/* Map-like background */}
      <div className="absolute inset-0 opacity-20">
        <div className="w-full h-full bg-gradient-to-br from-green-400 to-blue-500"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 20% 20%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 40% 60%, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px, 80px 80px, 60px 60px'
        }}></div>
      </div>

      {/* Places as interactive markers */}
      <div className="relative z-10 p-4 h-full">
        {places.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-white">
              <div className="text-6xl mb-4">🗺️</div>
              <h3 className="text-xl font-bold mb-2">{t('fallbackMap.title')}</h3>
              <p className="text-blue-100">{t('fallbackMap.subtitle')}</p>
            </div>
          </div>
        ) : (
          <div className="relative h-full">
            {/* Place markers positioned on the map */}
            {places.map((place, index) => {
              // Distribute places across the map area
              const positions = [
                { top: '20%', left: '30%' },
                { top: '40%', left: '60%' },
                { top: '60%', left: '25%' },
                { top: '30%', left: '70%' },
                { top: '70%', left: '50%' },
                { top: '50%', left: '15%' }
              ]
              
              const position = positions[index % positions.length]
              
              return (
                <div
                  key={place.id}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={position}
                  onClick={() => handlePlaceClick(place)}
                >
                  {/* Marker */}
                  <div className="relative">
                    <div className="w-10 h-10 bg-red-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white font-bold text-sm hover:scale-110 transition-transform">
                      {index + 1}
                    </div>
                    
                    {/* Info window on hover */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <div className="bg-white rounded-lg shadow-lg p-3 min-w-48 max-w-64">
                        <h4 className="font-bold text-gray-900 text-sm mb-1">{place.name}</h4>
                        <p className="text-gray-600 text-xs mb-2">{place.description}</p>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-yellow-500">⭐ {place.rating}</span>
                          <span className="text-gray-500">{t('home.reviewsLabel', { count: place.reviews })}</span>
                        </div>
                        <p className="text-gray-500 text-xs mt-1">{place.address}</p>
                        <div className="flex gap-3 text-xs text-gray-500 mt-2">
                          <span>📍 {place.distance}</span>
                          <span>⏱️ {place.eta}</span>
                        </div>
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* Route lines if enabled */}
            {showRoute && places.length >= 2 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {places.slice(0, -1).map((place, index) => {
                  const nextPlace = places[index + 1]
                  const startPos = [
                    { x: '30%', y: '20%' },
                    { x: '60%', y: '40%' },
                    { x: '25%', y: '60%' },
                    { x: '70%', y: '30%' },
                    { x: '50%', y: '70%' },
                    { x: '15%', y: '50%' }
                  ]
                  const endPos = [
                    { x: '60%', y: '40%' },
                    { x: '25%', y: '60%' },
                    { x: '70%', y: '30%' },
                    { x: '50%', y: '70%' },
                    { x: '15%', y: '50%' },
                    { x: '30%', y: '20%' }
                  ]
                  
                  const start = startPos[index % startPos.length]
                  const end = endPos[index % endPos.length]
                  
                  return (
                    <line
                      key={`route-${index}`}
                      x1={start.x}
                      y1={start.y}
                      x2={end.x}
                      y2={end.y}
                      stroke="#ff6b6b"
                      strokeWidth="3"
                      strokeDasharray="5,5"
                      opacity="0.8"
                    />
                  )
                })}
              </svg>
            )}
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title={t('home.fitPlaces')}
        >
          📍 {t('home.fitPlaces')}
        </button>
        
        {places.length >= 2 && (
          <button
            className="block w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title={showRoute ? t('fallbackMap.toggleRoute.hide') : t('fallbackMap.toggleRoute.show')}
          >
            🛣️ {showRoute ? t('fallbackMap.toggleRoute.hide') : t('fallbackMap.toggleRoute.show')}
          </button>
        )}
      </div>

      {/* Places counter */}
      {places.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm text-gray-700">{t('home.placesOnMap', { count: places.length })}</p>
        </div>
      )}

      {/* Google Maps setup notice */}
      <div className="absolute bottom-4 right-4 bg-yellow-100 border border-yellow-300 rounded-lg p-2 max-w-xs">
        <p className="text-xs text-yellow-800">
          <strong>💡</strong> {t('fallbackMap.demoNotice')}
        </p>
      </div>
    </div>
  )
}
