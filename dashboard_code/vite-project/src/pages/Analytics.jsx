// src/pages/Analytics.jsx
import { useState } from "react";

export default function Analytics() {
  // Example data (replace later with backend data if needed)
  const [visited, setVisited] = useState([
    {
      country: "Japan",
      state: "",
      city: "Tokyo",
      places: ["Shibuya Crossing", "Tokyo Tower"],
    },
    {
      country: "USA",
      state: "Illinois",
      city: "St. Charles",
      places: ["Downtown", "Main Street", "Alton"],
    },
  ]);

  const [wishlist, setWishlist] = useState([
    {
      country: "France",
      state: "",
      city: "Paris",
      places: ["Eiffel Tower", "Louvre Museum"],
    },
    {
      country: "Australia",
      state: "NSW",
      city: "Sydney",
      places: ["Opera House", "Harbour Bridge"],
    },
  ]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Travel Analytics 🧭</h2>

      {/* VISITED TRIPS */}
      <section className="mb-8">
        <h3 className="text-xl font-semibold text-blue-700 mb-4">
          Visited Trips 🌍
        </h3>

        {visited.length === 0 ? (
          <p className="text-gray-500">No visited trips yet.</p>
        ) : (
          <ul className="space-y-4">
            {visited.map((trip, i) => (
              <li
                key={i}
                className="border border-gray-200 rounded-lg p-4 bg-blue-50"
              >
                <h4 className="font-semibold text-lg">
                  {trip.country}
                  {trip.state ? ` → ${trip.state}` : ""} → {trip.city}
                </h4>
                <ul className="ml-6 mt-2 list-disc text-gray-700">
                  {trip.places.map((place, j) => (
                    <li key={j}>{place}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* WISHLIST SECTION */}
      <section>
        <h3 className="text-xl font-semibold text-green-700 mb-4">
          Wishlist ✨
        </h3>

        {wishlist.length === 0 ? (
          <p className="text-gray-500">No wishlist items yet.</p>
        ) : (
          <ul className="space-y-4">
            {wishlist.map((trip, i) => (
              <li
                key={i}
                className="border border-gray-200 rounded-lg p-4 bg-green-50"
              >
                <h4 className="font-semibold text-lg">
                  {trip.country}
                  {trip.state ? ` → ${trip.state}` : ""} → {trip.city}
                </h4>
                <ul className="ml-6 mt-2 list-disc text-gray-700">
                  {trip.places.map((place, j) => (
                    <li key={j}>{place}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
