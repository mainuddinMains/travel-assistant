import React from "react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { name: "Dashboard", path: "/" },
  { name: "Itinerary", path: "/itinerary" },
  { name: "Explore", path: "/explore" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white shadow-xl p-6 flex flex-col justify-between">
      <div>
        <div className="mb-10">
          <h1 className="text-2xl font-bold text-blue-600">TripPlanner</h1>
        </div>

        <div className="mb-4">
          <button className="bg-blue-600 text-white w-full py-2 rounded-xl hover:bg-blue-700">
            + New Trip
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `block px-4 py-2 rounded-lg font-medium ${
                  isActive
                    ? "bg-blue-500 text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`
              }
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <button className="text-gray-500 text-sm hover:text-red-500">
        Logout
      </button>
    </aside>
  );
}
