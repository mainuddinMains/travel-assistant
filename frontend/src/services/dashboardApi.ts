/**
 * Dashboard API Service
 * Handles all API calls to the Dashboard backend (port 8000)
 * Includes authentication token from the auth system
 */

import { loadAuthTokenFromStorage } from '../lib/http'

const DASHBOARD_API_BASE_URL = import.meta.env.VITE_DASHBOARD_API_URL || 'http://localhost:8000'

/**
 * Get auth token from storage
 */
function getAuthToken(): string | null {
  return loadAuthTokenFromStorage()
}

/**
 * Build headers with authentication
 */
function buildHeaders(includeJson: boolean = false): HeadersInit {
  const headers: HeadersInit = {}
  
  if (includeJson) {
    headers['Content-Type'] = 'application/json'
  }
  
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  
  return headers
}

export interface ChatInitResponse {
  session_id: string
  welcome_message: string
}

export interface ChatStreamEvent {
  type: 'text_chunk' | 'text_complete' | 'marker' | 'trip_context' | 'done' | 'error'
  content?: string
  trip_context?: any
  placeId?: string
  displayName?: string
  formattedAddress?: string
  location?: { latitude: number; longitude: number }
  rating?: number
  userRatingCount?: number
  [key: string]: any
}

export interface PlaceData {
  placeId: string
  displayName: string
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
  location?: { latitude: number; longitude: number }
  [key: string]: any
}

export interface RouteLeg {
  duration: number
  distanceMeters: number
  polyline: string
  startName: string
  endName: string
  steps?: any[]
}

export interface RouteResponse {
  legs: RouteLeg[]
  totalDuration: number
  totalDistance: number
  placeOrder: string[]
}

/**
 * Initialize a new chat session
 */
export async function initChat(): Promise<ChatInitResponse> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/chat/init`, {
    method: 'POST',
    headers: buildHeaders(),
    credentials: 'include',
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      throw new Error('Authentication required. Please log in.')
    }
    throw new Error(`Failed to initialize chat: ${response.statusText}`)
  }
  
  return response.json()
}

/**
 * Send a chat message and get streaming response
 */
export async function* streamChatMessage(
  sessionId: string,
  message: string
): AsyncGenerator<ChatStreamEvent, void, unknown> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/chat/stream/${sessionId}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ message }),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Chat request failed: ${response.statusText}`)
  }

  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('No response body reader available')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { value, done } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6))
          yield data
        } catch (e) {
          console.error('Failed to parse SSE data:', e)
        }
      }
    }
  }
}

/**
 * Select a place for route planning
 */
export async function selectPlace(sessionId: string, placeData: PlaceData): Promise<{ status: string; selected_count: number }> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/places/select/${sessionId}`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify(placeData),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to select place: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Deselect a place from route planning
 */
export async function deselectPlace(sessionId: string, placeId: string): Promise<{ status: string; selected_count: number }> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/places/select/${sessionId}/${placeId}`, {
    method: 'DELETE',
    headers: buildHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to deselect place: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get all selected places for a session
 */
export async function getSelectedPlaces(sessionId: string): Promise<PlaceData[]> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/places/selected/${sessionId}`, {
    headers: buildHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to get selected places: ${response.statusText}`)
  }

  const data = await response.json()
  return data.selected_places || data.places || []
}

/**
 * Reorder selected places
 */
export async function reorderPlaces(sessionId: string, placeIds: string[]): Promise<{ status: string }> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/places/reorder/${sessionId}`, {
    method: 'PUT',
    headers: buildHeaders(true),
    body: JSON.stringify({ placeIds }),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to reorder places: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Optimize route order
 */
export async function optimizeRoute(sessionId: string, mode: string): Promise<RouteResponse> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/optimize`, {
    method: 'POST',
    headers: buildHeaders(true),
    body: JSON.stringify({ session_id: sessionId, mode }),
    credentials: 'include',
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('[OptimizeRoute] Error response:', errorText)
    throw new Error(`Failed to optimize route: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Compute route between places
 */
export async function computeRoute(
  places: Array<{ placeId: string; displayName: string; formattedAddress: string }>,
  mode: 'DRIVE' | 'WALK' | 'BICYCLE' | 'TRANSIT',
  optimizeWaypointOrder: boolean = true,
  departureTime?: string,
  sessionId?: string
): Promise<RouteResponse> {
  const response = await fetch(`${DASHBOARD_API_BASE_URL}/routes/compute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      places,
      mode,
      optimize_waypoint_order: optimizeWaypointOrder,
      departure_time: departureTime,
      session_id: sessionId,
    }),
    credentials: 'include',
  })

  if (!response.ok) {
    throw new Error(`Failed to compute route: ${response.statusText}`)
  }

  return response.json()
}

/**
 * Get place photo
 */
export async function getPlacePhoto(placeId: string, maxWidthPx?: number): Promise<string | null> {
  const params = new URLSearchParams()
  if (maxWidthPx) {
    params.append('max_width', maxWidthPx.toString())
  }

  const response = await fetch(`${DASHBOARD_API_BASE_URL}/api/places/${placeId}/photo?${params}`, {
    headers: buildHeaders(),
    credentials: 'include',
  })

  if (!response.ok) {
    console.warn(`[PlacePhoto] Failed to load photo for place ${placeId}: ${response.statusText}`)
    return null
  }

  try {
    const data = await response.json()
    return data.photoUrl || null
  } catch (error) {
    console.warn(`[PlacePhoto] Failed to parse photo response:`, error)
    return null
  }
}

