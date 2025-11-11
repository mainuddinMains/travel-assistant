from dotenv import load_dotenv
import os
import googlemaps
import json

from typing import List, Tuple, Dict, Any, Optional
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

class Place():
    def __init__(self, name:str, address:str, city:str, reason:str,
                 place_id:Optional[str]=None, url:Optional[str]=None,
                 rating:Optional[float]=None, number_of_reviews:Optional[int]=None,
                 business_hours:Optional[str]=None, category:Optional[str]=None):
        self.name = name.strip()
        self.address = address.strip()
        self.city = city.strip()
        self.reason = reason.strip()

        # New fields from Gemini grounding (can be pre-populated)
        self.place_id: Optional[str] = place_id
        self.map_url: Optional[str] = url
        self.rating: Optional[float] = rating
        self.number_of_reviews: Optional[int] = number_of_reviews
        # Business hours from Gemini is a single string; convert to list for compatibility
        self.business_hours: Optional[list] = business_hours.split(", ") if business_hours else None
        self.category: Optional[str] = category  # Business type from Google Maps

        # Fields that may still need API enrichment
        self.formatted_address: Optional[str] = None

    @property
    def full_address(self) -> str:
        return f"{self.name}, {self.address}, {self.city}"
    
def normalize_place_id(place_id: Optional[str]) -> Optional[str]:
    """
    Normalize Place ID to the format expected by googlemaps Python client.

    Gemini grounding returns: "places/ChIJzwJT8Haz2IcRTuf4LlMlHgk"
    Google Maps API expects: "ChIJzwJT8Haz2IcRTuf4LlMlHgk"

    Args:
        place_id: Place ID in either format

    Returns:
        Normalized Place ID without "places/" prefix, or None if input is None
    """
    if not place_id:
        return None

    # Remove "places/" prefix if present
    if place_id.startswith("places/"):
        return place_id[7:]  # len("places/") = 7

    return place_id

def find_place_id(gmaps_client, p: Place) -> Optional[str]:
    resp = gmaps_client.find_place(
        input=p.full_address,
        input_type="textquery",
        fields=["place_id"]
    )
    candidates = resp.get("candidates", [])
    if candidates:
        return candidates[0].get("place_id")
    return None

def parse_trip(data: Dict[str, Any]) -> Tuple[Dict[str, Any], List[Place]]:
    meta = data.get("trip_meta", {})
    recs = data.get("recommendations", [])

    places = []
    for r in recs:
        # Normalize place_id from Gemini's "places/ChIJ..." format to "ChIJ..." format
        raw_place_id = r.get('place_id')
        normalized_place_id = normalize_place_id(raw_place_id)

        place = Place(
            name=r['name'],
            address=r['address'],
            city=r['city'],
            reason=r['reason'],
            place_id=normalized_place_id,  # Normalized from Gemini grounding
            url=r.get('url'),  # From Gemini grounding
            rating=r.get('rating'),  # From Gemini grounding
            number_of_reviews=r.get('number_of_reviews'),  # From Gemini grounding
            business_hours=r.get('business_hours'),  # From Gemini grounding (string format)
            category=r.get('category')  # From Gemini grounding
        )
        places.append(place)

    return meta, places

def load_place_details(gmaps_client, place_id: str) -> Dict[str, Any]:

    return gmaps_client.place(
        place_id=place_id,
        fields=['current_opening_hours', 'formatted_address', 'rating', 'user_ratings_total', 'url']
    )['result']

def enrich_place_with_details(gmaps_client, places: List[Place]) -> None:
    """Enrich places with Google Maps data. Only call API when place_id is missing."""
    for p in places:
        # ONLY call API if place_id is missing - otherwise use grounding data
        if not p.place_id:
            print(f"  ⚠️  Missing Place ID from Gemini grounding for: {p.name}")
            print(f"      Attempting fallback: Google Maps text search...")
            place_id = find_place_id(gmaps_client, p)
            if place_id:
                p.place_id = place_id
                print(f"      ✅ Found Place ID via text search: {place_id}")

                # Now fetch full details since we got the place_id
                try:
                    details = load_place_details(gmaps_client, p.place_id)
                    p.formatted_address = details.get("formatted_address")
                    p.business_hours = details.get("current_opening_hours", {}).get("weekday_text", [])
                    p.rating = details.get("rating")
                    p.number_of_reviews = details.get("user_ratings_total")
                    p.map_url = details.get("url")
                    print(f"      ✅ Enriched with Place Details API")
                except Exception as e:
                    print(f"      ⚠️  Place Details API failed: {str(e)}")
            else:
                print(f"      ❌ Text search failed - place will use address-based routing")
                # Route optimization can still work with full_address even without place_id
        else:
            # Have place_id from grounding - no API call needed
            print(f"  ✅ Using data from Gemini grounding for: {p.name} (Place ID: {p.place_id})")

