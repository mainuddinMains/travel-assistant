# time_suggester.py

def get_best_time(place_name):
    """
    Suggests the best time of day to visit a given location based on common keywords.
    """
    keywords = {
        "park": "Morning",
        "square": "Evening",
        "museum": "Afternoon",
        "observatory": "Evening",
        "bridge": "Afternoon",
        "monument": "Morning",
        "tower": "Evening",
        "beach": "Afternoon",
        "zoo": "Morning",
        "palace": "Afternoon",
        "statue": "Morning"
    }

    name = place_name.lower()
    for key in keywords:
        if key in name:
            return keywords[key]
    return "Afternoon"  # default fallback


def print_suggested_times(places):
    print("Suggested Visit Times:\n")
    for i, place in enumerate(places):
        best_time = get_best_time(place)
        print(f"{i+1}. {place}: Best time → {best_time}")


if __name__ == "__main__":
    # Example input list — replace with your optimized route
    optimized_places = [
        "Statue of Liberty",
        "Brooklyn Bridge",
        "Central Park",
        "Times Square",
        "Empire State Building"
    ]

    print_suggested_times(optimized_places)
