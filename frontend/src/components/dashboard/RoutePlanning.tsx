/**
 * RoutePlanning Component - Phase 3
 * Wrapper component that combines TransportMode, PlacesList, and RouteDetails
 */

import { useState, useCallback, useEffect } from 'react'
import { getSelectedPlaces } from '../../services/dashboardApi'
import { TransportMode, type TransportMode as TransportModeType } from './TransportMode'
import { PlacesList } from './PlacesList'
import { RouteDetails, type RouteData } from './RouteDetails'
import { type PlaceData } from '../../services/dashboardApi'
import { computeRoute, optimizeRoute, reorderPlaces, selectPlace, deselectPlace } from '../../services/dashboardApi'
import './RoutePlanning.css'

interface RoutePlanningProps {
  sessionId: string | null
  onRouteChange?: (route: RouteData | null) => void
  onPlaceAdd?: (place: PlaceData) => void
  onAddPlaceRef?: (addPlace: (place: PlaceData) => Promise<void>) => void
}

export function RoutePlanning({ sessionId, onRouteChange, onPlaceAdd, onAddPlaceRef }: RoutePlanningProps) {
  const [transportMode, setTransportMode] = useState<TransportModeType>('driving')
  const [selectedPlaces, setSelectedPlaces] = useState<PlaceData[]>([])
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Load selected places from backend when session is ready
  useEffect(() => {
    if (!sessionId) return

    const loadSelectedPlaces = async () => {
      try {
        const places = await getSelectedPlaces(sessionId)
        setSelectedPlaces(places)
      } catch (error) {
        console.error('[RoutePlanning] Error loading selected places:', error)
      }
    }

    loadSelectedPlaces()
  }, [sessionId])

  const handleAddPlace = useCallback(async (place: PlaceData) => {
    if (!sessionId) return

    // Check if already selected
    if (selectedPlaces.some(p => p.placeId === place.placeId)) {
      console.log('[RoutePlanning] Place already selected')
      return
    }

    try {
      // Add to backend
      await selectPlace(sessionId, place)
      
      // Add to local state
      setSelectedPlaces(prev => [...prev, place])

      if (onPlaceAdd) {
        onPlaceAdd(place)
      }
    } catch (error) {
      console.error('[RoutePlanning] Error adding place:', error)
    }
  }, [sessionId, selectedPlaces, onPlaceAdd])

  // Expose addPlace function to parent via ref callback
  useEffect(() => {
    if (onAddPlaceRef) {
      onAddPlaceRef(handleAddPlace)
    }
  }, [handleAddPlace, onAddPlaceRef])

  const handleRemovePlace = useCallback(async (placeId: string) => {
    if (!sessionId) return

    try {
      await deselectPlace(sessionId, placeId)
      setSelectedPlaces(prev => prev.filter(p => p.placeId !== placeId))
      
      // Clear route if less than 2 places
      if (selectedPlaces.length <= 2) {
        setCurrentRoute(null)
        if (onRouteChange) {
          onRouteChange(null)
        }
      }
    } catch (error) {
      console.error('[RoutePlanning] Error removing place:', error)
    }
  }, [sessionId, selectedPlaces, onRouteChange])

  const handleReorderPlaces = useCallback(async (newOrder: PlaceData[]) => {
    if (!sessionId) return

    try {
      const placeIds = newOrder.map(p => p.placeId)
      await reorderPlaces(sessionId, placeIds)
      setSelectedPlaces(newOrder)
      
      // If there's a current route, update it with the new order so markers update
      if (currentRoute) {
        const updatedRoute: RouteData = {
          ...currentRoute,
          places: newOrder.map(p => ({
            placeId: p.placeId,
            displayName: p.displayName
          }))
        }
        setCurrentRoute(updatedRoute)
        if (onRouteChange) {
          onRouteChange(updatedRoute)
        }
      }
    } catch (error) {
      console.error('[RoutePlanning] Error reordering places:', error)
    }
  }, [sessionId, currentRoute, onRouteChange])

  const handleOptimize = useCallback(async () => {
    if (!sessionId || selectedPlaces.length < 2 || isLoading) return

    setIsLoading(true)
    try {
      // Convert transport mode to lowercase format expected by backend
      const modeForBackend = transportMode.toLowerCase()

      const result = await optimizeRoute(sessionId, modeForBackend)
      
      // Update places order if optimized
      if (result.placeOrder && result.placeOrder.length > 0) {
        const reorderedPlaces = result.placeOrder
          .map(placeId => selectedPlaces.find(p => p.placeId === placeId))
          .filter((p): p is PlaceData => p !== undefined)
        
        if (reorderedPlaces.length === selectedPlaces.length) {
          setSelectedPlaces(reorderedPlaces)
        }
      }

      const route: RouteData = {
        legs: result.legs || [],
        total_duration: result.totalDuration || 0,
        total_distance: result.totalDistance || 0,
        places: result.placeOrder?.map(placeId => {
          const place = selectedPlaces.find(p => p.placeId === placeId)
          return place || { placeId, displayName: 'Unknown' }
        }) || [],
        mode: transportMode
      }

      setCurrentRoute(route)
      if (onRouteChange) {
        onRouteChange(route)
      }
    } catch (error) {
      console.error('[RoutePlanning] Error optimizing route:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, selectedPlaces, transportMode, isLoading, onRouteChange])

  const handleGetDirections = useCallback(async () => {
    if (!sessionId || selectedPlaces.length < 2 || isLoading) return

    setIsLoading(true)
    try {
      const modeMap: Record<TransportModeType, 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT'> = {
        'driving': 'DRIVE',
        'walking': 'WALK',
        'bicycling': 'BICYCLE',
        'transit': 'TRANSIT'
      }

      const departureTime = transportMode === 'transit' 
        ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
        : undefined

      const result = await computeRoute(
        selectedPlaces.map(p => ({
          placeId: p.placeId,
          displayName: p.displayName,
          formattedAddress: p.formattedAddress || ''
        })),
        modeMap[transportMode] || 'DRIVE',
        false, // Don't optimize - keep user's order
        departureTime,
        sessionId
      )

      const route: RouteData = {
        legs: result.legs || [],
        total_duration: result.totalDuration || 0,
        total_distance: result.totalDistance || 0,
        places: selectedPlaces,
        mode: transportMode
      }

      setCurrentRoute(route)
      if (onRouteChange) {
        onRouteChange(route)
      }
    } catch (error) {
      console.error('[RoutePlanning] Error getting directions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, selectedPlaces, transportMode, isLoading, onRouteChange])

  return (
    <div className="route-planning">
      <TransportMode mode={transportMode} onChange={setTransportMode} />
      <PlacesList
        places={selectedPlaces}
        onRemove={handleRemovePlace}
        onReorder={handleReorderPlaces}
        onOptimize={handleOptimize}
        onGetDirections={handleGetDirections}
      />
      <RouteDetails route={currentRoute} transportMode={transportMode} />
    </div>
  )
}


