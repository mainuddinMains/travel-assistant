/**
 * Maps Component - Phase 2
 * Google Maps integration with place markers and route polylines
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { type PlaceData } from '../../services/dashboardApi'
import { setupMapsErrorHandler } from './MapsErrorHandler'
import './Maps.css'

interface MapsProps {
      places?: PlaceData[]
      routePolylines?: any[]
      route?: { places?: Array<{ placeId: string }> } | null
      onPlaceClick?: (place: PlaceData, anchorElement: HTMLElement | null) => void
      onPlaceHover?: (place: PlaceData | null, anchorElement: HTMLElement | null, isClick?: boolean) => void
      googleMapsApiKey?: string
    }

declare global {
  interface Window {
    google: typeof google
    initMap: () => void
  }
}

export function Maps({ places = [], routePolylines = [], route, onPlaceClick, onPlaceHover, googleMapsApiKey }: MapsProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMapReady, setIsMapReady] = useState(false)
  const displayedPlaceIdsRef = useRef<Set<string>>(new Set())

  // Setup error handler for Google Maps internal errors
  useEffect(() => {
    setupMapsErrorHandler()
    return () => {
      // Cleanup is handled by the error handler itself
    }
  }, [])

  // Load Google Maps API
  useEffect(() => {
    const apiKey = googleMapsApiKey || import.meta.env.VITE_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.error('[Maps] Google Maps API key not provided')
      return
    }

    // Check if Google Maps is already loaded with all required libraries
    if (window.google?.maps?.Map && window.google?.maps?.geometry?.encoding) {
      setIsLoaded(true)
      return
    }

    // Check if script is already being loaded or exists
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)
    if (existingScript) {
      // Script is already loaded or loading, just wait for it
      const checkLoaded = setInterval(() => {
        if (window.google?.maps?.Map && window.google?.maps?.geometry?.encoding) {
          setIsLoaded(true)
          clearInterval(checkLoaded)
        }
      }, 100)
      
      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkLoaded)
        if (!window.google?.maps?.Map) {
          console.warn('[Maps] Google Maps took too long to load')
        }
      }, 10000)
      
      return () => clearInterval(checkLoaded)
    }

    // Create unique callback function to avoid conflicts
    const callbackName = `initMap_${Date.now()}`
    ;(window as any)[callbackName] = () => {
      // Wait a bit to ensure geometry library is fully loaded
      setTimeout(() => {
        if (window.google?.maps?.geometry?.encoding) {
          setIsLoaded(true)
        } else {
          console.warn('[Maps] Geometry library not ready, retrying...')
          setTimeout(() => setIsLoaded(true), 500)
        }
      }, 100)
      // Clean up callback
      delete (window as any)[callbackName]
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&callback=${callbackName}`
    script.async = true
    script.defer = true
    script.onerror = () => {
      console.error('[Maps] Failed to load Google Maps API')
      delete (window as any)[callbackName]
    }
    document.head.appendChild(script)

    return () => {
      // Don't remove script if it's already loaded (might be used by other components)
      // Just clean up callback
      delete (window as any)[callbackName]
    }
  }, [googleMapsApiKey])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return

    // Ensure all required APIs are available
    if (!window.google?.maps?.Map || !window.google?.maps?.Marker || !window.google?.maps?.LatLngBounds) {
      console.warn('[Maps] Google Maps APIs not fully loaded yet')
      return
    }

    try {
      const googleMap = new window.google.maps.Map(mapRef.current, {
        center: { lat: 49.2827, lng: -123.1207 }, // Vancouver default
        zoom: 12,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        gestureHandling: 'greedy',
        clickableIcons: false
      })

      // Wait for map to be fully ready before setting state
      googleMap.addListener('tilesloaded', () => {
        console.log('[Maps] ✓ Google Maps initialized and ready')
        setIsMapReady(true)
      })

      // Also listen for idle event (when map is fully loaded and ready)
      googleMap.addListener('idle', () => {
        setIsMapReady(true)
      })

      setMap(googleMap)
      console.log('[Maps] ✓ Google Maps initialized')
      
      // Set ready after a short delay to ensure internals are initialized
      setTimeout(() => {
        setIsMapReady(true)
      }, 500)
    } catch (error) {
      console.error('[Maps] Error initializing map:', error)
    }
  }, [isLoaded, map])

  // Helper to get route label for a place
  const getRouteLabel = useCallback((placeId: string): string | null => {
    if (!route?.places || route.places.length === 0) {
      return null
    }

    // Extract place IDs from route.places array (can be objects or just IDs)
    const routePlaceIds = route.places.map((p: any) => 
      typeof p === 'string' ? p : (p.placeId || p.id || p)
    )
    const index = routePlaceIds.indexOf(placeId)
    
    if (index === -1) {
      return null // Not in route
    }

    const totalPlaces = routePlaceIds.length
    if (totalPlaces === 1) {
      return 'S'
    }

    if (index === 0) {
      return 'S' // Start
    } else if (index === totalPlaces - 1) {
      return 'E' // End
    } else {
      return index.toString() // Middle waypoints: 1, 2, 3, etc.
    }
  }, [route])

  // Create route marker icon with label (S, numbers, or E) - replaces icon with colored circle
  const createRouteMarkerIcon = useCallback((label: string) => {
    if (!window.google) return undefined

    // Colors matching the place list UI
    let bgColor: string, borderColor: string
    if (label === 'S') {
      bgColor = '#4CAF50'  // Green for Start
      borderColor = '#388E3C'
    } else if (label === 'E') {
      bgColor = '#f44336'  // Red for End
      borderColor = '#c62828'
    } else {
      bgColor = '#2196F3'  // Blue for intermediate stops
      borderColor = '#1565C0'
    }

    const markerSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
        <ellipse cx="21" cy="45" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
        <path d="M20 36l-6-6h12l-6 6z" fill="${bgColor}" stroke="${borderColor}" stroke-width="1"/>
        <circle cx="20" cy="18" r="16" fill="${bgColor}" stroke="${borderColor}" stroke-width="1.5"/>
        <text x="20" y="23" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${label}</text>
      </svg>
    `

    const encoded = encodeURIComponent(markerSvg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')

    return {
      url: 'data:image/svg+xml,' + encoded,
      scaledSize: new window.google.maps.Size(40, 48),
      anchor: new window.google.maps.Point(20, 48)
    }
  }, [])

  // Create marker icon helper (normal icon with category symbol)
  const createMarkerIcon = useCallback((iconId: number = 7) => {
    if (!window.google) return undefined

    const iconColors = [
      { bg: '#FF6B6B', border: '#C92A2A' }, // food - red
      { bg: '#4ECDC4', border: '#0C8599' }, // shopping - teal
      { bg: '#95E1D3', border: '#0D9488' }, // entertainment - green
      { bg: '#F38181', border: '#DC2626' }, // lodging - pink
      { bg: '#AAE3E2', border: '#0891B2' }, // health - cyan
      { bg: '#FFD93D', border: '#F59E0B' }, // sports - yellow
      { bg: '#6BCB77', border: '#16A34A' }, // transport - green
      { bg: '#2196F3', border: '#1565C0' }  // default - blue
    ]

    const colors = iconColors[iconId] || iconColors[7]

    const markerSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="40" height="48" viewBox="0 0 40 48">
        <ellipse cx="21" cy="45" rx="8" ry="3" fill="rgba(0,0,0,0.2)"/>
        <path d="M20 36l-6-6h12l-6 6z" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1"/>
        <circle cx="20" cy="18" r="16" fill="${colors.bg}" stroke="${colors.border}" stroke-width="1.5"/>
        <circle cx="20" cy="18" r="6" fill="white" opacity="0.9"/>
      </svg>
    `

    const encoded = encodeURIComponent(markerSvg)
      .replace(/'/g, '%27')
      .replace(/"/g, '%22')

    return {
      url: 'data:image/svg+xml,' + encoded,
      scaledSize: new window.google.maps.Size(40, 48),
      anchor: new window.google.maps.Point(20, 48)
    }
  }, [])

  // Add/update markers when places or route changes
  useEffect(() => {
    if (!map || !isLoaded || !isMapReady) return

    // Clear all existing markers first when route changes to update labels
    setMarkers(prev => {
      prev.forEach(marker => marker.setMap(null))
      return []
    })
    displayedPlaceIdsRef.current.clear()

    // Add all markers with updated route labels
    places.forEach(place => {
      if (!place.location) {
        return
      }

      // Ensure marker can be created safely
      if (!window.google?.maps?.Marker) {
        console.warn('[Maps] Marker API not available yet')
        return
      }

      // Get route label for this place (S, numbers, or E)
      const routeLabel = getRouteLabel(place.placeId)
      
      // If place is in route, use route marker icon (colored circle with label)
      // Otherwise, use normal marker icon (category icon)
      const icon = routeLabel 
        ? createRouteMarkerIcon(routeLabel)
        : createMarkerIcon(place.iconId)
      
      let marker: google.maps.Marker
      try {
        marker = new window.google.maps.Marker({
          position: {
            lat: place.location.latitude,
            lng: place.location.longitude
          },
          map,
          icon,
          title: place.displayName
        })
      } catch (error) {
        console.error('[Maps] Error creating marker:', error)
        return
      }

      // Store placeId and place data on marker for later reference
      ;(marker as any).placeId = place.placeId
      ;(marker as any).placeData = place

      // Helper to get marker screen position
      const getMarkerScreenPosition = () => {
        if (!map) return null
        
        try {
          const projection = map.getProjection()
          const bounds = map.getBounds()
          if (!projection || !bounds) return null

          const mapDiv = map.getDiv()
          if (!mapDiv) return null
          const mapRect = mapDiv.getBoundingClientRect()

          const markerPos = marker.getPosition()
          if (!markerPos) return null

          const ne = bounds.getNorthEast()
          const sw = bounds.getSouthWest()
          if (!ne || !sw) return null

          const nw = new window.google.maps.LatLng(ne.lat(), sw.lng())

          const worldPoint = projection.fromLatLngToPoint(markerPos)
          const topLeftWorld = projection.fromLatLngToPoint(nw)

          if (!worldPoint || !topLeftWorld) return null

          const zoom = map.getZoom() || 12
          const scale = Math.pow(2, zoom)

          const pixelX = (worldPoint.x - topLeftWorld.x) * scale
          const pixelY = (worldPoint.y - topLeftWorld.y) * scale

          // Position anchor at right edge of marker
          return {
            left: mapRect.left + pixelX + 20,
            top: mapRect.top + pixelY - 24
          }
        } catch (error) {
          console.warn('[Maps] Error getting marker screen position:', error)
          return null
        }
      }

      // Create anchor element for place card positioning
      let markerAnchor: HTMLElement | null = null

      // Add hover listener
      marker.addListener('mouseover', () => {
        const screenPos = getMarkerScreenPosition()
        if (!screenPos) return

        // Create anchor element
        markerAnchor = document.createElement('div')
        markerAnchor.style.position = 'fixed'
        markerAnchor.style.left = screenPos.left + 'px'
        markerAnchor.style.top = screenPos.top + 'px'
        markerAnchor.style.width = '0'
        markerAnchor.style.height = '0'
        document.body.appendChild(markerAnchor)

        if (onPlaceHover) {
          onPlaceHover(place, markerAnchor)
        }
      })

      marker.addListener('mouseout', () => {
        // Only hide on mouseout if it wasn't a click (card isn't sticky)
        // We'll let the card's own hover handlers manage visibility for sticky cards
        // Don't remove anchor on mouseout - it might be needed for sticky card
        // The card will manage cleanup when it closes
      })

      // Add click listener
      marker.addListener('click', () => {
        const screenPos = getMarkerScreenPosition()
        if (!screenPos) return

        // Create or reuse anchor element for click
        if (!markerAnchor) {
          markerAnchor = document.createElement('div')
          markerAnchor.style.position = 'fixed'
          markerAnchor.style.left = screenPos.left + 'px'
          markerAnchor.style.top = screenPos.top + 'px'
          markerAnchor.style.width = '0'
          markerAnchor.style.height = '0'
          document.body.appendChild(markerAnchor)
        } else {
          // Update position if anchor already exists
          markerAnchor.style.left = screenPos.left + 'px'
          markerAnchor.style.top = screenPos.top + 'px'
        }

        // On click, show immediately and make sticky (pass isClick flag)
        if (onPlaceHover) {
          onPlaceHover(place, markerAnchor, true) // Pass true to indicate it's a click
        }

        if (onPlaceClick) {
          onPlaceClick(place, markerAnchor)
        }
      })

      setMarkers(prev => [...prev, marker])
      displayedPlaceIdsRef.current.add(place.placeId)
    })

    // Fit bounds to show all markers
    if (places.length > 0 && map) {
      try {
        const bounds = new window.google.maps.LatLngBounds()
        places.forEach(place => {
          if (place.location) {
            bounds.extend({
              lat: place.location.latitude,
              lng: place.location.longitude
            })
          }
        })
        if (!bounds.isEmpty()) {
          map.fitBounds(bounds)
        }
      } catch (error) {
        console.warn('[Maps] Error fitting bounds:', error)
      }
    }
  }, [map, places, isLoaded, isMapReady, createMarkerIcon, onPlaceClick, onPlaceHover, route, getRouteLabel])

  // Update route polylines
  useEffect(() => {
    if (!map || !isLoaded || routePolylines.length === 0) {
      // Clear existing polylines
      setPolylines(prev => {
        prev.forEach(polyline => polyline.setMap(null))
        return []
      })
      return
    }

    // Clear existing polylines
    setPolylines(prev => {
      prev.forEach(polyline => polyline.setMap(null))
      return []
    })

    // Add new polylines
    const newPolylines: google.maps.Polyline[] = []
    routePolylines.forEach((routePolyline: any) => {
      try {
        if (routePolyline.encodedPolyline) {
          // Check if geometry library is available
          if (!window.google?.maps?.geometry?.encoding) {
            console.warn('[Maps] Geometry library not loaded yet, skipping polyline')
            return
          }
          
          const path = window.google.maps.geometry.encoding.decodePath(routePolyline.encodedPolyline)
          if (path && path.length > 0) {
            const polyline = new window.google.maps.Polyline({
              path,
              geodesic: true,
              strokeColor: routePolyline.color || '#2196F3',
              strokeOpacity: 0.8,
              strokeWeight: 4,
              map
            })
            newPolylines.push(polyline)
          }
        } else if (routePolyline.path) {
          const polyline = new window.google.maps.Polyline({
            path: routePolyline.path,
            geodesic: true,
            strokeColor: routePolyline.color || '#2196F3',
            strokeOpacity: 0.8,
            strokeWeight: 4,
            map
          })
          newPolylines.push(polyline)
        }
      } catch (error) {
        console.error('[Maps] Error creating polyline:', error)
      }
    })

    setPolylines(newPolylines)
  }, [map, routePolylines, isLoaded])

  return (
    <div className="dashboard-maps">
      <div ref={mapRef} className="map-container" />
      {!isLoaded && (
        <div className="map-loading">
          <p>Loading map...</p>
        </div>
      )}
    </div>
  )
}

