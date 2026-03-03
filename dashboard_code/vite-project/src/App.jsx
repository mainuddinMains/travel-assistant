import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  mapPlaceholder: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  modeSelector: {
    position: "absolute",
    top: "16px",
    left: "16px",
    zIndex: 10,
    display: "flex",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    padding: "4px",
  },
  modeButton: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  chatButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    zIndex: 10,
    width: "48px",
    height: "48px",
    borderRadius: "full",
    backgroundColor: "#2563eb",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  profilePanel: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    zIndex: 20,
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
    overflow: "hidden",
    transition: "all 0.3s",
    width: "320px",
  },
  profileCollapsed: {
    width: "auto",
  },
};

const modes = [
  { id: "drive", icon: "🚗", label: "Drive" },
  { id: "transit", icon: "🚇", label: "Transit" },
  { id: "walk", icon: "🚶", label: "Walk" },
  { id: "bike", icon: "🚴", label: "Bike" },
];

const tabs = [
  { id: "active", icon: "🚗", label: "Active" },
  { id: "saved", icon: "⭐", label: "Saved" },
  { id: "history", icon: "📜", label: "History" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedMode, setSelectedMode] = useState("drive");
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [geolocationStatus, setGeolocationStatus] = useState("offline");
  const [showCountries, setShowCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "US", details: null });
  const [showCountryDetails, setShowCountryDetails] = useState(false);

  const countryData = {
    "US": {
      popularCities: ["New York", "Los Angeles", "Chicago", "San Francisco", "Miami", "Las Vegas"],
      beautifulPlaces: ["Grand Canyon", "Yellowstone", "Yosemite", "Niagara Falls", "Golden Gate Bridge"],
      cityAndCountryside: { city: "New York - Times Square, Central Park, Broadway shows", countryside: "Napa Valley - Wine country, rolling hills, vineyards" },
      popularDishes: ["Hamburgers", "Hot Dogs", "BBQ Ribs", "Apple Pie", "Cheeseburger"],
      naturalBeauty: "Grand Canyon, Yellowstone, Yosemite, Rocky Mountains, Florida Everglades"
    },
    "GB": {
      popularCities: ["London", "Edinburgh", "Manchester", "Birmingham", "Liverpool", "Oxford"],
      beautifulPlaces: ["Big Ben", "Tower Bridge", "Stonehenge", "Lake District", "Tower of London"],
      cityAndCountryside: { city: "London - Big Ben, Buckingham Palace, West End", countryside: "Cotswolds - Quaint villages, rolling hills, thatched cottages" },
      popularDishes: ["Fish and Chips", "Shepherd's Pie", "Full English Breakfast", "Sunday Roast", "Bangers and Mash"],
      naturalBeauty: "Lake District, Scottish Highlands, Cornwall coastline, White Cliffs of Dover"
    },
    "FR": {
      popularCities: ["Paris", "Lyon", "Nice", "Marseille", "Bordeaux", "Strasbourg"],
      beautifulPlaces: ["Eiffel Tower", "Louvre Museum", "Palace of Versailles", "Mont Saint-Michel", "French Riviera"],
      cityAndCountryside: { city: "Paris - Eiffel Tower, Champs-Élysées, Notre-Dame", countryside: "Provence - Lavender fields, vineyards, charming villages" },
      popularDishes: ["Croissant", "Coq au Vin", "Bouillabaisse", "Ratatouille", "Crème Brûlée"],
      naturalBeauty: "French Alps, Lavender fields of Provence, French Riviera, Normandy coast"
    },
    "JP": {
      popularCities: ["Tokyo", "Kyoto", "Osaka", "Hiroshima", "Yokohama", "Sapporo"],
      beautifulPlaces: ["Mount Fuji", "Fushimi Inari Shrine", "Cherry Blossoms", "Kinkaku-ji", "Himeji Castle"],
      cityAndCountryside: { city: "Tokyo - Shibuya Crossing, Senso-ji Temple, Tokyo Tower", countryside: "Kyoto - Ancient temples, bamboo groves, traditional ryokans" },
      popularDishes: ["Sushi", "Ramen", "Tempura", "Okonomiyaki", "Mochi"],
      naturalBeauty: "Mount Fuji, Japanese Alps, Cherry blossom season, Okinawa beaches"
    },
    "IT": {
      popularCities: ["Rome", "Venice", "Florence", "Milan", "Naples", "Amalfi Coast"],
      beautifulPlaces: ["Colosseum", "Venice Canals", "Leaning Tower of Pisa", "Amalfi Coast", "Cinque Terre"],
      cityAndCountryside: { city: "Rome - Colosseum, Vatican City, Trevi Fountain", countryside: "Tuscany - Rolling hills, vineyards, medieval towns" },
      popularDishes: ["Pizza", "Pasta Carbonara", "Risotto", "Lasagna", "Tiramisu"],
      naturalBeauty: "Amalfi Coast, Lake Como, Tuscan hills, Dolomites, Sicilian beaches"
    },
    "ES": {
      popularCities: ["Madrid", "Barcelona", "Seville", "Valencia", "Bilbao", "Malaga"],
      beautifulPlaces: ["Sagrada Familia", "Alhambra", "Park Güell", "La Rambla", "Ibiza"],
      cityAndCountryside: { city: "Barcelona - Gaudi architecture, Las Ramblas, Beach", countryside: "Andalusia - White villages, flamenco, olive groves" },
      popularDishes: ["Paella", "Tapas", "Jamón Ibérico", "Gazpacho", "Churros"],
      naturalBeauty: "Pyrenees, Canary Islands, Costa del Sol, Balearic Islands"
    },
    "DE": {
      popularCities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Dresden"],
      beautifulPlaces: ["Brandenburg Gate", "Neuschwanstein Castle", "Cologne Cathedral", "Black Forest", "Romantic Road"],
      cityAndCountryside: { city: "Berlin - Brandenburg Gate, Berlin Wall, Museum Island", countryside: "Bavaria - Alps, castles, fairytale forests" },
      popularDishes: ["Currywurst", "Schnitzel", "Pretzels", "Sauerkraut", "Black Forest Cake"],
      naturalBeauty: "Black Forest, Bavarian Alps, Rhine Valley, Mecklenburg Lake District"
    },
    "AU": {
      popularCities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Cairns"],
      beautifulPlaces: ["Sydney Opera House", "Great Barrier Reef", "Uluru", "Blue Mountains", "Bondi Beach"],
      cityAndCountryside: { city: "Sydney - Opera House, Harbour Bridge, Taronga Zoo", countryside: "Outback - Red deserts, unique wildlife, Aboriginal culture" },
      popularDishes: ["Vegemite", "Meat Pie", "Pavlova", "Tim Tam Slam", "Flat White"],
      naturalBeauty: "Great Barrier Reef, Uluru, Blue Mountains, Whitsunday Islands, Daintree Rainforest"
    },
    "CA": {
      popularCities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa", "Quebec City"],
      beautifulPlaces: ["Niagara Falls", "Banff National Park", "CN Tower", "Old Quebec", "Lake Louise"],
      cityAndCountryside: { city: "Toronto - CN Tower, Distillery District, Islands", countryside: "Banff - Mountain lakes, glaciers, wildlife" },
      popularDishes: ["Poutine", "Maple Syrup", "Nanaimo Bars", "Butter Tarts", "Bannock"],
      naturalBeauty: "Banff National Park, Niagara Falls, Rocky Mountains, Northern Lights, Prince Edward Island"
    },
    "TH": {
      popularCities: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Krabi", "Koh Samui"],
      beautifulPlaces: ["Grand Palace", "Phi Phi Islands", "Angkor Wat nearby", "Floating Markets", "Chiang Mai Temples"],
      cityAndCountryside: { city: "Bangkok - Grand Palace, Chatuchak Market, Khao San Road", countryside: "Northern Thailand - Mountain temples, hill tribes, waterfalls" },
      popularDishes: ["Pad Thai", "Green Curry", "Tom Yum Goong", "Mango Sticky Rice", "Som Tam"],
      naturalBeauty: "Phi Phi Islands, Similan Islands, Thai beaches, Khao Yai National Park, Northern mountains"
    },
    "IN": {
      popularCities: ["Delhi", "Mumbai", "Jaipur", "Agra", "Kolkata", "Bangalore"],
      beautifulPlaces: ["Taj Mahal", "Varanasi", "Jaipur Palaces", "Kerala Backwaters", "Goa Beaches"],
      cityAndCountryside: { city: "Delhi - Red Fort, India Gate, Qutub Minar", countryside: "Kerala - Houseboats, spice plantations, backwaters" },
      popularDishes: ["Biryani", "Butter Chicken", "Dosa", "Samosa", "Naan"],
      naturalBeauty: "Himalayas, Kerala backwaters, Goa beaches, Ranthambore tigers, Darjeeling tea gardens"
    },
    "CN": {
      popularCities: ["Beijing", "Shanghai", "Xi'an", "Guangzhou", "Hangzhou", "Hong Kong"],
      beautifulPlaces: ["Great Wall", "Forbidden City", "Terracotta Army", "Li River", "Zhangjiajie"],
      cityAndCountryside: { city: "Beijing - Great Wall, Forbidden City, Tiananmen Square", countryside: "Guilin - Karst mountains, Li River, rice terraces" },
      popularDishes: ["Peking Duck", "Dim Sum", "Hot Pot", "Dumplings", "Kung Pao Chicken"],
      naturalBeauty: "Great Wall, Zhangjiajie Avatar mountains, Guilin karsts, Jiuzhaigou valley, Yangtze River"
    },
    "KR": {
      popularCities: ["Seoul", "Busan", "Incheon", "Jeju Island", "Daegu", "Jeonju"],
      beautifulPlaces: ["Bukchon Hanok Village", "Gyeongbokgung Palace", "Jeju Island", "DMZ", "Nami Island"],
      cityAndCountryside: { city: "Seoul - Palaces, Shopping districts, K-pop culture", countryside: "Jeju Island - Volcanic landscape, beaches, Hallasan mountain" },
      popularDishes: ["Kimchi", "Bibimbap", "Korean BBQ", "Tteokbokki", "Japchae"],
      naturalBeauty: "Jeju Island, Jirisan mountains, Korean DMZ, Ulleungdo island, Seoraksan National Park"
    },
    "MX": {
      popularCities: ["Mexico City", "Cancun", "Guadalajara", "Playa del Carmen", "Oaxaca", "Tijuana"],
      beautifulPlaces: ["Chichen Itza", "Teotihuacan", "Mexico City Centro", "Copper Canyon", "Cabo San Lucas"],
      cityAndCountryside: { city: "Mexico City - Zócalo, Frida Kahlo Museum, Chapultepec", countryside: "Oaxaca - Ancient ruins, mezcal, colonial towns" },
      popularDishes: ["Tacos", "Mole", "Tamales", "Enchiladas", "Guacamole"],
      naturalBeauty: "Cancun beaches, Copper Canyon, Sierra Gorda, Sian Ka'an biosphere, Monarch butterfly migration"
    },
    "BR": {
      popularCities: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador", "Foz do Iguaçu", "Recife"],
      beautifulPlaces: ["Christ the Redeemer", "Iguazu Falls", "Copacabana Beach", "Amazon Rainforest", "Ipanema"],
      cityAndCountryside: { city: "Rio - Christ the Redeemer, Copacabana, Sugar Loaf", countryside: "Amazon - Rainforest, river cruises, wildlife" },
      popularDishes: ["Feijoada", "Churrasco", "Moqueca", " brigadeiro", "Acarajé"],
      naturalBeauty: "Amazon Rainforest, Iguazu Falls, Rio beaches, Fernando de Noronha, Pantanal wetlands"
    },
    "NL": {
      popularCities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Delft", "Maastricht"],
      beautifulPlaces: ["Keukenhof Gardens", "Anne Frank House", "Van Gogh Museum", "Kinderdijk Windmills", "Rijksmuseum"],
      cityAndCountryside: { city: "Amsterdam - Canals, museums, cycling culture", countryside: "Dutch countryside - Tulip fields, windmills, cheese farms" },
      popularDishes: ["Stroopwafel", "Poffertjes", "Oliebollen", "Dutch cheese", "Pancakes"],
      naturalBeauty: "Keukenhof gardens, Dutch dikes, Giethoorn village, Wadden Sea, tulip fields"
    },
    "CH": {
      popularCities: ["Zurich", "Geneva", "Bern", "Lucerne", "Interlaken", "Zermatt"],
      beautifulPlaces: ["Matterhorn", "Jungfrau", "Lake Geneva", "Swiss Alps", "Rhine Falls"],
      cityAndCountryside: { city: "Zurich - Old town, lake, nightlife", countryside: "Swiss Alps - Mountain villages, ski resorts, scenic trains" },
      popularDishes: ["Fondue", "Raclette", "Rösti", "Swiss chocolate", "Zürcher Geschnetzeltes"],
      naturalBeauty: "Matterhorn, Jungfrau region, Lake Geneva, Swiss National Park, Engadin valley"
    },
    "SG": {
      popularCities: ["Singapore"],
      beautifulPlaces: ["Marina Bay Sands", "Gardens by the Bay", "Sentosa Island", "Clarke Quay", "Orchard Road"],
      cityAndCountryside: { city: "Singapore - Futuristic skyline, Gardens by the Bay, Hawker centers", countryside: "Sentosa - Beach resorts, Universal Studios, relaxation" },
      popularDishes: ["Chili Crab", "Hainanese Chicken Rice", "Laksa", "Kaya Toast", "Satay"],
      naturalBeauty: "Gardens by the Bay, Sentosa beaches, Singapore Botanic Gardens, MacRitchie Reservoir"
    },
    "AE": {
      popularCities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ras Al Khaimah"],
      beautifulPlaces: ["Burj Khalifa", "Sheikh Zayed Mosque", "Palm Jumeirah", "Desert Safari", "Dubai Mall"],
      cityAndCountryside: { city: "Dubai - Burj Khalifa, luxury shopping, modern architecture", countryside: "Desert - Sand dunes, camel farms, Bedouin experience" },
      popularDishes: ["Shawarma", "Falafel", "Hummus", "Umm Ali", "Machboos"],
      naturalBeauty: "Desert dunes, Hatta mountains, Fujairah beaches, Arabian Gulf coral reefs"
    },
    "EG": {
      popularCities: ["Cairo", "Alexandria", "Luxor", "Aswan", "Sharm El Sheikh", "Giza"],
      beautifulPlaces: ["Pyramids of Giza", "Luxor Temple", "Valley of the Kings", "Karnak Temple", "Nile Cruise"],
      cityAndCountryside: { city: "Cairo - Pyramids, Egyptian Museum, Khan el-Khalili", countryside: "Nile Valley - Ancient temples, pharaonic tombs, felucca boats" },
      popularDishes: ["Koshari", "Ful Medames", "Molokhia", "Egyptian pizza", "Umm Ali"],
      naturalBeauty: "Red Sea coral reefs, White Desert, Nile Valley, Sinai mountains, Siwa Oasis"
    }
  };

  const getCountryDetails = (countryCode) => {
    return countryData[countryCode] || {
      popularCities: ["Capital City", "Major City 1", "Major City 2"],
      beautifulPlaces: ["Famous Landmark 1", "National Park", "Historical Site"],
      cityAndCountryside: { city: "Modern city center with attractions", countryside: "Beautiful rural landscapes" },
      popularDishes: ["Local Specialty 1", "Traditional Dish 2", "Famous Street Food"],
      naturalBeauty: "Stunning natural landscapes throughout the country"
    };
  };

  const handleCountrySelect = (country) => {
    const details = getCountryDetails(country.code);
    setSelectedCountry({ ...country, details });
    setShowCountries(false);
    setShowCountryDetails(true);
  };

  const countries = [
    { name: "Afghanistan", flag: "🇦🇫", code: "AF" },
    { name: "Albania", flag: "🇦🇱", code: "AL" },
    { name: "Algeria", flag: "🇩🇿", code: "DZ" },
    { name: "Argentina", flag: "🇦🇷", code: "AR" },
    { name: "Australia", flag: "🇦🇺", code: "AU" },
    { name: "Austria", flag: "🇦🇹", code: "AT" },
    { name: "Bahrain", flag: "🇧🇭", code: "BH" },
    { name: "Bangladesh", flag: "🇧🇩", code: "BD" },
    { name: "Belgium", flag: "🇧🇪", code: "BE" },
    { name: "Brazil", flag: "🇧🇷", code: "BR" },
    { name: "Cambodia", flag: "🇰🇭", code: "KH" },
    { name: "Canada", flag: "🇨🇦", code: "CA" },
    { name: "Chile", flag: "🇨🇱", code: "CL" },
    { name: "China", flag: "🇨🇳", code: "CN" },
    { name: "Colombia", flag: "🇨🇴", code: "CO" },
    { name: "Costa Rica", flag: "🇨🇷", code: "CR" },
    { name: "Croatia", flag: "🇭🇷", code: "HR" },
    { name: "Czech Republic", flag: "🇨🇿", code: "CZ" },
    { name: "Denmark", flag: "🇩🇰", code: "DK" },
    { name: "Dominican Republic", flag: "🇩🇴", code: "DO" },
    { name: "Ecuador", flag: "🇪🇨", code: "EC" },
    { name: "Egypt", flag: "🇪🇬", code: "EG" },
    { name: "Estonia", flag: "🇪🇪", code: "EE" },
    { name: "Ethiopia", flag: "🇪🇹", code: "ET" },
    { name: "Finland", flag: "🇫🇮", code: "FI" },
    { name: "France", flag: "🇫🇷", code: "FR" },
    { name: "Germany", flag: "🇩🇪", code: "DE" },
    { name: "Greece", flag: "🇬🇷", code: "GR" },
    { name: "Guatemala", flag: "🇬🇹", code: "GT" },
    { name: "Honduras", flag: "🇭🇳", code: "HN" },
    { name: "Hungary", flag: "🇭🇺", code: "HU" },
    { name: "Iceland", flag: "🇮🇸", code: "IS" },
    { name: "India", flag: "🇮🇳", code: "IN" },
    { name: "Indonesia", flag: "🇮🇩", code: "ID" },
    { name: "Iran", flag: "🇮🇷", code: "IR" },
    { name: "Iraq", flag: "🇮🇶", code: "IQ" },
    { name: "Ireland", flag: "🇮🇪", code: "IE" },
    { name: "Israel", flag: "🇮🇱", code: "IL" },
    { name: "Italy", flag: "🇮🇹", code: "IT" },
    { name: "Jamaica", flag: "🇯🇲", code: "JM" },
    { name: "Japan", flag: "🇯🇵", code: "JP" },
    { name: "Jordan", flag: "🇯🇴", code: "JO" },
    { name: "Kazakhstan", flag: "🇰🇿", code: "KZ" },
    { name: "Kenya", flag: "🇰🇪", code: "KE" },
    { name: "Kuwait", flag: "🇰🇼", code: "KW" },
    { name: "Latvia", flag: "🇱🇻", code: "LV" },
    { name: "Lebanon", flag: "🇱🇧", code: "LB" },
    { name: "Lithuania", flag: "🇱🇹", code: "LT" },
    { name: "Luxembourg", flag: "🇱🇺", code: "LU" },
    { name: "Malaysia", flag: "🇲🇾", code: "MY" },
    { name: "Maldives", flag: "🇲🇻", code: "MV" },
    { name: "Malta", flag: "🇲🇹", code: "MT" },
    { name: "Mexico", flag: "🇲🇽", code: "MX" },
    { name: "Monaco", flag: "🇲🇨", code: "MC" },
    { name: "Morocco", flag: "🇲🇦", code: "MA" },
    { name: "Nepal", flag: "🇳🇵", code: "NP" },
    { name: "Netherlands", flag: "🇳🇱", code: "NL" },
    { name: "New Zealand", flag: "🇳🇿", code: "NZ" },
    { name: "Nicaragua", flag: "🇳🇮", code: "NI" },
    { name: "Nigeria", flag: "🇳🇬", code: "NG" },
    { name: "Norway", flag: "🇳🇴", code: "NO" },
    { name: "Oman", flag: "🇴🇲", code: "OM" },
    { name: "Pakistan", flag: "🇵🇰", code: "PK" },
    { name: "Panama", flag: "🇵🇦", code: "PA" },
    { name: "Paraguay", flag: "🇵🇾", code: "PY" },
    { name: "Peru", flag: "🇵🇪", code: "PE" },
    { name: "Philippines", flag: "🇵🇭", code: "PH" },
    { name: "Poland", flag: "🇵🇱", code: "PL" },
    { name: "Portugal", flag: "🇵🇹", code: "PT" },
    { name: "Qatar", flag: "🇶🇦", code: "QA" },
    { name: "Romania", flag: "🇷🇴", code: "RO" },
    { name: "Russia", flag: "🇷🇺", code: "RU" },
    { name: "Saudi Arabia", flag: "🇸🇦", code: "SA" },
    { name: "Serbia", flag: "🇷🇸", code: "RS" },
    { name: "Singapore", flag: "🇸🇬", code: "SG" },
    { name: "Slovakia", flag: "🇸🇰", code: "SK" },
    { name: "Slovenia", flag: "🇸🇮", code: "SI" },
    { name: "South Africa", flag: "🇿🇦", code: "ZA" },
    { name: "South Korea", flag: "🇰🇷", code: "KR" },
    { name: "Spain", flag: "🇪🇸", code: "ES" },
    { name: "Sri Lanka", flag: "🇱🇰", code: "LK" },
    { name: "Sweden", flag: "🇸🇪", code: "SE" },
    { name: "Switzerland", flag: "🇨🇭", code: "CH" },
    { name: "Taiwan", flag: "🇹🇼", code: "TW" },
    { name: "Thailand", flag: "🇹🇭", code: "TH" },
    { name: "Turkey", flag: "🇹🇷", code: "TR" },
    { name: "Ukraine", flag: "🇺🇦", code: "UA" },
    { name: "United Arab Emirates", flag: "🇦🇪", code: "AE" },
    { name: "United Kingdom", flag: "🇬🇧", code: "GB" },
    { name: "United States", flag: "🇺🇸", code: "US" },
    { name: "Uruguay", flag: "🇺🇾", code: "UY" },
    { name: "Venezuela", flag: "🇻🇪", code: "VE" },
    { name: "Vietnam", flag: "🇻🇳", code: "VN" },
  ];

  useEffect(() => {
    requestGeolocation();
  }, []);

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      setGeolocationStatus("searching");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude, label: "Current Location" });
          setGeolocationStatus("connected");
        },
        () => setGeolocationStatus("offline")
      );
    } else {
      setGeolocationStatus("offline");
    }
  };

  const routes = origin && destination ? {
    drive: { duration: "18 min", distance: "9.2 km" },
    transit: { duration: "28 min", distance: "walk 0.9 km", transitInfo: "Next bus in 6 min" },
    walk: { duration: "1 hr 45 min", distance: "7.8 km" },
    bike: { duration: "34 min", distance: "8.1 km" },
  } : null;

  const getStatusColor = () => {
    switch (geolocationStatus) {
      case "connected": return "#22c55e";
      case "searching": return "#eab308";
      default: return "#9ca3af";
    }
  };

  return (
    <div style={styles.container}>
      {/* Map / Background Image */}
      <div style={styles.mapPlaceholder}>
        {/* Country Selector - Top Center */}
        <div style={{ position: "absolute", top: "16px", left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
          <button
            onClick={() => { setShowCountries(!showCountries); setShowCountryDetails(false); }}
            style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "white", padding: "8px 16px", borderRadius: "24px", border: "none", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}
          >
            <span style={{ fontSize: "24px" }}>🌍</span>
            <span style={{ fontSize: "14px", fontWeight: 500, color: "#374151" }}>{selectedCountry.flag} {selectedCountry.name}</span>
            <span style={{ color: "#9ca3af" }}>▼</span>
          </button>
          
          {showCountries && (
            <div style={{ position: "absolute", top: "100%", left: "50%", transform: "translateX(-50%)", marginTop: "8px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 10px 25px rgba(0,0,0,0.2)", padding: "8px", width: "280px", maxHeight: "400px", overflowY: "auto" }}>
              <p style={{ fontSize: "12px", color: "#6b7280", padding: "8px", borderBottom: "1px solid #e5e7eb", marginBottom: "4px" }}>Select Country ({countries.length} countries)</p>
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "8px 12px", border: "none", background: selectedCountry.code === country.code ? "#eff6ff" : "transparent", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                >
                  <span style={{ fontSize: "18px" }}>{country.flag}</span>
                  <span style={{ fontSize: "14px", color: "#374151" }}>{country.name}</span>
                  {selectedCountry.code === country.code && <span style={{ marginLeft: "auto", color: "#2563eb" }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: "40px", borderRadius: "20px", textAlign: "center", marginTop: "60px" }}>
          <span style={{ fontSize: "64px", marginBottom: "16px", display: "block" }}>🌍</span>
          <p style={{ color: "white", fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Travel Assistant</p>
          <p style={{ color: "#e5e7eb", marginBottom: "16px" }}>Your AI-powered travel companion</p>
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>{origin ? "📍 " + origin.label : "Click profile to set location"}</p>
        </div>
      </div>

      {/* Country Details Panel */}
      {showCountryDetails && selectedCountry.details && (
        <div style={{ position: "absolute", top: "80px", left: "50%", transform: "translateX(-50%)", zIndex: 15, width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
          <div style={{ padding: "20px" }}>
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "48px" }}>{selectedCountry.flag}</span>
                <div>
                  <h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>{selectedCountry.name}</h2>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Travel Guide</p>
                </div>
              </div>
              <button onClick={() => setShowCountryDetails(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>

            {/* Popular Cities */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                🏙️ Popular Cities
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedCountry.details.popularCities.map((city, idx) => (
                  <span key={idx} style={{ backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", color: "#374151" }}>{city}</span>
                ))}
              </div>
            </div>

            {/* Beautiful Places */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                🏛️ Beautiful Places
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedCountry.details.beautifulPlaces.map((place, idx) => (
                  <span key={idx} style={{ backgroundColor: "#fef3c7", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", color: "#92400e" }}>{place}</span>
                ))}
              </div>
            </div>

            {/* City vs Countryside */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                🏙️ vs 🌄 City & Countryside
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ backgroundColor: "#eff6ff", padding: "12px", borderRadius: "12px" }}>
                  <p style={{ fontSize: "12px", color: "#2563eb", fontWeight: "600", marginBottom: "4px" }}>🏙️ CITY</p>
                  <p style={{ fontSize: "13px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.cityAndCountryside.city}</p>
                </div>
                <div style={{ backgroundColor: "#ecfdf5", padding: "12px", borderRadius: "12px" }}>
                  <p style={{ fontSize: "12px", color: "#059669", fontWeight: "600", marginBottom: "4px" }}>🌄 COUNTRYSIDE</p>
                  <p style={{ fontSize: "13px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.cityAndCountryside.countryside}</p>
                </div>
              </div>
            </div>

            {/* Popular Dishes */}
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                🍽️ Popular Dishes
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedCountry.details.popularDishes.map((dish, idx) => (
                  <span key={idx} style={{ backgroundColor: "#fce7f3", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", color: "#9d174d" }}>{dish}</span>
                ))}
              </div>
            </div>

            {/* Natural Beauty */}
            <div style={{ marginBottom: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                🌿 Natural Beauty
              </h3>
              <div style={{ backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "12px" }}>
                <p style={{ fontSize: "14px", color: "#166534", margin: 0, lineHeight: 1.6 }}>{selectedCountry.details.naturalBeauty}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mode Selector - Top Left */}
      <div style={styles.modeSelector}>
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            style={{
              ...styles.modeButton,
              backgroundColor: selectedMode === mode.id ? "#2563eb" : "transparent",
              color: selectedMode === mode.id ? "white" : "#374151",
            }}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      {/* Chat Button - Top Right */}
      <button style={styles.chatButton}>
        <span style={{ fontSize: "24px" }}>🤖</span>
      </button>

      {/* Profile Panel - Bottom Left */}
      <div style={{ ...styles.profilePanel, ...(profileExpanded ? {} : styles.profileCollapsed) }}>
        {!profileExpanded ? (
          <div 
            onClick={() => setProfileExpanded(true)}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", cursor: "pointer" }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "full", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
              U
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>Traveler</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "full", backgroundColor: getStatusColor() }}></span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  {geolocationStatus === "connected" ? "GPS Connected" : geolocationStatus === "searching" ? "Searching..." : "GPS Offline"}
                </span>
              </div>
            </div>
            <button style={{ backgroundColor: "#2563eb", color: "white", padding: "6px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer" }}>
              Active Trip
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "full", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
                  U
                </div>
                <div>
                  <p style={{ fontWeight: 500, color: "#1f2937" }}>Traveler</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "full", backgroundColor: getStatusColor() }}></span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>GPS Connected</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setProfileExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9ca3af" }}>
                ▲
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, padding: "8px", fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: activeTab === tab.id ? "#2563eb" : "#6b7280", borderBottom: activeTab === tab.id ? "2px solid #2563eb" : "none" }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: "12px", maxHeight: "320px", overflowY: "auto" }}>
              {activeTab === "active" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {!origin && (
                    <button onClick={requestGeolocation} style={{ backgroundColor: "#2563eb", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px" }}>
                      📍 Use Current Location
                    </button>
                  )}
                  
                  <div>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Destination</p>
                    <input
                      type="text"
                      placeholder="Where to?"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
                      onChange={(e) => setDestination({ lat: 38.627, lng: -90.1994, label: e.target.value })}
                    />
                  </div>

                  {routes && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <p style={{ fontSize: "12px", color: "#6b7280" }}>Routes</p>
                      {Object.entries(routes).map(([mode, route]) => (
                        <button
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
                          style={{ padding: "12px", borderRadius: "8px", border: selectedMode === mode ? "2px solid #2563eb" : "1px solid #e5e7eb", backgroundColor: selectedMode === mode ? "#eff6ff" : "white", textAlign: "left", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{mode}</span>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>{route.duration}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                            {route.distance} {route.transitInfo && `• ${route.transitInfo}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button style={{ width: "100%", backgroundColor: "#22c55e", color: "white", padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 500, marginTop: "8px" }}>
                    Start Trip
                  </button>
                </div>
              )}

              {activeTab === "saved" && (
                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                  <p>No saved places yet</p>
                </div>
              )}

              {activeTab === "history" && (
                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                  <p>No trip history</p>
                </div>
              )}

              {activeTab === "settings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>Notifications</button>
                  <button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>Distance Units</button>
                  <button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>About</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
