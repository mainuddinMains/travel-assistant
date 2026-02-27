import React from "react";

export default function TripCard({ place }) {
  return (
    <div className="bg-white rounded-2xl shadow p-4 flex flex-col hover:shadow-lg transition">
      <img
        src={place.image}
        alt={place.name}
        className="rounded-xl h-40 w-full object-cover mb-3"
      />
      <h3 className="text-lg font-semibold">{place.name}</h3>
      <p className="text-gray-500 text-sm mb-2">
        {place.city}, {place.state}
      </p>
      <div className="text-sm text-gray-600">
        <p>🚌 Bus: {place.busTime} hrs</p>
        <p>🚗 Car: {place.carTime} hrs</p>
        <p>🚶 Walk: {place.walkTime} hrs</p>
      </div>
    </div>
  );
}
