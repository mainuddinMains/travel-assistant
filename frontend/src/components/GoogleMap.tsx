import React, { useEffect, useRef, useState } from 'react'
import { googleMapsService, type Place, type Route } from '../services/googleMaps'

interface GoogleMapProps {
  places: Place[]
  center?: { lat: number; lng: number }
  zoom?: number
  onPlaceClick?: (place: Place) => void
  showRoute?: boolean
  className?: string
}

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

export function GoogleMap({ 
  places, 
  center = { lat: 43.6532, lng: -79.3832 }, // Default to Toronto
  zoom = 13,
  onPlaceClick,
  showRoute = false,
  className = "w-full h-96"
}: GoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize Google Maps
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    
    if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
      setError('Google Maps API key not configured')
      return
    }

    // Set API key in service
    googleMapsService.setApiKey(apiKey)

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
      return
    }

    // Load Google Maps script
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`
    script.async = true
    script.defer = true

    // Set up callback
    window.initMap = () => {
      initializeMap()
    }

    script.onerror = () => {
      setError('Failed to load Google Maps')
    }

    document.head.appendChild(script)

    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
      delete (window as any).initMap
    }
  }, [])

  const initializeMap = () => {
    if (!mapRef.current || !window.google) return

    try {
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

      setIsLoaded(true)
      setError(null)
    } catch (err) {
      setError('Failed to initialize map')
      console.error('Map initialization error:', err)
    }
  }

  // Update markers when places change
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) return

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
      } else {
        console.error('Directions request failed:', status)
      }
    })
  }, [places, showRoute, isLoaded])

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
          <p className="text-gray-600 text-sm">{error}</p>
          <p className="text-gray-500 text-xs mt-2">
            Please configure your Google Maps API key in the environment variables.
          </p>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 border border-gray-300 rounded-lg`}>
        <div className="text-center p-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600 text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div ref={mapRef} className={className} />
      
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


