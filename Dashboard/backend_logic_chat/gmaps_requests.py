"""
Google Maps Platform - Basic API Functions

Low-level HTTP client functions for Google Maps APIs.
Each function makes a single API call and returns the raw response.

API Documentation:
- Text Search: https://developers.google.com/maps/documentation/places/web-service/text-search
- Place Details: https://developers.google.com/maps/documentation/places/web-service/place-details
- Compute Routes: https://developers.google.com/maps/documentation/routes/compute_route_directions

Data Fields Reference:
- https://developers.google.com/maps/documentation/places/web-service/data-fields

Pricing:
- Places API: https://developers.google.com/maps/documentation/places/web-service/usage-and-billing
- Routes API: https://developers.google.com/maps/documentation/routes/usage-and-billing
"""

import requests
from typing import Optional, List, Dict, Any
from place_icons import get_icon_id


# Create a module-level session for connection pooling
_session = requests.Session()


# ============================================================================
# TEXT SEARCH (Places API New)
# ============================================================================
# Documentation: https://developers.google.com/maps/documentation/places/web-service/text-search
# Pricing: Basic $0.032/req, Advanced $0.035/req, Preferred $0.040/req
# ============================================================================

def text_search(
    api_key: str,
    query: str,
    fields: List[str],
    max_results: int = 20,
    language_code: str = "en",
    timeout: int = 10,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """
    Search for places using a text query.

    Args:
        api_key: Google Maps API key
        query: Text query (e.g., "Rain or Shine Ice Cream Vancouver BC")
        fields: List of fields to return (controls billing tier)
        max_results: Maximum results (1-20)
        language_code: Language code (default: "en")
        timeout: Request timeout in seconds

    Returns:
        Dict with 'places' list

    Field Examples:
        Basic: places.id, places.displayName, places.formattedAddress
        Advanced: places.rating, places.userRatingCount, places.regularOpeningHours
    """
    if session is None:
        session = _session

    url = "https://places.googleapis.com/v1/places:searchText"

    body = {
        "textQuery": query,
        "languageCode": language_code,
        "maxResultCount": max_results
    }

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ",".join(fields)
    }

    response = session.post(url, headers=headers, json=body, timeout=timeout)

    if response.status_code != 200:
        raise Exception(f"Text Search error {response.status_code}: {response.text}")

    return response.json()


def find_place_id(
    api_key: str,
    query: str,
    language_code: str = "en",
    timeout: int = 10,
    session: Optional[requests.Session] = None
) -> Optional[str]:
    """
    Find a place ID using text search (FREE - IDs Only tier, $0.00).

    This function uses the Text Search Essentials (IDs Only) SKU which is completely
    free when requesting only the 'places.id' field.

    Args:
        api_key: Google Maps API key
        query: Text query (e.g., "Starbucks 123 Main St, Vancouver BC")
        language_code: Language code (default: "en")
        timeout: Request timeout in seconds
        session: Optional requests.Session for connection pooling

    Returns:
        Place ID string (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4") or None if not found

    Cost:
        $0.00 per request (Text Search Essentials - IDs Only tier)

    Documentation:
        https://developers.google.com/maps/documentation/places/web-service/text-search

    Example:
        place_id = find_place_id(api_key, "Stanley Park Vancouver BC")
        print(place_id)  # "ChIJN1t_tDeuEmsRUsoyG83frY4"
    """
    try:
        result = text_search(
            api_key=api_key,
            query=query,
            fields=["places.id"],  # Request only ID for free tier
            max_results=1,  # We only need the best match
            language_code=language_code,
            timeout=timeout,
            session=session
        )

        places = result.get("places", [])
        if places:
            place_id = places[0].get("id", "")
            return place_id
        return None

    except Exception as e:
        # Re-raise with more context
        raise Exception(f"Failed to find place ID for query '{query}': {str(e)}")


# ============================================================================
# PLACE DETAILS (Places API New)
# ============================================================================
# Documentation: https://developers.google.com/maps/documentation/places/web-service/place-details
# Pricing: Basic $0.017/req, Advanced $0.020/req, Preferred $0.025/req
# ============================================================================

def place_details(
    api_key: str,
    place_id: str,
    fields: List[str],
    language_code: str = "en",
    timeout: int = 10,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """
    Get detailed information about a place using its Place ID.

    Args:
        api_key: Google Maps API key
        place_id: Place ID (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4")
        fields: List of fields to return (controls billing tier)
        language_code: Language code (default: "en")
        timeout: Request timeout in seconds

    Returns:
        Dict with place details

    Note:
        - Cheaper than Text Search when you already have Place ID
        - Place ID can be in "places/ChIJ..." or "ChIJ..." format (both work)
    """
    if session is None:
        session = _session

    # Normalize place_id (remove "places/" prefix if present)
    if place_id.startswith("places/"):
        place_id = place_id[7:]

    url = f"https://places.googleapis.com/v1/places/{place_id}"

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ",".join(fields),
        "X-Goog-Language": language_code
    }

    response = session.get(url, headers=headers, timeout=timeout)

    if response.status_code != 200:
        raise Exception(f"Place Details error {response.status_code}: {response.text}")

    return response.json()


