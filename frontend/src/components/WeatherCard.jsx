import React from "react";

export default function WeatherCard({ time, temp }) {
  return (
    <div className="bg-white shadow p-4 rounded-xl text-center">
      <h3 className="font-semibold text-gray-700">{time}</h3>
      <p className="text-2xl font-bold text-orange-500">{temp}</p>
    </div>
  );
}
