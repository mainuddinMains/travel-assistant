def suggest_visit_times(places):
    return {place: "Morning" if i % 2 == 0 else "Evening" for i, place in enumerate(places)}
