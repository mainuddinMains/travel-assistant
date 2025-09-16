import React, { useEffect, useRef, useState } from 'react'
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
    google: any
    initMap: () => void
  }
}

export function SimpleGoogleMap({ 
  places, 
  center = { lat: 43.6532, lng: -79.3832 }, // Default to Toronto
  zoom = 13,
  onPlaceClick,
  showRoute = false,
  className = "w-full h-96",
  style,
  onError
}: SimpleGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [containerReady, setContainerReady] = useState(false)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Callback ref to ensure container is ready
  const setMapRef = (node: HTMLDivElement | null) => {
    if (node) {
      console.log('Map container ref set:', node)
      mapRef.current = node
      setContainerReady(true)
    }
  }

  // Ensure container is ready
  useEffect(() => {
    const checkContainer = () => {
      if (mapRef.current) {
        console.log('Map container is ready:', mapRef.current)
        const rect = mapRef.current.getBoundingClientRect()
        console.log('Container dimensions:', rect.width, 'x', rect.height)
        console.log('Container parent:', mapRef.current.parentElement)
        console.log('Container in DOM:', document.contains(mapRef.current))
      } else {
        console.log('Map container not ready yet')
        console.log('mapRef.current is null')
      }
    }
    
    // Check immediately and after delays
    checkContainer()
    setTimeout(checkContainer, 100)
    setTimeout(checkContainer, 500)
    setTimeout(checkContainer, 1000)
  }, [containerReady])

  // Initialize Google Maps
  useEffect(() => {
    let apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    console.log('Google Maps API Key from env:', apiKey ? 'Present' : 'Missing')
    console.log('API Key value:', apiKey)
    console.log('Environment:', import.meta.env)
    
    // Fallback: try to get API key from URL parameters or localStorage
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.log('Trying fallback methods for API key...')
      
      // Try URL parameter
      const urlParams = new URLSearchParams(window.location.search)
      const urlApiKey = urlParams.get('apiKey')
      if (urlApiKey) {
        apiKey = urlApiKey
        console.log('Using API key from URL parameter')
      }
      
      // Try localStorage
      const storedApiKey = localStorage.getItem('google_maps_api_key')
      if (storedApiKey && !apiKey) {
        apiKey = storedApiKey
        console.log('Using API key from localStorage')
      }
    }
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      console.error('API key not found in environment variables, URL, or localStorage')
      setError('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file or use ?apiKey=YOUR_KEY in the URL.')
      setLoading(false)
      return
    }
    
    console.log('Using API key:', apiKey.substring(0, 10) + '...')

    // Add global error handler for Google Maps
    const handleGoogleMapsError = (error: any) => {
      console.error('Google Maps global error:', error)
      setError('Google Maps API error. Please check your API key and try the fallback map.')
      setLoading(false)
      if (onError) onError()
    }

    // Set up global error handler
    window.addEventListener('error', handleGoogleMapsError)
    window.addEventListener('unhandledrejection', handleGoogleMapsError)

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      console.log('Google Maps already loaded')
      // Wait a bit for the DOM to be ready
      setTimeout(initializeMap, 50)
      return
    }

    // Load Google Maps script
    console.log('Loading Google Maps script...')
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true

    // Set up callback with error handling
    window.initMap = () => {
      console.log('Google Maps script loaded successfully')
      try {
        // Wait a bit for the DOM to be ready
        setTimeout(initializeMap, 100)
      } catch (error) {
        console.error('Error in initMap callback:', error)
        setError('Google Maps initialization failed: ' + (error as Error).message)
        setLoading(false)
        if (onError) onError()
      }
    }

    script.onerror = (error) => {
      console.error('Failed to load Google Maps script:', error)
      setError('Failed to load Google Maps. Please check your API key and internet connection.')
      setLoading(false)
      if (onError) onError()
    }

    script.onload = () => {
      console.log('Google Maps script loaded successfully')
    }

    // Add timeout to detect if script never loads
    const timeout = setTimeout(() => {
      if (!window.google || !window.google.maps) {
        console.error('Google Maps script loading timeout')
        setError('Google Maps failed to load within 10 seconds. Please check your API key.')
        setLoading(false)
        if (onError) onError()
      }
    }, 10000)

    document.head.appendChild(script)

    return () => {
      // Cleanup
      clearTimeout(timeout)
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      delete window.initMap
      
      // Remove event listeners
      window.removeEventListener('error', handleGoogleMapsError)
      window.removeEventListener('unhandledrejection', handleGoogleMapsError)
    }
  }, [])

  const initializeMap = () => {
    console.log('initializeMap called')
    console.log('mapRef.current:', mapRef.current)
    
    // Wait for the DOM to be ready
    if (!mapRef.current) {
      console.error('Map container not available, retrying...')
      // Retry after a short delay
      setTimeout(() => {
        if (mapRef.current) {
          console.log('Map container found on retry, initializing...')
          initializeMap()
        } else {
          console.error('Map container still not found after retry')
          console.log('Falling back to error state')
          setError('Map container not found after retry. Please try refreshing the page.')
          setLoading(false)
        }
      }, 500)
      return
    }

    // Check if the container has dimensions
    const rect = mapRef.current.getBoundingClientRect()
    console.log('Container rect:', rect)
    if (rect.width === 0 || rect.height === 0) {
      console.log('Map container has no dimensions, waiting...')
      setTimeout(initializeMap, 200)
      return
    }

    if (!window.google || !window.google.maps) {
      console.error('Google Maps not available')
      setError('Google Maps failed to load. Please check your API key and internet connection.')
      setLoading(false)
      if (onError) onError()
      return
    }

    try {
      console.log('Initializing Google Maps...')
      console.log('Map container element:', mapRef.current)
      console.log('Google Maps object:', window.google)
      
      // Create map
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

      // Initialize directions service
      directionsServiceRef.current = new window.google.maps.DirectionsService()
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        draggable: false,
        suppressMarkers: true
      })
      directionsRendererRef.current.setMap(mapInstanceRef.current)

      console.log('Google Maps initialized successfully')
      setIsLoaded(true)
      setError(null)
      setLoading(false)
    } catch (err) {
      console.error('Map initialization error:', err)
      setError('Failed to initialize map: ' + (err as Error).message)
      setLoading(false)
      if (onError) onError()
    }
  }

  // Update markers when places change
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

    console.log('Updating markers for places:', places.length)

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    places.forEach((place, index) => {
      const marker = new window.google.maps.Marker({
        position: place.coordinates,
        map: mapInstanceRef.current,
        title: place.name,
        label: {
          text: (index + 1).toString(),
          color: 'white',
          fontWeight: 'bold',
          fontSize: '12px'
        },
        icon: {
          url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
            <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
              <circle cx="20" cy="20" r="18" fill="#4285F4" stroke="white" stroke-width="2"/>
              <text x="20" y="26" text-anchor="middle" fill="white" font-size="14" font-weight="bold">${index + 1}</text>
            </svg>
          `)}`,
          scaledSize: new window.google.maps.Size(40, 40),
          anchor: new window.google.maps.Point(20, 20)
        }
      })

      // Add click listener
      marker.addListener('click', () => {
        if (onPlaceClick) {
          onPlaceClick(place)
        }
        
        // Show info window
        const infoWindow = new window.google.maps.InfoWindow({
          content: `
            <div style="padding: 10px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; color: #333; font-size: 16px;">${place.name}</h3>
              <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${place.description}</p>
              <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                <span style="color: #FFA500;">⭐ ${place.rating}</span>
                <span style="color: #666; font-size: 12px;">(${place.reviews} reviews)</span>
              </div>
              <p style="margin: 0; color: #666; font-size: 12px;">${place.address}</p>
              <div style="margin-top: 8px; display: flex; gap: 8px; font-size: 12px; color: #666;">
                <span>📍 ${place.distance}</span>
                <span>⏱️ ${place.eta}</span>
              </div>
            </div>
          `
        })
        infoWindow.open(mapInstanceRef.current, marker)
      })

      markersRef.current.push(marker)
    })

    // Fit map to show all markers
    if (places.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      places.forEach(place => {
        bounds.extend(place.coordinates)
      })
      mapInstanceRef.current.fitBounds(bounds)
      
      // Ensure minimum zoom level
      const listener = window.google.maps.event.addListener(mapInstanceRef.current, 'idle', () => {
        if (mapInstanceRef.current.getZoom() > 15) {
          mapInstanceRef.current.setZoom(15)
        }
        window.google.maps.event.removeListener(listener)
      })
    }
  }, [places, isLoaded, onPlaceClick])

  // Update route when showRoute changes
  useEffect(() => {
    if (!isLoaded || !showRoute || places.length < 2) return

    console.log('Updating route for places:', places.length)

    const waypoints = places.slice(1, -1).map(place => ({
      location: place.coordinates,
      stopover: true
    }))

    const request = {
      origin: places[0].coordinates,
      destination: places[places.length - 1].coordinates,
      waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      optimizeWaypoints: true
    }

    directionsServiceRef.current.route(request, (result: any, status: any) => {
      if (status === window.google.maps.DirectionsStatus.OK) {
        directionsRendererRef.current.setDirections(result)
        console.log('Route updated successfully')
      } else {
        console.error('Directions request failed:', status)
      }
    })
  }, [places, showRoute, isLoaded])

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`} style={{ minHeight: '400px', minWidth: '300px' }}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading Google Maps...</p>
          <p className="text-gray-500 text-xs mt-1">This may take a few seconds</p>
          <p className="text-gray-400 text-xs mt-2">Container ready: {containerReady ? 'Yes' : 'No'}</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center p-4">
          <div className="text-red-500 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Map Unavailable</h3>
          <p className="text-gray-600 text-sm mb-2">{error}</p>
          <div className="text-left text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <p className="font-medium mb-1">To fix this:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Get a Google Maps API key from Google Cloud Console</li>
              <li>Enable Maps JavaScript API and Places API</li>
              <li>Add the key to your .env file: VITE_GOOGLE_MAPS_API_KEY=your_key_here</li>
              <li>Restart the development server</li>
            </ol>
          </div>
        </div>
      </div>
    )
  }

  console.log('SimpleGoogleMap rendering, containerReady:', containerReady, 'mapRef.current:', !!mapRef.current)
  
  return (
    <div className="relative">
      <div 
        ref={setMapRef} 
        className={className}
        style={{ minHeight: '400px', minWidth: '300px', ...style }}
        data-testid="map-container"
      />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <button
          onClick={() => {
            if (places.length > 0) {
              const bounds = new window.google.maps.LatLngBounds()
              places.forEach(place => bounds.extend(place.coordinates))
              mapInstanceRef.current.fitBounds(bounds)
            }
          }}
          className="block w-full px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Fit to places"
        >
          📍 Fit Places
        </button>
        
        {places.length >= 2 && (
          <button
            onClick={() => {
              // Toggle route display
              if (showRoute) {
                directionsRendererRef.current.setDirections({ routes: [] })
              } else {
                // Re-trigger route calculation
                const waypoints = places.slice(1, -1).map(place => ({
                  location: place.coordinates,
                  stopover: true
                }))

                const request = {
                  origin: places[0].coordinates,
                  destination: places[places.length - 1].coordinates,
                  waypoints,
                  travelMode: window.google.maps.TravelMode.DRIVING,
                  optimizeWaypoints: true
                }

                directionsServiceRef.current.route(request, (result: any, status: any) => {
                  if (status === window.google.maps.DirectionsStatus.OK) {
                    directionsRendererRef.current.setDirections(result)
                  }
                })
              }
            }}
            className="block w-full px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            title="Toggle route"
          >
            🛣️ {showRoute ? 'Hide Route' : 'Show Route'}
          </button>
        )}
      </div>

      {/* Places Counter */}
      {places.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2">
          <p className="text-sm text-gray-700">
            <span className="font-medium">{places.length}</span> places on map
          </p>
        </div>
      )}
    </div>
  )
}