def optimize_with_direction(gmaps_client, places: List[Place], mode: str = "driving", departure_time: datetime = datetime.now()) -> Dict[str, Any]:
    assert mode in ["driving", "walking", "bicycling", "transit"], "Invalid mode"

    # Handle timezone-aware vs timezone-naive comparison
    now = datetime.now(departure_time.tzinfo) if departure_time.tzinfo else datetime.now()

    # Allow up to 5 minutes in the past for all modes (to account for processing delays)
    assert departure_time > now - timedelta(minutes=5), f"Departure time cannot be more than 5 minutes in the past. Current: {now}, Provided: {departure_time}"
    
    origin = places[0].full_address
    destination = places[-1].full_address
    waypoint_strings = [p.full_address for p in places[1:-1]]

    if mode == "transit":
        # For transit, first optimize with driving to get waypoint order
        if waypoint_strings:  # Only if there are waypoints
            directions = gmaps_client.directions(
                origin=origin,
                destination=destination,
                waypoints=waypoint_strings,
                mode="driving",
                departure_time=departure_time,
                optimize_waypoints=True,
            )[0]
            optimized_route = [origin] + [waypoint_strings[i] for i in directions['waypoint_order']] + [destination]
        else:
            # No waypoints, just origin and destination
            optimized_route = [origin, destination]

        distances = []
        durations = []
        legs = []

        for i in range(len(optimized_route) - 1):
            try:
                transit_result = gmaps_client.directions(
                    origin=optimized_route[i],
                    destination=optimized_route[i + 1],
                    mode="transit",
                    departure_time=departure_time,
                    transit_mode=None, # Valid values are "bus", "subway", "train", "tram", "rail". "rail" is equivalent to ["train", "tram", "subway"].
                    transit_routing_preference=None # Valid values are "less_walking" or "fewer_transfers"
                )

                if not transit_result or len(transit_result) == 0:
                    raise ValueError(f"No transit route available from {optimized_route[i]} to {optimized_route[i + 1]}")

                leg_directions = transit_result[0]['legs'][0]

                distances.append(leg_directions['distance']['value'])
                durations.append(leg_directions['duration']['value'])
                legs.append(leg_directions)
            except Exception as e:
                raise ValueError(f"Transit routing failed between stops {i+1} and {i+2}. Transit may not be available for this route. Error: {str(e)}")
        
    else:
        directions = gmaps_client.directions(
            origin=origin, 
            destination=destination, 
            waypoints=waypoint_strings, 
            mode=mode, 
            departure_time=departure_time,
            optimize_waypoints=True,
        )[0]

        optimized_route = [origin] + [waypoint_strings[i] for i in directions['waypoint_order']] + [destination]

        legs = directions['legs']

    optimized_legs = build_path_object(legs)
    # meter
    total_distance = sum(leg['distance']['value'] for leg in legs)
    # seconds
    total_duration = sum(leg['duration']['value'] for leg in legs)

    return {
        "mode": mode,
        "optimized_route": optimized_route,
        "total_distance": total_distance,
        "total_duration": total_duration,
        "legs": optimized_legs
    }

def _fmt_time(t: Dict[str, Any]) -> str: 
    epoch, tzname = t.get("value"), t.get("time_zone")
    dt = datetime.fromtimestamp(epoch, tz=ZoneInfo(tzname))

    return dt.strftime("%Y-%m-%d %H:%M:%S %Z")

