/**
 * RouteDetails Component - Phase 3
 * Display route legs, duration, and distance
 */

import './RoutePlanning.css'

export interface RouteLeg {
  duration: number
  distanceMeters: number
  polyline?: string
  start_name?: string
  end_name?: string
  steps?: any[]
  error?: boolean
}

export interface RouteData {
  legs: RouteLeg[]
  total_duration: number
  total_distance: number
  places?: Array<{ placeId: string; displayName: string }>
  mode?: string
}

interface RouteDetailsProps {
  route: RouteData | null
  transportMode: string
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds} sec`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainingMins = minutes % 60
  return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`
}

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters} m`
  return `${(meters / 1000).toFixed(1)} km`
}

function formatTime(isoTime: string): string {
  if (!isoTime) return ''
  try {
    const date = new Date(isoTime)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  } catch {
    return ''
  }
}

export function RouteDetails({ route, transportMode }: RouteDetailsProps) {
  if (!route || !route.legs || route.legs.length === 0) {
    return (
      <div className="route-details-box">
        <div className="route-details-header">
          <h3>Route Details</h3>
        </div>
        <div className="route-legs">
          <div className="route-empty">
            <p>No route details available</p>
            <p className="placeholder-note">Add places and get directions to see route details</p>
          </div>
        </div>
        <div className="route-summary">
          <div className="summary-item">
            <span className="summary-label">Total Distance</span>
            <span className="summary-value">--</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Time</span>
            <span className="summary-value">--</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="route-details-box">
      <div className="route-details-header">
        <h3>Route Details</h3>
      </div>
      <div className="route-legs">
        {route.legs.map((leg, legIndex) => {
          const startLabel = legIndex === 0 ? 'S' : legIndex
          const startName = leg.start_name || route.places?.[legIndex]?.displayName || `Stop ${legIndex + 1}`
          const endName = leg.end_name || route.places?.[legIndex + 1]?.displayName || `Stop ${legIndex + 2}`

          return (
            <div key={legIndex} className="route-leg">
              {/* Starting place */}
              <div className="route-place-stop">
                <div className="stop-number">{startLabel === 0 ? 'S' : startLabel}</div>
                <div className="stop-name">{startName}</div>
              </div>

              {/* Travel segment */}
              {leg.error ? (
                <div className="route-travel-segment">
                  <div className="travel-segment-header">
                    <div className="segment-icon">⚠️</div>
                    <div className="segment-summary">Route not available</div>
                  </div>
                </div>
              ) : (
                <div className="route-travel-segment">
                  <div className="travel-segment-header">
                    <div className="segment-icon">
                      {transportMode === 'driving' && '🚗'}
                      {transportMode === 'transit' && '🚌'}
                      {transportMode === 'walking' && '🚶'}
                      {transportMode === 'bicycling' && '🚴'}
                    </div>
                    <div className="segment-summary">
                      <strong>{formatDuration(leg.duration)}</strong> • {formatDistance(leg.distanceMeters)}
                    </div>
                  </div>
                  {/* Transit steps could go here */}
                </div>
              )}
            </div>
          )
        })}
        
        {/* Final destination */}
        {route.places && route.places.length > 0 && (
          <div className="route-place-stop">
            <div className="stop-number end">E</div>
            <div className="stop-name">
              {route.places[route.places.length - 1]?.displayName || 'Destination'}
            </div>
          </div>
        )}
      </div>
      <div className="route-summary">
        <div className="summary-item">
          <span className="summary-label">Total Distance</span>
          <span className="summary-value">{formatDistance(route.total_distance)}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Time</span>
          <span className="summary-value">{formatDuration(route.total_duration)}</span>
        </div>
      </div>
    </div>
  )
}

