import React, { useEffect, useRef, useState } from 'react'
import { type Place } from '../services/googleMaps'

interface ModernGoogleMapProps {
  places: Place[]
  center?: { lat: number; lng: number }
  zoom?: number
  onPlaceClick?: (place: Place) => void
  showRoute?: boolean
  className?: string
  style?: React.CSSProperties
}

declare global {
  interface Window {
    google: any
  }
}

export function ModernGoogleMap({ 
  places, 
  center = { lat: 43.6532, lng: -79.3832 }, // Default to Toronto
  zoom = 13,
  onPlaceClick,
  showRoute = false,
  className = "w-full h-96",
  style
}: ModernGoogleMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const directionsServiceRef = useRef<any>(null)
  const directionsRendererRef = useRef<any>(null)
  
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Initialize map using modern Google Maps API
  useEffect(() => {
    const initializeMap = async () => {
      if (!mapRef.current) {
        setError('Map container not found')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)
        
        console.log('Loading Google Maps libraries...')
        
        // Load required libraries dynamically
        const { Map } = await window.google.maps.importLibrary('maps')
        const { Marker } = await window.google.maps.importLibrary('marker')
        const { DirectionsService, DirectionsRenderer } = await window.google.maps.importLibrary('routes')
        
        console.log('Google Maps libraries loaded successfully')
        
        // Create map
        mapInstanceRef.current = new Map(mapRef.current, {
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
        directionsServiceRef.current = new DirectionsService()
        directionsRendererRef.current = new DirectionsRenderer({
          draggable: false,
          suppressMarkers: true
        })
        directionsRendererRef.current.setMap(mapInstanceRef.current)

        console.log('Modern Google Maps initialized successfully')
        setIsLoaded(true)
        setLoading(false)
        
      } catch (err) {
        console.error('Modern map initialization error:', err)
        setError('Failed to initialize map: ' + (err as Error).message)
        setLoading(false)
      }
    }

    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      initializeMap()
    } else {
      setError('Google Maps not loaded. Please check your API key.')
      setLoading(false)
    }
  }, [center, zoom])

  // Update markers when places change
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current || !window.google) return

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current = []

    // Add new markers
    places.forEach((place, index) => {
      if (place.coordinates.lat && place.coordinates.lng) {
        const marker = new window.google.maps.Marker({
          position: { lat: place.coordinates.lat, lng: place.coordinates.lng },
          map: mapInstanceRef.current,
          title: place.name,
          label: {
            text: (index + 1).toString(),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '12px'
          }
        })

        // Add click listener
        marker.addListener('click', () => {
          if (onPlaceClick) {
            onPlaceClick(place)
          }
        })

        markersRef.current.push(marker)
      }
    })

    // Fit map to show all markers
    if (markersRef.current.length > 0 && mapInstanceRef.current) {
      const bounds = new window.google.maps.LatLngBounds()
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition())
      })
      mapInstanceRef.current.fitBounds(bounds)
    }
  }, [places, isLoaded, onPlaceClick])

  // Handle route display
  useEffect(() => {
    if (!isLoaded || !directionsServiceRef.current || !directionsRendererRef.current) return

    if (showRoute && places.length >= 2) {
      const waypoints = places.slice(1, -1).map(place => ({
        location: { lat: place.coordinates.lat!, lng: place.coordinates.lng! },
        stopover: true
      }))

      const request = {
        origin: { lat: places[0].coordinates.lat!, lng: places[0].coordinates.lng! },
        destination: { lat: places[places.length - 1].coordinates.lat!, lng: places[places.length - 1].coordinates.lng! },
        waypoints: waypoints,
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
    } else {
      directionsRendererRef.current.setDirections({ routes: [] })
    }
  }, [showRoute, places, isLoaded])

  if (loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading modern map...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50 rounded-lg border border-red-200`}>
        <div className="text-center p-4">
          <div className="text-red-500 text-4xl mb-2">🗺️</div>
          <p className="text-red-700 font-medium">Map Error</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <p className="text-red-500 text-xs mt-2">Using modern Google Maps API</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} style={style}>
      <div 
        ref={mapRef} 
        className="w-full h-full rounded-lg shadow-lg"
        style={{ minHeight: '400px', minWidth: '300px' }}
      />
      {isLoaded && (
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded shadow text-xs text-gray-600">
          Modern Maps API
        </div>
      )}
    </div>
  )
}
