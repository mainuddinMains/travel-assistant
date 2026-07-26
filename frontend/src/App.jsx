import React, { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api";

const printStyles = `
  @media print {
    body * { visibility: hidden; }
    .printable-area, .printable-area * { visibility: visible; }
    .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white; }
    .no-print { display: none !important; }
  }
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
  @keyframes bounce {
    0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
    40% { transform: translateY(-6px); opacity: 1; }
  }
  @keyframes fadeInScale {
    from { opacity: 0; transform: scale(0.88); }
    to   { opacity: 1; transform: scale(1);    }
  }
  .start-trip-btn {
    transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease;
  }
  .start-trip-btn:hover {
    transform: scale(1.06) !important;
    box-shadow: 0 8px 32px rgba(34,197,94,0.55) !important;
    background-color: #16a34a !important;
  }
`;

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8001/api/v1";

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
  { id: "saved",    icon: "📍", label: "Saved"   },
  { id: "history",  icon: "📜", label: "History" },
  { id: "settings", icon: "⚙️", label: "Prefs"  },
];

const countryData = {
  "US": {
    popularCities: [
      { name: "New York", lat: 40.7128, lng: -74.0060 },
      { name: "Los Angeles", lat: 34.0522, lng: -118.2437 },
      { name: "Chicago", lat: 41.8781, lng: -87.6298 },
      { name: "San Francisco", lat: 37.7749, lng: -122.4194 },
      { name: "Miami", lat: 25.7617, lng: -80.1918 },
      { name: "Las Vegas", lat: 36.1699, lng: -115.1398 }
    ],
    beautifulPlaces: [
      { name: "Grand Canyon", image: "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=400&q=80", lat: 36.0544, lng: -112.1401, desc: "World-famous canyon with stunning red rock formations" },
      { name: "Yellowstone", image: "https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?w=400&q=80", lat: 44.4280, lng: -110.5885, desc: "World's first national park with geysers and wildlife" },
      { name: "Yosemite", image: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?w=400&q=80", lat: 37.8651, lng: -119.5383, desc: "Stunning granite cliffs, waterfalls, and giant sequoias" },
      { name: "Niagara Falls", image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&q=80", lat: 43.0962, lng: -79.0377, desc: "Massive waterfalls on US-Canada border" },
      { name: "Golden Gate", image: "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&q=80", lat: 37.8199, lng: -122.4783, desc: "Iconic red suspension bridge in San Francisco" }
    ],
    popularDishes: ["Hamburgers", "Hot Dogs", "BBQ Ribs", "Apple Pie", "Cheeseburger"],
    naturalBeauty: "Grand Canyon, Yellowstone, Yosemite, Rocky Mountains",
    bestTimeToVisit: {
      tip: "Spring (Mar–May) and Fall (Sep–Nov) offer the best weather with mild temperatures, fewer crowds, and lower hotel prices across most of the US.",
      byMonth: [
        { month: "Jan", rating: "avoid",  temp: "-2°–8°C",  icon: "❄️", desc: "Cold & snowy in north. Mild in Florida & California. Great for skiing in Colorado." },
        { month: "Feb", rating: "avoid",  temp: "0°–10°C",  icon: "🌨️", desc: "Still cold nationwide. Valentine's travel peaks prices in big cities." },
        { month: "Mar", rating: "best",   temp: "7°–18°C",  icon: "🌸", desc: "Spring begins! Cherry blossoms in DC. Mild weather before summer crowds." },
        { month: "Apr", rating: "best",   temp: "11°–22°C", icon: "🌼", desc: "Perfect weather. National parks start opening. Great for road trips." },
        { month: "May", rating: "best",   temp: "16°–27°C", icon: "☀️", desc: "Warm & sunny. Beaches start up. Best month before peak season prices." },
        { month: "Jun", rating: "good",   temp: "22°–32°C", icon: "🌤️", desc: "Summer kicks off. Beaches & theme parks buzz. Book well in advance." },
        { month: "Jul", rating: "fair",   temp: "25°–35°C", icon: "🔥", desc: "Peak summer — hot, humid, and crowded. High prices. Great for Alaska." },
        { month: "Aug", rating: "fair",   temp: "24°–34°C", icon: "🌊", desc: "Hot everywhere. Hurricane risk on Gulf Coast. Still beach season." },
        { month: "Sep", rating: "best",   temp: "18°–29°C", icon: "🍂", desc: "Crowds drop, prices fall. Warm days, cool nights. Excellent nationwide." },
        { month: "Oct", rating: "best",   temp: "12°–22°C", icon: "🍁", desc: "Fall foliage in New England. Perfect hiking. Lower costs. Highly recommended." },
        { month: "Nov", rating: "good",   temp: "5°–15°C",  icon: "🌥️", desc: "Thanksgiving travel rush. Weather cools. Good deals early in the month." },
        { month: "Dec", rating: "fair",   temp: "0°–10°C",  icon: "🎄", desc: "Festive season! NYC & Chicago magical. Cold in north, warm in Miami & LA." },
      ]
    },
    states: [
      { name: "Alabama",        code: "AL", lat: 32.3617,  lng: -86.2792,  capital: "Montgomery",   bestMonths: ["Mar","Apr","Oct","Nov"], desc: "Warm subtropical. Spring and fall are ideal; summers are hot and humid." },
      { name: "Alaska",         code: "AK", lat: 64.2008,  lng: -153.4937, capital: "Juneau",        bestMonths: ["Jun","Jul","Aug"],       desc: "Summer for wildlife & hiking; winter for Northern Lights." },
      { name: "Arizona",        code: "AZ", lat: 34.0489,  lng: -111.0937, capital: "Phoenix",       bestMonths: ["Mar","Apr","Oct","Nov"], desc: "Desert heat peaks in summer. Spring and fall are perfect." },
      { name: "Arkansas",       code: "AR", lat: 34.7999,  lng: -92.1994,  capital: "Little Rock",   bestMonths: ["Apr","May","Oct"],       desc: "Mild springs and colorful falls are the highlight." },
      { name: "California",     code: "CA", lat: 36.7783,  lng: -119.4179, capital: "Sacramento",    bestMonths: ["Apr","May","Sep","Oct"], desc: "Year-round appeal. Coastal areas stay mild; inland heats up in summer." },
      { name: "Colorado",       code: "CO", lat: 39.5501,  lng: -105.7821, capital: "Denver",        bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Mountain summers are stunning. World-class ski season in winter." },
      { name: "Connecticut",    code: "CT", lat: 41.6032,  lng: -73.0877,  capital: "Hartford",      bestMonths: ["Sep","Oct"],            desc: "Famous fall foliage. Mild summers and crisp autumn days." },
      { name: "Delaware",       code: "DE", lat: 38.9108,  lng: -75.5277,  capital: "Dover",         bestMonths: ["May","Jun","Sep"],       desc: "Small state with great beaches. Summer is warm and pleasant." },
      { name: "Florida",        code: "FL", lat: 27.6648,  lng: -81.5158,  capital: "Tallahassee",   bestMonths: ["Nov","Dec","Jan","Feb","Mar"], desc: "Dry winter season is best. Summer is hot and stormy." },
      { name: "Georgia",        code: "GA", lat: 32.1656,  lng: -82.9001,  capital: "Atlanta",       bestMonths: ["Mar","Apr","Oct","Nov"], desc: "Warm and sunny. Spring blooms and fall colors are lovely." },
      { name: "Hawaii",         code: "HI", lat: 19.8968,  lng: -155.5828, capital: "Honolulu",      bestMonths: ["Apr","May","Sep","Oct"], desc: "Year-round paradise. Shoulder seasons avoid crowds and rain." },
      { name: "Idaho",          code: "ID", lat: 44.0682,  lng: -114.7420, capital: "Boise",         bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Beautiful mountains in summer. Heavy snow in winter." },
      { name: "Illinois",       code: "IL", lat: 40.6331,  lng: -89.3985,  capital: "Springfield",   bestMonths: ["May","Jun","Sep","Oct"], desc: "Harsh winters. Late spring and early fall are most comfortable." },
      { name: "Indiana",        code: "IN", lat: 40.2672,  lng: -86.1349,  capital: "Indianapolis",  bestMonths: ["May","Sep","Oct"],       desc: "Pleasant spring and fall. Summers are warm; winters cold." },
      { name: "Iowa",           code: "IA", lat: 41.8780,  lng: -93.0977,  capital: "Des Moines",    bestMonths: ["May","Jun","Sep","Oct"], desc: "Extreme winters and summers. Mild spring and fall are best." },
      { name: "Kansas",         code: "KS", lat: 39.0119,  lng: -98.4842,  capital: "Topeka",        bestMonths: ["Apr","May","Sep","Oct"], desc: "Great Plains weather. Spring wildflowers and fall skies are beautiful." },
      { name: "Kentucky",       code: "KY", lat: 37.8393,  lng: -84.2700,  capital: "Frankfort",     bestMonths: ["Apr","May","Oct"],       desc: "Rolling bluegrass hills. Spring and fall are mild and scenic." },
      { name: "Louisiana",      code: "LA", lat: 31.2441,  lng: -92.1451,  capital: "Baton Rouge",   bestMonths: ["Oct","Nov","Mar","Apr"], desc: "Hot and humid summers. Mardi Gras in late winter is iconic." },
      { name: "Maine",          code: "ME", lat: 45.2538,  lng: -69.4455,  capital: "Augusta",       bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Lobster season and fall foliage. Winters are harsh and snowy." },
      { name: "Maryland",       code: "MD", lat: 39.0458,  lng: -76.6413,  capital: "Annapolis",     bestMonths: ["Apr","May","Sep","Oct"], desc: "Chesapeake Bay area. Spring blooms and fall harvest are superb." },
      { name: "Massachusetts",  code: "MA", lat: 42.4072,  lng: -71.3824,  capital: "Boston",        bestMonths: ["Jun","Sep","Oct"],       desc: "Boston is vibrant year-round. Fall foliage is world-class." },
      { name: "Michigan",       code: "MI", lat: 44.3148,  lng: -85.6024,  capital: "Lansing",       bestMonths: ["Jun","Jul","Aug"],       desc: "Great Lakes summers are wonderful. Cold and snowy winters." },
      { name: "Minnesota",      code: "MN", lat: 46.7296,  lng: -94.6859,  capital: "St. Paul",      bestMonths: ["Jun","Jul","Aug"],       desc: "Short but glorious summers. Brutal winters; amazing for skiing." },
      { name: "Mississippi",    code: "MS", lat: 32.3547,  lng: -89.3985,  capital: "Jackson",       bestMonths: ["Mar","Apr","Oct","Nov"], desc: "Deep south heat. Spring and fall are pleasant and colorful." },
      { name: "Missouri",       code: "MO", lat: 37.9643,  lng: -91.8318,  capital: "Jefferson City", bestMonths: ["Apr","May","Oct"],      desc: "Gateway to the west. Spring and fall offer mild touring weather." },
      { name: "Montana",        code: "MT", lat: 46.8797,  lng: -110.3626, capital: "Helena",        bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Big Sky country. Summer is magnificent; winters are severe." },
      { name: "Nebraska",       code: "NE", lat: 41.4925,  lng: -99.9018,  capital: "Lincoln",       bestMonths: ["May","Jun","Sep","Oct"], desc: "Prairie state with dramatic skies. Mild spring and fall are best." },
      { name: "Nevada",         code: "NV", lat: 38.8026,  lng: -116.4194, capital: "Carson City",   bestMonths: ["Mar","Apr","Oct","Nov"], desc: "Desert climate. Avoid scorching July–August. Vegas is year-round." },
      { name: "New Hampshire",  code: "NH", lat: 43.1939,  lng: -71.5724,  capital: "Concord",       bestMonths: ["Jun","Jul","Sep","Oct"], desc: "Stunning fall foliage and great summer hiking in the White Mountains." },
      { name: "New Jersey",     code: "NJ", lat: 40.0583,  lng: -74.4057,  capital: "Trenton",       bestMonths: ["May","Jun","Sep","Oct"], desc: "Shore season peaks in summer. Spring and fall are pleasant." },
      { name: "New Mexico",     code: "NM", lat: 34.5199,  lng: -105.8701, capital: "Santa Fe",      bestMonths: ["Apr","May","Sep","Oct"], desc: "High desert. Warm days and cool nights. Avoid monsoon July–Aug." },
      { name: "New York",       code: "NY", lat: 42.1657,  lng: -74.9481,  capital: "Albany",        bestMonths: ["Apr","May","Sep","Oct"], desc: "NYC is year-round. Upstate shines in fall with stunning foliage." },
      { name: "North Carolina", code: "NC", lat: 35.7596,  lng: -79.0193,  capital: "Raleigh",       bestMonths: ["Apr","May","Oct","Nov"], desc: "Mountains to coast. Spring flowers and fall leaves are spectacular." },
      { name: "North Dakota",   code: "ND", lat: 47.5515,  lng: -101.0020, capital: "Bismarck",      bestMonths: ["Jun","Jul","Aug"],       desc: "Very cold winters. Short warm summer is the best time to visit." },
      { name: "Ohio",           code: "OH", lat: 40.4173,  lng: -82.9071,  capital: "Columbus",      bestMonths: ["May","Jun","Sep","Oct"], desc: "Lake Erie region. Spring and fall are comfortable and scenic." },
      { name: "Oklahoma",       code: "OK", lat: 35.0078,  lng: -97.0929,  capital: "Oklahoma City", bestMonths: ["Apr","May","Oct","Nov"], desc: "Tornado Alley. Spring wildflowers are stunning despite storm risk." },
      { name: "Oregon",         code: "OR", lat: 43.8041,  lng: -120.5542, capital: "Salem",         bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Rainy coast winters. Summers are dry and perfect for exploring." },
      { name: "Pennsylvania",   code: "PA", lat: 41.2033,  lng: -77.1945,  capital: "Harrisburg",    bestMonths: ["May","Jun","Sep","Oct"], desc: "Philadelphia and Pittsburgh buzz in spring and fall. Great foliage." },
      { name: "Rhode Island",   code: "RI", lat: 41.6809,  lng: -71.5118,  capital: "Providence",    bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Smallest state. Newport's summer scene is lively and beautiful." },
      { name: "South Carolina", code: "SC", lat: 33.8361,  lng: -81.1637,  capital: "Columbia",      bestMonths: ["Mar","Apr","May","Oct"], desc: "Beach and lowcountry. Mild winters and gorgeous spring." },
      { name: "South Dakota",   code: "SD", lat: 43.9695,  lng: -99.9018,  capital: "Pierre",        bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Badlands and Black Hills are stunning in summer." },
      { name: "Tennessee",      code: "TN", lat: 35.5175,  lng: -86.5804,  capital: "Nashville",     bestMonths: ["Apr","May","Oct"],       desc: "Music City and Smoky Mountains. Spring and fall are the best." },
      { name: "Texas",          code: "TX", lat: 31.9686,  lng: -99.9018,  capital: "Austin",        bestMonths: ["Mar","Apr","Oct","Nov"], desc: "Huge and diverse. Avoid peak summer heat. Spring bluebonnets are iconic." },
      { name: "Utah",           code: "UT", lat: 39.3210,  lng: -111.0937, capital: "Salt Lake City", bestMonths: ["Mar","Apr","Sep","Oct"], desc: "Incredible national parks. Spring and fall have perfect hiking temps." },
      { name: "Vermont",        code: "VT", lat: 44.0459,  lng: -72.7107,  capital: "Montpelier",    bestMonths: ["Jun","Jul","Sep","Oct"], desc: "Best fall foliage in the US. Summer hiking and winter skiing." },
      { name: "Virginia",       code: "VA", lat: 37.4316,  lng: -78.6569,  capital: "Richmond",      bestMonths: ["Apr","May","Oct"],       desc: "History and nature. Shenandoah fall and Virginia Beach summer are top." },
      { name: "Washington",     code: "WA", lat: 47.7511,  lng: -120.7401, capital: "Olympia",       bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Rainy winters. Dry summers are magical — Olympics and Cascades shine." },
      { name: "West Virginia",  code: "WV", lat: 38.5976,  lng: -80.4549,  capital: "Charleston",    bestMonths: ["May","Jun","Sep","Oct"], desc: "Wild and wonderful. Whitewater and fall foliage are world-class." },
      { name: "Wisconsin",      code: "WI", lat: 43.7844,  lng: -88.7879,  capital: "Madison",       bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Great Lakes summer fun. Cold winters with ice fishing and skiing." },
      { name: "Wyoming",        code: "WY", lat: 43.0760,  lng: -107.2903, capital: "Cheyenne",      bestMonths: ["Jun","Jul","Aug","Sep"], desc: "Yellowstone and Grand Teton are best in summer. Harsh winters." },
    ]
  },
  "FR": {
    popularCities: [
      { name: "Paris", lat: 48.8566, lng: 2.3522 },
      { name: "Lyon", lat: 45.7640, lng: 4.8357 },
      { name: "Nice", lat: 43.7102, lng: 7.2620 },
      { name: "Marseille", lat: 43.2965, lng: 5.3698 },
      { name: "Bordeaux", lat: 44.8378, lng: -0.5792 }
    ],
    beautifulPlaces: [
      { name: "Eiffel Tower", image: "https://images.unsplash.com/photo-1511739001486-6bfe10ce65f4?w=400&q=80", lat: 48.8584, lng: 2.2945, desc: "Iconic iron lattice tower in Paris" },
      { name: "Louvre Museum", image: "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=400&q=80", lat: 48.8606, lng: 2.3376, desc: "World's largest art museum, home to Mona Lisa" },
      { name: "Versailles", image: "https://images.unsplash.com/photo-1564969290666-7c4c1696d9c5?w=400&q=80", lat: 48.8049, lng: 2.1204, desc: "Magnificent royal palace with stunning gardens" },
      { name: "Mont Saint-Michel", image: "https://images.unsplash.com/photo-1502058537675-38798c831334?w=400&q=80", lat: 48.6360, lng: -1.5115, desc: "Medieval abbey on a tidal island" },
      { name: "French Riviera", image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=400&q=80", lat: 43.7102, lng: 7.2620, desc: "Glamorous Mediterranean coastline" }
    ],
    popularDishes: ["Croissant", "Coq au Vin", "Bouillabaisse", "Ratatouille", "Crème Brûlée"],
    naturalBeauty: "French Alps, Lavender fields of Provence, French Riviera"
  },
  "JP": {
    popularCities: [
      { name: "Tokyo", lat: 35.6762, lng: 139.6503 },
      { name: "Kyoto", lat: 35.0116, lng: 135.7681 },
      { name: "Osaka", lat: 34.6937, lng: 135.5023 },
      { name: "Hiroshima", lat: 34.3853, lng: 132.4553 },
      { name: "Yokohama", lat: 35.4437, lng: 139.6380 }
    ],
    beautifulPlaces: [
      { name: "Mount Fuji", image: "https://images.unsplash.com/photo-1490806843957-31f4c9a91c65?w=400&q=80", lat: 35.3606, lng: 138.7274, desc: "Japan's iconic sacred mountain" },
      { name: "Fushimi Inari", image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=400&q=80", lat: 34.9671, lng: 135.7727, desc: "Famous shrine with thousands of torii gates" },
      { name: "Cherry Blossoms", image: "https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&q=80", lat: 35.6762, lng: 139.6503, desc: "Beautiful sakura season in spring" },
      { name: "Kinkaku-ji", image: "https://images.unsplash.com/photo-1624253321171-1be53e12f5f4?w=400&q=80", lat: 35.0394, lng: 135.7292, desc: "Golden pavilion in Kyoto" },
      { name: "Himeji Castle", image: "https://images.unsplash.com/photo-1524413840807-0c3cb6fa808d?w=400&q=80", lat: 34.7393, lng: 134.9000, desc: "Stunning white castle and UNESCO site" }
    ],
    popularDishes: ["Sushi", "Ramen", "Tempura", "Okonomiyaki", "Mochi"],
    naturalBeauty: "Mount Fuji, Japanese Alps, Cherry blossom season"
  },
  "GB": {
    popularCities: [
      { name: "London", lat: 51.5074, lng: -0.1278 },
      { name: "Edinburgh", lat: 55.9533, lng: -3.1883 },
      { name: "Manchester", lat: 53.4808, lng: -2.2426 },
      { name: "Birmingham", lat: 52.4862, lng: -1.8904 },
      { name: "Liverpool", lat: 53.4084, lng: -2.9916 }
    ],
    beautifulPlaces: [
      { name: "Big Ben", image: "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?w=400&q=80", lat: 51.5007, lng: -0.1246, desc: "Iconic clock tower in London" },
      { name: "Tower Bridge", image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&q=80", lat: 51.5055, lng: -0.0754, desc: "Famous Victorian combined bridge" },
      { name: "Stonehenge", image: "https://images.unsplash.com/photo-1599833975787-5c143f373c30?w=400&q=80", lat: 51.1789, lng: -1.8262, desc: "Prehistoric stone circle monument" },
      { name: "Lake District", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 54.4600, lng: -3.0900, desc: "Beautiful mountains and lakes in Cumbria" },
      { name: "Tower of London", image: "https://images.unsplash.com/photo-1513026705753-bc3fffca8bf4?w=400&q=80", lat: 51.5081, lng: -0.0759, desc: "Historic castle and crown jewels" }
    ],
    popularDishes: ["Fish and Chips", "Shepherd's Pie", "Full English Breakfast", "Sunday Roast"],
    naturalBeauty: "Lake District, Scottish Highlands, Cornwall coastline"
  },
  "IT": {
    popularCities: [
      { name: "Rome", lat: 41.9028, lng: 12.4964 },
      { name: "Venice", lat: 45.4408, lng: 12.3155 },
      { name: "Florence", lat: 43.7696, lng: 11.2558 },
      { name: "Milan", lat: 45.4642, lng: 9.1900 },
      { name: "Naples", lat: 40.8518, lng: 14.2681 }
    ],
    beautifulPlaces: [
      { name: "Colosseum", image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=400&q=80", lat: 41.8902, lng: 12.4922, desc: "Ancient Roman amphitheater" },
      { name: "Venice Canals", image: "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?w=400&q=80", lat: 45.4408, lng: 12.3155, desc: "Romantic canals of Venice" },
      { name: "Amalfi Coast", image: "https://images.unsplash.com/photo-1533587851505-d119e13fa0d7?w=400&q=80", lat: 40.6333, lng: 14.6029, desc: "Stunning Mediterranean coastline" },
      { name: "Cinque Terre", image: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=400&q=80", lat: 44.1461, lng: 9.6440, desc: "Colorful cliffside villages" },
      { name: "Tuscany", image: "https://images.unsplash.com/photo-1523531294919-4bcd7c65e216?w=400&q=80", lat: 43.7711, lng: 11.2486, desc: "Rolling hills, vineyards, and medieval towns" }
    ],
    popularDishes: ["Pizza", "Pasta Carbonara", "Risotto", "Lasagna", "Tiramisu"],
    naturalBeauty: "Amalfi Coast, Lake Como, Tuscan hills, Dolomites"
  },
  "ES": {
    popularCities: [
      { name: "Madrid", lat: 40.4168, lng: -3.7038 },
      { name: "Barcelona", lat: 41.3851, lng: 2.1734 },
      { name: "Seville", lat: 37.3891, lng: -5.9845 },
      { name: "Valencia", lat: 39.4699, lng: -0.3763 },
      { name: "Malaga", lat: 36.7213, lng: -4.4214 }
    ],
    beautifulPlaces: [
      { name: "Sagrada Familia", image: "https://images.unsplash.com/photo-1583422409516-2895a77efded?w=400&q=80", lat: 41.4036, lng: 2.1744, desc: "Gaudi's unfinished masterpiece" },
      { name: "Alhambra", image: "https://images.unsplash.com/photo-1591122947157-26bad3a117d2?w=400&q=80", lat: 37.1760, lng: -3.5881, desc: "Stunning Moorish palace in Granada" },
      { name: "Park Güell", image: "https://images.unsplash.com/photo-1562883676-8c7feb83f09b?w=400&q=80", lat: 41.4145, lng: 2.1527, desc: "Gaudi's colorful park in Barcelona" },
      { name: "Ibiza", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80", lat: 38.9069, lng: 1.4206, desc: "Famous party island" },
      { name: "Seville Cathedral", image: "https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=400&q=80", lat: 37.3891, lng: -5.9845, desc: "Largest Gothic cathedral" }
    ],
    popularDishes: ["Paella", "Tapas", "Jamón Ibérico", "Gazpacho", "Churros"],
    naturalBeauty: "Pyrenees, Canary Islands, Costa del Sol"
  },
  "DE": {
    popularCities: [
      { name: "Berlin", lat: 52.5200, lng: 13.4050 },
      { name: "Munich", lat: 48.1351, lng: 11.5820 },
      { name: "Hamburg", lat: 53.5511, lng: 9.9937 },
      { name: "Frankfurt", lat: 50.1109, lng: 8.6821 },
      { name: "Cologne", lat: 50.9375, lng: 6.9603 }
    ],
    beautifulPlaces: [
      { name: "Brandenburg Gate", image: "https://images.unsplash.com/photo-1560969184-10fe8719e047?w=400&q=80", lat: 52.5163, lng: 13.3777, desc: "Iconic Berlin landmark" },
      { name: "Neuschwanstein", image: "https://images.unsplash.com/photo-1596803241199-8c7e4d6b5a6c?w=400&q=80", lat: 47.5576, lng: 10.7498, desc: "Fairytale castle in Bavaria" },
      { name: "Black Forest", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 48.1333, lng: 8.2000, desc: "Dense forest with charming villages" },
      { name: "Cologne Cathedral", image: "https://images.unsplash.com/photo-1548663807-89b68942982f?w=400&q=80", lat: 50.9413, lng: 6.9583, desc: "Stunning Gothic cathedral" },
      { name: "Romantic Road", image: "https://images.unsplash.com/photo-1467269204594-9661b134dd2b?w=400&q=80", lat: 48.8000, lng: 10.5000, desc: "Scenic route through Bavaria" }
    ],
    popularDishes: ["Currywurst", "Schnitzel", "Pretzels", "Sauerkraut", "Black Forest Cake"],
    naturalBeauty: "Black Forest, Bavarian Alps, Rhine Valley"
  },
  "AU": {
    popularCities: [
      { name: "Sydney", lat: -33.8688, lng: 151.2093 },
      { name: "Melbourne", lat: -37.8136, lng: 144.9631 },
      { name: "Brisbane", lat: -27.4698, lng: 153.0251 },
      { name: "Perth", lat: -31.9505, lng: 115.8605 },
      { name: "Adelaide", lat: -34.9285, lng: 138.6007 }
    ],
    beautifulPlaces: [
      { name: "Sydney Opera House", image: "https://images.unsplash.com/photo-1624138784614-87fd1b6528f8?w=400&q=80", lat: -33.8568, lng: 151.2153, desc: "Iconic sail-shaped building" },
      { name: "Great Barrier Reef", image: "https://images.unsplash.com/photo-1587139223877-04cb899fa3e9?w=400&q=80", lat: -18.2871, lng: 147.6992, desc: "World's largest coral reef system" },
      { name: "Uluru", image: "https://images.unsplash.com/photo-1599487487719-e8c7c9d9e0e9?w=400&q=80", lat: -25.3444, lng: 131.0369, desc: "Sacred red rock monolith" },
      { name: "Blue Mountains", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", lat: -33.7150, lng: 150.3119, desc: "Stunning eucalyptus forests" },
      { name: "Bondi Beach", image: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=400&q=80", lat: -33.8915, lng: 151.2767, desc: "Famous beach in Sydney" }
    ],
    popularDishes: ["Vegemite", "Meat Pie", "Pavlova", "Tim Tam Slam", "Flat White"],
    naturalBeauty: "Great Barrier Reef, Uluru, Blue Mountains"
  },
  "IN": {
    popularCities: [
      { name: "Delhi", lat: 28.7041, lng: 77.1025 },
      { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
      { name: "Jaipur", lat: 26.9124, lng: 75.7873 },
      { name: "Agra", lat: 27.1767, lng: 78.0081 },
      { name: "Kolkata", lat: 22.5726, lng: 88.3639 }
    ],
    beautifulPlaces: [
      { name: "Taj Mahal", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80", lat: 27.1751, lng: 78.0421, desc: "Stunning white marble mausoleum" },
      { name: "Varanasi", image: "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=400&q=80", lat: 25.3176, lng: 82.9739, desc: "Ancient holy city on Ganges" },
      { name: "Jaipur Palaces", image: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=400&q=80", lat: 26.9124, lng: 75.7873, desc: "Pink City royal palaces" },
      { name: "Kerala Backwaters", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80", lat: 9.4981, lng: 76.3388, desc: "Serene network of lagoons" },
      { name: "Goa Beaches", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 15.2993, lng: 74.1240, desc: "Famous beach destination" }
    ],
    popularDishes: ["Biryani", "Butter Chicken", "Dosa", "Samosa", "Naan"],
    naturalBeauty: "Himalayas, Kerala backwaters, Goa beaches"
  },
  "CN": {
    popularCities: [
      { name: "Beijing", lat: 39.9042, lng: 116.4074 },
      { name: "Shanghai", lat: 31.2304, lng: 121.4737 },
      { name: "Xi'an", lat: 34.3416, lng: 108.9398 },
      { name: "Guangzhou", lat: 23.1291, lng: 113.2644 },
      { name: "Hangzhou", lat: 30.2741, lng: 120.1551 }
    ],
    beautifulPlaces: [
      { name: "Great Wall", image: "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?w=400&q=80", lat: 40.4319, lng: 116.5704, desc: "Ancient defensive wall" },
      { name: "Forbidden City", image: "https://images.unsplash.com/photo-1570889922376-2d7c27a777a4?w=400&q=80", lat: 39.9163, lng: 116.3972, desc: "Imperial palace complex" },
      { name: "Terracotta Army", image: "https://images.unsplash.com/photo-1591122947157-26bad3a117d2?w=400&q=80", lat: 34.3846, lng: 109.2785, desc: "Ancient clay soldiers" },
      { name: "Li River", image: "https://images.unsplash.com/photo-1537531383496-f4749a4b8590?w=400&q=80", lat: 25.2742, lng: 110.4790, desc: "Stunning karst landscape" },
      { name: "Zhangjiajie", image: "https://images.unsplash.com/photo-1553856622-d1b352e7e9b9?w=400&q=80", lat: 29.1170, lng: 110.4790, desc: "Avatar-inspired sandstone pillars" }
    ],
    popularDishes: ["Peking Duck", "Dim Sum", "Hot Pot", "Dumplings", "Kung Pao Chicken"],
    naturalBeauty: "Great Wall, Zhangjiajie Avatar mountains, Guilin karsts"
  },
  "TH": {
    popularCities: [
      { name: "Bangkok", lat: 13.7563, lng: 100.5018 },
      { name: "Phuket", lat: 7.8804, lng: 98.3923 },
      { name: "Chiang Mai", lat: 18.7883, lng: 98.9853 },
      { name: "Pattaya", lat: 12.9273, lng: 100.8824 },
      { name: "Krabi", lat: 8.0863, lng: 98.9063 }
    ],
    beautifulPlaces: [
      { name: "Grand Palace", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", lat: 13.7500, lng: 100.4915, desc: "Stunning royal palace" },
      { name: "Phi Phi Islands", image: "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=400&q=80", lat: 7.7407, lng: 98.7784, desc: "Paradise islands" },
      { name: "Chiang Mai Temples", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", lat: 18.7883, lng: 98.9853, desc: "Ancient Buddhist temples" },
      { name: "Floating Markets", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", lat: 13.5463, lng: 100.2936, desc: "Traditional canal markets" },
      { name: "Railay Beach", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", lat: 8.0094, lng: 98.8381, desc: "Stunning limestone cliffs" }
    ],
    popularDishes: ["Pad Thai", "Green Curry", "Tom Yum Goong", "Mango Sticky Rice", "Som Tam"],
    naturalBeauty: "Phi Phi Islands, Thai beaches, Mountain temples"
  },
  "CA": {
    popularCities: [
      { name: "Toronto", lat: 43.6532, lng: -79.3832 },
      { name: "Vancouver", lat: 49.2827, lng: -123.1207 },
      { name: "Montreal", lat: 45.5017, lng: -73.5673 },
      { name: "Calgary", lat: 51.0447, lng: -114.0719 },
      { name: "Ottawa", lat: 45.4215, lng: -75.6972 }
    ],
    beautifulPlaces: [
      { name: "Niagara Falls", image: "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400&q=80", lat: 43.0896, lng: -79.0849, desc: "Massive waterfalls" },
      { name: "Banff National Park", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 51.1784, lng: -115.5708, desc: "Stunning Rocky Mountains" },
      { name: "Lake Louise", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 51.4254, lng: -116.1773, desc: "Crystal clear turquoise lake" },
      { name: "CN Tower", image: "https://images.unsplash.com/photo-1548663807-89b68942982f?w=400&q=80", lat: 43.6425, lng: -79.3892, desc: "Iconic Toronto landmark" },
      { name: "Old Quebec", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 46.8139, lng: -71.2080, desc: "Charming historic district" }
    ],
    popularDishes: ["Poutine", "Maple Syrup", "Nanaimo Bars", "Butter Tarts", "Bannock"],
    naturalBeauty: "Banff, Niagara Falls, Rocky Mountains",
    bestTimeToVisit: {
      tip: "Summer (Jun–Aug) is best coast-to-coast. Fall (Sep–Oct) offers stunning foliage with fewer crowds. Winter is magical in Quebec City and world-class for skiing.",
      byMonth: [
        { month: "Jan", rating: "avoid", temp: "-15°–-3°C", icon: "❄️", desc: "Bitterly cold across most of Canada. Great for skiing in Whistler, Banff & Quebec." },
        { month: "Feb", rating: "avoid", temp: "-13°–-1°C", icon: "🌨️", desc: "Still very cold. Quebec City's Winter Carnival is a unique experience." },
        { month: "Mar", rating: "fair",  temp: "-7°–5°C",   icon: "🌦️", desc: "Late winter. Maple syrup season begins in Quebec and Ontario." },
        { month: "Apr", rating: "good",  temp: "-1°–11°C",  icon: "🌸", desc: "Spring arrives in BC and Ontario. Ottawa Tulip Festival is iconic." },
        { month: "May", rating: "best",  temp: "6°–18°C",   icon: "🌼", desc: "Warm and blooming. National parks reopen. Excellent weather in BC." },
        { month: "Jun", rating: "best",  temp: "12°–24°C",  icon: "☀️", desc: "Long summer days. Beautiful weather nationwide. Perfect for travel." },
        { month: "Jul", rating: "best",  temp: "16°–28°C",  icon: "🌞", desc: "Peak summer. Warm and sunny. Festivals, hiking, beaches, and more." },
        { month: "Aug", rating: "best",  temp: "15°–27°C",  icon: "🌤️", desc: "Still gorgeous. Calgary Stampede, whale watching in BC, PEI beaches." },
        { month: "Sep", rating: "best",  temp: "8°–20°C",   icon: "🍂", desc: "Crowds drop, prices fall. Stunning fall foliage begins. Highly recommended." },
        { month: "Oct", rating: "good",  temp: "2°–13°C",   icon: "🍁", desc: "Peak fall colors in Quebec and Ontario. Getting cold — pack layers." },
        { month: "Nov", rating: "fair",  temp: "-4°–5°C",   icon: "🌥️", desc: "First snow in many provinces. Tourism slows and prices drop." },
        { month: "Dec", rating: "fair",  temp: "-10°–0°C",  icon: "🎄", desc: "Cold and snowy. Quebec City Christmas market and Niagara Falls are magical." },
      ]
    },
    provinces: [
      { name: "Alberta",                    code: "AB", lat: 53.9333,  lng: -116.5765, capital: "Edmonton",       bestMonths: ["Jun","Jul","Aug","Sep"],       desc: "Home to Banff and Jasper. Summers are warm and perfect for Rocky Mountain exploration." },
      { name: "British Columbia",           code: "BC", lat: 53.7267,  lng: -127.6476, capital: "Victoria",       bestMonths: ["Jun","Jul","Aug","Sep"],       desc: "Mild west coast climate. Summers are dry and warm — ideal for Vancouver, Whistler, and wine country." },
      { name: "Manitoba",                   code: "MB", lat: 53.7609,  lng: -98.8139,  capital: "Winnipeg",       bestMonths: ["Jun","Jul","Aug"],             desc: "Prairie province with harsh winters. Summer brings warm days and Churchill's polar bear season." },
      { name: "New Brunswick",              code: "NB", lat: 46.5653,  lng: -66.4619,  capital: "Fredericton",    bestMonths: ["Jun","Jul","Aug","Sep"],       desc: "Atlantic province with stunning Bay of Fundy tides. Fall foliage is world-class." },
      { name: "Newfoundland & Labrador",    code: "NL", lat: 53.1355,  lng: -57.6604,  capital: "St. John's",     bestMonths: ["Jul","Aug","Sep"],             desc: "Wild and remote Atlantic coast. Iceberg season in spring; warm summers for hiking Gros Morne." },
      { name: "Northwest Territories",      code: "NT", lat: 64.8255,  lng: -124.8457, capital: "Yellowknife",    bestMonths: ["Jun","Jul","Aug"],             desc: "Midnight sun in summer. Winter offers spectacular Northern Lights from October to April." },
      { name: "Nova Scotia",                code: "NS", lat: 44.6820,  lng: -63.7443,  capital: "Halifax",        bestMonths: ["Jun","Jul","Aug","Sep"],       desc: "Celtic culture and dramatic coastline. Peggy's Cove and Cape Breton are stunning in summer." },
      { name: "Nunavut",                    code: "NU", lat: 70.2998,  lng: -83.1076,  capital: "Iqaluit",        bestMonths: ["Jun","Jul","Aug"],             desc: "Canada's largest territory. Summer brings 24-hour daylight and unique Arctic wildlife." },
      { name: "Ontario",                    code: "ON", lat: 51.2538,  lng: -85.3232,  capital: "Toronto",        bestMonths: ["May","Jun","Sep","Oct"],       desc: "Most visited province. Toronto, Niagara Falls, and Algonquin Park shine in spring and fall." },
      { name: "Prince Edward Island",       code: "PE", lat: 46.5107,  lng: -63.4168,  capital: "Charlottetown",  bestMonths: ["Jun","Jul","Aug"],             desc: "Canada's smallest province. Red sand beaches and Anne of Green Gables charm peak in summer." },
      { name: "Quebec",                     code: "QC", lat: 52.9399,  lng: -73.5491,  capital: "Quebec City",    bestMonths: ["Jun","Jul","Sep","Oct"],       desc: "Vibrant French culture. Summer festivals in Montreal; breathtaking fall foliage province-wide." },
      { name: "Saskatchewan",               code: "SK", lat: 52.9399,  lng: -106.4509, capital: "Regina",         bestMonths: ["Jun","Jul","Aug"],             desc: "Prairie skies and wide-open landscapes. Warm summers; extremely cold winters." },
      { name: "Yukon",                      code: "YT", lat: 64.2823,  lng: -135.0000, capital: "Whitehorse",     bestMonths: ["Jun","Jul","Aug"],             desc: "Rugged wilderness and Klondike Gold Rush history. Summer brings the midnight sun and epic hiking." },
    ]
  },
  "MX": {
    popularCities: [
      { name: "Mexico City", lat: 19.4326, lng: -99.1332 },
      { name: "Cancun", lat: 21.1619, lng: -86.8515 },
      { name: "Guadalajara", lat: 20.6597, lng: -103.3496 },
      { name: "Playa del Carmen", lat: 20.6296, lng: -87.0739 },
      { name: "Oaxaca", lat: 17.0732, lng: -96.7266 }
    ],
    beautifulPlaces: [
      { name: "Chichen Itza", image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=80", lat: 20.6843, lng: -88.5678, desc: "Ancient Mayan pyramid" },
      { name: "Teotihuacan", image: "https://images.unsplash.com/photo-1572518240755-c98096b24d2a?w=400&q=80", lat: 19.6926, lng: -98.8031, desc: "Ancient Aztec ruins" },
      { name: "Cancun Beaches", image: "https://images.unsplash.com/photo-1551829015-4a7e666a0795?w=400&q=80", lat: 21.1619, lng: -86.8515, desc: "Caribbean beaches" },
      { name: "Copper Canyon", image: "https://images.unsplash.com/photo-1518638150340-f706e86654de?w=400&q=80", lat: 27.5833, lng: -107.6333, desc: "Grand canyon system" },
      { name: "Oaxaca Historic", image: "https://images.unsplash.com/photo-1585464231875-d9ef1f5ad396?w=400&q=80", lat: 17.0732, lng: -96.7266, desc: "Colonial charm" }
    ],
    popularDishes: ["Tacos", "Mole", "Tamales", "Enchiladas", "Guacamole"],
    naturalBeauty: "Cancun beaches, Copper Canyon, Sierra Gorda"
  },
  "BR": {
    popularCities: [
      { name: "Rio de Janeiro", lat: -22.9068, lng: -43.1729 },
      { name: "São Paulo", lat: -23.5505, lng: -46.6333 },
      { name: "Brasília", lat: -15.8267, lng: -47.9218 },
      { name: "Salvador", lat: -12.9714, lng: -38.5014 },
      { name: "Foz do Iguaçu", lat: -25.5469, lng: -54.5882 }
    ],
    beautifulPlaces: [
      { name: "Christ the Redeemer", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80", lat: -22.9519, lng: -43.2105, desc: "Iconic statue over Rio" },
      { name: "Iguazu Falls", image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&q=80", lat: -25.6953, lng: -54.4367, desc: "Massive waterfall system" },
      { name: "Copacabana Beach", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80", lat: -22.9711, lng: -43.1822, desc: "Famous beach" },
      { name: "Amazon Rainforest", image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80", lat: -3.4653, lng: -62.2159, desc: "World's largest rainforest" },
      { name: "Ipanema", image: "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=400&q=80", lat: -22.9838, lng: -43.2096, desc: "Beach in Rio" }
    ],
    popularDishes: ["Feijoada", "Churrasco", "Moqueca", "brigadeiro", "Acarajé"],
    naturalBeauty: "Amazon Rainforest, Iguazu Falls, Rio beaches"
  },
  "NL": {
    popularCities: [
      { name: "Amsterdam", lat: 52.3676, lng: 4.9041 },
      { name: "Rotterdam", lat: 51.9244, lng: 4.4777 },
      { name: "The Hague", lat: 52.0705, lng: 4.3007 },
      { name: "Utrecht", lat: 52.0907, lng: 5.1214 },
      { name: "Delft", lat: 52.0116, lng: 4.3571 }
    ],
    beautifulPlaces: [
      { name: "Keukenhof", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80", lat: 52.2695, lng: 4.5462, desc: "World's largest flower garden" },
      { name: "Anne Frank House", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80", lat: 52.3742, lng: 4.8910, desc: "Historic WWII museum" },
      { name: "Van Gogh Museum", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80", lat: 52.3604, lng: 4.8816, desc: "World's largest collection" },
      { name: "Kinderdijk", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80", lat: 51.8992, lng: 4.5350, desc: "Historic windmills" },
      { name: "Rijksmuseum", image: "https://images.unsplash.com/photo-1584143976662-8e75a7e17e9c?w=400&q=80", lat: 52.3604, lng: 4.8852, desc: "Dutch Golden Age art" }
    ],
    popularDishes: ["Stroopwafel", "Poffertjes", "Oliebollen", "Dutch cheese", "Pancakes"],
    naturalBeauty: "Keukenhof gardens, Tulip fields, Canals"
  },
  "SG": {
    popularCities: [
      { name: "Singapore", lat: 1.3521, lng: 103.8198 }
    ],
    beautifulPlaces: [
      { name: "Marina Bay Sands", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80", lat: 1.2838, lng: 103.8591, desc: "Iconic hotel with rooftop pool" },
      { name: "Gardens by the Bay", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80", lat: 1.2816, lng: 103.8636, desc: "Supertree Grove" },
      { name: "Sentosa Island", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80", lat: 1.2494, lng: 103.8303, desc: "Beach resort island" },
      { name: "Clarke Quay", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80", lat: 1.2887, lng: 103.8492, desc: "Nightlife district" },
      { name: "Orchard Road", image: "https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=400&q=80", lat: 1.3048, lng: 103.8320, desc: "Famous shopping street" }
    ],
    popularDishes: ["Chili Crab", "Hainanese Chicken Rice", "Laksa", "Kaya Toast", "Satay"],
    naturalBeauty: "Gardens by the Bay, Sentosa beaches"
  },
  "AE": {
    popularCities: [
      { name: "Dubai", lat: 25.2048, lng: 55.2708 },
      { name: "Abu Dhabi", lat: 24.4539, lng: 54.3773 },
      { name: "Sharjah", lat: 25.3463, lng: 55.4209 },
      { name: "Al Ain", lat: 24.2075, lng: 55.7447 },
      { name: "Ras Al Khaimah", lat: 25.7895, lng: 55.9432 }
    ],
    beautifulPlaces: [
      { name: "Burj Khalifa", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80", lat: 25.1972, lng: 55.2744, desc: "World's tallest building" },
      { name: "Sheikh Zayed Mosque", image: "https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=400&q=80", lat: 24.4128, lng: 54.4741, desc: "Stunning white mosque" },
      { name: "Palm Jumeirah", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80", lat: 25.1124, lng: 55.1392, desc: "Man-made palm island" },
      { name: "Desert Safari", image: "https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=400&q=80", lat: 25.2048, lng: 55.2708, desc: "Dune bashing adventure" },
      { name: "Dubai Mall", image: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=400&q=80", lat: 25.1985, lng: 55.2796, desc: "World's largest mall" }
    ],
    popularDishes: ["Shawarma", "Falafel", "Hummus", "Umm Ali", "Machboos"],
    naturalBeauty: "Desert dunes, Palm Jumeirah, Modern skyline"
  },
  "EG": {
    popularCities: [
      { name: "Cairo", lat: 30.0444, lng: 31.2357 },
      { name: "Alexandria", lat: 31.2001, lng: 29.9187 },
      { name: "Luxor", lat: 25.6872, lng: 32.6396 },
      { name: "Aswan", lat: 24.0889, lng: 32.8998 },
      { name: "Sharm El Sheikh", lat: 27.8508, lng: 34.8933 }
    ],
    beautifulPlaces: [
      { name: "Pyramids of Giza", image: "https://images.unsplash.com/photo-1503177119275-0aa32b3a9368?w=400&q=80", lat: 29.9792, lng: 31.1342, desc: "Ancient wonders of the world" },
      { name: "Luxor Temple", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80", lat: 25.6872, lng: 32.6396, desc: "Ancient Egyptian temple" },
      { name: "Valley of the Kings", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80", lat: 25.7402, lng: 32.6014, desc: "Royal tombs" },
      { name: "Nile Cruise", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80", lat: 24.0889, lng: 32.8998, desc: "Scenic river cruise" },
      { name: "Red Sea Diving", image: "https://images.unsplash.com/photo-1548546738-8509cb246ed3?w=400&q=80", lat: 27.8508, lng: 34.8933, desc: "World-class diving" }
    ],
    popularDishes: ["Koshari", "Ful Medames", "Molokhia", "Egyptian pizza", "Umm Ali"],
    naturalBeauty: "Red Sea coral reefs, Nile Valley, Desert"
  },
  "KR": {
    popularCities: [
      { name: "Seoul", lat: 37.5665, lng: 126.9780 },
      { name: "Busan", lat: 35.1796, lng: 129.0756 },
      { name: "Incheon", lat: 37.4563, lng: 126.7052 },
      { name: "Jeju Island", lat: 33.4996, lng: 126.5312 },
      { name: "Daegu", lat: 35.8714, lng: 128.6014 }
    ],
    beautifulPlaces: [
      { name: "Bukchon Hanok", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80", lat: 37.5796, lng: 126.9830, desc: "Traditional Korean houses" },
      { name: "Gyeongbokgung", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80", lat: 37.5769, lng: 126.9789, desc: "Grand palace" },
      { name: "Jeju Island", image: "https://images.unsplash.com/photo-1596847047383-5a0e4b66e8c7?w=400&q=80", lat: 33.4996, lng: 126.5312, desc: "Island with volcanic landscape" },
      { name: "DMZ", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80", lat: 37.9362, lng: 126.7105, desc: "Demilitarized zone" },
      { name: "Nami Island", image: "https://images.unsplash.com/photo-1601823984263-b87b59798b70?w=400&q=80", lat: 37.7763, lng: 127.0547, desc: "Scenic tree-lined island" }
    ],
    popularDishes: ["Kimchi", "Bibimbap", "Korean BBQ", "Tteokbokki", "Japchae"],
    naturalBeauty: "Jeju Island, Jirisan mountains, DMZ"
  },
  "CH": {
    popularCities: [
      { name: "Zurich", lat: 47.3769, lng: 8.5417 },
      { name: "Geneva", lat: 46.2044, lng: 6.1432 },
      { name: "Bern", lat: 46.9480, lng: 7.4474 },
      { name: "Lucerne", lat: 47.0502, lng: 8.3093 },
      { name: "Interlaken", lat: 46.6863, lng: 7.8632 }
    ],
    beautifulPlaces: [
      { name: "Matterhorn", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", lat: 45.9766, lng: 7.6585, desc: "Iconic pyramid peak" },
      { name: "Jungfrau", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", lat: 46.5488, lng: 7.9666, desc: "Famous alpine peak" },
      { name: "Lake Geneva", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 46.4474, lng: 6.1423, desc: "Beautiful lake" },
      { name: "Swiss Alps", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", lat: 46.8182, lng: 8.2275, desc: "Stunning mountain range" },
      { name: "Lucerne", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", lat: 47.0502, lng: 8.3093, desc: "Picturesque city with chapel bridge" }
    ],
    popularDishes: ["Fondue", "Raclette", "Rösti", "Swiss chocolate", "Zürcher Geschnetzeltes"],
    naturalBeauty: "Matterhorn, Jungfrau, Lake Geneva"
  },
  "AR": {
    popularCities: [
      { name: "Buenos Aires", lat: -34.6037, lng: -58.3816 },
      { name: "Córdoba", lat: -31.4135, lng: -64.1811 },
      { name: "Mendoza", lat: -32.8908, lng: -68.8272 },
      { name: "Bariloche", lat: -41.1335, lng: -71.3103 },
      { name: "Rosario", lat: -32.9442, lng: -60.6505 }
    ],
    beautifulPlaces: [
      { name: "Iguazu Falls", image: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=400&q=80", lat: -25.6953, lng: -54.4367, desc: "Spectacular waterfalls on the Argentine-Brazilian border" },
      { name: "Patagonia", image: "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&q=80", lat: -49.3300, lng: -72.8900, desc: "Wild southern tip with glaciers and peaks" },
      { name: "Perito Moreno Glacier", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", lat: -50.4963, lng: -73.1388, desc: "One of the world's most dynamic glaciers" },
      { name: "Buenos Aires Obelisk", image: "https://images.unsplash.com/photo-1534430480872-3498386e7856?w=400&q=80", lat: -34.6037, lng: -58.3816, desc: "Iconic city landmark and cultural heart" },
      { name: "Aconcagua", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: -32.6532, lng: -70.0109, desc: "Highest peak in the Americas at 6,961 m" }
    ],
    popularDishes: ["Asado", "Empanadas", "Dulce de Leche", "Medialunas", "Milanesa"],
    naturalBeauty: "Patagonia, Iguazu Falls, Andes, Perito Moreno Glacier"
  },
  "GR": {
    popularCities: [
      { name: "Athens", lat: 37.9838, lng: 23.7275 },
      { name: "Thessaloniki", lat: 40.6401, lng: 22.9444 },
      { name: "Santorini", lat: 36.3932, lng: 25.4615 },
      { name: "Mykonos", lat: 37.4467, lng: 25.3289 },
      { name: "Rhodes", lat: 36.4341, lng: 28.2176 }
    ],
    beautifulPlaces: [
      { name: "Acropolis of Athens", image: "https://images.unsplash.com/photo-1555993539-1732b0258235?w=400&q=80", lat: 37.9715, lng: 23.7267, desc: "Ancient citadel with the Parthenon" },
      { name: "Santorini Caldera", image: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=400&q=80", lat: 36.3932, lng: 25.4615, desc: "Iconic white-washed cliffs over the caldera" },
      { name: "Mykonos Windmills", image: "https://images.unsplash.com/photo-1533105079780-92b9be482077?w=400&q=80", lat: 37.4467, lng: 25.3289, desc: "Famous Cycladic windmills and beaches" },
      { name: "Meteora", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80", lat: 39.7217, lng: 21.6306, desc: "Monasteries perched on towering rock pillars" },
      { name: "Delphi", image: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?w=400&q=80", lat: 38.4824, lng: 22.5010, desc: "Ancient oracle sanctuary on Mount Parnassus" }
    ],
    popularDishes: ["Moussaka", "Souvlaki", "Spanakopita", "Baklava", "Tzatziki"],
    naturalBeauty: "Santorini caldera, Meteora, Aegean islands, Ionian coast"
  },
  "NO": {
    popularCities: [
      { name: "Oslo", lat: 59.9139, lng: 10.7522 },
      { name: "Bergen", lat: 60.3913, lng: 5.3221 },
      { name: "Trondheim", lat: 63.4305, lng: 10.3951 },
      { name: "Tromsø", lat: 69.6489, lng: 18.9551 },
      { name: "Stavanger", lat: 58.9700, lng: 5.7331 }
    ],
    beautifulPlaces: [
      { name: "Geirangerfjord", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400&q=80", lat: 62.1040, lng: 7.2061, desc: "UNESCO fjord with dramatic waterfalls" },
      { name: "Northern Lights", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", lat: 69.6489, lng: 18.9551, desc: "Aurora Borealis over Tromsø" },
      { name: "Preikestolen", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 58.9864, lng: 6.1896, desc: "Dramatic cliff 604 m above Lysefjord" },
      { name: "Bryggen Wharf", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 60.3976, lng: 5.3239, desc: "UNESCO colorful wooden buildings in Bergen" },
      { name: "Lofoten Islands", image: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=400&q=80", lat: 68.1532, lng: 13.9996, desc: "Dramatic archipelago with fishing villages" }
    ],
    popularDishes: ["Rakfisk", "Lutefisk", "Kjøttkaker", "Brunost", "Raspeball"],
    naturalBeauty: "Fjords, Northern Lights, Lofoten Islands, midnight sun"
  },
  "TR": {
    popularCities: [
      { name: "Istanbul", lat: 41.0082, lng: 28.9784 },
      { name: "Ankara", lat: 39.9334, lng: 32.8597 },
      { name: "Izmir", lat: 38.4192, lng: 27.1287 },
      { name: "Antalya", lat: 36.8969, lng: 30.7133 },
      { name: "Cappadocia", lat: 38.6431, lng: 34.8289 }
    ],
    beautifulPlaces: [
      { name: "Hagia Sophia", image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80", lat: 41.0086, lng: 28.9802, desc: "Byzantine basilica turned mosque in Istanbul" },
      { name: "Cappadocia Balloons", image: "https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=400&q=80", lat: 38.6431, lng: 34.8289, desc: "Hot air balloons over fairy chimneys" },
      { name: "Pamukkale", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", lat: 37.9208, lng: 29.1204, desc: "Cotton Castle — white terraced thermal pools" },
      { name: "Blue Mosque", image: "https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?w=400&q=80", lat: 41.0054, lng: 28.9768, desc: "Iconic Ottoman mosque with six minarets" },
      { name: "Ephesus", image: "https://images.unsplash.com/photo-1568322445389-f64ac2515020?w=400&q=80", lat: 37.9397, lng: 27.3415, desc: "Ancient Greek city and UNESCO World Heritage Site" }
    ],
    popularDishes: ["Kebab", "Baklava", "Meze", "Pide", "Lahmacun"],
    naturalBeauty: "Cappadocia, Pamukkale, Turquoise Coast, Bosphorus"
  },
  "VN": {
    popularCities: [
      { name: "Hanoi", lat: 21.0285, lng: 105.8542 },
      { name: "Ho Chi Minh City", lat: 10.7769, lng: 106.7009 },
      { name: "Da Nang", lat: 16.0544, lng: 108.2022 },
      { name: "Hoi An", lat: 15.8801, lng: 108.3380 },
      { name: "Hue", lat: 16.4637, lng: 107.5909 }
    ],
    beautifulPlaces: [
      { name: "Ha Long Bay", image: "https://images.unsplash.com/photo-1528127269322-539801943592?w=400&q=80", lat: 20.9101, lng: 107.1839, desc: "UNESCO bay with thousands of limestone islands" },
      { name: "Hoi An Old Town", image: "https://images.unsplash.com/photo-1528181304800-259b08848526?w=400&q=80", lat: 15.8801, lng: 108.3380, desc: "Lantern-lit ancient trading port" },
      { name: "Phong Nha Caves", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80", lat: 17.5593, lng: 106.2822, desc: "World's largest cave systems" },
      { name: "Sapa Rice Terraces", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80", lat: 22.3364, lng: 103.8438, desc: "Stunning stacked rice terraces in the mountains" },
      { name: "Mekong Delta", image: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=400&q=80", lat: 10.2899, lng: 105.7469, desc: "Lush river delta with floating markets" }
    ],
    popularDishes: ["Pho", "Banh Mi", "Bun Bo Hue", "Com Tam", "Banh Xeo"],
    naturalBeauty: "Ha Long Bay, Phong Nha caves, Sapa terraces, beaches"
  },
};

const countries = [
  { name: "Afghanistan", flag: "🇦🇫", code: "AF", lat: 33.9391, lng: 67.71 },
  { name: "Albania", flag: "🇦🇱", code: "AL", lat: 41.1533, lng: 20.1683 },
  { name: "Algeria", flag: "🇩🇿", code: "DZ", lat: 28.0339, lng: 1.6596 },
  { name: "Argentina", flag: "🇦🇷", code: "AR", lat: -38.4161, lng: -63.6167 },
  { name: "Australia", flag: "🇦🇺", code: "AU", lat: -25.2744, lng: 133.7751 },
  { name: "Austria", flag: "🇦🇹", code: "AT", lat: 47.5162, lng: 14.5501 },
  { name: "Bahrain", flag: "🇧🇭", code: "BH", lat: 26.0667, lng: 50.5577 },
  { name: "Bangladesh", flag: "🇧🇩", code: "BD", lat: 23.685, lng: 90.3563 },
  { name: "Belgium", flag: "🇧🇪", code: "BE", lat: 50.5039, lng: 4.4699 },
  { name: "Brazil", flag: "🇧🇷", code: "BR", lat: -14.235, lng: -51.9253 },
  { name: "Cambodia", flag: "🇰🇭", code: "KH", lat: 12.5657, lng: 104.991 },
  { name: "Canada", flag: "🇨🇦", code: "CA", lat: 56.1304, lng: -106.3468 },
  { name: "Chile", flag: "🇨🇱", code: "CL", lat: -35.6751, lng: -71.543 },
  { name: "China", flag: "🇨🇳", code: "CN", lat: 35.8617, lng: 104.1954 },
  { name: "Colombia", flag: "🇨🇴", code: "CO", lat: 4.5709, lng: -74.2973 },
  { name: "Costa Rica", flag: "🇨🇷", code: "CR", lat: 9.7489, lng: -83.7534 },
  { name: "Croatia", flag: "🇭🇷", code: "HR", lat: 45.1, lng: 15.2 },
  { name: "Czech Republic", flag: "🇨🇿", code: "CZ", lat: 49.8175, lng: 15.473 },
  { name: "Denmark", flag: "🇩🇰", code: "DK", lat: 56.2639, lng: 9.5018 },
  { name: "Dominican Republic", flag: "🇩🇴", code: "DO", lat: 18.7357, lng: -70.1627 },
  { name: "Ecuador", flag: "🇪🇨", code: "EC", lat: -1.8312, lng: -78.1834 },
  { name: "Egypt", flag: "🇪🇬", code: "EG", lat: 26.8206, lng: 30.8025 },
  { name: "Estonia", flag: "🇪🇪", code: "EE", lat: 58.5953, lng: 25.0136 },
  { name: "Ethiopia", flag: "🇪🇹", code: "ET", lat: 9.145, lng: 40.4897 },
  { name: "Finland", flag: "🇫🇮", code: "FI", lat: 61.9241, lng: 25.7482 },
  { name: "France", flag: "🇫🇷", code: "FR", lat: 46.2276, lng: 2.2137 },
  { name: "Germany", flag: "🇩🇪", code: "DE", lat: 51.1657, lng: 10.4515 },
  { name: "Greece", flag: "🇬🇷", code: "GR", lat: 39.0742, lng: 21.8243 },
  { name: "Guatemala", flag: "🇬🇹", code: "GT", lat: 15.7835, lng: -90.2308 },
  { name: "Honduras", flag: "🇭🇳", code: "HN", lat: 15.2, lng: -86.2419 },
  { name: "Hungary", flag: "🇭🇺", code: "HU", lat: 47.1625, lng: 19.5033 },
  { name: "Iceland", flag: "🇮🇸", code: "IS", lat: 64.9631, lng: -19.0208 },
  { name: "India", flag: "🇮🇳", code: "IN", lat: 20.5937, lng: 78.9629 },
  { name: "Indonesia", flag: "🇮🇩", code: "ID", lat: -0.7893, lng: 113.9213 },
  { name: "Iran", flag: "🇮🇷", code: "IR", lat: 32.4279, lng: 53.688 },
  { name: "Iraq", flag: "🇮🇶", code: "IQ", lat: 33.2232, lng: 43.6793 },
  { name: "Ireland", flag: "🇮🇪", code: "IE", lat: 53.1424, lng: -7.6921 },
  { name: "Israel", flag: "🇮🇱", code: "IL", lat: 31.0461, lng: 34.8516 },
  { name: "Italy", flag: "🇮🇹", code: "IT", lat: 41.8719, lng: 12.5674 },
  { name: "Jamaica", flag: "🇯🇲", code: "JM", lat: 18.1096, lng: -77.2975 },
  { name: "Japan", flag: "🇯🇵", code: "JP", lat: 36.2048, lng: 138.2529 },
  { name: "Jordan", flag: "🇯🇴", code: "JO", lat: 30.5852, lng: 36.2384 },
  { name: "Kazakhstan", flag: "🇰🇿", code: "KZ", lat: 48.0196, lng: 66.9237 },
  { name: "Kenya", flag: "🇰🇪", code: "KE", lat: -0.0236, lng: 37.9062 },
  { name: "Kuwait", flag: "🇰🇼", code: "KW", lat: 29.3117, lng: 47.4818 },
  { name: "Latvia", flag: "🇱🇻", code: "LV", lat: 56.8796, lng: 24.6032 },
  { name: "Lebanon", flag: "🇱🇧", code: "LB", lat: 33.8547, lng: 35.8623 },
  { name: "Lithuania", flag: "🇱🇹", code: "LT", lat: 55.1694, lng: 23.8813 },
  { name: "Luxembourg", flag: "🇱🇺", code: "LU", lat: 49.8153, lng: 6.1296 },
  { name: "Malaysia", flag: "🇲🇾", code: "MY", lat: 4.2105, lng: 101.9758 },
  { name: "Maldives", flag: "🇲🇻", code: "MV", lat: 3.2028, lng: 73.2207 },
  { name: "Malta", flag: "🇲🇹", code: "MT", lat: 35.9375, lng: 14.3754 },
  { name: "Mexico", flag: "🇲🇽", code: "MX", lat: 23.6345, lng: -102.5528 },
  { name: "Monaco", flag: "🇲🇨", code: "MC", lat: 43.7384, lng: 7.4246 },
  { name: "Morocco", flag: "🇲🇦", code: "MA", lat: 31.7917, lng: -7.0926 },
  { name: "Nepal", flag: "🇳🇵", code: "NP", lat: 28.3949, lng: 84.124 },
  { name: "Netherlands", flag: "🇳🇱", code: "NL", lat: 52.1326, lng: 5.2913 },
  { name: "New Zealand", flag: "🇳🇿", code: "NZ", lat: -40.9006, lng: 174.886 },
  { name: "Nicaragua", flag: "🇳🇮", code: "NI", lat: 12.8654, lng: -85.2072 },
  { name: "Nigeria", flag: "🇳🇬", code: "NG", lat: 9.082, lng: 8.6753 },
  { name: "Norway", flag: "🇳🇴", code: "NO", lat: 60.472, lng: 8.4689 },
  { name: "Oman", flag: "🇴🇲", code: "OM", lat: 21.4735, lng: 55.9754 },
  { name: "Pakistan", flag: "🇵🇰", code: "PK", lat: 30.3753, lng: 69.3451 },
  { name: "Panama", flag: "🇵🇦", code: "PA", lat: 8.538, lng: -80.7821 },
  { name: "Paraguay", flag: "🇵🇾", code: "PY", lat: -23.4425, lng: -58.4438 },
  { name: "Peru", flag: "🇵🇪", code: "PE", lat: -9.19, lng: -75.0152 },
  { name: "Philippines", flag: "🇵🇭", code: "PH", lat: 12.8797, lng: 121.774 },
  { name: "Poland", flag: "🇵🇱", code: "PL", lat: 51.9194, lng: 19.1451 },
  { name: "Portugal", flag: "🇵🇹", code: "PT", lat: 39.3999, lng: -8.2245 },
  { name: "Qatar", flag: "🇶🇦", code: "QA", lat: 25.3548, lng: 51.1839 },
  { name: "Romania", flag: "🇷🇴", code: "RO", lat: 45.9432, lng: 24.9668 },
  { name: "Russia", flag: "🇷🇺", code: "RU", lat: 61.524, lng: 105.3188 },
  { name: "Saudi Arabia", flag: "🇸🇦", code: "SA", lat: 23.8859, lng: 45.0792 },
  { name: "Serbia", flag: "🇷🇸", code: "RS", lat: 44.0165, lng: 21.0059 },
  { name: "Singapore", flag: "🇸🇬", code: "SG", lat: 1.3521, lng: 103.8198 },
  { name: "Slovakia", flag: "🇸🇰", code: "SK", lat: 48.669, lng: 19.699 },
  { name: "Slovenia", flag: "🇸🇮", code: "SI", lat: 46.1512, lng: 14.9955 },
  { name: "South Africa", flag: "🇿🇦", code: "ZA", lat: -30.5595, lng: 22.9375 },
  { name: "South Korea", flag: "🇰🇷", code: "KR", lat: 35.9078, lng: 127.7669 },
  { name: "Spain", flag: "🇪🇸", code: "ES", lat: 40.4637, lng: -3.7492 },
  { name: "Sri Lanka", flag: "🇱🇰", code: "LK", lat: 7.8731, lng: 80.7718 },
  { name: "Sweden", flag: "🇸🇪", code: "SE", lat: 60.1282, lng: 18.6435 },
  { name: "Switzerland", flag: "🇨🇭", code: "CH", lat: 46.8182, lng: 8.2275 },
  { name: "Taiwan", flag: "🇹🇼", code: "TW", lat: 23.6978, lng: 120.9605 },
  { name: "Thailand", flag: "🇹🇭", code: "TH", lat: 15.87, lng: 100.9925 },
  { name: "Turkey", flag: "🇹🇷", code: "TR", lat: 38.9637, lng: 35.2433 },
  { name: "Ukraine", flag: "🇺🇦", code: "UA", lat: 48.3794, lng: 31.1656 },
  { name: "United Arab Emirates", flag: "🇦🇪", code: "AE", lat: 23.4241, lng: 53.8478 },
  { name: "United Kingdom", flag: "🇬🇧", code: "GB", lat: 55.3781, lng: -3.436 },
  { name: "United States", flag: "🇺🇸", code: "US", lat: 37.0902, lng: -95.7129 },
  { name: "Uruguay", flag: "🇺🇾", code: "UY", lat: -32.5228, lng: -55.7658 },
  { name: "Venezuela", flag: "🇻🇪", code: "VE", lat: 6.4238, lng: -66.5897 },
  { name: "Vietnam", flag: "🇻🇳", code: "VN", lat: 14.0583, lng: 108.2772 },
];

const allCityLocations = Object.entries(countryData).flatMap(([code, data]) => {
  const country = countries.find(c => c.code === code);
  if (!country) return [];
  return (data.popularCities || [])
    .filter(city => city.lat && city.lng)
    .map(city => ({
      type: "city",
      name: city.name,
      countryCode: code,
      countryName: country.name,
      countryFlag: country.flag,
      lat: city.lat,
      lng: city.lng,
    }));
});

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
  const [activeTab, setActiveTab] = useState("saved");
  const [savedPlaces, setSavedPlaces] = useState([]);
  const [travelHistory, setTravelHistory] = useState([]);
  const [defaultTransitMode, setDefaultTransitMode] = useState("drive");
  const [tripSaved, setTripSaved] = useState(false);
  const [geolocationStatus, setGeolocationStatus] = useState("offline");
  const [showCountries, setShowCountries] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ name: "United States", flag: "🇺🇸", code: "US", lat: 37.0902, lng: -95.7129, details: null });
  const [showCountryDetails, setShowCountryDetails] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapType, setMapType] = useState("roadmap");
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [tripPlan, setTripPlan] = useState(null);
  const [chatMessages, setChatMessages] = useState([
    { role: "assistant", content: "Hi! I'm your travel assistant. How can I help you today? 🌍" }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatSize, setChatSize] = useState({ width: 340, height: 420 });
  const [isResizing, setIsResizing] = useState(false);
  const [showFullscreenChat, setShowFullscreenChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState("");
  const [transportInfo, setTransportInfo] = useState(null);
  const [transportLoading, setTransportLoading] = useState(false);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [stateWeather, setStateWeather] = useState(null);
  const [stateWeatherLoading, setStateWeatherLoading] = useState(false);
  const [stateSearch, setStateSearch] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const [chatPlaces, setChatPlaces] = useState([]);
  const [activeChatPlace, setActiveChatPlace] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [destTimezone, setDestTimezone] = useState(null);

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
      popularCities: [
        { name: "Capital City", lat: countryCode ? 0 : 0, lng: 0 },
        { name: "Major City", lat: 0, lng: 0 },
        { name: "Coastal City", lat: 0, lng: 0 },
        { name: "Mountain City", lat: 0, lng: 0 }
      ],
      beautifulPlaces: [
        { name: "Historic Old Town", image: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80", lat: 0, lng: 0, desc: "Historic old town" },
        { name: "National Park", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&q=80", lat: 0, lng: 0, desc: "Beautiful national park" },
        { name: "Ancient Ruins", image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=400&q=80", lat: 0, lng: 0, desc: "Ancient ruins" },
        { name: "Mountain Range", image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&q=80", lat: 0, lng: 0, desc: "Mountain range" },
        { name: "Beautiful Beach", image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&q=80", lat: 0, lng: 0, desc: "Beautiful beach" }
      ],
      popularDishes: ["Local Specialty", "Traditional Dish", "Street Food", "Must-Try Dessert"],
      naturalBeauty: "Stunning natural landscapes throughout the country"
    };
  };

  const handleCountrySelect = (country) => {
    const details = getCountryDetails(country.code);
    setSelectedCountry({ ...country, details });
    setDestination({ lat: country.lat, lng: country.lng, label: country.name });
    setSelectedPlace(null);
    setShowCountries(false);
    setShowCountryDetails(true);
    setCountrySearch(country.name);
    fetchStateWeather({ lat: country.lat, lng: country.lng });
  };

  const getWeatherInfo = (code) => {
    if (code === undefined || code === null) return { icon: "🌤️", desc: "Unknown" };
    if (code === 0)              return { icon: "☀️",  desc: "Clear sky" };
    if (code <= 3)               return { icon: "⛅",  desc: "Partly cloudy" };
    if (code <= 48)              return { icon: "🌫️", desc: "Foggy" };
    if (code <= 55)              return { icon: "🌦️", desc: "Drizzle" };
    if (code <= 65)              return { icon: "🌧️", desc: "Rainy" };
    if (code <= 75)              return { icon: "❄️",  desc: "Snowy" };
    if (code <= 82)              return { icon: "🌧️", desc: "Rain showers" };
    if (code <= 86)              return { icon: "🌨️", desc: "Snow showers" };
    if (code >= 95)              return { icon: "⛈️",  desc: "Thunderstorm" };
    return { icon: "🌤️", desc: "Variable" };
  };

  const fetchStateWeather = async (state) => {
    setStateWeather(null);
    setStateWeatherLoading(true);
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${state.lat}&longitude=${state.lng}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,windspeed_10m_max&timezone=auto&forecast_days=1`
      );
      const data = await res.json();
      setStateWeather(data);
      if (data.timezone) setDestTimezone(data.timezone);
    } catch {
      setStateWeather({ error: true });
    }
    setStateWeatherLoading(false);
  };

  const handleStateSelect = (state) => {
    setSelectedState(state);
    setStateWeather(null);
    fetchStateWeather(state);
  };

  const getLocalRideApp = (countryCode) => {
    const grabCountries = ["TH", "VN", "MY", "ID", "PH", "SG", "KH", "MM", "BD"];
    const careemCountries = ["AE", "SA", "EG", "JO", "KW", "QA", "BH", "OM", "LB"];
    const olaCountries = ["IN"];
    const didiCountries = ["CN"];
    if (grabCountries.includes(countryCode)) return { name: "Grab", color: "#00b14f", url: "https://www.grab.com/" };
    if (careemCountries.includes(countryCode)) return { name: "Careem", color: "#5bb962", url: "https://www.careem.com/" };
    if (olaCountries.includes(countryCode)) return { name: "Ola", color: "#f5a623", url: "https://www.olacabs.com/" };
    if (didiCountries.includes(countryCode)) return { name: "DiDi", color: "#ff6b00", url: "https://www.didiglobal.com/" };
    return { name: "Uber", color: "#000000", url: `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${0}&dropoff[longitude]=${0}&dropoff[nickname]=Destination` };
  };

  const fetchTransportInfo = (place) => {
    if (!window.google || !origin?.lat) {
      setTransportInfo({ noLocation: true });
      return;
    }
    setTransportLoading(true);
    setTransportInfo(null);
    const service = new window.google.maps.DistanceMatrixService();
    const origin_ll = new window.google.maps.LatLng(origin.lat, origin.lng);
    const dest_ll = new window.google.maps.LatLng(place.lat, place.lng);
    const travelModes = [
      window.google.maps.TravelMode.WALKING,
      window.google.maps.TravelMode.DRIVING,
      window.google.maps.TravelMode.TRANSIT,
      window.google.maps.TravelMode.BICYCLING,
    ];
    const results = {};
    let pending = travelModes.length;
    travelModes.forEach((mode) => {
      service.getDistanceMatrix(
        { origins: [origin_ll], destinations: [dest_ll], travelMode: mode },
        (res, status) => {
          if (status === "OK") {
            const el = res.rows[0]?.elements[0];
            const modeKey = mode.toLowerCase();
            if (el?.status === "OK") {
              results[modeKey] = { distance: el.distance.text, duration: el.duration.text };
            } else {
              results[modeKey] = null;
            }
          }
          pending--;
          if (pending === 0) {
            setTransportInfo(results);
            setTransportLoading(false);
          }
        }
      );
    });
  };

  const handlePlaceSelect = (place) => {
    if (place.lat && place.lng) {
      setSelectedPlace(place);
      setDestination({ lat: place.lat, lng: place.lng, label: place.name });
      setShowMap(true);
      setTransportInfo(null);
      fetchStateWeather({ lat: place.lat, lng: place.lng });
      // Fetch transport info after map/Google loads
      setTimeout(() => fetchTransportInfo(place), 800);
    }
  };

  const handleSearchEnter = () => {
    const q = countrySearch.trim();
    if (!q) return;
    setShowCountries(false);

    // 1. Exact or prefix city match
    const cityMatch =
      allCityLocations.find(c => c.name.toLowerCase() === q.toLowerCase()) ||
      allCityLocations.find(c =>
        `${c.name}, ${c.countryName}`.toLowerCase() === q.toLowerCase()
      ) ||
      allCityLocations.find(c => c.name.toLowerCase().startsWith(q.toLowerCase()));

    if (cityMatch) {
      const parent = countries.find(c => c.code === cityMatch.countryCode);
      if (parent) handleCountrySelect(parent);
      handlePlaceSelect({ name: cityMatch.name, lat: cityMatch.lat, lng: cityMatch.lng, desc: `City in ${cityMatch.countryName}` });
      setCountrySearch(`${cityMatch.name}, ${cityMatch.countryName}`);
      return;
    }

    // 2. Exact or prefix country match
    const countryMatch =
      countries.find(c => c.name.toLowerCase() === q.toLowerCase()) ||
      countries.find(c => c.name.toLowerCase().startsWith(q.toLowerCase()));

    if (countryMatch) {
      handleCountrySelect(countryMatch);
      return;
    }

    // 3. Free-text fallback — deterministic mock weather + timezone
    let hash = 0;
    for (let i = 0; i < q.length; i++) hash = (hash * 31 + q.charCodeAt(i)) >>> 0;
    const mockTzList = [
      "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Sao_Paulo",
      "Europe/London", "Europe/Paris", "Europe/Berlin", "Europe/Moscow",
      "Asia/Dubai", "Asia/Kolkata", "Asia/Bangkok", "Asia/Tokyo", "Asia/Shanghai",
      "Australia/Sydney", "Pacific/Auckland", "Africa/Cairo", "Africa/Nairobi",
    ];
    const mockWeatherCodes = [0, 1, 2, 3, 45, 61, 71, 80, 95];
    const tz = mockTzList[hash % mockTzList.length];
    const code = mockWeatherCodes[(hash >> 4) % mockWeatherCodes.length];
    const tempC = 8 + ((hash >> 8) % 27);

    setDestination({ lat: 0, lng: 0, label: q });
    setCountrySearch(q);
    setStateWeather({ current_weather: { temperature: tempC, weathercode: code } });
    setDestTimezone(tz);
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

  const handleSaveTrip = () => {
    if (!destination) return;
    const plan = {
      destination: destination.label,
      mode: selectedMode,
      date: new Date().toLocaleDateString(),
      origin: origin?.label || "Current Location",
      id: Date.now(),
    };
    setTripPlan(plan);
    setTravelHistory(prev => [plan, ...prev].slice(0, 20));
    setTripSaved(true);
    setTimeout(() => setTripSaved(false), 2000);
  };

  const handleChatResize = useCallback((e) => {
    if (!isResizing) return;
    const newWidth = Math.max(280, Math.min(600, e.clientX));
    const newHeight = Math.max(300, Math.min(600, window.innerHeight - e.clientY));
    setChatSize({ width: newWidth, height: newHeight });
  }, [isResizing]);

  const stopResize = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleChatResize);
      window.addEventListener('mouseup', stopResize);
      return () => {
        window.removeEventListener('mousemove', handleChatResize);
        window.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing, handleChatResize, stopResize]);

  useEffect(() => {
    if (showMap && mapInstance && window.google) {
      const timer = setTimeout(() => {
        window.google.maps.event.trigger(mapInstance, "resize");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [showMap, mapInstance]);

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setChatPlaces([]);
    setActiveChatPlace(null);
    setIsChatLoading(true);
    setStreamingMessage("");

    const ctx = [
      selectedCountry?.name && `Exploring: ${selectedCountry.flag} ${selectedCountry.name}`,
      selectedPlace?.name && `Viewing: ${selectedPlace.name}`,
      selectedState?.name && `State/Province: ${selectedState.name}`,
    ].filter(Boolean).join(" | ");
    const systemPrompt = `You are a concise AI travel assistant. Help users plan trips and discover places worldwide. ${ctx ? `Context: ${ctx}.` : ""} Be brief, friendly, use emojis. Max 3 short paragraphs.`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...chatMessages
        .filter(m => m.content !== "Hi! I'm your travel assistant. How can I help you today? 🌍")
        .slice(-6)
        .map(m => ({ role: m.role === "assistant" ? "assistant" : "user", content: m.content })),
      { role: "user", content: userMessage },
    ];

    const backendUrl = import.meta.env.VITE_DASHBOARD_API_URL || "http://localhost:8000";

    try {
      const res = await fetch(`${backendUrl}/chat/groq`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.detail || "Backend error");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let streamError = null;
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data: ")) continue;
          const raw = trimmed.slice(6);
          try {
            const data = JSON.parse(raw);
            if (data.type === "done") { streamDone = true; break; }
            if (data.type === "error") { streamError = data.message; streamDone = true; break; }
            if (data.type === "text" && data.content) {
              fullText += data.content;
              setStreamingMessage(fullText);
            }
            if (data.type === "marker" && data.lat && data.lng) {
              setChatPlaces(prev => [...prev, { name: data.name, lat: data.lat, lng: data.lng, description: data.description, address: data.address }]);
              setShowMap(true);
            }
          } catch (_) { /* skip malformed lines */ }
        }
      }

      if (streamError) throw new Error(streamError);
      setChatMessages(prev => [...prev, { role: "assistant", content: fullText || "Sorry, I couldn't generate a response." }]);
    } catch (e) {
      console.error("Chat error:", e.message);
      setChatMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${e.message || "Failed to connect to backend."}` }]);
    }

    setStreamingMessage("");
    setIsChatLoading(false);
  };

  const routes = origin && destination ? {
    drive: { duration: "18 min", distance: "9.2 km" },
    transit: { duration: "28 min", distance: "walk 0.9 km", transitInfo: "Next bus in 6 min" },
    walk: { duration: "1 hr 45 min", distance: "7.8 km" },
    bike: { duration: "34 min", distance: "8.1 km" },
  } : null;

  const pulsingPinSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="50" height="60" viewBox="0 0 50 60">
    <circle cx="25" cy="22" r="20" fill="rgba(37,99,235,0.15)">
      <animate attributeName="r" values="14;22;14" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.7;0;0.7" dur="1.8s" repeatCount="indefinite"/>
    </circle>
    <circle cx="25" cy="22" r="10" fill="rgba(37,99,235,0.3)">
      <animate attributeName="r" values="8;16;8" dur="1.8s" begin="0.4s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.9;0;0.9" dur="1.8s" begin="0.4s" repeatCount="indefinite"/>
    </circle>
    <path d="M25 4C17.27 4 11 10.27 11 18c0 9.75 14 28 14 28s14-18.25 14-28C39 10.27 32.73 4 25 4z" fill="#2563eb" stroke="white" stroke-width="1.5"/>
    <circle cx="25" cy="18" r="5.5" fill="white"/>
  </svg>`;

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

      {/* ── FULL-SCREEN CONTAINER ─────────────────────────── */}
      <div
        style={{
          position: isFullscreen ? "fixed" : "relative",
          top: isFullscreen ? 0 : undefined,
          left: isFullscreen ? 0 : undefined,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
        onClick={() => { if (showCountries) setShowCountries(false); }}
      >
        {/* ── SCENIC BACKGROUND ───────────────────────────── */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80')",
          backgroundSize: "cover", backgroundPosition: "center",
        }} />
        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.38)" }} />

        {/* ── HEADER BAR ──────────────────────────────────── */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
          display: "flex", alignItems: "center", padding: "10px 14px", gap: "10px",
          backgroundColor: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.12)",
          height: "58px", boxSizing: "border-box",
        }}>
          {/* Transport mode selector */}
          <div style={{
            display: "flex", flexShrink: 0,
            backgroundColor: "rgba(255,255,255,0.1)", backdropFilter: "blur(12px)",
            borderRadius: "10px", padding: "3px",
            border: "1px solid rgba(255,255,255,0.18)",
          }}>
            {modes.map(mode => (
              <button key={mode.id} onClick={() => setSelectedMode(mode.id)} style={{
                padding: "6px 11px", borderRadius: "7px", border: "none", cursor: "pointer",
                fontSize: "12px", fontWeight: 600, transition: "all 0.2s",
                backgroundColor: selectedMode === mode.id ? "#2563eb" : "transparent",
                color: selectedMode === mode.id ? "white" : "rgba(255,255,255,0.8)",
              }}>{mode.icon} {mode.label}</button>
            ))}
          </div>

          {/* Search bar — centre */}
          <div style={{ flex: 1, maxWidth: "420px", margin: "0 auto", position: "relative" }}
               onClick={e => e.stopPropagation()}>
            <div style={{
              display: "flex", alignItems: "center", gap: "10px",
              backgroundColor: "rgba(255,255,255,0.94)", backdropFilter: "blur(12px)",
              borderRadius: "50px", padding: "9px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}>
              <span style={{ fontSize: "18px" }}>{selectedCountry.flag}</span>
              <input
                type="text" placeholder="Search a destination…" value={countrySearch}
                onFocus={() => setShowCountries(true)}
                onChange={e => { setCountrySearch(e.target.value); setShowCountries(true); }}
                onKeyDown={e => { if (e.key === "Enter") handleSearchEnter(); }}
                style={{ flex: 1, border: "none", outline: "none", fontSize: "14px", color: "#111827", background: "transparent" }}
              />
              {countrySearch ? (
                <button onClick={() => setCountrySearch("")}
                  style={{ border: "none", background: "none", cursor: "pointer", color: "#9ca3af", fontSize: "16px", padding: 0 }}>✕</button>
              ) : (
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontSize: "13px" }}>🔍</span>
                </div>
              )}
            </div>
            {/* Start Trip — floats below search bar when a destination is selected */}
            {!showCountries && destination && (
              <div style={{
                position: "absolute", top: "calc(100% + 12px)", left: 0, right: 0,
                display: "flex", justifyContent: "center",
                animation: "fadeInScale 0.25s ease forwards",
                zIndex: 49, pointerEvents: "auto",
              }}>
                <button
                  className="start-trip-btn"
                  onClick={handleSaveTrip}
                  style={{
                    backgroundColor: tripSaved ? "#16a34a" : "#22c55e",
                    color: "white",
                    padding: "9px 24px", borderRadius: "50px",
                    border: "none", cursor: "pointer",
                    fontSize: "14px", fontWeight: 700,
                    boxShadow: tripSaved
                      ? "0 4px 20px rgba(22,163,74,0.6)"
                      : "0 4px 20px rgba(34,197,94,0.45)",
                    display: "flex", alignItems: "center", gap: "8px",
                    whiteSpace: "nowrap",
                    transition: "background-color 0.25s ease, box-shadow 0.25s ease",
                  }}
                >
                  {tripSaved ? (
                    <>
                      <span style={{ fontSize: "15px", fontWeight: 900 }}>✓</span>
                      <span>Saved to History!</span>
                    </>
                  ) : (
                    <>
                      <span>✈️</span>
                      <span>Start Trip to {destination.label}</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {showCountries && (() => {
              const q = countrySearch.toLowerCase();
              const filteredCountries = countries.filter(c =>
                c.name.toLowerCase().includes(q)
              );
              const filteredCities = q.length >= 2
                ? allCityLocations.filter(c =>
                    c.name.toLowerCase().includes(q) ||
                    c.countryName.toLowerCase().includes(q)
                  ).slice(0, 6)
                : [];
              const noResults = filteredCountries.length === 0 && filteredCities.length === 0;
              return (
                <div style={{ position: "absolute", top: "calc(100% + 8px)", left: 0, right: 0, backgroundColor: "white", borderRadius: "14px", boxShadow: "0 12px 36px rgba(0,0,0,0.25)", maxHeight: "320px", overflowY: "auto", zIndex: 50 }}>
                  {noResults
                    ? <div style={{ padding: "20px", textAlign: "center", color: "#9ca3af", fontSize: "14px" }}>🌐 No destinations found</div>
                    : <>
                        {filteredCities.length > 0 && (
                          <>
                            <div style={{ padding: "6px 14px 4px", borderBottom: "1px solid #f3f4f6" }}>
                              <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Cities</p>
                            </div>
                            {filteredCities.map(city => (
                              <button key={`${city.countryCode}-${city.name}`}
                                onClick={() => {
                                  const parent = countries.find(c => c.code === city.countryCode);
                                  if (parent) handleCountrySelect(parent);
                                  handlePlaceSelect({ name: city.name, lat: city.lat, lng: city.lng, desc: `City in ${city.countryName}` });
                                  setCountrySearch(`${city.name}, ${city.countryName}`);
                                  setShowCountries(false);
                                }}
                                style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "9px 14px", border: "none", background: "transparent", cursor: "pointer", textAlign: "left" }}>
                                <span style={{ fontSize: "20px" }}>{city.countryFlag}</span>
                                <div style={{ flex: 1 }}>
                                  <span style={{ fontSize: "14px", color: "#374151" }}>{city.name}</span>
                                  <span style={{ fontSize: "11px", color: "#9ca3af", marginLeft: "6px" }}>{city.countryName}</span>
                                </div>
                                <span style={{ fontSize: "11px", color: "#9ca3af" }}>🏙️</span>
                              </button>
                            ))}
                          </>
                        )}
                        {filteredCountries.length > 0 && (
                          <>
                            <div style={{ padding: "6px 14px 4px", borderBottom: "1px solid #f3f4f6", borderTop: filteredCities.length > 0 ? "1px solid #f3f4f6" : "none" }}>
                              <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>Countries ({filteredCountries.length})</p>
                            </div>
                            {filteredCountries.map(country => (
                              <button key={country.code}
                                onClick={() => { handleCountrySelect(country); }}
                                style={{ display: "flex", alignItems: "center", gap: "12px", width: "100%", padding: "9px 14px", border: "none", background: selectedCountry.code === country.code ? "#eff6ff" : "transparent", cursor: "pointer", textAlign: "left" }}>
                                <span style={{ fontSize: "20px" }}>{country.flag}</span>
                                <span style={{ fontSize: "14px", color: "#374151", flex: 1 }}>{country.name}</span>
                                {selectedCountry.code === country.code && <span style={{ color: "#2563eb", fontSize: "12px" }}>✓</span>}
                              </button>
                            ))}
                          </>
                        )}
                      </>
                  }
                </div>
              );
            })()}
          </div>

          {/* Chat button */}
          <button onClick={() => setShowChat(!showChat)} style={{
            width: "42px", height: "42px", borderRadius: "50%", flexShrink: 0,
            backgroundColor: showChat ? "#1d4ed8" : "#2563eb",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 15px rgba(37,99,235,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: "20px" }}>💬</span>
          </button>

          {/* User menu */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0, paddingLeft: "10px", borderLeft: "1px solid rgba(255,255,255,0.2)" }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold", fontSize: "13px", flexShrink: 0 }}>U</div>
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: 500 }}>Traveler</span>
            <button onClick={handleLogout} style={{ backgroundColor: "#ef4444", color: "white", padding: "5px 10px", borderRadius: "6px", fontSize: "12px", border: "none", cursor: "pointer", fontWeight: 600 }}>Logout</button>
          </div>
        </div>

        {/* ── ETA SUMMARY CARD ─────────────────────────────── */}
        {destination && (
          <div style={{
            position: "absolute", top: "58px", left: "50%", transform: "translateX(-50%)",
            zIndex: 25,
            width: "min(440px, calc(100vw - 32px))",
            backgroundColor: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            borderRadius: "0 0 16px 16px",
            boxShadow: "0 8px 28px rgba(0,0,0,0.22)",
            border: "1px solid rgba(0,0,0,0.06)", borderTop: "none",
            overflow: "hidden",
          }}>

            {/* Destination row */}
            <div style={{
              padding: "6px 14px 5px",
              borderBottom: "1px solid #f3f4f6",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: "12px", color: "#374151", fontWeight: 600 }}>
                {selectedCountry.flag}&nbsp;{destination.label}
              </span>
              {transportLoading && (
                <span style={{ fontSize: "11px", color: "#9ca3af", fontStyle: "italic" }}>Calculating…</span>
              )}
              {!transportLoading && !origin && (
                <span style={{ fontSize: "11px", color: "#9ca3af" }}>📍 Enable location for real ETAs</span>
              )}
            </div>

            {/* Four-mode columns */}
            <div style={{ display: "flex" }}>
              {[
                { id: "drive",   icon: "🚗", label: "Drive",   infoKey: "driving"   },
                { id: "transit", icon: "🚇", label: "Transit", infoKey: "transit"   },
                { id: "walk",    icon: "🚶", label: "Walk",    infoKey: "walking"   },
                { id: "bike",    icon: "🚴", label: "Bike",    infoKey: "bicycling" },
              ].map((m, i) => {
                const info = transportInfo?.[m.infoKey];
                const duration = transportLoading
                  ? "…"
                  : info?.duration ?? routes?.[m.id]?.duration ?? "—";
                const isActive = selectedMode === m.id;
                return (
                  <button key={m.id} onClick={() => setSelectedMode(m.id)} style={{
                    flex: 1, padding: "9px 4px 10px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                    border: "none",
                    borderLeft: i > 0 ? "1px solid #f3f4f6" : "none",
                    cursor: "pointer",
                    backgroundColor: isActive ? "#eff6ff" : "white",
                    transition: "background 0.15s",
                    position: "relative",
                  }}>
                    {isActive && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0,
                        height: "3px", backgroundColor: "#2563eb",
                      }} />
                    )}
                    <span style={{ fontSize: "18px", lineHeight: 1 }}>{m.icon}</span>
                    <span style={{
                      fontSize: "13px", fontWeight: 700, lineHeight: 1.2,
                      color: isActive ? "#1d4ed8" : "#111827",
                    }}>
                      {duration}
                    </span>
                    <span style={{
                      fontSize: "10px", fontWeight: 600,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                      color: isActive ? "#3b82f6" : "#9ca3af",
                    }}>
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>
        )}

        {/* ── CENTRAL PANEL (context card + map) ───────────── */}
        <div style={{
          position: "absolute", top: "58px", bottom: "52px", left: 0, right: 0,
          display: "flex", alignItems: "flex-start", justifyContent: "center",
          padding: "12px 16px", overflow: "hidden",
        }}>
          <div style={{ width: "min(900px, 100%)", height: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>

            {/* ── MAP PANEL ───────────────────────────────────── */}
            <div style={{
              flex: 1, minHeight: "300px",
              borderRadius: "18px", overflow: "hidden", position: "relative",
              boxShadow: showMap ? "0 20px 60px rgba(0,0,0,0.55)" : "none",
              border: "1.5px solid rgba(255,255,255,0.16)",
              opacity: showMap ? 1 : 0,
              transform: showMap ? "scale(1) translateY(0)" : "scale(0.97) translateY(16px)",
              transition: "opacity 0.35s cubic-bezier(0.4,0,0.2,1), transform 0.35s cubic-bezier(0.4,0,0.2,1), box-shadow 0.35s ease",
              pointerEvents: showMap ? "auto" : "none",
            }}>
              {/* Close map button */}
              <button
                onClick={() => setShowMap(false)}
                style={{
                  position: "absolute", bottom: "14px", left: "50%",
                  transform: "translateX(-50%)", zIndex: 15,
                  display: "flex", alignItems: "center", gap: "6px",
                  backgroundColor: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                  color: "white", padding: "7px 20px", borderRadius: "20px",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.75)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.55)"}
              >
                ✕ Close Map
              </button>

              {/* ── WEATHER + TIME FLOATING OVERLAY ─────────── */}
              <div className="absolute top-4 right-4 z-10 bg-slate-900/80 backdrop-blur-md text-white p-3 rounded-xl shadow-lg border border-slate-700/50 flex gap-4 items-center">
                {/* Weather */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {stateWeatherLoading ? (
                    <span style={{ fontSize: "12px", opacity: 0.7 }}>⏳ Fetching weather…</span>
                  ) : stateWeather?.current_weather ? (
                    <>
                      <span style={{ fontSize: "26px", lineHeight: 1 }}>{getWeatherInfo(stateWeather.current_weather.weathercode).icon}</span>
                      <div>
                        <p style={{ margin: 0, fontSize: "18px", fontWeight: 700, lineHeight: 1 }}>
                          {Math.round(stateWeather.current_weather.temperature * 9 / 5 + 32)}°F
                        </p>
                        <p style={{ margin: "2px 0 0", fontSize: "11px", opacity: 0.6 }}>
                          {getWeatherInfo(stateWeather.current_weather.weathercode).desc}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <span style={{ fontSize: "22px" }}>🌤️</span>
                      <div>
                        <p style={{ margin: 0, fontSize: "13px" }}>Weather</p>
                        <p style={{ margin: 0, fontSize: "11px", opacity: 0.45 }}>
                          {destination ? destination.label : "Search a destination"}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                <div style={{ width: "1px", height: "34px", backgroundColor: "rgba(255,255,255,0.25)", flexShrink: 0 }} />

                {/* Local Time */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ fontSize: "18px" }}>🕐</span>
                  <div>
                    <p style={{ margin: 0, fontSize: "15px", fontWeight: 700, lineHeight: 1 }}>
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", ...(destTimezone ? { timeZone: destTimezone } : {}) })}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", opacity: 0.5 }}>
                      {destTimezone
                        ? (destTimezone.split("/")[1] || destTimezone).replace(/_/g, " ") + " Time"
                        : "Local Time"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Map-type mini toggle */}
              <div style={{
                position: "absolute", top: "10px", left: "10px", zIndex: 10,
                backgroundColor: "rgba(255,255,255,0.93)", backdropFilter: "blur(8px)",
                borderRadius: "8px", padding: "3px",
                boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              }}>
                {[
                  { id: "roadmap",   label: "🛣️ Road"    },
                  { id: "satellite", label: "🛰️ Sat"     },
                  { id: "terrain",   label: "🏔️ Terrain" },
                  { id: "hybrid",    label: "🗺️ Hybrid"  },
                ].map(t => (
                  <button key={t.id} onClick={() => setMapType(t.id)} style={{
                    padding: "6px 10px", borderRadius: "6px", border: "none",
                    background: mapType === t.id ? "#2563eb" : "transparent",
                    color: mapType === t.id ? "white" : "#374151",
                    cursor: "pointer", fontSize: "11px", fontWeight: 500,
                  }}>{t.label}</button>
                ))}
              </div>

              <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={
                    activeChatPlace?.lat ? { lat: activeChatPlace.lat, lng: activeChatPlace.lng } :
                    chatPlaces.length > 0 ? { lat: chatPlaces[0].lat, lng: chatPlaces[0].lng } :
                    selectedPlace?.lat ? { lat: selectedPlace.lat, lng: selectedPlace.lng } :
                    selectedCountry?.lat ? { lat: selectedCountry.lat, lng: selectedCountry.lng } :
                    origin?.lat ? { lat: origin.lat, lng: origin.lng } :
                    { lat: 38.627, lng: -90.1994 }
                  }
                  zoom={
                    activeChatPlace?.lat ? 13 :
                    chatPlaces.length > 0 ? (chatPlaces.length === 1 ? 13 : 6) :
                    selectedPlace?.lat ? 12 :
                    selectedCountry?.lat ? 5 :
                    origin?.lat ? 12 : 4
                  }
                  mapTypeId={mapType}
                  options={{
                    disableDefaultUI: false,
                    zoomControl: true,
                    streetViewControl: true,
                    mapTypeControl: false,
                    fullscreenControl: true,
                  }}
                  onLoad={(m) => { setMapsLoaded(true); setMapInstance(m); }}
                >
                  {/* User origin */}
                  {mapsLoaded && origin?.lat && <Marker position={{ lat: origin.lat, lng: origin.lng }} label="A" />}

                  {/* Country city + place markers */}
                  {mapsLoaded && selectedCountry?.details && !selectedPlace?.lat && (
                    <>
                      {selectedCountry.details.popularCities?.map((city, idx) => (
                        city.lat !== 0 && (
                          <Marker
                            key={`city-${idx}`}
                            position={{ lat: city.lat, lng: city.lng }}
                            title={city.name}
                            onClick={() => setSelectedPlace({ name: city.name, lat: city.lat, lng: city.lng, desc: `Popular city in ${selectedCountry.name}` })}
                            icon={{
                              url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#2563eb"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
                              scaledSize: new window.google.maps.Size(30, 30),
                            }}
                          />
                        )
                      ))}
                      {selectedCountry.details.beautifulPlaces?.map((place, idx) => (
                        place.lat && (
                          <Marker
                            key={`place-${idx}`}
                            position={{ lat: place.lat, lng: place.lng }}
                            title={place.name}
                            onClick={() => setSelectedPlace(place)}
                            icon={{
                              url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#16a34a"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'),
                              scaledSize: new window.google.maps.Size(30, 30),
                            }}
                          />
                        )
                      ))}
                    </>
                  )}

                  {/* Active destination — pulsing pin */}
                  {mapsLoaded && selectedPlace?.lat && (
                    <>
                      <Marker
                        position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                        icon={{
                          url: "data:image/svg+xml," + encodeURIComponent(pulsingPinSVG),
                          scaledSize: new window.google.maps.Size(50, 60),
                          anchor: new window.google.maps.Point(25, 55),
                        }}
                      />
                      <InfoWindow
                        position={{ lat: selectedPlace.lat, lng: selectedPlace.lng }}
                        onCloseClick={() => setSelectedPlace(null)}
                      >
                        <div style={{ padding: "8px", maxWidth: "200px" }}>
                          <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 6px 0", color: "#1f2937" }}>{selectedPlace.name}</h3>
                          <p style={{ fontSize: "12px", margin: 0, color: "#4b5563", lineHeight: 1.4 }}>{selectedPlace.desc}</p>
                        </div>
                      </InfoWindow>
                    </>
                  )}

                  {/* Country-level pulsing pin when no specific place selected */}
                  {mapsLoaded && !selectedPlace?.lat && selectedCountry?.lat && !selectedCountry?.details && (
                    <Marker
                      position={{ lat: selectedCountry.lat, lng: selectedCountry.lng }}
                      icon={{
                        url: "data:image/svg+xml," + encodeURIComponent(pulsingPinSVG),
                        scaledSize: new window.google.maps.Size(50, 60),
                        anchor: new window.google.maps.Point(25, 55),
                      }}
                    />
                  )}

                  {/* AI chat suggested places (orange) */}
                  {mapsLoaded && chatPlaces.map((place, idx) => (
                    <Marker
                      key={`chat-${idx}`}
                      position={{ lat: place.lat, lng: place.lng }}
                      title={place.name}
                      onClick={() => setActiveChatPlace(place)}
                      icon={{
                        url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 24 30"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#f97316" stroke="white" stroke-width="1"/><circle cx="12" cy="9" r="3" fill="white"/></svg>'),
                        scaledSize: new window.google.maps.Size(32, 40),
                      }}
                    />
                  ))}
                  {activeChatPlace && (
                    <InfoWindow
                      position={{ lat: activeChatPlace.lat, lng: activeChatPlace.lng }}
                      onCloseClick={() => setActiveChatPlace(null)}
                    >
                      <div style={{ padding: "8px", maxWidth: "220px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                          <span style={{ fontSize: "16px" }}>🤖</span>
                          <span style={{ fontSize: "11px", color: "#f97316", fontWeight: 600 }}>AI Suggestion</span>
                        </div>
                        <h3 style={{ fontSize: "14px", fontWeight: "bold", margin: "0 0 4px 0", color: "#1f2937" }}>{activeChatPlace.name}</h3>
                        <p style={{ fontSize: "12px", margin: "0 0 4px 0", color: "#4b5563", lineHeight: 1.4 }}>{activeChatPlace.description}</p>
                        <p style={{ fontSize: "11px", margin: 0, color: "#9ca3af" }}>{activeChatPlace.address}</p>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            </div>
          </div>

          {/* ── MAP HIDDEN PLACEHOLDER ───────────────────────── */}
          {!showMap && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 20, textAlign: "center",
              animation: "fadeInScale 0.3s ease forwards",
            }}>
              <div style={{
                backgroundColor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(22px)", WebkitBackdropFilter: "blur(22px)",
                borderRadius: "22px", padding: "38px 48px",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 16px 50px rgba(0,0,0,0.38)",
                display: "flex", flexDirection: "column", alignItems: "center", gap: "14px",
              }}>
                <span style={{ fontSize: "54px", lineHeight: 1 }}>🗺️</span>
                <h2 style={{ color: "white", fontSize: "22px", fontWeight: 700, margin: 0, letterSpacing: "-0.3px" }}>
                  Explore the World
                </h2>
                <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "14px", margin: 0, maxWidth: "240px", lineHeight: 1.55 }}>
                  Search a destination above or tap Show Map to start navigating
                </p>
                <button
                  onClick={() => setShowMap(true)}
                  style={{
                    marginTop: "4px", backgroundColor: "#2563eb", color: "white",
                    padding: "11px 28px", borderRadius: "50px", border: "none",
                    fontSize: "14px", fontWeight: 700, cursor: "pointer",
                    boxShadow: "0 4px 18px rgba(37,99,235,0.55)",
                    display: "flex", alignItems: "center", gap: "8px",
                    transition: "transform 0.15s, box-shadow 0.15s",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.05)"; e.currentTarget.style.boxShadow = "0 6px 24px rgba(37,99,235,0.7)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.boxShadow = "0 4px 18px rgba(37,99,235,0.55)"; }}
                >
                  🗺️ Show Map
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── FOOTER BAR ──────────────────────────────────── */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 30,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", height: "52px",
          backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}>
          {/* GPS status */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{
              width: "8px", height: "8px", borderRadius: "50%",
              backgroundColor: getStatusColor(),
              boxShadow: geolocationStatus === "connected" ? "0 0 6px #22c55e" : "none",
              display: "inline-block",
            }} />
            <span style={{ color: "rgba(255,255,255,0.9)", fontSize: "13px", fontWeight: 500 }}>
              {geolocationStatus === "connected" ? "GPS Connected" :
               geolocationStatus === "searching" ? "Locating…" : "GPS Offline"}
            </span>
            {origin && (
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: "12px" }}>· {origin.label}</span>
            )}
          </div>

          {/* Map toggle */}
          <button
            onClick={() => setShowMap(!showMap)}
            style={{
              display: "flex", alignItems: "center", gap: "6px",
              backgroundColor: showMap ? "rgba(37,99,235,0.8)" : "rgba(255,255,255,0.13)",
              border: `1px solid ${showMap ? "rgba(37,99,235,0.5)" : "rgba(255,255,255,0.22)"}`,
              color: "white", padding: "6px 16px", borderRadius: "20px",
              fontSize: "13px", fontWeight: 600, cursor: "pointer",
              transition: "all 0.25s",
            }}
          >
            {showMap ? "✕ Hide Map" : "🗺️ Show Map"}
          </button>

          {/* Active trip + profile */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {tripPlan && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "rgba(34,197,94,0.18)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "8px", padding: "4px 10px" }}>
                <span style={{ fontSize: "12px" }}>🚗</span>
                <span style={{ color: "#4ade80", fontSize: "12px", fontWeight: 600 }}>Active: {tripPlan.destination}</span>
              </div>
            )}
            <button
              onClick={() => setProfileExpanded(!profileExpanded)}
              style={{
                backgroundColor: profileExpanded ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.13)", border: "1px solid rgba(255,255,255,0.22)",
                color: "white", padding: "5px 14px", borderRadius: "8px",
                fontSize: "12px", fontWeight: 600, cursor: "pointer",
              }}
            >{profileExpanded ? "✕ Close" : "☰ Menu"}</button>
          </div>
        </div>

        {/* ── CHAT PANEL (overlay, top-right) ─────────────── */}
        {showChat && (
          <div style={{
            position: "absolute", top: "66px", right: "16px", zIndex: 40,
            width: `${chatSize.width}px`,
            height: showFullscreenChat ? "calc(100vh - 130px)" : `${chatSize.height}px`,
            backgroundColor: "white", borderRadius: "16px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.35)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            transition: isResizing ? "none" : "all 0.3s ease",
          }}>
            <div style={{ backgroundColor: "#2563eb", padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "24px" }}>🤖</span>
                <div>
                  <p style={{ color: "white", fontWeight: 600, fontSize: "14px", margin: 0 }}>AI Assistant</p>
                  <p style={{ color: "#93c5fd", fontSize: "12px", margin: 0 }}>Online</p>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button onClick={() => setShowFullscreenChat(!showFullscreenChat)}
                  style={{ background: "none", border: "none", color: "white", fontSize: "16px", cursor: "pointer", padding: "4px" }}
                  title={showFullscreenChat ? "Exit Fullscreen" : "Fullscreen"}>
                  {showFullscreenChat ? "⊠" : "⛶"}
                </button>
                <button onClick={() => { setShowChat(false); setShowFullscreenChat(false); }}
                  style={{ background: "none", border: "none", color: "white", fontSize: "20px", cursor: "pointer" }}>✕</button>
              </div>
            </div>
            <div style={{ flex: 1, padding: "12px", overflowY: "auto", backgroundColor: "#f9fafb" }}>
              {chatMessages.map((msg, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", marginBottom: "10px" }}>
                  {msg.role === "assistant" && (
                    <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "6px", flexShrink: 0, fontSize: "14px" }}>✈️</div>
                  )}
                  <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", backgroundColor: msg.role === "user" ? "#2563eb" : "white", color: msg.role === "user" ? "white" : "#1f2937", fontSize: "13px", lineHeight: 1.6, boxShadow: msg.role === "assistant" ? "0 1px 3px rgba(0,0,0,0.1)" : "none", whiteSpace: "pre-wrap" }}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {streamingMessage && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "6px", flexShrink: 0, fontSize: "14px" }}>✈️</div>
                  <div style={{ maxWidth: "80%", padding: "10px 14px", borderRadius: "16px 16px 16px 4px", backgroundColor: "white", color: "#1f2937", fontSize: "13px", lineHeight: 1.6, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", whiteSpace: "pre-wrap" }}>
                    {streamingMessage}<span style={{ display: "inline-block", width: "2px", height: "14px", backgroundColor: "#2563eb", marginLeft: "2px", verticalAlign: "middle", animation: "blink 1s step-end infinite" }}>|</span>
                  </div>
                </div>
              )}
              {isChatLoading && !streamingMessage && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", marginRight: "6px", flexShrink: 0, fontSize: "14px" }}>✈️</div>
                  <div style={{ padding: "12px 16px", borderRadius: "16px 16px 16px 4px", backgroundColor: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", display: "flex", gap: "4px", alignItems: "center" }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", backgroundColor: "#93c5fd", display: "inline-block", animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
            {chatPlaces.length > 0 && (
              <div style={{ borderTop: "1px solid #e5e7eb", background: "#fff7ed", padding: "8px 10px" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: "#f97316", marginBottom: "6px" }}>📍 {chatPlaces.length} place{chatPlaces.length > 1 ? "s" : ""} suggested — tap to view on map</div>
                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                  {chatPlaces.map((place, i) => (
                    <div key={i} onClick={() => setActiveChatPlace(place)}
                      style={{ flexShrink: 0, width: "130px", background: "white", borderRadius: "10px", padding: "8px", cursor: "pointer", border: "1.5px solid #fed7aa", boxShadow: "0 1px 4px rgba(249,115,22,0.15)", transition: "transform 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
                      onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                    >
                      <div style={{ fontSize: "18px", marginBottom: "3px" }}>🗺️</div>
                      <div style={{ fontSize: "12px", fontWeight: 600, color: "#1f2937", marginBottom: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</div>
                      <div style={{ fontSize: "10px", color: "#6b7280", lineHeight: 1.3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{place.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px" }}>
              <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
                onKeyPress={e => e.key === "Enter" && handleSendChat()}
                placeholder="Ask about your trip..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: "24px", border: "1px solid #d1d5db", fontSize: "13px", outline: "none" }}
              />
              <button onClick={handleSendChat} disabled={isChatLoading || !chatInput.trim()}
                style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: isChatLoading || !chatInput.trim() ? "#93c5fd" : "#2563eb", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "white", fontSize: "16px" }}>➤</span>
              </button>
            </div>
            {!showFullscreenChat && (
              <div onMouseDown={e => { e.preventDefault(); setIsResizing(true); }}
                style={{ position: "absolute", bottom: 0, right: 0, width: "20px", height: "20px", cursor: "nwse-resize", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#e5e7eb", borderBottomRightRadius: "16px" }}>
                <span style={{ fontSize: "10px", color: "#9ca3af" }}>⤡</span>
              </div>
            )}
          </div>
        )}

        {/* ── LEFT SIDEBAR ────────────────────────────────── */}
        <div style={{
          position: "absolute", top: "58px", bottom: "52px", left: 0, zIndex: 25,
          width: "272px", backgroundColor: "white",
          boxShadow: "4px 0 24px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
          transform: profileExpanded ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          willChange: "transform",
        }}>
          {/* Sidebar header */}
          <div style={{ padding: "10px 14px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#1f2937" }}>Navigation</span>
            <button onClick={() => setProfileExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9ca3af", lineHeight: 1 }}>✕</button>
          </div>

          {/* Tab bar */}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", flexShrink: 0 }}>
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1, padding: "10px 4px", fontSize: "11px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: "3px",
                  background: "none", border: "none", cursor: "pointer",
                  color: activeTab === tab.id ? "#2563eb" : "#6b7280",
                  borderBottom: activeTab === tab.id ? "2px solid #2563eb" : "2px solid transparent",
                  fontWeight: activeTab === tab.id ? 600 : 400,
                  transition: "color 0.15s",
                }}>
                <span style={{ fontSize: "16px", position: "relative", display: "inline-block" }}>
                  {tab.icon}
                  {tab.id === "history" && travelHistory.length > 0 && (
                    <span style={{
                      position: "absolute", top: "-4px", right: "-9px",
                      backgroundColor: "#2563eb", color: "white",
                      borderRadius: "50%", fontSize: "9px",
                      width: "15px", height: "15px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: 700, lineHeight: 1,
                    }}>
                      {travelHistory.length > 9 ? "9+" : travelHistory.length}
                    </span>
                  )}
                </span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* ── SAVED PLACES ── */}
            {activeTab === "saved" && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                {selectedPlace && !savedPlaces.some(p => p.name === selectedPlace.name) && (
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #f3f4f6", backgroundColor: "#f0fdf4" }}>
                    <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>📍 Current selection</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", color: "#1f2937", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{selectedPlace.name}</span>
                      <button
                        onClick={() => setSavedPlaces(prev => [...prev, { ...selectedPlace, savedAt: new Date().toLocaleDateString() }])}
                        style={{ backgroundColor: "#22c55e", color: "white", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", border: "none", cursor: "pointer", fontWeight: 600, flexShrink: 0 }}>
                        Save
                      </button>
                    </div>
                  </div>
                )}
                {savedPlaces.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <p style={{ fontSize: "28px", margin: "0 0 8px" }}>📍</p>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>No saved places yet</p>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0" }}>Select a spot on the map, then tap Save</p>
                  </div>
                ) : (
                  <div style={{ padding: "8px" }}>
                    {savedPlaces.map((place, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px", borderRadius: "10px", marginBottom: "4px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                        <span style={{ fontSize: "18px", flexShrink: 0 }}>📍</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#1f2937", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{place.name}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#9ca3af" }}>Saved {place.savedAt}</p>
                        </div>
                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                          <button onClick={() => handlePlaceSelect(place)} style={{ border: "1px solid #d1d5db", borderRadius: "6px", padding: "3px 8px", fontSize: "11px", cursor: "pointer", color: "#2563eb", background: "white" }}>Go</button>
                          <button onClick={() => setSavedPlaces(prev => prev.filter((_, j) => j !== i))} style={{ background: "none", border: "none", padding: "3px 5px", cursor: "pointer", color: "#9ca3af", fontSize: "14px" }}>✕</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── TRAVEL HISTORY ── */}
            {activeTab === "history" && (
              <div style={{ display: "flex", flexDirection: "column" }}>

                {/* Save current destination */}
                {destination && (
                  <div style={{ padding: "10px 12px", borderBottom: "1px solid #e5e7eb", backgroundColor: "#f0fdf4", flexShrink: 0 }}>
                    <p style={{ margin: "0 0 6px", fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>Current destination</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "13px", color: "#1f2937", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {selectedCountry.flag} {destination.label}
                      </span>
                      <button
                        onClick={handleSaveTrip}
                        style={{
                          backgroundColor: tripSaved ? "#16a34a" : "#22c55e",
                          color: "white", padding: "5px 12px", borderRadius: "8px",
                          fontSize: "11px", border: "none", cursor: "pointer", fontWeight: 700,
                          flexShrink: 0, transition: "background-color 0.25s ease",
                          whiteSpace: "nowrap",
                        }}>
                        {tripSaved ? "✓ Saved!" : "Save to History"}
                      </button>
                    </div>
                  </div>
                )}

                {travelHistory.length === 0 ? (
                  <div style={{ padding: "40px 20px", textAlign: "center" }}>
                    <p style={{ fontSize: "28px", margin: "0 0 8px" }}>📜</p>
                    <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>No trips yet</p>
                    <p style={{ fontSize: "11px", color: "#9ca3af", margin: "4px 0 0" }}>Start a trip to see it logged here</p>
                  </div>
                ) : (
                  <div style={{ padding: "8px" }}>
                    {travelHistory.map(trip => (
                      <div key={trip.id} style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: "6px", backgroundColor: "#f9fafb", border: "1px solid #e5e7eb" }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "13px", fontWeight: 600, color: "#1f2937" }}>
                            {modes.find(m => m.id === trip.mode)?.icon || "✈️"} {trip.destination}
                          </span>
                          <span style={{ fontSize: "10px", color: "#9ca3af" }}>{trip.date}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: "11px", color: "#6b7280" }}>From: {trip.origin}</p>
                      </div>
                    ))}
                    <button onClick={() => setTravelHistory([])}
                      style={{ width: "100%", marginTop: "4px", padding: "7px", border: "1px solid #fee2e2", borderRadius: "8px", backgroundColor: "white", color: "#ef4444", fontSize: "12px", cursor: "pointer" }}>
                      Clear History
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── PREFERENCES ── */}
            {activeTab === "settings" && (
              <div style={{ padding: "14px", display: "flex", flexDirection: "column", gap: "18px" }}>

                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Default Transit Mode</p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                    {modes.map(mode => (
                      <button key={mode.id}
                        onClick={() => { setDefaultTransitMode(mode.id); setSelectedMode(mode.id); }}
                        style={{
                          padding: "10px 8px", borderRadius: "10px", border: "none", cursor: "pointer",
                          display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
                          backgroundColor: defaultTransitMode === mode.id ? "#eff6ff" : "#f9fafb",
                          outline: defaultTransitMode === mode.id ? "2px solid #2563eb" : "2px solid transparent",
                          fontSize: "12px", fontWeight: defaultTransitMode === mode.id ? 700 : 400,
                          color: defaultTransitMode === mode.id ? "#1d4ed8" : "#4b5563",
                          transition: "all 0.15s",
                        }}>
                        <span style={{ fontSize: "20px" }}>{mode.icon}</span>
                        <span>{mode.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Location</p>
                  <button onClick={requestGeolocation}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", backgroundColor: origin ? "#f0fdf4" : "white", cursor: "pointer", fontSize: "13px", display: "flex", alignItems: "center", gap: "8px", color: origin ? "#16a34a" : "#374151", textAlign: "left" }}>
                    <span>📍</span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{origin ? `Connected · ${origin.label}` : "Use Current Location"}</span>
                  </button>
                </div>

                <div>
                  <p style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: 700, color: "#374151", textTransform: "uppercase", letterSpacing: "0.06em" }}>Display</p>
                  <button onClick={() => setIsFullscreen(!isFullscreen)}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: "10px", border: "1px solid #d1d5db", backgroundColor: "white", cursor: "pointer", fontSize: "13px", textAlign: "left", display: "flex", alignItems: "center", gap: "8px", color: "#374151" }}>
                    <span>{isFullscreen ? "⊠" : "⛶"}</span>
                    <span>{isFullscreen ? "Exit Fullscreen" : "Fullscreen Mode"}</span>
                  </button>
                </div>

              </div>
            )}

          </div>
        </div>

        {/* ── COUNTRY DETAILS PANEL (overlay) ─────────────── */}
        {showCountryDetails && selectedCountry.details && (
          <div style={{ position: "absolute", top: "70px", left: "50%", transform: "translateX(-50%)", zIndex: 35, width: "90%", maxWidth: "600px", maxHeight: "80vh", overflowY: "auto", backgroundColor: "white", borderRadius: "16px", boxShadow: "0 20px 40px rgba(0,0,0,0.35)" }}>
            <div style={{ padding: "20px" }}>
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

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🏙️ Popular Cities <span style={{ fontSize: "12px", fontWeight: 400, color: "#6b7280" }}>(Click to view on map)</span></h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedCountry.details.popularCities.map((city, idx) => (
                    <span key={idx} onClick={() => handlePlaceSelect({ name: city.name, lat: city.lat, lng: city.lng, desc: `Popular city in ${selectedCountry.name}` })}
                      style={{ backgroundColor: "#f3f4f6", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", color: "#374151", cursor: "pointer" }}>
                      {city.name}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🏛️ Beautiful Places <span style={{ fontSize: "12px", fontWeight: 400, color: "#6b7280" }}>(Click to view on map)</span></h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                  {selectedCountry.details.beautifulPlaces.map((place, idx) => (
                    <div key={idx} onClick={() => handlePlaceSelect(place)}
                      style={{ position: "relative", borderRadius: "12px", overflow: "hidden", height: "100px", cursor: place.lat ? "pointer" : "default", border: selectedPlace?.name === place.name ? "3px solid #2563eb" : "none" }}>
                      <img src={place.image || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&q=80"} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.7))", padding: "8px" }}>
                        <p style={{ fontSize: "12px", color: "white", fontWeight: 500, margin: 0 }}>{place.name}</p>
                        {place.desc && <p style={{ fontSize: "10px", color: "#e5e7eb", margin: "2px 0 0 0" }}>{place.desc.substring(0, 40)}...</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🍽️ Popular Dishes</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {selectedCountry.details.popularDishes.map((dish, idx) => (
                    <span key={idx} style={{ backgroundColor: "#fce7f3", padding: "6px 12px", borderRadius: "16px", fontSize: "13px", color: "#9d174d" }}>{dish}</span>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: "10px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "12px" }}>🌿 Natural Beauty</h3>
                <div style={{ backgroundColor: "#f0fdf4", padding: "12px", borderRadius: "12px" }}>
                  <p style={{ fontSize: "14px", color: "#166534", margin: 0, lineHeight: 1.6 }}>{selectedCountry.details.naturalBeauty}</p>
                </div>
              </div>

              {selectedCountry.details.bestTimeToVisit && (() => {
                const { byMonth, tip } = selectedCountry.details.bestTimeToVisit;
                const ratingConfig = {
                  best:  { bg: "#dcfce7", bar: "#16a34a", label: "Best",  dot: "#16a34a" },
                  good:  { bg: "#fef9c3", bar: "#ca8a04", label: "Good",  dot: "#ca8a04" },
                  fair:  { bg: "#ffedd5", bar: "#ea580c", label: "Fair",  dot: "#ea580c" },
                  avoid: { bg: "#fee2e2", bar: "#dc2626", label: "Avoid", dot: "#dc2626" },
                };
                return (
                  <div style={{ marginBottom: "10px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>🌤️ Best Time to Visit</h3>
                    <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 14px" }}>{tip}</p>
                    <div style={{ display: "flex", gap: "12px", marginBottom: "12px", flexWrap: "wrap" }}>
                      {Object.entries(ratingConfig).map(([key, cfg]) => (
                        <div key={key} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: cfg.dot, display: "inline-block" }}></span>
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>{cfg.label}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "6px", marginBottom: "14px" }}>
                      {byMonth.map((m, idx) => {
                        const cfg = ratingConfig[m.rating];
                        const isHovered = hoveredMonth === idx;
                        return (
                          <div key={idx}
                            onMouseEnter={() => setHoveredMonth(idx)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            style={{ backgroundColor: isHovered ? cfg.bar : cfg.bg, borderRadius: "10px", padding: "8px 4px", textAlign: "center", cursor: "default", transition: "all 0.15s", border: `1px solid ${cfg.bar}33` }}>
                            <div style={{ fontSize: "16px", marginBottom: "2px" }}>{m.icon}</div>
                            <div style={{ fontSize: "11px", fontWeight: 700, color: isHovered ? "white" : "#374151" }}>{m.month}</div>
                            <div style={{ fontSize: "9px", color: isHovered ? "#e5e7eb" : cfg.dot, fontWeight: 600, textTransform: "uppercase" }}>{cfg.label}</div>
                          </div>
                        );
                      })}
                    </div>
                    {hoveredMonth !== null && (() => {
                      const m = byMonth[hoveredMonth];
                      const cfg = ratingConfig[m.rating];
                      return (
                        <div style={{ backgroundColor: "#f9fafb", border: `1px solid ${cfg.bar}44`, borderRadius: "12px", padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "20px" }}>{m.icon}</span>
                            <div>
                              <span style={{ fontWeight: 700, fontSize: "14px", color: "#111827" }}>{m.month}</span>
                              <span style={{ marginLeft: "8px", fontSize: "12px", color: "#6b7280" }}>Avg {m.temp}</span>
                              <span style={{ marginLeft: "8px", fontSize: "11px", backgroundColor: cfg.bg, color: cfg.dot, padding: "2px 8px", borderRadius: "99px", fontWeight: 600 }}>{cfg.label}</span>
                            </div>
                          </div>
                          <p style={{ fontSize: "13px", color: "#374151", margin: 0, lineHeight: 1.5 }}>{m.desc}</p>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              {(selectedCountry.details.states || selectedCountry.details.provinces) && (
                <div style={{ marginTop: "16px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: "600", color: "#1f2937", marginBottom: "4px" }}>
                    🗺️ {selectedCountry.code === "CA" ? "Explore Provinces & Territories" : "Explore All 50 States"}
                  </h3>
                  <p style={{ fontSize: "12px", color: "#6b7280", margin: "0 0 10px" }}>Click any region to see live current weather</p>
                  <input type="text" placeholder={`🔍 Search ${selectedCountry.code === "CA" ? "provinces" : "states"}...`} value={stateSearch}
                    onChange={e => setStateSearch(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "13px", marginBottom: "10px", boxSizing: "border-box", outline: "none" }} />
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", maxHeight: "180px", overflowY: "auto", marginBottom: "12px" }}>
                    {(selectedCountry.details.states || selectedCountry.details.provinces)
                      .filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()))
                      .map(state => (
                        <button key={state.code} onClick={() => handleStateSelect(state)}
                          style={{ padding: "5px 10px", borderRadius: "20px", border: "1px solid", borderColor: selectedState?.code === state.code ? "#2563eb" : "#d1d5db", backgroundColor: selectedState?.code === state.code ? "#eff6ff" : "#f9fafb", color: selectedState?.code === state.code ? "#1d4ed8" : "#374151", fontSize: "12px", fontWeight: selectedState?.code === state.code ? 700 : 400, cursor: "pointer", transition: "all 0.15s" }}>
                          {state.name}
                        </button>
                      ))}
                  </div>
                  {selectedState && (
                    <div style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "16px", overflow: "hidden" }}>
                      <div style={{ background: "linear-gradient(135deg, #1e40af, #3b82f6)", padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <p style={{ color: "white", fontWeight: 700, fontSize: "16px", margin: 0 }}>{selectedState.name}</p>
                          <p style={{ color: "#bfdbfe", fontSize: "12px", margin: "2px 0 0" }}>Capital: {selectedState.capital}</p>
                        </div>
                        <button onClick={() => { setSelectedState(null); setStateWeather(null); }} style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: "26px", height: "26px", cursor: "pointer", fontSize: "13px" }}>✕</button>
                      </div>
                      <div style={{ padding: "14px 16px" }}>
                        {stateWeatherLoading && <div style={{ textAlign: "center", padding: "20px", color: "#6b7280", fontSize: "14px" }}>⏳ Fetching live weather...</div>}
                        {!stateWeatherLoading && stateWeather?.error && <p style={{ color: "#dc2626", fontSize: "13px", textAlign: "center", padding: "12px 0" }}>⚠️ Could not fetch weather. Check your connection.</p>}
                        {!stateWeatherLoading && stateWeather?.current_weather && (
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px", padding: "12px", backgroundColor: "white", borderRadius: "12px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
                              <span style={{ fontSize: "48px", lineHeight: 1 }}>{getWeatherInfo(stateWeather.current_weather.weathercode).icon}</span>
                              <div>
                                <p style={{ fontSize: "28px", fontWeight: 800, color: "#111827", margin: 0 }}>{Math.round(stateWeather.current_weather.temperature * 9 / 5 + 32)}°F</p>
                                <p style={{ fontSize: "13px", color: "#6b7280", margin: "2px 0 0" }}>{getWeatherInfo(stateWeather.current_weather.weathercode).desc} · {stateWeather.current_weather.is_day ? "Daytime" : "Nighttime"}</p>
                              </div>
                              <div style={{ marginLeft: "auto", textAlign: "right" }}>
                                <p style={{ fontSize: "12px", color: "#374151", margin: 0 }}>💨 {stateWeather.current_weather.windspeed} km/h</p>
                                {stateWeather.daily?.precipitation_sum && <p style={{ fontSize: "12px", color: "#374151", margin: "4px 0 0" }}>🌧️ {stateWeather.daily.precipitation_sum[0]} mm</p>}
                              </div>
                            </div>
                            {stateWeather.daily && (
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                                <div style={{ backgroundColor: "#fef3c7", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                                  <p style={{ fontSize: "11px", color: "#92400e", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today High</p>
                                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#b45309", margin: 0 }}>{stateWeather.daily.temperature_2m_max ? Math.round(stateWeather.daily.temperature_2m_max[0] * 9 / 5 + 32) + "°F" : "—"}</p>
                                </div>
                                <div style={{ backgroundColor: "#eff6ff", borderRadius: "10px", padding: "10px", textAlign: "center" }}>
                                  <p style={{ fontSize: "11px", color: "#1e40af", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Today Low</p>
                                  <p style={{ fontSize: "18px", fontWeight: 700, color: "#2563eb", margin: 0 }}>{stateWeather.daily.temperature_2m_min ? Math.round(stateWeather.daily.temperature_2m_min[0] * 9 / 5 + 32) + "°F" : "—"}</p>
                                </div>
                              </div>
                            )}
                            <div style={{ backgroundColor: "#f0fdf4", borderRadius: "10px", padding: "10px 12px", marginBottom: "10px" }}>
                              <p style={{ fontSize: "12px", color: "#166534", fontWeight: 600, margin: "0 0 6px" }}>🗓️ Best Months to Visit</p>
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                                {selectedState.bestMonths.map(m => (
                                  <span key={m} style={{ backgroundColor: "#16a34a", color: "white", padding: "3px 10px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}>{m}</span>
                                ))}
                              </div>
                            </div>
                            <p style={{ fontSize: "13px", color: "#374151", margin: "0 0 12px", lineHeight: 1.5 }}>{selectedState.desc}</p>
                            <button onClick={() => handlePlaceSelect({ name: selectedState.name, lat: selectedState.lat, lng: selectedState.lng, desc: selectedState.desc })}
                              style={{ width: "100%", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>
                              🗺️ View {selectedState.name} on Map
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── TRANSPORT INFO PANEL (bottom-centre overlay) ─── */}
        {selectedPlace?.lat && (
          <div style={{ position: "absolute", bottom: "64px", left: "50%", transform: "translateX(-50%)", zIndex: 25, width: "min(480px, 92vw)", backgroundColor: "white", borderRadius: "20px", boxShadow: "0 8px 32px rgba(0,0,0,0.3)", overflow: "hidden" }}>
            <div style={{ background: "linear-gradient(135deg, #1d4ed8, #2563eb)", padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <p style={{ color: "white", fontWeight: 700, fontSize: "15px", margin: 0 }}>📍 {selectedPlace.name}</p>
                <p style={{ color: "#bfdbfe", fontSize: "12px", margin: "2px 0 0" }}>{origin?.lat ? `From: ${origin.label}` : "Enable location for live distances"}</p>
              </div>
              <button onClick={() => { setSelectedPlace(null); setTransportInfo(null); }}
                style={{ background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: "28px", height: "28px", cursor: "pointer", fontSize: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {transportLoading && <div style={{ textAlign: "center", padding: "16px 0", color: "#6b7280", fontSize: "13px" }}>⏳ Calculating routes...</div>}
              {!transportLoading && transportInfo?.noLocation && (
                <div style={{ textAlign: "center", padding: "12px 0" }}>
                  <p style={{ color: "#6b7280", fontSize: "13px", margin: 0 }}>📍 Allow location access to see live distances & times</p>
                  <button onClick={requestGeolocation} style={{ marginTop: "10px", backgroundColor: "#2563eb", color: "white", border: "none", borderRadius: "8px", padding: "8px 18px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Enable Location</button>
                </div>
              )}
              {!transportLoading && transportInfo && !transportInfo.noLocation && (() => {
                const rideApp = getLocalRideApp(selectedCountry?.code);
                const uberUrl = `https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${selectedPlace.lat}&dropoff[longitude]=${selectedPlace.lng}&dropoff[nickname]=${encodeURIComponent(selectedPlace.name)}`;
                const rows = [
                  { mode: "walking",   icon: "🚶", label: "Walk",    color: "#16a34a" },
                  { mode: "driving",   icon: "🚗", label: "Drive",   color: "#2563eb" },
                  { mode: "transit",   icon: "🚌", label: "Transit", color: "#7c3aed" },
                  { mode: "bicycling", icon: "🚴", label: "Bike",    color: "#d97706" },
                ];
                return (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "14px" }}>
                      {rows.map(({ mode, icon, label, color }) => {
                        const info = transportInfo[mode];
                        return (
                          <div key={mode} style={{ backgroundColor: "#f9fafb", borderRadius: "12px", padding: "10px 12px", border: "1px solid #e5e7eb" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                              <span style={{ fontSize: "16px" }}>{icon}</span>
                              <span style={{ fontSize: "12px", fontWeight: 700, color }}>{label}</span>
                            </div>
                            {info ? (
                              <>
                                <p style={{ fontSize: "15px", fontWeight: 700, color: "#111827", margin: 0 }}>{info.duration}</p>
                                <p style={{ fontSize: "11px", color: "#6b7280", margin: "2px 0 0" }}>{info.distance}</p>
                              </>
                            ) : (
                              <p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Not available</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ borderTop: "1px solid #f3f4f6", paddingTop: "12px" }}>
                      <p style={{ fontSize: "11px", color: "#9ca3af", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Book a ride</p>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <a href={uberUrl} target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: "#000", color: "white", borderRadius: "10px", padding: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>🚖 Uber</a>
                        {rideApp.name !== "Uber" && (
                          <a href={rideApp.url} target="_blank" rel="noopener noreferrer"
                            style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: rideApp.color, color: "white", borderRadius: "10px", padding: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>🚖 {rideApp.name}</a>
                        )}
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.lat},${selectedPlace.lng}&travelmode=transit`} target="_blank" rel="noopener noreferrer"
                          style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", backgroundColor: "#4285f4", color: "white", borderRadius: "10px", padding: "10px", textDecoration: "none", fontSize: "13px", fontWeight: 600 }}>🗺️ Maps</a>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── PRINTABLE TRIP PLAN ──────────────────────────── */}
        {tripPlan && (
          <div className="printable-area" style={{ display: "none" }}>
            <div style={{ padding: "40px", fontFamily: "Arial, sans-serif" }}>
              <h1 style={{ fontSize: "28px", color: "#1f2937", marginBottom: "20px", borderBottom: "2px solid #2563eb", paddingBottom: "10px" }}>✈️ Travel Plan</h1>
              <div style={{ marginBottom: "20px" }}><p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Trip Date</p><p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>{tripPlan.date}</p></div>
              <div style={{ marginBottom: "20px" }}><p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>From</p><p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>📍 {tripPlan.origin}</p></div>
              <div style={{ marginBottom: "20px" }}><p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>To</p><p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>🏁 {tripPlan.destination}</p></div>
              <div style={{ marginBottom: "20px" }}><p style={{ fontSize: "14px", color: "#6b7280", margin: 0 }}>Transport Mode</p><p style={{ fontSize: "18px", color: "#1f2937", fontWeight: "bold", margin: 0 }}>{tripPlan.mode === "drive" && "🚗 Driving"}{tripPlan.mode === "transit" && "🚇 Transit"}{tripPlan.mode === "walk" && "🚶 Walking"}{tripPlan.mode === "bike" && "🚴 Cycling"}</p></div>
              {selectedCountry.details && (
                <div style={{ marginTop: "30px" }}>
                  <h2 style={{ fontSize: "20px", color: "#1f2937", marginBottom: "15px" }}>📋 Destination Info</h2>
                  <div style={{ marginBottom: "15px" }}><p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 5px 0" }}>Popular Cities</p><p style={{ fontSize: "14px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.popularCities?.map(c => c.name).join(", ")}</p></div>
                  <div style={{ marginBottom: "15px" }}><p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 5px 0" }}>Must-Try Dishes</p><p style={{ fontSize: "14px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.popularDishes?.join(", ")}</p></div>
                  <div><p style={{ fontSize: "14px", color: "#6b7280", margin: "0 0 5px 0" }}>Natural Beauty</p><p style={{ fontSize: "14px", color: "#1f2937", margin: 0 }}>{selectedCountry.details.naturalBeauty}</p></div>
                </div>
              )}
              <div style={{ marginTop: "40px", paddingTop: "20px", borderTop: "1px solid #e5e7eb", textAlign: "center" }}><p style={{ fontSize: "12px", color: "#9ca3af", margin: 0 }}>Generated by Travel Assistant</p></div>
            </div>
          </div>
        )}

        {/* ── FULLSCREEN EXIT ──────────────────────────────── */}
        {isFullscreen && (
          <button onClick={() => setIsFullscreen(false)}
            style={{ position: "fixed", top: "16px", right: "16px", zIndex: 10000, display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#ef4444", padding: "10px 18px", borderRadius: "24px", border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.3)", fontSize: "14px", fontWeight: 600, color: "white" }}>
            ⊠ Exit Fullscreen
          </button>
        )}

      </div>
    </>
  );
}