def enrich_place_with_details(
    api_key: str,
    place: Dict[str, Any],
    language_code: str = "en",
    timeout: int = 10,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """
    Complete place enrichment: Find Place ID + Get ALL details.

    Takes a place dictionary with displayName and formattedAddress, constructs a query,
    finds the Place ID via Google Maps Text Search, fetches full details via Place Details API,
    and returns a flattened details dict with consistent naming.

    Args:
        api_key: Google Maps API key
        place: Dictionary with at least:
            - "displayName": Place name (e.g., "La Casa Gelato")
            - "formattedAddress": Full address (e.g., "1033 Venables St, Vancouver, BC V6A 3E8, Canada")
        language_code: Language code (default: "en")
        timeout: Request timeout in seconds
        session: Optional requests.Session for connection pooling

    Returns:
        Dict: Enriched place with consistent attribute names:
            - placeId (str): Google Maps Place ID
            - originalDisplayName (str): Original place name from chatting agent
            - originalFormattedAddress (str): Original address from chatting agent
            - displayName (str): Official Google Maps name (extracted from displayName.text)
            - formattedAddress (str): Full address from Google Maps
            - rating (float): Average rating
            - userRatingCount (int): Number of reviews
            - location (dict): {latitude, longitude}
            - businessStatus (str): e.g., "OPERATIONAL"
            - primaryType (str): Place type e.g., "ice_cream_shop"
            - iconId (int): Icon category ID (0-7) for map markers
            - googleMapsUri (str): Google Maps URL
            - priceLevel (str): Price level
            - currentOpeningHours (dict): Opening hours
            - photos (list): Photo references

        Returns place dict with "error" field if enrichment fails

    Cost:
        $0.00 (find_place_id) + $25/1000 (place_details_enterprise) = $25/1000 total

    Example:
        place = {
            "displayName": "La Casa Gelato",
            "formattedAddress": "1033 Venables St, Vancouver, BC V6A 3E8, Canada"
        }
        enriched = enrich_place_with_details(api_key, place)
        print(enriched["placeId"])  # "ChIJ..."
        print(enriched["originalDisplayName"])  # "La Casa Gelato"
        print(enriched["displayName"])  # "La Casa Gelato" (from API)
        print(enriched["rating"])  # 4.4
    """
    try:
        # Extract name and address from place dict
        display_name = place.get("displayName", "")
        formatted_address = place.get("formattedAddress", "")

        if not display_name or not formatted_address:
            place["error"] = "Missing displayName or formattedAddress in place dict"
            return place

        # Construct query from name and address
        query = f"{display_name}, {formatted_address}"

        # Step 1: Find Place ID (FREE - $0.00)
        place_id = find_place_id(
            api_key=api_key,
            query=query,
            language_code=language_code,
            timeout=timeout,
            session=session
        )

        if not place_id:
            place["error"] = f"Place not found for query: {query}"
            return place

        # Step 2: Get full details (Enterprise tier - $25/1000)
        raw_details = place_details_enterprise(
            api_key=api_key,
            place_id=place_id,
            language_code=language_code,
            timeout=timeout,
            session=session
        )

        # Step 3: Build enriched place dict with consistent naming
        enriched = {
            # Custom fields (from chatting agent input)
            "placeId": place_id,
            "originalDisplayName": place["displayName"],
            "originalFormattedAddress": place["formattedAddress"],
            "iconId": get_icon_id(raw_details.get("primaryType")),

            # Flattened Google API fields (camelCase preserved)
            "displayName": raw_details.get("displayName", {}).get("text", ""),
            "formattedAddress": raw_details.get("formattedAddress"),
            "rating": raw_details.get("rating"),
            "userRatingCount": raw_details.get("userRatingCount"),
            "location": raw_details.get("location"),
            "businessStatus": raw_details.get("businessStatus"),
            "primaryType": raw_details.get("primaryType"),
            "primaryTypeDisplayName": raw_details.get("primaryTypeDisplayName", {}).get("text") if raw_details.get("primaryTypeDisplayName") else None,
            "googleMapsUri": raw_details.get("googleMapsUri"),
            "priceLevel": raw_details.get("priceLevel"),
            "currentOpeningHours": raw_details.get("currentOpeningHours"),
            "photos": raw_details.get("photos"),
            "websiteUri": raw_details.get("websiteUri"),
            "nationalPhoneNumber": raw_details.get("nationalPhoneNumber"),
            "internationalPhoneNumber": raw_details.get("internationalPhoneNumber"),
            "regularOpeningHours": raw_details.get("regularOpeningHours"),
            "types": raw_details.get("types"),
        }

        return enriched

    except Exception as e:
        place["error"] = str(e)
        return place


def place_details_enterprise(
    api_key: str,
    place_id: str,
    language_code: str = "en",
    timeout: int = 10,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """
    Get all place details up to Enterprise tier (cost: $25/1000 requests).

    Requests all available fields up to Enterprise tier, excluding the most expensive
    Atmosphere tier fields (reviews, amenities) which would cost $40/1000.

    Args:
        api_key: Google Maps API key
        place_id: Place ID (e.g., "ChIJN1t_tDeuEmsRUsoyG83frY4")
        language_code: Language code (default: "en")
        timeout: Request timeout in seconds
        session: Optional requests.Session for connection pooling

    Returns:
        Dict with comprehensive place details up to Enterprise tier

    Cost:
        $25.00 per 1,000 requests (Enterprise tier)

    Fields included:
        - Essentials: address, location, types, viewport
        - Pro: displayName, businessStatus, googleMapsUri, primaryType
        - Enterprise: phone, website, hours, rating, reviews count, price level

    Example:
        details = place_details_enterprise(api_key, "ChIJN1t_tDeuEmsRUsoyG83frY4")
        print(details["displayName"]["text"])  # "Starbucks"
        print(details["rating"])  # 4.5
    """
    enterprise_fields = [
        # Essentials (IDs Only) - $0
        "id",
        #"name",
        "photos",

        # Essentials (Basic Details) - $5
        #"addressComponents",
        #"adrFormatAddress",
        "formattedAddress",
        #"shortFormattedAddress",
        "location",
        #"plusCode",
        "types",
        #"viewport",
        #"utcOffsetMinutes",
        "iconMaskBaseUri",
        "iconBackgroundColor",

        # Pro (Advanced Details) - $17
        "displayName",
        "businessStatus",
        "googleMapsUri",
        "accessibilityOptions",
        "primaryType",
        "primaryTypeDisplayName",
        #"containingPlaces",
        #"pureServiceAreaBusiness",
        #"subDestinations",

        # Enterprise (Preferred Details) - $25
        "nationalPhoneNumber",
        "internationalPhoneNumber",
        "websiteUri",
        "regularOpeningHours",
        "currentOpeningHours",
        "regularSecondaryOpeningHours",
        "currentSecondaryOpeningHours",
        "rating",
        "userRatingCount",
        "priceLevel",
        "priceRange"
    ]

    return place_details(
        api_key=api_key,
        place_id=place_id,
        fields=enterprise_fields,
        language_code=language_code,
        timeout=timeout,
        session=session
    )


# ============================================================================
# PLACE PHOTOS (Places API)
# ============================================================================
# Documentation: https://developers.google.com/maps/documentation/places/web-service/place-photos
# Pricing: $7.00 per 1,000 requests (per photo, not per place)
# ============================================================================

def fetch_place_photo(
    api_key: str,
    photo_name: str,
    max_width: int = 400,
    max_height: Optional[int] = None,
    skip_http_redirect: bool = False,
    timeout: int = 10,
    session: Optional[requests.Session] = None
) -> str:
    """
    Fetch a photo URL from Google Maps Place Photos API.

    Args:
        api_key: Google Maps API key
        photo_name: Photo resource name (e.g., "places/ChIJ.../photos/...")
        max_width: Maximum width in pixels (1-4800)
        max_height: Optional maximum height in pixels (1-4800)
        skip_http_redirect: If True, returns redirect URL instead of downloading
        timeout: Request timeout in seconds
        session: Optional requests.Session for connection pooling

    Returns:
        Photo URL string (either direct download URL or redirect URL)

    Cost:
        $7.00 per 1,000 photo requests

    Note:
        - Cost is per photo request, NOT per place
        - Requesting 100x100 costs the same as 4800x4800
        - Recommended sizes: 200-400px for thumbnails, 800-1200px for full view
        - Photo names come from the "photos" field in Place Details response

    Example:
        # Get place details with photos field
        details = place_details_enterprise(api_key, place_id)
        photos = details.get("photos", [])

        if photos:
            photo_name = photos[0]["name"]  # e.g., "places/ChIJ.../photos/..."
            photo_url = fetch_place_photo(api_key, photo_name, max_width=400)
            print(photo_url)
    """
    if session is None:
        session = _session

    # Build URL with photo name
    url = f"https://places.googleapis.com/v1/{photo_name}/media"

    # Build query parameters
    params = {
        "key": api_key,
        "maxWidthPx": max_width
    }

    if max_height:
        params["maxHeightPx"] = max_height

    if skip_http_redirect:
        params["skipHttpRedirect"] = "true"

    # Make request
    response = session.get(url, params=params, timeout=timeout, allow_redirects=not skip_http_redirect)

    if response.status_code != 200:
        raise Exception(f"Place Photo error {response.status_code}: {response.text}")

    if skip_http_redirect:
        # Return the redirect URL from response JSON
        return response.json().get("photoUri", "")
    else:
        # Return the final URL after redirect
        return response.url


# ============================================================================
# COMPUTE ROUTES (Routes API)
# ============================================================================

def extract_place(place: Dict[str, Any]) -> Dict[str, str]:
    """Extract only placeId, displayName, and formattedAddress from a place dict."""
    return {
        "placeId": place["placeId"],
        "displayName": place["displayName"],
        "formattedAddress": place["formattedAddress"]
    }
# Documentation: https://developers.google.com/maps/documentation/routes/compute_route_directions
#
# TRAVEL MODES:
#   - DRIVE: Standard car routing
#   - WALK: Pedestrian routing
#   - BICYCLE: Cycling routing
#   - TRANSIT: Public transportation (requires departureTime)
#   - TWO_WHEELER: Motorcycle/scooter (Enterprise tier)
#
# ROUTING PREFERENCES (triggers Pro tier if traffic-aware):
#   - TRAFFIC_UNAWARE: No traffic data (default, Essentials tier)
#   - TRAFFIC_AWARE: Real-time traffic (Pro tier)
#   - TRAFFIC_AWARE_OPTIMAL: Best route with traffic (Pro tier)
#
# PRICING TIERS:
#   - Essentials: $5/1000 requests - Basic routing, max 10 intermediates
#   - Pro: $10/1000 requests - Traffic-aware, 11-25 intermediates
#   - Enterprise: $15/1000 requests - TWO_WHEELER mode, toll info
#
# AVAILABLE FIELDS BY TIER:
#
# --- ESSENTIALS TIER ($5/1000) ---
# Route-level:
#   routes.routeToken               - Token to reference this route
#   routes.distanceMeters           - Total distance in meters
#   routes.duration                 - Total travel time (without traffic)
#   routes.staticDuration           - Travel time ignoring traffic
#   routes.polyline.encodedPolyline - Encoded polyline for the full route
#   routes.description              - Human-readable route description
#   routes.warnings                 - Route warnings
#   routes.viewport                 - Bounding box for the route
#   routes.routeLabels              - Labels like DEFAULT_ROUTE, FUEL_EFFICIENT
#
# Leg-level:
#   routes.legs.distanceMeters      - Distance for this leg
#   routes.legs.duration            - Travel time for this leg
#   routes.legs.staticDuration      - Travel time ignoring traffic
#   routes.legs.polyline.encodedPolyline - Encoded polyline for this leg
#   routes.legs.startLocation       - Start lat/lng
#   routes.legs.endLocation         - End lat/lng
#
# Step-level:
#   routes.legs.steps.distanceMeters     - Distance for this step
#   routes.legs.steps.staticDuration     - Duration for this step
#   routes.legs.steps.polyline.encodedPolyline - Encoded polyline
#   routes.legs.steps.startLocation      - Start of step
#   routes.legs.steps.endLocation        - End of step
#   routes.legs.steps.navigationInstruction - Turn-by-turn instruction
#
# Other:
#   routes.optimizedIntermediateWaypointIndex - Optimized order
#   geocodingResults                - Geocoding results for addresses
#
# --- PRO TIER ($10/1000) - includes Essentials ---
#   routes.travelAdvisory                    - Traffic/congestion info
#   routes.travelAdvisory.speedReadingIntervals - Speed along route
#   routes.legs.travelAdvisory               - Traffic info per leg
#   routes.legs.travelAdvisory.speedReadingIntervals
#   routes.legs.steps.travelAdvisory         - Traffic info per step
#
# --- ENTERPRISE TIER ($15/1000) - includes Pro ---
#   routes.travelAdvisory.tollInfo           - Toll info for route
#   routes.travelAdvisory.tollInfo.estimatedPrice - Estimated toll cost
#   routes.legs.travelAdvisory.tollInfo      - Toll info per leg
#   routes.travelAdvisory.fuelConsumptionMicroliters - Fuel consumption
#   routes.legs.travelAdvisory.fuelConsumptionMicroliters
#
# ============================================================================

def compute_routes(
    api_key: str,
    origin: Dict[str, Any],
    destination: Dict[str, Any],
    fields: List[str],
    intermediates: Optional[List[Dict[str, Any]]] = None,
    travel_mode: str = "DRIVE",
    optimize_waypoint_order: bool = False,
    departure_time: Optional[str] = None,
    timeout: int = 30,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """
    Compute routes between locations.

    Args:
        api_key: Google Maps API key
        origin: Origin location {"placeId": "..."} or {"address": "..."} or {"latLng": {...}}
        destination: Destination location
        fields: List of fields to return (controls billing tier)
        intermediates: Optional list of waypoints
        travel_mode: DRIVE, WALK, BICYCLE, TRANSIT
        optimize_waypoint_order: If True, reorder waypoints for optimal route
        departure_time: ISO format datetime string (e.g., "2025-01-15T09:00:00Z")
        timeout: Request timeout in seconds

    Returns:
        Dict with 'routes' list
    """
    url = "https://routes.googleapis.com/directions/v2:computeRoutes"

    body = {
        "origin": origin,
        "destination": destination,
        "travelMode": travel_mode,
        "languageCode": "en-US",
        "units": "METRIC"
    }

    if intermediates:
        body["intermediates"] = intermediates

    if optimize_waypoint_order:
        body["optimizeWaypointOrder"] = True

    if departure_time:
        body["departureTime"] = departure_time

    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": api_key,
        "X-Goog-FieldMask": ",".join(fields)
    }

    if session is None:
        session = _session

    response = session.post(url, headers=headers, json=body, timeout=timeout)

    if response.status_code != 200:
        raise Exception(f"Compute Routes error {response.status_code}: {response.text}")

    return response.json()


def compute_routes_drive_walk_bicycle(
    api_key: str,
    places: List[Dict[str, str]],
    travel_mode: str = "DRIVE",
    optimize_waypoint_order: bool = False,
    departure_time: Optional[str] = None,
    timeout: int = 30,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """
    Compute routes for DRIVE, WALK, or BICYCLE modes and return structured data.

    Args:
        api_key: Google Maps API key
        places: List of place dicts, each with:
            - "placeId": Google Place ID (required)
            - "displayName": Place name (required)
            - "formattedAddress": Full address (required)
        travel_mode: DRIVE, WALK, or BICYCLE
        optimize_waypoint_order: If True, reorder waypoints for optimal route
        departure_time: ISO datetime (e.g., "2025-01-15T09:00:00Z")
        timeout: Request timeout in seconds
        session: Optional requests.Session

    Returns:
        Dict with structured route data:
        {
            "places": [
                {"placeId": "...", "displayName": "Stanley Park", "formattedAddress": "..."},
                ...
            ],
            "duration": 2867,              # Total duration in seconds
            "distanceMeters": 27551,       # Total distance in meters
            "optimizedOrder": [0, 2, 1, 3], # Reordered indices (if optimize=True)
            "legs": [
                {
                    "duration": 912,       # Leg duration in seconds
                    "distanceMeters": 5138,
                    "polyline": "encoded...",
                },
                ...
            ]
        }
    """
    if len(places) < 2:
        raise ValueError("At least 2 places required (origin and destination)")

    if travel_mode not in ("DRIVE", "WALK", "BICYCLE"):
        raise ValueError("travel_mode must be DRIVE, WALK, or BICYCLE")

    # Extract place IDs for API call
    place_ids = [p["placeId"] for p in places]

    # Build location dicts from place IDs
    origin = {"placeId": place_ids[0]}
    destination = {"placeId": place_ids[-1]}
    intermediates = [{"placeId": pid} for pid in place_ids[1:-1]] if len(place_ids) > 2 else None

    # Request fields for legs (not full route polyline)
    fields = [
        "routes.duration",
        "routes.distanceMeters",
        "routes.legs.duration",
        "routes.legs.distanceMeters",
        "routes.legs.polyline.encodedPolyline",
        "routes.optimizedIntermediateWaypointIndex",
    ]

    # Call the base compute_routes function
    raw_result = compute_routes(
        api_key=api_key,
        origin=origin,
        destination=destination,
        fields=fields,
        intermediates=intermediates,
        travel_mode=travel_mode,
        optimize_waypoint_order=optimize_waypoint_order,
        departure_time=departure_time,
        timeout=timeout,
        session=session
    )

    # Extract and structure the response
    if not raw_result.get("routes"):
        raise Exception("No routes found in response")

    route = raw_result["routes"][0]

    # Parse total duration (format: "2867s" -> 2867)
    total_duration = int(route["duration"].replace("s", ""))
    total_distance = route["distanceMeters"]

    # Reorder places if optimization was requested and available
    if optimize_waypoint_order and "optimizedIntermediateWaypointIndex" in route:
        optimized_indices = route["optimizedIntermediateWaypointIndex"]
        # Build reordered places: [origin, ...optimized intermediates..., destination]
        output_places = [extract_place(places[0])]  # Origin first
        for idx in optimized_indices:
            output_places.append(extract_place(places[idx + 1]))  # +1 because intermediates start at index 1
        output_places.append(extract_place(places[-1]))  # Destination last
    else:
        output_places = [extract_place(p) for p in places]

    # Extract leg data
    legs = []
    for leg in route.get("legs", []):
        leg_data = {
            "duration": int(leg["duration"].replace("s", "")),
            "distanceMeters": leg["distanceMeters"],
            "polyline": leg["polyline"]["encodedPolyline"],
        }
        legs.append(leg_data)

    # Build result with places info
    return {
        "places": output_places,
        "duration": total_duration,
        "distanceMeters": total_distance,
        "legs": legs
    }


def compute_routes_transit(
    api_key: str,
    places: List[Dict[str, str]],
    optimize_waypoint_order: bool = False,
    departure_time: Optional[str] = None,
    timeout: int = 30,
    session: Optional[requests.Session] = None
) -> Dict[str, Any]:
    """
    Compute transit routes by making separate API calls for each consecutive pair.

    TRANSIT mode does not allow intermediate waypoints, so this function makes
    separate API calls for each pair (A->B, B->C, C->D, etc.) and combines results.

    Args:
        api_key: Google Maps API key
        places: List of place dicts, each with:
            - "placeId": Google Place ID (required)
            - "displayName": Place name (required)
            - "formattedAddress": Full address (required)
        optimize_waypoint_order: If True, first compute DRIVE route to get optimal
            waypoint order, then compute transit routes in that order.
        departure_time: ISO datetime (e.g., "2025-01-15T09:00:00Z"). If not provided,
                       uses current time + 5 minutes.
        timeout: Request timeout in seconds
        session: Optional requests.Session

    Returns:
        Dict with structured transit route data:
        {
            "places": [
                {"placeId": "...", "displayName": "Stanley Park", "formattedAddress": "..."},
                ...
            ],
            "totalDuration": 8906,           # Total duration in seconds
            "totalDistanceMeters": 23490,    # Total distance in meters
            "legs": [                        # legs[i] = route from places[i] to places[i+1]
                {
                    "duration": 2294,        # Leg duration in seconds
                    "distanceMeters": 4927,
                    "polyline": "encoded...",
                    "steps": [
                        {
                            "travelMode": "WALK",
                            "duration": 120,         # Summed from consecutive walk steps
                            "distanceMeters": 250,   # Summed from consecutive walk steps
                            "polylines": ["encoded1...", "encoded2..."]  # List of polylines
                        },
                        {
                            "travelMode": "TRANSIT",
                            "duration": 417,
                            "distanceMeters": 1406,
                            "polyline": "encoded...",
                            "transitDetails": {
                                "departureStop": "EB W Georgia St @ Denman St",
                                "arrivalStop": "EB W Pender St @ Burrard St",
                                "departureTime": "2025-01-15T09:11:56Z",
                                "arrivalTime": "2025-01-15T09:18:53Z",
                                "lineShortName": "019",
                                "vehicleType": "BUS"
                            }
                        },
                        ...
                    ]
                },
                ...
            ]
        }
    """
    from datetime import datetime, timezone, timedelta

    if len(places) < 2:
        raise ValueError("At least 2 places required")

    # Optimize waypoint order using DRIVE mode if requested
    if optimize_waypoint_order and len(places) > 2:
        # Extract place IDs for optimization API call
        place_ids = [p["placeId"] for p in places]

        # Call compute_routes with DRIVE mode to get optimized order
        optimize_result = compute_routes(
            api_key=api_key,
            origin={"placeId": place_ids[0]},
            destination={"placeId": place_ids[-1]},
            intermediates=[{"placeId": pid} for pid in place_ids[1:-1]],
            travel_mode="DRIVE",
            optimize_waypoint_order=True,
            fields=["routes.optimizedIntermediateWaypointIndex"],
            timeout=timeout,
            session=session
        )

        # Reorder places based on optimized indices
        if optimize_result.get("routes") and optimize_result["routes"][0].get("optimizedIntermediateWaypointIndex"):
            optimized_indices = optimize_result["routes"][0]["optimizedIntermediateWaypointIndex"]
            output_places = [extract_place(places[0])]  # Origin first
            for idx in optimized_indices:
                output_places.append(extract_place(places[idx + 1]))  # +1 because intermediates start at index 1
            output_places.append(extract_place(places[-1]))  # Destination last
        else:
            output_places = [extract_place(p) for p in places]
    else:
        output_places = [extract_place(p) for p in places]

    # Extract place IDs for API calls (from potentially reordered places)
    place_ids = [p["placeId"] for p in output_places]

    # Default departure time: now + 5 minutes
    if not departure_time:
        departure_time = (datetime.now(timezone.utc) + timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Fields to request for transit
    fields = [
        "routes.duration",
        "routes.distanceMeters",
        "routes.polyline.encodedPolyline",
        "routes.legs.duration",
        "routes.legs.distanceMeters",
        "routes.legs.polyline.encodedPolyline",
        "routes.legs.steps.distanceMeters",
        "routes.legs.steps.staticDuration",
        "routes.legs.steps.polyline.encodedPolyline",
        "routes.legs.steps.travelMode",
        "routes.legs.steps.transitDetails.stopDetails.departureStop.name",
        "routes.legs.steps.transitDetails.stopDetails.arrivalStop.name",
        "routes.legs.steps.transitDetails.stopDetails.departureTime",
        "routes.legs.steps.transitDetails.stopDetails.arrivalTime",
        "routes.legs.steps.transitDetails.transitLine.agencies",
        "routes.legs.steps.transitDetails.transitLine.name",
        "routes.legs.steps.transitDetails.transitLine.nameShort",
        "routes.legs.steps.transitDetails.transitLine.color",
        "routes.legs.steps.transitDetails.transitLine.textColor",
        "routes.legs.steps.transitDetails.transitLine.vehicle.type",
        "routes.legs.steps.transitDetails.transitLine.vehicle.iconUri",
        "routes.legs.steps.transitDetails.headsign",
        "routes.legs.steps.transitDetails.stopCount",
    ]

    legs = []
    total_duration = 0
    total_distance = 0

    # Make separate API calls for each consecutive pair
    for i in range(len(place_ids) - 1):
        origin_id = place_ids[i]
        dest_id = place_ids[i + 1]

        try:
            raw_result = compute_routes(
                api_key=api_key,
                origin={"placeId": origin_id},
                destination={"placeId": dest_id},
                fields=fields,
                intermediates=None,
                travel_mode="TRANSIT",
                departure_time=departure_time,
                timeout=timeout,
                session=session
            )

            if not raw_result.get("routes"):
                legs.append({"error": "No route found"})
                continue

            route = raw_result["routes"][0]
            leg = route["legs"][0]

            # Parse duration (format: "2294s" -> 2294)
            segment_duration = int(route["duration"].replace("s", ""))
            segment_distance = route["distanceMeters"]

            total_duration += segment_duration
            total_distance += segment_distance

            # Extract steps, combining consecutive WALK steps
            steps = []
            pending_walk = None  # Accumulator for consecutive WALK steps

            for step in leg.get("steps", []):
                travel_mode = step.get("travelMode", "WALK")

                if travel_mode == "WALK":
                    duration = int(step.get("staticDuration", "0s").replace("s", ""))
                    distance = step.get("distanceMeters", 0)
                    polyline = step.get("polyline", {}).get("encodedPolyline", "")

                    if pending_walk is None:
                        # Start new walk accumulator
                        pending_walk = {
                            "travelMode": "WALK",
                            "duration": duration,
                            "distanceMeters": distance,
                            "polylines": [polyline] if polyline else []
                        }
                    else:
                        # Add to existing walk accumulator
                        pending_walk["duration"] += duration
                        pending_walk["distanceMeters"] += distance
                        if polyline:
                            pending_walk["polylines"].append(polyline)
                else:
                    # Non-WALK step encountered - flush pending walk first
                    if pending_walk is not None:
                        steps.append(pending_walk)
                        pending_walk = None

                    # Process TRANSIT step
                    step_data = {
                        "travelMode": travel_mode,
                        "duration": int(step.get("staticDuration", "0s").replace("s", "")),
                        "distanceMeters": step.get("distanceMeters", 0),
                        "polyline": step.get("polyline", {}).get("encodedPolyline", ""),
                    }

                    # Add transit details if this is a TRANSIT step
                    if step.get("travelMode") == "TRANSIT" and step.get("transitDetails"):
                        td = step["transitDetails"]
                        stop_details = td.get("stopDetails", {})

                        transit_info = {}

                        # Departure/arrival stop names
                        dep_stop = stop_details.get("departureStop", {})
                        arr_stop = stop_details.get("arrivalStop", {})
                        if dep_stop.get("name"):
                            transit_info["departureStop"] = dep_stop["name"]
                        if arr_stop.get("name"):
                            transit_info["arrivalStop"] = arr_stop["name"]

                        # Times
                        if stop_details.get("departureTime"):
                            transit_info["departureTime"] = stop_details["departureTime"]
                        if stop_details.get("arrivalTime"):
                            transit_info["arrivalTime"] = stop_details["arrivalTime"]

                        # Line info
                        transit_line = td.get("transitLine", {})
                        if transit_line.get("name"):
                            transit_info["lineName"] = transit_line["name"]
                        if transit_line.get("nameShort"):
                            transit_info["lineShortName"] = transit_line["nameShort"]
                        if transit_line.get("color"):
                            transit_info["lineColor"] = transit_line["color"]
                        if transit_line.get("textColor"):
                            transit_info["lineTextColor"] = transit_line["textColor"]

                        vehicle = transit_line.get("vehicle", {})
                        if vehicle.get("type"):
                            transit_info["vehicleType"] = vehicle["type"]
                        if vehicle.get("iconUri"):
                            transit_info["vehicleIconUri"] = vehicle["iconUri"]

                        # Agencies
                        if transit_line.get("agencies"):
                            transit_info["agencies"] = transit_line["agencies"]

                        # Headsign and stop count
                        if td.get("headsign"):
                            transit_info["headsign"] = td["headsign"]
                        if td.get("stopCount"):
                            transit_info["stopCount"] = td["stopCount"]

                        if transit_info:
                            step_data["transitDetails"] = transit_info

                    steps.append(step_data)

            # Flush any remaining pending walk at the end
            if pending_walk is not None:
                steps.append(pending_walk)

            # Build leg data
            leg_data = {
                "duration": segment_duration,
                "distanceMeters": segment_distance,
                "polyline": route.get("polyline", {}).get("encodedPolyline", ""),
                "steps": steps
            }

            legs.append(leg_data)

            # Update departure time for next segment to be after this segment's arrival
            # This ensures realistic chained transit timing
            if leg.get("steps"):
                last_transit_step = None
                for step in reversed(leg["steps"]):
                    if step.get("travelMode") == "TRANSIT" and step.get("transitDetails"):
                        last_transit_step = step
                        break

                if last_transit_step:
                    arr_time = last_transit_step["transitDetails"].get("stopDetails", {}).get("arrivalTime")
                    if arr_time:
                        # Add 1 minute buffer after arrival for next segment
                        try:
                            arr_dt = datetime.fromisoformat(arr_time.replace("Z", "+00:00"))
                            departure_time = (arr_dt + timedelta(minutes=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
                        except:
                            pass  # Keep previous departure_time if parsing fails

        except Exception as e:
            legs.append({"error": str(e)})

    return {
        "places": output_places,
        "totalDuration": total_duration,
        "totalDistanceMeters": total_distance,
        "legs": legs
    }

# ============================================================================
# TEST: Save route results as JSON files
# ============================================================================

if __name__ == "__main__":
    import os
    import json
    from dotenv import load_dotenv
    from pathlib import Path
    from datetime import datetime, timedelta

    load_dotenv(dotenv_path=Path(__file__).parent / "api.env")
    api_key = os.getenv("GMAP_API_KEY")

    if not api_key:
        print("Error: GMAP_API_KEY not found")
        exit(1)

    output_dir = Path(__file__).parent / "route_tests"
    output_dir.mkdir(exist_ok=True)

    print("=" * 60)
    print("TEST: Compute Routes - Save JSON Results")
    print("=" * 60)

    # Test with 4 places in Vancouver
    place_queries = [
        "Stanley Park Vancouver BC",
        "La Casa Gelato Vancouver BC",
        "Granville Island Vancouver BC",
        "Capilano Suspension Bridge Vancouver BC"
    ]

    print(f"\nStep 1: Looking up Place IDs...")
    print("-" * 60)

    places = []  # List of place dicts with placeId, displayName, formattedAddress

    for query in place_queries:
        print(f"  Searching: {query}")
        result = text_search(
            api_key,
            query,
            fields=["places.id", "places.displayName", "places.formattedAddress"],
            max_results=1
        )

        if result.get("places"):
            place = result["places"][0]
            place_dict = {
                "placeId": place.get("id"),
                "displayName": place.get("displayName", {}).get("text", query),
                "formattedAddress": place.get("formattedAddress", "")
            }
            places.append(place_dict)
            print(f"    Found: {place_dict['displayName']} ({place_dict['placeId']})")
        else:
            print(f"    Not found: {query}")

    if len(places) < 2:
        print("\nNeed at least 2 places")
        exit(1)

    # Extract place_ids for raw compute_routes tests
    place_ids = [p["placeId"] for p in places]
    place_names = [p["displayName"] for p in places]

    print(f"\nPlaces: {place_names}")
    print(f"IDs: {place_ids}")

    # Departure time for TRANSIT (required)
    from datetime import timezone
    departure_time = (datetime.now(timezone.utc) + timedelta(hours=1)).strftime("%Y-%m-%dT%H:%M:%SZ")

    # Common setup for raw API calls
    origin = {"placeId": place_ids[0]}
    destination = {"placeId": place_ids[-1]}
    intermediates = [{"placeId": pid} for pid in place_ids[1:-1]]

    test_num = 0

    # =========================================================================
    # RAW API TESTS (compute_routes) - 8 tests
    # 4 modes × 2 optimize options = 8 (but TRANSIT doesn't support intermediates)
    # =========================================================================
    print("\n" + "=" * 60)
    print("RAW API TESTS (compute_routes)")
    print("=" * 60)

    for mode in ["DRIVE", "WALK", "BICYCLE"]:
        for optimize in [True, False]:
            test_num += 1
            opt_str = "true" if optimize else "false"
            filename = f"raw_{mode.lower()}_optimize_{opt_str}.json"
            print(f"\n[{test_num}] {mode} + optimize={optimize}...")
            try:
                result = compute_routes(
                    api_key,
                    origin=origin,
                    destination=destination,
                    fields="*",
                    intermediates=intermediates,
                    travel_mode=mode,
                    optimize_waypoint_order=optimize
                )
                with open(output_dir / filename, "w") as f:
                    json.dump(result, f, indent=2)
                print(f"  Saved: {filename}")
            except Exception as e:
                print(f"  Error: {e}")

    # TRANSIT raw - enumerate pairs (no intermediates allowed)
    for optimize in [True, False]:
        test_num += 1
        opt_str = "true" if optimize else "false"
        filename = f"raw_transit_optimize_{opt_str}.json"
        print(f"\n[{test_num}] TRANSIT raw pairs + optimize={optimize}...")
        transit_results = []
        for i in range(len(place_ids) - 1):
            origin_id = place_ids[i]
            dest_id = place_ids[i + 1]
            print(f"  [{i+1}] {place_names[i]} -> {place_names[i+1]}...")
            try:
                result = compute_routes(
                    api_key,
                    origin={"placeId": origin_id},
                    destination={"placeId": dest_id},
                    fields="*",
                    intermediates=None,
                    travel_mode="TRANSIT",
                    departure_time=departure_time
                )
                transit_results.append({
                    "from": place_names[i],
                    "to": place_names[i + 1],
                    "from_id": origin_id,
                    "to_id": dest_id,
                    "result": result
                })
                print(f"      Done")
            except Exception as e:
                print(f"      Error: {e}")
                transit_results.append({
                    "from": place_names[i],
                    "to": place_names[i + 1],
                    "error": str(e)
                })
        with open(output_dir / filename, "w") as f:
            json.dump(transit_results, f, indent=2)
        print(f"  Saved: {filename}")

    # =========================================================================
    # PROCESSED API TESTS - 8 tests
    # 4 modes × 2 optimize options = 8
    # =========================================================================
    print("\n" + "=" * 60)
    print("PROCESSED API TESTS")
    print("=" * 60)

    # DRIVE, WALK, BICYCLE processed
    for mode in ["DRIVE", "WALK", "BICYCLE"]:
        for optimize in [True, False]:
            test_num += 1
            opt_str = "true" if optimize else "false"
            filename = f"processed_{mode.lower()}_optimize_{opt_str}.json"
            print(f"\n[{test_num}] {mode} processed + optimize={optimize}...")
            try:
                result = compute_routes_drive_walk_bicycle(
                    api_key,
                    places=places,
                    travel_mode=mode,
                    optimize_waypoint_order=optimize
                )
                with open(output_dir / filename, "w") as f:
                    json.dump(result, f, indent=2)
                print(f"  Saved: {filename}")
            except Exception as e:
                print(f"  Error: {e}")

    # TRANSIT processed
    for optimize in [True, False]:
        test_num += 1
        opt_str = "true" if optimize else "false"
        filename = f"processed_transit_optimize_{opt_str}.json"
        print(f"\n[{test_num}] TRANSIT processed + optimize={optimize}...")
        try:
            result = compute_routes_transit(
                api_key,
                places=places,
                optimize_waypoint_order=optimize,
                departure_time=departure_time
            )
            with open(output_dir / filename, "w") as f:
                json.dump(result, f, indent=2)
            print(f"  Saved: {filename}")
        except Exception as e:
            print(f"  Error: {e}")

    print("\n" + "=" * 60)
    print(f"All results saved to: {output_dir}")
    print("=" * 60)
