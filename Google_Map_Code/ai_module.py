# ai_module.py

import os
import googlemaps
from dotenv import load_dotenv
from optimizer import optimize_route

load_dotenv()

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

def get_optimized_itinerary(places):
    matrix = gmaps.distance_matrix(places, places, mode="driving")

    distance_matrix = [
        [row['duration']['value'] for row in r['elements']]
        for r in matrix['rows']
    ]

    order = optimize_route(distance_matrix)
    
    return [places[i] for i in order]
