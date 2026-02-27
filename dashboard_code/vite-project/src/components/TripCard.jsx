import React from "react";

export default function TripCard({ name, date, price }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition">
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{name}</h3>
      <p className="text-sm text-gray-500">{date}</p>
      <p className="text-sm text-orange-600 mt-2 font-semibold">{price} per night</p>
    </div>
  );
}
