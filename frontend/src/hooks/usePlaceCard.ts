/**
 * Custom hook for managing place card hover state with delays
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { type PlaceData } from '../services/dashboardApi'

interface UsePlaceCardOptions {
  showDelay?: number
  hideDelay?: number
}

export function usePlaceCard(options: UsePlaceCardOptions = {}) {
  const { showDelay = 300, hideDelay = 500 } = options
  const [visiblePlace, setVisiblePlace] = useState<PlaceData | null>(null)
  const [anchorElement, setAnchorElement] = useState<HTMLElement | null>(null)
  const [isSticky, setIsSticky] = useState(false)
  const showTimeoutRef = useRef<number | null>(null)
  const hideTimeoutRef = useRef<number | null>(null)
  const pendingPlaceRef = useRef<PlaceData | null>(null)
  const pendingAnchorRef = useRef<HTMLElement | null>(null)

  const showPlaceCard = useCallback((place: PlaceData | null, anchor: HTMLElement | null, immediate: boolean = false) => {
    // Cancel any pending hide
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }

    if (!place || !anchor) {
      // Hide immediately only if not sticky
      if (!isSticky) {
        setVisiblePlace(null)
        setAnchorElement(null)
        setIsSticky(false)
      }
      return
    }

    // Cancel any pending show
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }

    if (immediate || isSticky) {
      // Show immediately (for clicks or if already sticky)
      setVisiblePlace(place)
      setAnchorElement(anchor)
      pendingPlaceRef.current = null
      pendingAnchorRef.current = null
    } else {
      // Schedule show after delay (for hover)
      pendingPlaceRef.current = place
      pendingAnchorRef.current = anchor
      
      showTimeoutRef.current = setTimeout(() => {
        if (pendingPlaceRef.current && pendingAnchorRef.current) {
          setVisiblePlace(pendingPlaceRef.current)
          setAnchorElement(pendingAnchorRef.current)
          pendingPlaceRef.current = null
          pendingAnchorRef.current = null
        }
        showTimeoutRef.current = null
      }, showDelay)
    }
  }, [showDelay, isSticky])

  const hidePlaceCard = useCallback((immediate = false) => {
    // Cancel pending show
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }

    pendingPlaceRef.current = null
    pendingAnchorRef.current = null

    // Don't hide if sticky
    if (isSticky) return

    if (immediate) {
      setVisiblePlace(null)
      setAnchorElement(null)
    } else {
      // Schedule hide with delay
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }

      hideTimeoutRef.current = setTimeout(() => {
        if (!isSticky) {
          setVisiblePlace(null)
          setAnchorElement(null)
        }
        hideTimeoutRef.current = null
      }, hideDelay)
    }
  }, [isSticky, hideDelay])

  const makeSticky = useCallback(() => {
    setIsSticky(true)
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  const closePlaceCard = useCallback(() => {
    setIsSticky(false)
    setVisiblePlace(null)
    setAnchorElement(null)
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
  }, [])

  useEffect(() => {
    return () => {
      if (showTimeoutRef.current) {
        clearTimeout(showTimeoutRef.current)
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current)
      }
    }
  }, [])

  return {
    visiblePlace,
    anchorElement,
    isSticky,
    showPlaceCard,
    hidePlaceCard,
    makeSticky,
    closePlaceCard
  }
}

