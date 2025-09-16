// Google Maps API Integration Service
// This will be implemented by your teammate

export interface Place {
  id: string
  name: string
  description: string
  rating: number
  reviews: number
  distance: string
  eta: string
  coordinates: { lat: number; lng: number }
  address: string
  photos?: string[]
  priceLevel?: number
  types: string[]
}

export interface Route {
  distance: string
  duration: string
  steps: RouteStep[]
}

export interface RouteStep {
  instruction: string
  distance: string
  duration: string
}

export interface MapConfig {
  center: { lat: number; lng: number }
  zoom: number
  places: Place[]
  route?: Route
}

class GoogleMapsService {
  private apiKey: string | null = null
  private placesApiUrl = 'https://maps.googleapis.com/maps/api/place'
  private directionsApiUrl = 'https://maps.googleapis.com/maps/api/directions'

  setApiKey(apiKey: string) {
    this.apiKey = apiKey
  }

  async searchPlaces(query: string, location?: { lat: number; lng: number }): Promise<Place[]> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    try {
      const response = await fetch(
        `${this.placesApiUrl}/textsearch/json?query=${encodeURIComponent(query)}&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformPlacesData(data.results)
    } catch (error) {
      console.error('Google Places API error:', error)
      throw error
    }
  }

  async getDirections(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<Route> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    try {
      const response = await fetch(
        `${this.directionsApiUrl}/json?origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Google Directions API error: ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformRouteData(data.routes[0])
    } catch (error) {
      console.error('Google Directions API error:', error)
      throw error
    }
  }

  async getPlaceDetails(placeId: string): Promise<Place> {
    if (!this.apiKey) {
      throw new Error('Google Maps API key not configured')
    }

    try {
      const response = await fetch(
        `${this.placesApiUrl}/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,formatted_address,geometry,photos,price_level,types&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Google Place Details API error: ${response.statusText}`)
      }

      const data = await response.json()
      return this.transformPlaceDetails(data.result)
    } catch (error) {
      console.error('Google Place Details API error:', error)
      throw error
    }
  }

  private transformPlacesData(results: any[]): Place[] {
    return results.map((place, index) => ({
      id: place.place_id || `place_${index}`,
      name: place.name,
      description: place.formatted_address || 'No description available',
      rating: place.rating || 0,
      reviews: place.user_ratings_total || 0,
      distance: 'Calculating...',
      eta: 'Calculating...',
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      address: place.formatted_address || '',
      photos: place.photos?.map((photo: any) => photo.photo_reference) || [],
      priceLevel: place.price_level,
      types: place.types || []
    }))
  }

  private transformRouteData(route: any): Route {
    const leg = route.legs[0]
    return {
      distance: leg.distance.text,
      duration: leg.duration.text,
      steps: leg.steps.map((step: any) => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.text,
        duration: step.duration.text
      }))
    }
  }

  private transformPlaceDetails(place: any): Place {
    return {
      id: place.place_id,
      name: place.name,
      description: place.formatted_address || 'No description available',
      rating: place.rating || 0,
      reviews: place.user_ratings_total || 0,
      distance: 'Calculating...',
      eta: 'Calculating...',
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      address: place.formatted_address || '',
      photos: place.photos?.map((photo: any) => photo.photo_reference) || [],
      priceLevel: place.price_level,
      types: place.types || []
    }
  }

  // Mock implementation for development
  async searchPlacesMock(query: string): Promise<Place[]> {
    const mockPlaces: Place[] = [
      {
        id: '1',
        name: 'Ruru Baked',
        description: 'Artisanal bakery known for fresh bread and pastries. Popular breakfast spot with outdoor seating.',
        rating: 4.5,
        reviews: 127,
        distance: '3.2 km',
        eta: '12 min',
        coordinates: { lat: 43.6532, lng: -79.3832 },
        address: '123 Queen St W, Toronto, ON',
        types: ['bakery', 'restaurant', 'food']
      },
      {
        id: '2',
        name: 'Bang Bang Ice Cream & Bakery',
        description: 'Creative ice cream flavors with unique Asian-inspired desserts and fresh baked goods.',
        rating: 4.3,
        reviews: 89,
        distance: '2.1 km',
        eta: '8 min',
        coordinates: { lat: 43.6519, lng: -79.3867 },
        address: '456 King St E, Toronto, ON',
        types: ['ice_cream_shop', 'bakery', 'food']
      },
      {
        id: '3',
        name: 'Sweet Jesus',
        description: 'Instagram-worthy ice cream creations with unique flavors and toppings.',
        rating: 4.2,
        reviews: 156,
        distance: '1.8 km',
        eta: '6 min',
        coordinates: { lat: 43.6545, lng: -79.3801 },
        address: '789 Spadina Ave, Toronto, ON',
        types: ['ice_cream_shop', 'dessert', 'food']
      }
    ]

    return mockPlaces.filter(place => 
      place.name.toLowerCase().includes(query.toLowerCase()) ||
      place.description.toLowerCase().includes(query.toLowerCase())
    )
  }

  async getDirectionsMock(origin: { lat: number; lng: number }, destination: { lat: number; lng: number }): Promise<Route> {
    return {
      distance: '10.1 km',
      duration: '38 min',
      steps: [
        { instruction: 'Head north on Queen St W', distance: '0.5 km', duration: '2 min' },
        { instruction: 'Turn right onto Spadina Ave', distance: '2.1 km', duration: '8 min' },
        { instruction: 'Continue straight to destination', distance: '7.5 km', duration: '28 min' }
      ]
    }
  }
}

export const googleMapsService = new GoogleMapsService()
