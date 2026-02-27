import React from "react";
import TripCard from "./TripCard";
import WeatherCard from "./WeatherCard";

export default function Dashboard() {
  const trips = [
    { name: "Cherry Log, Georgia, US", date: "22–25 Mar", price: "$350" },
    { name: "Blue Ridge, Georgia, US", date: "20–22 Mar", price: "$360" },
    { name: "Ellijay, Georgia, US", date: "20–25 Mar", price: "$355" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">Popular Trip Packages</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {trips.map((trip, i) => (
          <TripCard key={i} {...trip} />
        ))}
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">Weather Updates</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <WeatherCard time="Morning" temp="20°" />
          <WeatherCard time="Afternoon" temp="34°" />
          <WeatherCard time="Evening" temp="28°" />
          <WeatherCard time="Night" temp="22°" />
        </div>
      </div>
    </div>
  );
}
