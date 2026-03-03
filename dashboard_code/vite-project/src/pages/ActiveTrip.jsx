// src/pages/ActiveTrip.jsx
import { useEffect, useState } from "react";
import { GoogleMap, LoadScript, DirectionsService, DirectionsRenderer } from "@react-google-maps/api";

export default function ActiveTrip() {
  const [activeTrip, setActiveTrip] = useState({
    country: "USA",
    state: "Illinois",
    city: "St. Louis",
    places: [
      { name: "St. Charles", image: "https://source.unsplash.com/200x120/?city" },
      { name: "Grafton", image: "https://source.unsplash.com/200x120/?river" },
      { name: "Alton", image: "https://source.unsplash.com/200x120/?bridge" },
    ],
  });

  const [newPlace, setNewPlace] = useState("");
  const [directions, setDirections] = useState(null);
  const [origin, setOrigin] = useState("St. Louis");
  const [destination, setDestination] = useState("");
  const [travelTime, setTravelTime] = useState("");
  const [showMap, setShowMap] = useState(false);

  const mapContainerStyle = {
    width: "100%",
    height: "400px",
  };

  // 🧭 Calculate route and time when user selects destination
  const calculateRoute = () => {
    if (!origin || !destination) return;
    setDirections(null);
  };

  const handleAddPlace = () => {
    if (newPlace.trim() === "") return;
    setActiveTrip((prev) => ({
      ...prev,
      places: [...prev.places, { name: newPlace, image: "https://source.unsplash.com/200x120/?travel" }],
    }));
    setNewPlace("");
  };

  const handleRemovePlace = (placeName) => {
    setActiveTrip((prev) => ({
      ...prev,
      places: prev.places.filter((p) => p.name !== placeName),
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Active Trip 🌍</h2>

      <div className="mb-4">
        <p className="text-lg font-semibold">
          Country: <span className="text-blue-600">{activeTrip.country}</span>
        </p>
        <p className="text-lg font-semibold">
          State: <span className="text-blue-600">{activeTrip.state}</span>
        </p>
        <p className="text-lg font-semibold">
          City: <span className="text-blue-600">{activeTrip.city}</span>
        </p>
      </div>

      <h3 className="text-xl font-semibold mb-3">Places to Visit 🏙️</h3>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {activeTrip.places.map((place, index) => (
          <div key={index} className="border rounded-lg p-3 bg-gray-50 shadow-sm relative">
            <img
              src={place.image}
              alt={place.name}
              className="rounded-md mb-2 w-full h-24 object-cover"
            />
            <p className="font-medium text-gray-800">{place.name}</p>
            <button
              onClick={() => handleRemovePlace(place.name)}
              className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Add new place input */}
      <div className="flex gap-3 mb-6">
        <input
          type="text"
          placeholder="Add new place..."
          value={newPlace}
          onChange={(e) => setNewPlace(e.target.value)}
          className="border rounded-lg px-4 py-2 flex-grow"
        />
        <button
          onClick={handleAddPlace}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <button
        onClick={() => setShowMap(!showMap)}
        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
      >
        {showMap ? "Hide Map" : "🗺️ Show Map"}
      </button>

      {showMap && (
        <div className="bg-gray-100 p-4 rounded-lg mt-4">
          <h3 className="text-xl font-semibold mb-3">Live Map & Distance 🗺️</h3>

          <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={{ lat: 38.627, lng: -90.1994 }}
              zoom={8}
            >
              {directions && <DirectionsRenderer directions={directions} />}
            </GoogleMap>
          </LoadScript>

          <p className="mt-3 text-gray-700">
            <strong>Current Distance:</strong>{" "}
            {travelTime ? travelTime : "Calculating..."}
          </p>
        </div>
      )}
    </div>
  );
}
