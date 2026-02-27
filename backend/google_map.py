import googlemaps
import os
from dotenv import load_dotenv

load_dotenv()
gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

def get_distance_and_time(origin: str, destinations: list[str]):
    """Fetch travel distance and time between origin and multiple destinations."""
    matrix = gmaps.distance_matrix(origins=[origin], destinations=destinations, mode="driving")

    results = []
    for i, row in enumerate(matrix["rows"][0]["elements"]):
        dest = destinations[i]
        if row["status"] == "OK":
            distance = row["distance"]["text"]
            duration = row["duration"]["text"]
        else:
            distance, duration = "N/A", "N/A"
        results.append({
            "destination": dest,
            "distance": distance,
            "duration": duration
        })
    return results
