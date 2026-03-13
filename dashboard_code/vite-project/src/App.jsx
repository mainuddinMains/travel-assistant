import React, { useState, useEffect } from "react";
import { GoogleMap, LoadScript, Marker, Polyline } from "@react-google-maps/api";

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    .printable-area, .printable-area * {
      visibility: visible;
    }
    .printable-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      padding: 20px;
      background: white;
    }
    .no-print {
      display: none !important;
    }
  }
`;

const API_BASE_URL = "http://localhost:8001/api/v1";

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  loginContainer: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  loginBox: {
    backgroundColor: "white",
    borderRadius: "16px",
    padding: "32px",
    width: "400px",
    boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #d1d5db",
    fontSize: "14px",
    marginBottom: "16px",
    outline: "none",
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    fontSize: "14px",
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.2s",
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
  mapContainer: {
    position: "absolute",
    inset: 0,
  },
  mapToggleButton: {
    position: "absolute",
    bottom: "100px",
    left: "50%",
    transform: "translateX(-50%)",
    zIndex: 15,
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "white",
    padding: "12px 20px",
    borderRadius: "24px",
    border: "none",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    fontSize: "14px",
    fontWeight: 600,
    color: "#1f2937",
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

const countryData = {
  "US": {
    popularCities: ["New York", "Los Angeles", "Chicago", "San Francisco", "Miami", "Las Vegas"],
    beautifulPlaces: [
      { name: "Grand Canyon", image: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=400&q=80" },
      { name: "Yellowstone", image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&q=80" },
      { name: "Yosemite", image: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=400&q=80" },
      { name: "Niagara Falls", image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&q=80" },
      { name: "Golden Gate", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=80" }
    ],
    popularDishes: ["Hamburgers", "Hot Dogs", "BBQ Ribs", "Apple Pie", "Cheeseburger"],
    naturalBeauty: "Grand Canyon, Yellowstone, Yosemite, Rocky Mountains"
  },
  "FR": {
    popularCities: ["Paris", "Lyon", "Nice", "Marseille", "Bordeaux"],
    beautifulPlaces: [
      { name: "Eiffel Tower", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=400&q=80" },
      { name: "Louvre Museum", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80" },
      { name: "Versailles", image: "https://images.unsplash.com/photo-1564969290666-7c4c1696d9c5?w=400&q=80" },
      { name: "Mont Saint-Michel", image: "https://images.unsplash.com/photo-1502058537675-38798c831334?w=400&q=80" },
      { name: "French Riviera", image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&q=80" }
    ],
    popularDishes: ["Croissant", "Coq au Vin", "Bouillabaisse", "Ratatouille", "Crème Brûlée"],
    naturalBeauty: "French Alps, Lavender fields of Provence, French Riviera"
  },
  "JP": {
    popularCities: ["Tokyo", "Kyoto", "Osaka", "Hiroshima", "Yokohama"],
    beautifulPlaces: [
      { name: "Mount Fuji", image: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&q=80" },
      { name: "Fushimi Inari", image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80" },
      { name: "Cherry Blossoms", image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80" },
      { name: "Kinkaku-ji", image: "https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=400&q=80" },
      { name: "Himeji Castle", image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80" }
    ],
    popularDishes: ["Sushi", "Ramen", "Tempura", "Okonomiyaki", "Mochi"],
    naturalBeauty: "Mount Fuji, Japanese Alps, Cherry blossom season"
  },
  "GB": {
    popularCities: ["London", "Edinburgh", "Manchester", "Birmingham", "Liverpool"],
    beautifulPlaces: [
      { name: "Big Ben", image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&q=80" },
      { name: "Tower Bridge", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80" },
      { name: "Stonehenge", image: "https://images.unsplash.com/photo-1599833975787-5c143f373c30?w=400&q=80" },
      { name: "Lake District", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name: "Tower of London", image: "https://images.unsplash.com/photo-1513026705753-bc3fffca8bf4?w=400&q=80" }
    ],
    popularDishes: ["Fish and Chips", "Shepherd's Pie", "Full English Breakfast", "Sunday Roast"],
    naturalBeauty: "Lake District, Scottish Highlands, Cornwall coastline"
  },
  "IT": {
    popularCities: ["Rome", "Venice", "Florence", "Milan", "Naples"],
    beautifulPlaces: [
      { name: "Colosseum", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80" },
      { name: "Venice Canals", image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&q=80" },
      { name: "Leaning Tower", image: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=400&q=80" },
      { name: "Amalfi Coast", image: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=400&q=80" },
      { name: "Cinque Terre", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400&q=80" }
    ],
    popularDishes: ["Pizza", "Pasta Carbonara", "Risotto", "Lasagna", "Tiramisu"],
    naturalBeauty: "Amalfi Coast, Lake Como, Tuscan hills, Dolomites"
  },
  "ES": {
    popularCities: ["Madrid", "Barcelona", "Seville", "Valencia", "Malaga"],
    beautifulPlaces: [
      { name: "Sagrada Familia", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80" },
      { name: "Alhambra", image: "https://images.unsplash.com/photo-1591122947157-26bad3a117d2?w=400&q=80" },
      { name: "Park Güell", image: "https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=400&q=80" },
      { name: "La Rambla", image: "https://images.unsplash.com/photo-1569144157591-c60f3f82f137?w=400&q=80" },
      { name: "Ibiza", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80" }
    ],
    popularDishes: ["Paella", "Tapas", "Jamón Ibérico", "Gazpacho", "Churros"],
    naturalBeauty: "Pyrenees, Canary Islands, Costa del Sol"
  },
  "DE": {
    popularCities: ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne"],
    beautifulPlaces: [
      { name: "Brandenburg Gate", image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&q=80" },
      { name: "Neuschwanstein", image: "https://images.unsplash.com/photo-1596803241199-8c7e4d6b5a6c?w=400&q=80" },
      { name: "Cologne Cathedral", image: "https://images.unsplash.com/photo-1548663807-89b68942982f?w=400&q=80" },
      { name: "Black Forest", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name: "Romantic Road", image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80" }
    ],
    popularDishes: ["Currywurst", "Schnitzel", "Pretzels", "Sauerkraut", "Black Forest Cake"],
    naturalBeauty: "Black Forest, Bavarian Alps, Rhine Valley"
  },
  "AU": {
    popularCities: ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide"],
    beautifulPlaces: [
      { name: "Sydney Opera House", image: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=400&q=80" },
      { name: "Great Barrier Reef", image: "https://images.unsplash.com/photo-1587139223877-04cb899fa3e9?w=400&q=80" },
      { name: "Uluru", image: "https://images.unsplash.com/photo-1599487487719-e8c7c9d9e0e9?w=400&q=80" },
      { name: "Blue Mountains", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80" },
      { name: "Bondi Beach", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80" }
    ],
    popularDishes: ["Vegemite", "Meat Pie", "Pavlova", "Tim Tam Slam", "Flat White"],
    naturalBeauty: "Great Barrier Reef, Uluru, Blue Mountains"
  },
  "IN": {
    popularCities: ["Delhi", "Mumbai", "Jaipur", "Agra", "Kolkata"],
    beautifulPlaces: [
      { name: "Taj Mahal", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80" },
      { name: "Varanasi", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&q=80" },
      { name: "Jaipur Palaces", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80" },
      { name: "Kerala Backwaters", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80" },
      { name: "Goa Beaches", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" }
    ],
    popularDishes: ["Biryani", "Butter Chicken", "Dosa", "Samosa", "Naan"],
    naturalBeauty: "Himalayas, Kerala backwaters, Goa beaches"
  },
  "CN": {
    popularCities: ["Beijing", "Shanghai", "Xi'an", "Guangzhou", "Hangzhou"],
    beautifulPlaces: [
      { name: "Great Wall", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80" },
      { name: "Forbidden City", image: "https://images.unsplash.com/photo-1570889922376-2d7c27a777a4?w=400&q=80" },
      { name: "Terracotta Army", image: "https://images.unsplash.com/photo-1591122947157-26bad3a117d2?w=400&q=80" },
      { name: "Li River", image: "https://images.unsplash.com/photo-1537531383496-f4749a4b8590?w=400&q=80" },
      { name: "Zhangjiajie", image: "https://images.unsplash.com/photo-1553856622-d1b352e7e9b9?w=400&q=80" }
    ],
    popularDishes: ["Peking Duck", "Dim Sum", "Hot Pot", "Dumplings", "Kung Pao Chicken"],
    naturalBeauty: "Great Wall, Zhangjiajie Avatar mountains, Guilin karsts"
  },
  "TH": {
    popularCities: ["Bangkok", "Phuket", "Chiang Mai", "Pattaya", "Krabi"],
    beautifulPlaces: [
      { name: "Grand Palace", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80" },
      { name: "Phi Phi Islands", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=80" },
      { name: "Angkor Wat", image: "https://images.unsplash.com/photo-1569060716907-60ad666d4c83?w=400&q=80" },
      { name: "Floating Markets", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80" },
      { name: "Chiang Mai Temples", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80" }
    ],
    popularDishes: ["Pad Thai", "Green Curry", "Tom Yum Goong", "Mango Sticky Rice", "Som Tam"],
    naturalBeauty: "Phi Phi Islands, Similan Islands, Thai beaches"
  },
  "CA": {
    popularCities: ["Toronto", "Vancouver", "Montreal", "Calgary", "Ottawa"],
    beautifulPlaces: [
      { name: "Niagara Falls", image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&q=80" },
      { name: "Banff National Park", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name: "CN Tower", image: "https://images.unsplash.com/photo-1548663807-89b68942982f?w=400&q=80" },
      { name: "Lake Louise", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name: "Old Quebec", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" }
    ],
    popularDishes: ["Poutine", "Maple Syrup", "Nanaimo Bars", "Butter Tarts", "Bannock"],
    naturalBeauty: "Banff National Park, Niagara Falls, Rocky Mountains"
  },
  "MX": {
    popularCities: ["Mexico City", "Cancun", "Guadalajara", "Playa del Carmen", "Oaxaca"],
    beautifulPlaces: [
      { name: "Chichen Itza", image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=80" },
      { name: "Teotihuacan", image: "https://images.unsplash.com/photo-1572518240755-c98096b24d2a?w=400&q=80" },
      { name: "Mexico City Centro", image: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80" },
      { name: "Copper Canyon", image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=80" },
      { name: "Cabo San Lucas", image: "https://images.unsplash.com/photo-1551829015-4a7e666a0795?w=400&q=80" }
    ],
    popularDishes: ["Tacos", "Mole", "Tamales", "Enchiladas", "Guacamole"],
    naturalBeauty: "Cancun beaches, Copper Canyon, Sierra Gorda"
  },
  "BR": {
    popularCities: ["Rio de Janeiro", "São Paulo", "Brasília", "Salvador", "Foz do Iguaçu"],
    beautifulPlaces: [
      { name: "Christ the Redeemer", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80" },
      { name: "Iguazu Falls", image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&q=80" },
      { name: "Copacabana Beach", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80" },
      { name: "Amazon Rainforest", image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80" },
      { name: "Ipanema", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80" }
    ],
    popularDishes: ["Feijoada", "Churrasco", "Moqueca", "brigadeiro", "Acarajé"],
    naturalBeauty: "Amazon Rainforest, Iguazu Falls, Rio beaches"
  },
  "NL": {
    popularCities: ["Amsterdam", "Rotterdam", "The Hague", "Utrecht", "Delft"],
    beautifulPlaces: [
      { name: "Keukenhof", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80" },
      { name: "Anne Frank House", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80" },
      { name: "Van Gogh Museum", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80" },
      { name: "Kinderdijk", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80" },
      { name: "Rijksmuseum", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80" }
    ],
    popularDishes: ["Stroopwafel", "Poffertjes", "Oliebollen", "Dutch cheese", "Pancakes"],
    naturalBeauty: "Keukenhof gardens, Dutch dikes, Tulip fields"
  },
  "SG": {
    popularCities: ["Singapore"],
    beautifulPlaces: [
      { name: "Marina Bay Sands", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80" },
      { name: "Gardens by the Bay", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80" },
      { name: "Sentosa Island", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80" },
      { name: "Clarke Quay", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80" },
      { name: "Orchard Road", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80" }
    ],
    popularDishes: ["Chili Crab", "Hainanese Chicken Rice", "Laksa", "Kaya Toast", "Satay"],
    naturalBeauty: "Gardens by the Bay, Sentosa beaches"
  },
  "AE": {
    popularCities: ["Dubai", "Abu Dhabi", "Sharjah", "Al Ain", "Ras Al Khaimah"],
    beautifulPlaces: [
      { name: "Burj Khalifa", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
      { name: "Sheikh Zayed Mosque", image: "https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=400&q=80" },
      { name: "Palm Jumeirah", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" },
      { name: "Desert Safari", image: "https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=400&q=80" },
      { name: "Dubai Mall", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80" }
    ],
    popularDishes: ["Shawarma", "Falafel", "Hummus", "Umm Ali", "Machboos"],
    naturalBeauty: "Desert dunes, Hatta mountains, Fujairah beaches"
  },
  "EG": {
    popularCities: ["Cairo", "Alexandria", "Luxor", "Aswan", "Sharm El Sheikh"],
    beautifulPlaces: [
      { name: "Pyramids of Giza", image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=400&q=80" },
      { name: "Luxor Temple", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80" },
      { name: "Valley of the Kings", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80" },
      { name: "Karnak Temple", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80" },
      { name: "Nile Cruise", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80" }
    ],
    popularDishes: ["Koshari", "Ful Medames", "Molokhia", "Egyptian pizza", "Umm Ali"],
    naturalBeauty: "Red Sea coral reefs, White Desert, Nile Valley"
  },
  "KR": {
    popularCities: ["Seoul", "Busan", "Incheon", "Jeju Island", "Daegu"],
    beautifulPlaces: [
      { name: "Bukchon Hanok", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80" },
      { name: "Gyeongbokgung", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80" },
      { name: "Jeju Island", image: "https://images.unsplash.com/photo-1596847047383-5a0e4b66e8c7?w=400&q=80" },
      { name: "DMZ", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80" },
      { name: "Nami Island", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80" }
    ],
    popularDishes: ["Kimchi", "Bibimbap", "Korean BBQ", "Tteokbokki", "Japchae"],
    naturalBeauty: "Jeju Island, Jirisan mountains, Korean DMZ"
  },
  "CH": {
    popularCities: ["Zurich", "Geneva", "Bern", "Lucerne", "Interlaken"],
    beautifulPlaces: [
      { name: "Matterhorn", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80" },
      { name: "Jungfrau", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80" },
      { name: "Lake Geneva", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
      { name: "Swiss Alps", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80" },
      { name: "Rhine Falls", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80" }
    ],
    popularDishes: ["Fondue", "Raclette", "Rösti", "Swiss chocolate", "Zürcher Geschnetzeltes"],
    naturalBeauty: "Matterhorn, Jungfrau region, Lake Geneva"
  },
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

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedMode, setSelectedMode] = useState("drive");
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [geolocationStatus, setGeolocationStatus] = useState("offline");
  const [showCountries, setShowCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "US", details: null });
  const [showCountryDetails, setShowCountryDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [tripPlan, setTripPlan] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your travel assistant. How can I help you today? 🌍" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      setIsLoggedIn(true);
    }
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

  const getCountryDetails = (countryCode) => {
    return countryData[countryCode] || {
      popularCities: ["Capital City", "Major City", "Coastal City", "Mountain City"],
      beautifulPlaces: [
        { name: "Historic Old Town", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80" },
        { name: "National Park", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80" },
        { name: "Ancient Ruins", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80" },
        { name: "Mountain Range", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80" },
        { name: "Beautiful Beach", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80" }
      ],
      popularDishes: ["Local Specialty", "Traditional Dish", "Street Food", "Must-Try Dessert"],
      naturalBeauty: "Stunning natural landscapes throughout the country"
    };
  };

  const handleCountrySelect = (country) => {
    const details = getCountryDetails(country.code);
    setSelectedCountry({ ...country, details });
    setShowCountries(false);
    setShowCountryDetails(true);
  };

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("auth_token", data.access_token);
        setIsLoggedIn(true);
      } else {
        setError(data.detail || "Login failed");
      }
    } catch (e) {
      setError("Connection failed. Is the server running?");
    }
    setLoading(false);
  };

  const handleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (res.ok) {
        handleLogin();
      } else {
        setError(data.detail || "Signup failed");
      }
    } catch (e) {
      setError("Connection failed. Is the server running?");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("auth_token");
    setIsLoggedIn(false);
    setEmail("");
    setPassword("");
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setIsChatLoading(true);
    setTimeout(() => {
      let response = "";
      const lowerMsg = userMessage.toLowerCase();
      if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
        response = "Hello! 👋 I'm your travel assistant. Where would you like to travel?";
      } else if (selectedCountry?.name) {
        response = `Great choice! ${selectedCountry.flag} ${selectedCountry.name} is amazing!\n\n🏙️ ${selectedCountry.details?.popularCities?.slice(0,3).join(", ")}\n🍽️ ${selectedCountry.details?.popularDishes?.slice(0,2).join(", ")}`;
      } else {
        response = "That's interesting! 🌍 Select a country from the dropdown to see details, or ask me about travel!";
      }
      setChatMessages(prev => [...prev, { role: "assistant", content: response }]);
      setIsChatLoading(false);
    }, 1000);
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

  if (!isLoggedIn) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <span style={{ fontSize: "48px", display: "block", marginBottom: "8px" }}>✈️</span>
            <h1 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", marginBottom: "8px" }}>
              {showSignup ? "Create Account" : "Welcome Back"}
            </h1>
            <p style={{ fontSize: "14px", color: "#6b7280" }}>
              {showSignup ? "Sign up to start your journey" : "Sign in to continue your adventure"}
            </p>
          </div>
          
          {error && (
            <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px", borderRadius: "8px", marginBottom: "16px", fontSize: "14px" }}>
              {error}
            </div>
          )}
          
          {showSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          )}
          
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          
          <button
            onClick={showSignup ? handleSignup : handleLogin}
            disabled={loading || !email || !password}
            style={{
              ...styles.button,
              backgroundColor: loading || !email || !password ? "#93c5fd" : "#2563eb",
              color: "white",
              marginBottom: "16px",
            }}
          >
            {loading ? "Please wait..." : (showSignup ? "Create Account" : "Sign In")}
          </button>
          
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "14px", color: "#6b7280" }}>
              {showSignup ? "Already have an account? " : "Don't have an account? "}
            </span>
            <button
              onClick={() => { setShowSignup(!showSignup); setError(""); }}
              style={{ background: "none", border: "none", color: "#2563eb", cursor: "pointer", fontSize: "14px", fontWeight: 500 }}
            >
              {showSignup ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{printStyles}</style>
      <div style={styles.container}>
      {/* Map Toggle Button */}
      <button 
        onClick={() => setShowMap(!showMap)}
        style={styles.mapToggleButton}
      >
        {showMap ? "🏠" : "🗺️"} {showMap ? "Hide Map" : "Show Map"}
      </button>

      {/* Map or Background */}
      {showMap ? (
        <div style={styles.mapContainer}>
          <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              center={origin?.lat ? { lat: origin.lat, lng: origin.lng } : { lat: 38.627, lng: -90.1994 }}
              zoom={origin?.lat ? 12 : 4}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                streetViewControl: false,
              }}
            >
              {origin?.lat && <Marker position={{ lat: origin.lat, lng: origin.lng }} label="A" />}
              {destination?.lat && <Marker position={{ lat: destination.lat, lng: destination.lng }} label="B" />}
            </GoogleMap>
          </LoadScript>
        </div>
      ) : (
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
              <p style={{ fontSize: "12px", color: "#6b7280", padding: "8px", borderBottom: "1px solid #e5e7eb", marginBottom: "4px" }}>Select Country ({countries.length})</p>
              {countries.map((country) => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country)}
                  style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "8px 12px", border: "none", background: selectedCountry.code === country.code ? "#eff6ff" : "transparent", cursor: "pointer", borderRadius: "6px", textAlign: "left" }}
                >
                  <span style={{ fontSize: "18px" }}>{country.flag}</span>
                  <span style={{ fontSize: "14px", color: "#374151" }}>{country.name}</span>
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

      {/* Chat Button & Panel - Top Right */}
      <div style={{ position: "absolute", top: "16px", right: "16px", zIndex: 20 }}>
        {!showChat ? (
          <button 
            onClick={() => setShowChat(true)}
            style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "#2563eb", border: "none", cursor: "pointer", boxShadow: "0 4px 6px rgba(0,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <span style={{ fontSize: "24px" }}>💬</span>
          </button>
        ) : (
          <div style={{ width: "340px", height: "420px", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ backgroundColor: "#2563eb", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "24px" }}>🤖</span>
                <div>
                  <p style={{ color: "white", fontWeight: 600, fontSize: "14px", margin: 0 }}>AI Assistant</p>
                  <p style={{ color: "#93c5fd", fontSize: "12px", margin: 0 }}>Online</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ flex: 1, padding: "12px", overflowY: "auto", backgroundColor: "#f9fafb" }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                  <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: "16px", backgroundColor: msg.role === "user" ? "#2563eb" : "white", color: msg.role === "user" ? "white" : "#1f2937", fontSize: "13px", lineHeight: 1.4, boxShadow: msg.role === "assistant" ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Ask about your trip..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: "24px", border: "1px solid #d1d5db", fontSize: "13px", outline: "none" }}
              />
              <button
                onClick={handleSendChat}
                disabled={isChatLoading || !chatInput.trim()}
                style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: isChatLoading || !chatInput.trim() ? "#93c5fd" : "#2563eb", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <span style={{ color: "white", fontSize: "16px" }}>➤</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Profile Panel - Bottom Left */}
      <div style={{ ...styles.profilePanel, ...(profileExpanded ? {} : { width: "auto" }) }}>
        {!profileExpanded ? (
          <div onClick={() => setProfileExpanded(true)} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", cursor: "pointer" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>U</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>Traveler</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getStatusColor() }}></span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>{geolocationStatus === "connected" ? "GPS Connected" : "GPS Offline"}</span>
              </div>
            </div>
            <button style={{ backgroundColor: "#2563eb", color: "white", padding: "6px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer" }}>Active Trip</button>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>U</div>
                <div>
                  <p style={{ fontWeight: 500, color: "#1f2937" }}>Traveler</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getStatusColor() }}></span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>GPS Connected</span>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={handleLogout} style={{ backgroundColor: "#ef4444", color: "white", padding: "6px 12px", borderRadius: "6px", fontSize: "12px", border: "none", cursor: "pointer" }}>Logout</button>
                <button onClick={() => setProfileExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9ca3af" }}>▲</button>
              </div>
            </div>
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ flex: 1, padding: "8px", fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: activeTab === tab.id ? "#2563eb" : "#6b7280", borderBottom: activeTab === tab.id ? "2px solid #2563eb" : "none" }}>
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
            <div style={{ padding: "12px", maxHeight: "320px", overflowY: "auto" }}>
              {activeTab === "active" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {!origin && <button onClick={requestGeolocation} style={{ backgroundColor: "#2563eb", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px" }}>📍 Use Current Location</button>}
                  <div><p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Destination</p><input type="text" placeholder="Where to?" style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }} onChange={(e) => setDestination({ lat: 38.627, lng: -90.1994, label: e.target.value })} /></div>
                  {routes && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <p style={{ fontSize: "12px", color: "#6b7280" }}>Routes</p>
                      {Object.entries(routes).map(([mode, route]) => (
                        <button key={mode} onClick={() => setSelectedMode(mode)} style={{ padding: "12px", borderRadius: "8px", border: selectedMode === mode ? "2px solid #2563eb" : "1px solid #e5e7eb", backgroundColor: selectedMode === mode ? "#eff6ff" : "white", textAlign: "left", cursor: "pointer" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ fontWeight: 500, textTransform: "capitalize" }}>{mode}</span><span style={{ color: "#6b7280", fontSize: "14px" }}>{route.duration}</span></div>
                          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>{route.distance} {route.transitInfo}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <button 
                    onClick={() => {
                      setTripPlan({
                        destination: destination?.label || "Unknown",
                        mode: selectedMode,
                        date: new Date().toLocaleDateString(),
                        origin: origin?.label || "Current Location",
                      });
                    }}
                    style={{ width: "100%", backgroundColor: "#22c55e", color: "white", padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 500, marginTop: "8px" }}
                  >Start Trip</button>
                  
                  {tripPlan && (
                    <button 
                      onClick={() => window.print()}
                      style={{ width: "100%", backgroundColor: "#6366f1", color: "white", padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 500, marginTop: "8px" }}
                    >🖨️ Print Trip Plan</button>
                  )}
                </div>
              )}
              {activeTab === "saved" && <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}><p>No saved places</p></div>}
              {activeTab === "history" && <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}><p>No trip history</p></div>}
              {activeTab === "settings" && <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}><button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>Notifications</button><button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>Distance Units</button><button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>About</button></div>}
            </div>
          </div>
        )}
      </div>

      {/* Country Details Panel */}
      {showCountryDetails && selectedCountry.details && (
        <div style={{ position: "absolute", top: "80px", left: "50%", transform: "translateX(-50%)", zIndex: 15, width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}>
          <div style={{ padding: "20px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e5e7eb", paddingBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "48px" }}>{selectedCountry.flag}</span>
                <div><h2 style={{ fontSize: "24px", fontWeight: "bold", color: "#1f2937", margin: 0 }}>{selectedCountry.name}</h2><p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Travel Guide</p></div>
              </div>
              <button onClick={() => setShowCountryDetails(false)} style={{ background: "none", border: "none", fontSize: "24px", cursor: "pointer", color: "#9ca3af" }}>✕</button>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🏙️ Popular Cities</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedCountry.details.popularCities.map((city, idx) => (<span key={idx} style={{ backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", color: "#374151" }}>{city}</span>))}
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🏛️ Beautiful Places</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                {selectedCountry.details.beautifulPlaces.map((place, idx) => (
                  <div key={idx} style={{ position: "relative", borderRadius: "12px", overflow: "hidden", height: "100px" }}>
                    <img src={place.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80"} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "8px" }}><p style={{ fontSize: "12px", color: "white", fontWeight: 500, margin: 0 }}>{place.name}</p></div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🍽️ Popular Dishes</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {selectedCountry.details.popularDishes.map((dish, idx) => (<span key={idx} style={{ backgroundColor: "#fce7f3", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", color: "#9d174d" }}>{dish}</span>))}
              </div>
            </div>
            <div style={{ marginBottom: "10px" }}>
              <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🌿 Natural Beauty</h3>
              <div style={{ backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "12px" }}><p style={{ fontSize: "14px", color: "#166534", margin: 0, lineHeight: 1.6 }}>{selectedCountry.details.naturalBeauty}</p></div>
            </div>
          </div>
        </div>
      )}
      
      {/* Printable Trip Plan */}
      {tripPlan && (
        <div className="printable-area" style={{ display: "none" }}>
          <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
            <h1 style={{ fontSize: "28px", color: "#1f2937", marginBottom: "20px", borderBottom: "2px solid #2563eb", paddingBottom: "10px" }}>✈️ Travel Plan</h1>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Trip Date</p>
              <p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>{tripPlan.date}</p>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>From</p>
              <p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>📍 {tripPlan.origin}</p>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>To</p>
              <p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>🏁 {tripPlan.destination}</p>
            </div>
            
            <div style={{ marginBottom: "20px" }}>
              <p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Transport Mode</p>
              <p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>
                {tripPlan.mode === "drive" && "🚗 Driving"}
                {tripPlan.mode === "transit" && "🚇 Transit"}
                {tripPlan.mode === "walk" && "🚶 Walking"}
                {tripPlan.mode === "bike" && "🚴 Cycling"}
              </p>
            </div>
            
            {selectedCountry.details && (
              <div style={{ marginTop: "30px" }}>
                <h2 style={{ fontSize: "20px", color: "#1f2937", marginBottom: "15px" }}>📋 Destination Info</h2>
                <div style={{ marginBottom: "15px" }}>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 5px 0" }}>Popular Cities</p>
                  <p style={{ fontSize: "14px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.popularCities?.join(", ")}</p>
                </div>
                <div style={{ marginBottom: "15px" }}>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 5px 0" }}>Must-Try Dishes</p>
                  <p style={{ fontSize: "14px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.popularDishes?.join(", ")}</p>
                </div>
                <div>
                  <p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 5px 0" }}>Natural Beauty</p>
                  <p style={{ fontSize: "14px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.naturalBeauty}</p>
                </div>
              </div>
            )}
            
            <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}>
              <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Generated by Travel Assistant</p>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
