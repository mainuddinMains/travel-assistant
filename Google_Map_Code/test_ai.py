from ai_module import get_optimized_itinerary

places = [
    "Statue of Liberty", 
    "Times Square", 
    "Central Park", 
    "Empire State", 
    "Brooklyn Bridge"
]

itinerary = get_optimized_itinerary(places)

print("Optimized Itinerary:")
for place in itinerary:
    print(place)
