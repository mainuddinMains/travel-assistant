# Place Type to Icon ID Mapping
# Maps Google Places API primaryType to icon categories for map markers
#
# Icon IDs:
#   0 = food (fork & knife)
#   1 = shopping (bag)
#   2 = entertainment (tree/park)
#   3 = lodging (bed)
#   4 = health (plus/cross)
#   5 = sports (dumbbell)
#   6 = transport (bus)
#   7 = default (map pin)

# Direct type to icon ID mapping
# Based on Google Places API Table A and Table B types
# https://developers.google.com/maps/documentation/places/web-service/place-types

PLACE_TYPE_TO_ICON: dict[str, int] = {
    # =========================================================================
    # FOOD & DRINK (icon_id: 0)
    # =========================================================================
    "restaurant": 0,
    "cafe": 0,
    "coffee_shop": 0,
    "bar": 0,
    "bakery": 0,
    "ice_cream_shop": 0,
    "fast_food_restaurant": 0,
    "pizza_restaurant": 0,
    "meal_takeaway": 0,
    "meal_delivery": 0,
    "acai_shop": 0,
    "afghani_restaurant": 0,
    "african_restaurant": 0,
    "american_restaurant": 0,
    "asian_restaurant": 0,
    "bagel_shop": 0,
    "bar_and_grill": 0,
    "barbecue_restaurant": 0,
    "brazilian_restaurant": 0,
    "breakfast_restaurant": 0,
    "brunch_restaurant": 0,
    "buffet_restaurant": 0,
    "cafeteria": 0,
    "cat_cafe": 0,
    "chinese_restaurant": 0,
    "deli": 0,
    "dessert_restaurant": 0,
    "dessert_shop": 0,
    "diner": 0,
    "dog_cafe": 0,
    "donut_shop": 0,
    "fine_dining_restaurant": 0,
    "food_court": 0,
    "french_restaurant": 0,
    "greek_restaurant": 0,
    "hamburger_restaurant": 0,
    "indian_restaurant": 0,
    "indonesian_restaurant": 0,
    "italian_restaurant": 0,
    "japanese_restaurant": 0,
    "juice_shop": 0,
    "korean_restaurant": 0,
    "lebanese_restaurant": 0,
    "mediterranean_restaurant": 0,
    "mexican_restaurant": 0,
    "middle_eastern_restaurant": 0,
    "pub": 0,
    "ramen_restaurant": 0,
    "sandwich_shop": 0,
    "seafood_restaurant": 0,
    "spanish_restaurant": 0,
    "steak_house": 0,
    "sushi_restaurant": 0,
    "tea_house": 0,
    "thai_restaurant": 0,
    "turkish_restaurant": 0,
    "vegan_restaurant": 0,
    "vegetarian_restaurant": 0,
    "vietnamese_restaurant": 0,
    "wine_bar": 0,
    "confectionery": 0,
    "food": 0,

    # =========================================================================
    # SHOPPING (icon_id: 1)
    # =========================================================================
    "shopping_mall": 1,
    "store": 1,
    "supermarket": 1,
    "grocery_store": 1,
    "market": 1,
    "clothing_store": 1,
    "book_store": 1,
    "electronics_store": 1,
    "gift_shop": 1,
    "jewelry_store": 1,
    "asian_grocery_store": 1,
    "auto_parts_store": 1,
    "bicycle_store": 1,
    "butcher_shop": 1,
    "cell_phone_store": 1,
    "convenience_store": 1,
    "department_store": 1,
    "discount_store": 1,
    "food_store": 1,
    "furniture_store": 1,
    "hardware_store": 1,
    "home_goods_store": 1,
    "home_improvement_store": 1,
    "liquor_store": 1,
    "pet_store": 1,
    "shoe_store": 1,
    "sporting_goods_store": 1,
    "warehouse_store": 1,
    "wholesaler": 1,
    "candy_store": 1,
    "chocolate_factory": 1,
    "chocolate_shop": 1,
    "movie_rental": 1,
    "florist": 1,

    # =========================================================================
    # ENTERTAINMENT & PARKS (icon_id: 2)
    # =========================================================================
    "park": 2,
    "museum": 2,
    "zoo": 2,
    "aquarium": 2,
    "amusement_park": 2,
    "movie_theater": 2,
    "night_club": 2,
    "bowling_alley": 2,
    "casino": 2,
    "art_gallery": 2,
    "tourist_attraction": 2,
    "adventure_sports_center": 2,
    "amphitheatre": 2,
    "amusement_center": 2,
    "banquet_hall": 2,
    "barbecue_area": 2,
    "botanical_garden": 2,
    "childrens_camp": 2,
    "comedy_club": 2,
    "community_center": 2,
    "concert_hall": 2,
    "convention_center": 2,
    "cultural_center": 2,
    "cultural_landmark": 2,
    "cycling_park": 2,
    "dance_hall": 2,
    "dog_park": 2,
    "event_venue": 2,
    "ferris_wheel": 2,
    "garden": 2,
    "hiking_area": 2,
    "historical_landmark": 2,
    "historical_place": 2,
    "karaoke": 2,
    "marina": 2,
    "monument": 2,
    "national_park": 2,
    "observation_deck": 2,
    "off_roading_area": 2,
    "opera_house": 2,
    "performing_arts_theater": 2,
    "philharmonic_hall": 2,
    "picnic_ground": 2,
    "planetarium": 2,
    "plaza": 2,
    "roller_coaster": 2,
    "sculpture": 2,
    "skateboard_park": 2,
    "state_park": 2,
    "video_arcade": 2,
    "visitor_center": 2,
    "water_park": 2,
    "wedding_venue": 2,
    "wildlife_park": 2,
    "wildlife_refuge": 2,
    "beach": 2,
    "ski_resort": 2,
    "internet_cafe": 2,

    # =========================================================================
    # LODGING (icon_id: 3)
    # =========================================================================
    "hotel": 3,
    "motel": 3,
    "lodging": 3,
    "campground": 3,
    "hostel": 3,
    "bed_and_breakfast": 3,
    "budget_japanese_inn": 3,
    "camping_cabin": 3,
    "cottage": 3,
    "extended_stay_hotel": 3,
    "farmstay": 3,
    "guest_house": 3,
    "inn": 3,
    "japanese_inn": 3,
    "mobile_home_park": 3,
    "private_guest_room": 3,
    "resort_hotel": 3,
    "rv_park": 3,
    "apartment_building": 3,
    "apartment_complex": 3,
    "condominium_complex": 3,
    "housing_complex": 3,

    # =========================================================================
    # HEALTH & WELLNESS (icon_id: 4)
    # =========================================================================
    "hospital": 4,
    "pharmacy": 4,
    "doctor": 4,
    "dentist": 4,
    "chiropractor": 4,
    "dental_clinic": 4,
    "drugstore": 4,
    "medical_lab": 4,
    "physiotherapist": 4,
    "veterinary_care": 4,
    "clinic": 4,

    # =========================================================================
    # SPORTS & FITNESS (icon_id: 5)
    # =========================================================================
    "gym": 5,
    "spa": 5,
    "golf_course": 5,
    "swimming_pool": 5,
    "fitness_center": 5,
    "playground": 5,
    "stadium": 5,
    "arena": 5,
    "athletic_field": 5,
    "fishing_charter": 5,
    "fishing_pond": 5,
    "ice_skating_rink": 5,
    "sports_activity_location": 5,
    "sports_club": 5,
    "sports_coaching": 5,
    "sports_complex": 5,
    "massage": 5,
    "sauna": 5,
    "skin_care_clinic": 5,
    "tanning_studio": 5,
    "wellness_center": 5,
    "yoga_studio": 5,

    # =========================================================================
    # TRANSPORTATION (icon_id: 6)
    # =========================================================================
    "airport": 6,
    "bus_station": 6,
    "train_station": 6,
    "subway_station": 6,
    "taxi_stand": 6,
    "gas_station": 6,
    "parking": 6,
    "car_rental": 6,
    "car_repair": 6,
    "airstrip": 6,
    "bus_stop": 6,
    "ferry_terminal": 6,
    "heliport": 6,
    "international_airport": 6,
    "light_rail_station": 6,
    "park_and_ride": 6,
    "transit_depot": 6,
    "transit_station": 6,
    "truck_stop": 6,
    "rest_stop": 6,
    "electric_vehicle_charging_station": 6,
    "car_dealer": 6,
    "car_wash": 6,

    # =========================================================================
    # SERVICES & OTHER (icon_id: 7 - default)
    # =========================================================================
    "bank": 7,
    "atm": 7,
    "post_office": 7,
    "police": 7,
    "fire_station": 7,
    "library": 7,
    "school": 7,
    "university": 7,
    "church": 7,
    "mosque": 7,
    "synagogue": 7,
    "hindu_temple": 7,
    "hair_salon": 7,
    "laundry": 7,
    "accounting": 7,
    "barber_shop": 7,
    "beautician": 7,
    "beauty_salon": 7,
    "body_art_service": 7,
    "catering_service": 7,
    "cemetery": 7,
    "child_care_agency": 7,
    "consultant": 7,
    "courier_service": 7,
    "electrician": 7,
    "food_delivery": 7,
    "foot_care": 7,
    "funeral_home": 7,
    "hair_care": 7,
    "insurance_agency": 7,
    "lawyer": 7,
    "locksmith": 7,
    "makeup_artist": 7,
    "moving_company": 7,
    "nail_salon": 7,
    "painter": 7,
    "plumber": 7,
    "real_estate_agency": 7,
    "roofing_contractor": 7,
    "storage": 7,
    "tailor": 7,
    "telecommunications_service_provider": 7,
    "tour_agency": 7,
    "tourist_information_center": 7,
    "travel_agency": 7,
    "city_hall": 7,
    "courthouse": 7,
    "embassy": 7,
    "government_office": 7,
    "local_government_office": 7,
    "neighborhood_police_station": 7,
    "preschool": 7,
    "primary_school": 7,
    "secondary_school": 7,
    "place_of_worship": 7,
    "corporate_office": 7,
    "farm": 7,
    "ranch": 7,
    "public_bath": 7,
    "public_bathroom": 7,
    "stable": 7,
}

# Default icon ID for unknown types
DEFAULT_ICON_ID = 7


def get_icon_id(primary_type: str | None) -> int:
    """
    Get the icon ID for a given place primary type.

    Args:
        primary_type: The Google Places API primaryType string (e.g., "ice_cream_shop")

    Returns:
        Icon ID (0-7) for the place type
    """
    if not primary_type:
        return DEFAULT_ICON_ID

    # Direct lookup
    return PLACE_TYPE_TO_ICON.get(primary_type, DEFAULT_ICON_ID)


# Icon ID to category name mapping (for reference/debugging)
ICON_CATEGORIES = {
    0: "food",
    1: "shopping",
    2: "entertainment",
    3: "lodging",
    4: "health",
    5: "sports",
    6: "transport",
    7: "default"
}
