import React from "react";
import TripCard from "./TripCard";

export default function ActiveTrip() {
  const trip = {
    country: "South Korea",
    state: "Gyeonggi",
    city: "Seoul",
    totalDistance: "381 km",
    totalTime: "5 hr 10 min",
    places: [
      {
        name: "Sinsa-dong",
        image: "https://images.unsplash.com/photo-1500048993953-d23a436266cf",
        distance: 18,
        time: "30 min",
      },
      {
        name: "Busan",
        image: "https://images.unsplash.com/photo-1583403971276-263f9b1e013f",
        distance: 325,
        time: "3 hr 30 min",
      },
      {
        name: "Incheon",
        image: "https://images.unsplash.com/photo-1599586120421-5f8f7b3cc7ea",
        distance: 38,
        time: "1 hr 10 min",
      },
    ],
  };

  return (
    <div className="flex-1 p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4">Active Trip</h1>
      <p className="text-gray-600 mb-6">
        {trip.country} → {trip.state} → {trip.city}
      </p>

      <div className="space-y-4">
        {trip.places.map((place, index) => (
          <TripCard key={index} place={place} />
        ))}
      </div>

      <div className="mt-6 bg-white p-4 rounded-xl shadow">
        <h3 className="text-lg font-semibold mb-2">Total Distance & Time</h3>
        <p className="text-gray-700">
          {trip.totalDistance} • {trip.totalTime}
        </p>
      </div>
    </div>
  );
}
