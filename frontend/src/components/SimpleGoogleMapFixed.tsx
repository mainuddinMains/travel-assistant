import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { type Place } from '../services/googleMaps'

interface SimpleGoogleMapProps {
  places: Place[]
  center?: { lat: number; lng: number }
  zoom?: number
  onPlaceClick?: (place: Place) => void
  showRoute?: boolean
  className?: string
  style?: React.CSSProperties
  onError?: () => void
}

declare global {
  interface Window {
    google: typeof google
  }
}

export function SimpleGoogleMapFixed({ 
  places, 
  center = { lat: 43.6532, lng: -79.3832 },
  zoom = 13,
  onPlaceClick,
  showRoute = false,
  className = "w-full h-96",
  style,
  onError
}: SimpleGoogleMapProps) {
  const { t } = useTranslation()
  const mapRef = useRef<HTMLDivElement>(null)
  const [containerReady, setContainerReady] = useState(false)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (mapRef.current && !containerReady) {
      setContainerReady(true)
    }
  }, [containerReady])

  useEffect(() => {
    const checkRef = () => {
      if (mapRef.current && !containerReady) {
        setContainerReady(true)
      }
    }

    checkRef()
    setTimeout(checkRef, 100)
    setTimeout(checkRef, 500)
    setTimeout(checkRef, 1000)
    setTimeout(checkRef, 2000)
  }, [])

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true)
      setLoading(false)
    } else {
      const checkGoogleMaps = () => {
        if (window.google && window.google.maps) {
          setIsLoaded(true)
          setLoading(false)
        } else {
          setTimeout(checkGoogleMaps, 500)
        }
      }
      checkGoogleMaps()
    }
  }, [])

  useEffect(() => {
    if (isLoaded && containerReady && mapRef.current) {
      initializeMap()
    }
  }, [isLoaded, containerReady])

  const initializeMap = useCallback(() => {
    if (!mapRef.current) {
      setTimeout(() => {
        if (!mapRef.current) {
          setError(t('status.mapContainerMissing'))
          setLoading(false)
          onError?.()
        } else {
          initializeMap()
        }
      }, 1000)
      return
    }

    const rect = mapRef.current.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) {
      setTimeout(initializeMap, 200)
      return
    }

    if (!window.google || !window.google.maps) {
      setError(t('status.mapUnavailableDescription'))
      setLoading(false)
      onError?.()
      return
    }

    try {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center,
        zoom,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }]
          }
        ]
      })

      if (showRoute) {
        directionsServiceRef.current = new window.google.maps.DirectionsService()
        directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
          draggable: false,
          suppressMarkers: true
        })
        directionsRendererRef.current.setMap(mapInstanceRef.current)
      }

      setLoading(false)

      if (places && places.length > 0) {
        addMarkers(places)
      }

    } catch (err) {
      setError(t('status.apiError'))
      setLoading(false)
      onError?.()
    }
  }, [center, onError, places, showRoute, t, zoom])

  const addMarkers = useCallback((placesToAdd: Place[]) => {
    if (!mapInstanceRef.current || !window.google) return

    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    placesToAdd.forEach((place, index) => {
      const marker = new window.google.maps.Marker({
        position: place.coordinates,
        map: mapInstanceRef.current,
        title: place.name,
        label: (index + 1).toString()
      })

      if (onPlaceClick) {
        marker.addListener('click', () => {
          onPlaceClick(place)
        })
      }

      markersRef.current.push(marker)
    })

    if (placesToAdd.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      placesToAdd.forEach(place => {
        bounds.extend(place.coordinates)
      })
      mapInstanceRef.current.fitBounds(bounds)
    }
  }, [onPlaceClick])

  useEffect(() => {
    if (mapInstanceRef.current && places && places.length > 0) {
      addMarkers(places)
    }
  }, [addMarkers, places])

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
        <div className="text-center">
          <div className="mb-4">
            <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('status.mapUnavailable')}</h3>
          <p className="text-gray-600 text-sm mb-2">{error}</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gray-100 rounded-lg p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('status.mapLoading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div 
        ref={mapRef} 
        className={className}
        style={{ minHeight: '400px', minWidth: '300px', ...style }}
        data-testid="map-container"
      />
      {places.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm text-gray-700">{t('home.placesOnMap', { count: places.length })}</p>
        </div>
      )}
    </div>
  )
}

