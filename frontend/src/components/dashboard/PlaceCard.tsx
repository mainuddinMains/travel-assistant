/**
 * PlaceCard Component - Phase 4
 * Hover card for displaying place information
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { type PlaceData } from '../../services/dashboardApi'
import { getPlacePhoto } from '../../services/dashboardApi'
import './PlaceCard.css'

interface PlaceCardProps {
  place: PlaceData | null
  anchorElement: HTMLElement | null
  onClose: () => void
  onAddToRoute?: (place: PlaceData) => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  isSticky?: boolean
}

export function PlaceCard({ place, anchorElement, onClose, onAddToRoute, onMouseEnter, onMouseLeave, isSticky = false }: PlaceCardProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)
  const photoCacheRef = useRef<Record<string, string>>({})

  // Load photo when place changes
  useEffect(() => {
    if (!place) {
      setPhotoUrl(null)
      setPhotoLoading(false)
      return
    }

    // Check cache first
    if (photoCacheRef.current[place.placeId]) {
      setPhotoUrl(photoCacheRef.current[place.placeId])
      setPhotoLoading(false)
      return
    }

    // Load photo from API
    setPhotoLoading(true)
    getPlacePhoto(place.placeId, 400)
      .then(url => {
        if (url) {
          photoCacheRef.current[place.placeId] = url
          setPhotoUrl(url)
        }
        setPhotoLoading(false)
      })
      .catch(() => {
        setPhotoLoading(false)
      })
  }, [place])

  // Position card relative to anchor element
  useEffect(() => {
    if (!cardRef.current || !anchorElement || !place) return

    const cardWidth = 320
    const cardHeight = 450
    const rect = anchorElement.getBoundingClientRect()

    let left = rect.right + 10
    let top = rect.top

    // Adjust horizontal position if card would go off right edge
    if (left + cardWidth > window.innerWidth) {
      left = rect.left - cardWidth - 10
    }

    // Adjust vertical position if card would go off bottom edge
    if (top + cardHeight > window.innerHeight) {
      top = window.innerHeight - cardHeight - 10
    }

    // Ensure card doesn't go off top edge
    if (top < 10) {
      top = 10
    }

    cardRef.current.style.left = `${left}px`
    cardRef.current.style.top = `${top}px`
  }, [place, anchorElement])

  // Handle click outside to close (if sticky)
  useEffect(() => {
    if (!isSticky || !place) return

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    // Delay to prevent immediate closing
    setTimeout(() => {
      document.addEventListener('click', handleClickOutside)
    }, 0)

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isSticky, place, onClose])

  if (!place) return null

  const getPriceDisplay = (priceLevel?: string) => {
    const priceLevels: Record<string, string> = {
      'PRICE_LEVEL_FREE': 'Free',
      'PRICE_LEVEL_INEXPENSIVE': '$',
      'PRICE_LEVEL_MODERATE': '$$',
      'PRICE_LEVEL_EXPENSIVE': '$$$',
      'PRICE_LEVEL_VERY_EXPENSIVE': '$$$$'
    }
    return priceLevel ? (priceLevels[priceLevel] || '') : ''
  }

  const getStatusDisplay = () => {
    const businessStatus = (place as any).businessStatus
    const openingHours = (place as any).currentOpeningHours

    if (businessStatus && businessStatus !== 'OPERATIONAL') {
      const statusMessages: Record<string, string> = {
        'CLOSED_TEMPORARILY': 'Temporarily Closed',
        'CLOSED_PERMANENTLY': 'Permanently Closed'
      }
      return (
        <p className="opening-hours-status">
          <span className="status-closed">{statusMessages[businessStatus] || `Status: ${businessStatus}`}</span>
        </p>
      )
    }

    if (openingHours?.openNow !== undefined) {
      const isOpen = openingHours.openNow
      return (
        <p className="opening-hours-status">
          <span className={isOpen ? 'status-open' : 'status-closed'}>
            {isOpen ? 'Open' : 'Closed'}
          </span>
        </p>
      )
    }

    return null
  }

  const googleMapsUrl = (place as any).googleMapsUri ||
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName)}&query_place_id=${place.placeId}`

  const handleAddClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAddToRoute) {
      onAddToRoute(place)
    }
  }, [place, onAddToRoute])

  const handleCardClick = useCallback((e: React.MouseEvent) => {
    // Don't make sticky if clicking buttons
    if ((e.target as HTMLElement).closest('button')) {
      return
    }
    // Making sticky will be handled by parent if needed
  }, [])

  return (
    <div
      ref={cardRef}
      id="place-hover-card"
      className="place-card-hover"
      onClick={handleCardClick}
      onMouseEnter={(e) => {
        e.stopPropagation()
        e.preventDefault()
        // When hovering over the card itself, make it sticky so it doesn't disappear
        if (onMouseEnter) {
          onMouseEnter()
        }
      }}
      onMouseLeave={(e) => {
        e.stopPropagation()
        e.preventDefault()
        // Don't hide when leaving card - only hide if explicitly closed (X button)
        // The card should remain visible until user clicks X
        if (!isSticky && onMouseLeave) {
          // Only schedule hide if not sticky
          // But since we make it sticky on enter, this shouldn't fire
        }
      }}
    >
      <button
        className="place-card-close"
        onClick={(e) => {
          e.stopPropagation()
          onClose()
        }}
        title="Close"
      >
        ✕
      </button>

      <div className="photo-container">
        {photoLoading ? (
          <div className="photo-loading">Loading photo...</div>
        ) : photoUrl ? (
          <img
            src={photoUrl}
            alt={place.displayName}
            className="place-photo"
            loading="lazy"
          />
        ) : (
          <p className="no-photo">No photo available</p>
        )}
      </div>

      <div className="place-info">
        <h3>
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="place-name-link"
          >
            {place.displayName}
          </a>
        </h3>
        
        {place.rating && (
          <p className="rating">
            ⭐ {place.rating}
            {place.userRatingCount !== undefined && (
              <span className="review-count"> ({place.userRatingCount})</span>
            )}
          </p>
        )}

        {((place as any).primaryTypeDisplayName || (place as any).priceLevel) && (
          <p className="primary-type">
            {(place as any).primaryTypeDisplayName || ''}
            {(place as any).priceLevel && ` • ${getPriceDisplay((place as any).priceLevel)}`}
          </p>
        )}

        {getStatusDisplay()}

        <button onClick={handleAddClick}>
          + Add to Route
        </button>
      </div>
    </div>
  )
}

