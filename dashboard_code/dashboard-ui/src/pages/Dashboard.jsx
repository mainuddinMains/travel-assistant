import React from "react";
import Header from "../components/Header";
import TripCard from "../components/TripCard";

const mockTrips = [
  {
    name: "Blue Ridge Mountains",
    city: "Asheville",
    state: "North Carolina",
    image: "https://source.unsplash.com/featured/?mountain,travel",
    busTime: 3.5,
    carTime: 2.2,
    walkTime: 10,
  },
  {
    name: "Savannah Historic District",
    city: "Savannah",
    state: "Georgia",
    image: "https://source.unsplash.com/featured/?city,travel",
    busTime: 4.5,
    carTime: 3.1,
    walkTime: 12,
  },
  {
    name: "Miami Beach",
    city: "Miami",
    state: "Florida",
    image: "https://source.unsplash.com/featured/?beach,travel",
    busTime: 7,
    carTime: 6,
    walkTime: 20,
  },
];

export default function Dashboard() {
  return (
    <div>
      <Header />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {mockTrips.map((trip, index) => (
          <TripCard key={index} place={trip} />
        ))}
      </div>
      <div className="mt-10 bg-white p-6 rounded-2xl shadow">
        <h3 className="text-lg font-semibold mb-2">Total Travel Summary</h3>
        <p className="text-gray-600">
          Total distance: <strong>1240 km</strong> <br />
          Total estimated time: <strong>22 hrs</strong>
        </p>
      </div>
    </div>
  );
}
