import { useState, useEffect } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";

export default function Home() {
  const [activeTrip, setActiveTrip] = useState({
    country: "United States",
    state: "Illinois",
    city: "St. Louis",
    places: [
      { name: "St. Charles", lat: 38.7881, lng: -90.4974 },
      { name: "Grafton", lat: 38.9731, lng: -90.4318 },
      { name: "Alton", lat: 38.8906, lng: -90.1843 },
    ],
  });

  const [origin] = useState("St. Louis, Illinois");
  const [distance, setDistance] = useState("");
  const [duration, setDuration] = useState("");
  const [newPlace, setNewPlace] = useState("");

  const center = { lat: 38.627, lng: -90.1994 };
  const mapContainerStyle = { width: "100%", height: "400px" };

  useEffect(() => {
    if (!window.google || !activeTrip.places.length) return;

    const destination =
      activeTrip.places[activeTrip.places.length - 1].name + ", " + activeTrip.state;

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: "DRIVING",
      },
      (result, status) => {
        if (status === "OK") {
          const element = result.rows[0].elements[0];
          if (element.status === "OK") {
            setDistance(element.distance.text);
            setDuration(element.duration.text);
          }
        }
      }
    );
  }, [activeTrip, origin]);

  const handleAddPlace = () => {
    if (!newPlace.trim()) return;
    setActiveTrip((prev) => ({
      ...prev,
      places: [...prev.places, { name: newPlace }],
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
    <div className="p-6 bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Active Trip Dashboard 🌍</h2>

      <div className="mb-4">
        <p>
          <strong>Country:</strong> {activeTrip.country}
        </p>
        <p>
          <strong>State:</strong> {activeTrip.state}
        </p>
        <p>
          <strong>City:</strong> {activeTrip.city}
        </p>
      </div>

      <h3 className="text-xl font-semibold mb-2">Places to Visit 🏙️</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {activeTrip.places.map((place, index) => (
          <div
            key={index}
            className="border rounded-lg p-3 bg-gray-50 shadow-sm relative"
          >
            <img
              src={`https://source.unsplash.com/200x120/?${place.name}`}
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

      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="text-xl font-semibold mb-3">Live Map & Distance 🗺️</h3>
        <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
          <GoogleMap mapContainerStyle={mapContainerStyle} center={center} zoom={9}>
            {activeTrip.places.map((place, idx) => (
              <Marker key={idx} position={{ lat: place.lat, lng: place.lng }} />
            ))}
          </GoogleMap>
        </LoadScript>

        <p className="mt-4 text-gray-700">
          <strong>Current Distance:</strong> {distance || "Calculating..."} <br />
          <strong>Estimated Travel Time:</strong> {duration || "Calculating..."}
        </p>
      </div>
    </div>
  );
}
