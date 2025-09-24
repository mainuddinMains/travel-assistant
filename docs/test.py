# from optimizer import optimize_route

# places = [
#     "Statue of Liberty", 
#     "Times Square", 
#     "Central Park", 
#     "Empire State", 
#     "Brooklyn Bridge"
# ]

# # Example distance matrix in seconds (fake values for testing)
# distance_matrix = [
#     [0, 800, 1200, 1000, 1500],
#     [800, 0, 600, 700, 1300],
#     [1200, 600, 0, 500, 1000],
#     [1000, 700, 500, 0, 900],
#     [1500, 1300, 1000, 900, 0]
# ]

# order = optimize_route(distance_matrix)
# print("Optimal Visit Order:")
# for i in order:
#     print(f"{i}: {places[i]}")


import os
import googlemaps
from dotenv import load_dotenv
from optimizer import optimize_route

load_dotenv()  # Load API key from .env

gmaps = googlemaps.Client(key=os.getenv("GOOGLE_MAPS_API_KEY"))

places = [
    "Statue of Liberty", 
    "Times Square", 
    "Central Park", 
    "Empire State", 
    "Brooklyn Bridge"
]

matrix = gmaps.distance_matrix(places, places, mode="driving")

distance_matrix = [
    [row['duration']['value'] for row in r['elements']]
    for r in matrix['rows']
]

order = optimize_route(distance_matrix)
print("Optimal Visit Order:")
for i in order:
    print(f"{i}: {places[i]}")