def _emit_one_step(step: Dict[str, Any]) -> Dict[str, Any]:
    """Normalize one step to the requested shape."""
    mode = step.get("travel_mode")
    rec = {
        "mode": mode,
        "start_location": step.get("start_location"),
        "end_location": step.get("end_location"),
        "distance": step.get("distance").get("value"),   # meters
        "duration": step.get("duration").get("value"),   # seconds
    }

    if mode == "TRANSIT":
        td   = step.get("transit_details")
        line = td.get("line")
        veh  = line.get("vehicle")

        rec["transit_details"] = {
            "departure_stop_name": td.get("departure_stop").get("name"),
            "arrival_stop_name": td.get("arrival_stop").get("name"),
            "departure_time": _fmt_time(td.get("departure_time")),
            "arrival_time": _fmt_time(td.get("arrival_time")),
            "line_name": line.get("name"),
            "line_short_name": line.get("short_name"),
            "line_color": line.get("color"),
            "line_text_color": line.get("text_color"),
            "vehicle_name": veh.get("name"),
            "vehicle_type": veh.get("type"),
            "vehicle_icon": veh.get("icon"),
            "num_stops": td.get("num_stops")
        }

    return rec

def _collect_leaf_steps(step: Dict[str, Any], out: List[Dict[str, Any]]) -> None:
    """
    Recursively walk down 'steps'. If a step has children, go deeper.
    If it has no children, it's a leaf -> emit it via _emit_one_step.
    """
    children = step.get("steps", [])
    if children:
        for child in children:
            _collect_leaf_steps(child, out)
    else:
        out.append(_emit_one_step(step))

def build_path_object(legs: Dict[str, Any]) -> Dict[str, Any]:
    legs_info = []
    for leg in legs:
        leg_info = {
            "start_location": leg.get("start_location"),
            "start_address": leg.get("start_address"),
            "end_location": leg.get("end_location"),
            "end_address": leg.get("end_address"),
            "distance": leg.get("distance").get("value"),   # meters
            "duration": leg.get("duration").get("value"),   # seconds
        }
        steps_info = []
        for step in leg.get("steps"):
            _collect_leaf_steps(step, steps_info)
        leg_info["steps"] = steps_info
        legs_info.append(leg_info)

    return legs_info

if __name__ == "__main__":
    load_dotenv(dotenv_path="backend/api.env")
    api_key = os.getenv("GMAP_API_KEY")
    if not api_key:
        raise ValueError("Google Maps API key not found in environment variables.")

    gmaps_client = googlemaps.Client(key=api_key)

    with open("backend/triproute_structure.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    meta, places = parse_trip(data)

    enrich_place_with_details(gmaps_client, places)

    # Save enriched places
    places_data = [vars(place) for place in places]
    with open("backend/enriched_places.json", "w", encoding="utf-8") as f:
        json.dump(places_data, f, indent=4, ensure_ascii=False)

    driving_direction = optimize_with_direction(gmaps_client, places, mode="driving", departure_time=datetime.now())
    walking_direction = optimize_with_direction(gmaps_client, places, mode="walking", departure_time=datetime.now())
    bicycling_direction = optimize_with_direction(gmaps_client, places, mode="bicycling", departure_time=datetime.now())
    transit_direction = optimize_with_direction(gmaps_client, places, mode="transit", departure_time=datetime.now())

    with open("backend/direction_driving.json", "w", encoding="utf-8") as f:
        json.dump(driving_direction, f, indent=4)
    with open("backend/direction_walking.json", "w", encoding="utf-8") as f:
        json.dump(walking_direction, f, indent=4)
    with open("backend/direction_bicycling.json", "w", encoding="utf-8") as f:
        json.dump(bicycling_direction, f, indent=4)
    with open("backend/direction_transit.json", "w", encoding="utf-8") as f:
        json.dump(transit_direction, f, indent=4)

    print()

# departure_time (int or datetime.datetime) – Specifies the desired time of departure.
# mode (string) – Specifies the mode of transport to use when calculating directions. Valid values are “driving”, “walking”, “transit” or “bicycling”.
# transit_mode (string or list of strings) – Specifies one or more preferred modes of transit. This parameter may only be specified for requests where the mode is transit. Valid values are “bus”, “subway”, “train”, “tram”, “rail”. “rail” is equivalent to [“train”, “tram”, “subway”].
# transit_routing_preference (string) – Specifies preferences for transit requests. Valid values are “less_walking” or “fewer_transfers”.

# places_photo

# schedule for transit
# transportation
# starting point
# end point
# departure time
# photo
# type
# other introduction
# button
# 10 limit on the google maps directions on the actual maps

# compare the history of the routes and if the places are same, then use the cached log to save the api calls.
# default - chatting details (destinations, departure time, transportation mode) 
# user can revise the details and regenerate the route based on those changes of the details.
# user data collection