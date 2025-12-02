/**
 * Home Page - Dashboard Integration
 * Replaces previous Home.tsx with teammate's Dashboard layout and functionality
 */

import { useState, useCallback, useRef } from 'react'
import { useAuth } from '../app/providers/AuthProvider'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Chat } from '../components/dashboard/Chat'
import { Maps } from '../components/dashboard/Maps'
import { RoutePlanning } from '../components/dashboard/RoutePlanning'
import { PlaceCard } from '../components/dashboard/PlaceCard'
import { TripMeta } from '../components/dashboard/TripMeta'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { usePlaceCard } from '../hooks/usePlaceCard'
import { type PlaceData } from '../services/dashboardApi'
import { type RouteData } from '../components/dashboard/RouteDetails'
import './Home.css'

export function Home() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const nav = useNavigate()
  const [places, setPlaces] = useState<PlaceData[]>([])
  const [routePolylines, setRoutePolylines] = useState<any[]>([])
  const [currentRoute, setCurrentRoute] = useState<RouteData | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const addPlaceToRouteRef = useRef<((place: PlaceData) => Promise<void>) | null>(null)
  
  const {
    visiblePlace,
    anchorElement,
    isSticky,
    showPlaceCard,
    hidePlaceCard,
    makeSticky,
    closePlaceCard
  } = usePlaceCard()

  const handlePlaceReceived = useCallback((place: PlaceData) => {
    console.log('[Home] Place received:', place)
    setPlaces(prev => {
      // Check if place already exists
      if (prev.some(p => p.placeId === place.placeId)) {
        return prev
      }
      return [...prev, place]
    })
    
    // Optionally add to route planning (can be done via place card later)
    // if (addPlaceToRouteRef.current) {
    //   addPlaceToRouteRef.current(place)
    // }
  }, [])

  const handleSessionReady = useCallback((sessionId: string) => {
    console.log('[Home] Chat session ready:', sessionId)
    setSessionId(sessionId)
  }, [])

  const handleRouteChange = useCallback((route: RouteData | null) => {
    console.log('[Home] Route changed:', route)
    setCurrentRoute(route) // Store route for marker labels
    if (route && route.legs) {
      // Convert route legs to polylines for Maps component
      const polylines = route.legs
        .filter(leg => leg.polyline)
        .map((leg, index) => ({
          encodedPolyline: leg.polyline,
          color: route.mode === 'driving' ? '#4285F4' : 
                 route.mode === 'walking' ? '#34A853' :
                 route.mode === 'bicycling' ? '#FBBC04' : '#EA4335'
        }))
      setRoutePolylines(polylines)
    } else {
      setRoutePolylines([])
    }
  }, [])

  const handleTripContextReceived = useCallback((context: any) => {
    console.log('[Home] Trip context received:', context)
    // Trip context can be used to update TripMeta if needed
    // For now, handled by TripMeta component independently
  }, [])

  const handlePlaceClick = useCallback((place: PlaceData, anchorElement: HTMLElement | null) => {
    console.log('[Home] Place clicked:', place)
    // On click, show the card immediately (no delay) and make it sticky
    if (anchorElement) {
      // Set place and anchor immediately with immediate flag
      showPlaceCard(place, anchorElement, true) // true = immediate, no delay
      // Make it sticky right away
      setTimeout(() => {
        makeSticky()
      }, 10) // Very short delay to ensure card state is updated
    }
  }, [showPlaceCard, makeSticky])

  const handlePlaceHover = useCallback((place: PlaceData | null, anchorElement: HTMLElement | null, isClick: boolean = false) => {
    if (place && anchorElement) {
      if (isClick) {
        // On click, show immediately (no delay) and make sticky
        showPlaceCard(place, anchorElement, true) // true = immediate
        // Make sticky right away - this prevents card from disappearing
        setTimeout(() => {
          makeSticky()
        }, 10)
      } else {
        // On hover (not click), show with delay only if not already sticky
        if (!isSticky) {
          showPlaceCard(place, anchorElement, false)
        }
      }
    } else {
      // Only hide if not sticky - if sticky, keep showing
      if (!isSticky) {
        hidePlaceCard(false)
      }
      // If sticky, don't hide even if hover returns null
    }
  }, [showPlaceCard, hidePlaceCard, makeSticky, isSticky])

  const handleAddPlaceToRoute = useCallback(async (place: PlaceData) => {
    if (addPlaceToRouteRef.current) {
      await addPlaceToRouteRef.current(place)
    }
  }, [])

  return (
    <div className="dashboard-container">
      {/* Title Section */}
      <div className="title-section">
        <h1>Travel Planner</h1>
        <TripMeta />
        <div className="header-actions">
          <LanguageSwitcher />
          <button 
            className="logout-btn"
            onClick={() => { logout(); nav('/login') }}
          >
            {t('nav.logout')}
          </button>
        </div>
      </div>

      {/* Main Container - 3 Column Layout */}
      <div className="dashboard-main-container">
        {/* Left Section: Route Planning - Phase 3 ✅ */}
        <div className="left-section">
          <RoutePlanning
            sessionId={sessionId}
            onRouteChange={handleRouteChange}
            onAddPlaceRef={(addPlace) => {
              addPlaceToRouteRef.current = addPlace
            }}
          />
        </div>

        {/* Center Section: Google Map - Phase 2 ✅ */}
        <div className="center-section">
          <Maps 
            places={places}
            routePolylines={routePolylines}
            route={currentRoute}
            onPlaceClick={handlePlaceClick}
            onPlaceHover={handlePlaceHover}
          />
        </div>

        {/* Right Section: Chat Interface - Phase 1 ✅ */}
        <div className="right-section">
          <Chat 
            onPlaceReceived={handlePlaceReceived}
            onTripContextReceived={handleTripContextReceived}
            onSessionReady={handleSessionReady}
          />
        </div>
      </div>

      {/* Place Card - Phase 4 ✅ */}
      {visiblePlace && (
        <PlaceCard
          place={visiblePlace}
          anchorElement={anchorElement}
          onClose={closePlaceCard}
          onAddToRoute={handleAddPlaceToRoute}
          onMouseEnter={() => {
            // Cancel any pending hide when hovering over card
            // Make it sticky when hovering so user can click buttons
            if (!isSticky) {
              makeSticky()
            }
          }}
          onMouseLeave={() => {
            // Don't hide immediately when leaving - let it stay sticky
            // User can click X to close
          }}
          isSticky={isSticky}
        />
      )}
    </div>
  )
}
