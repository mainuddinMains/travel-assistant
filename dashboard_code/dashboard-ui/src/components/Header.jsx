import React from "react";

export default function Header() {
  return (
    <header className="flex justify-between items-center mb-6">
      <div>
        <h2 className="text-2xl font-semibold">Active Trip</h2>
        <p className="text-gray-500">Your current travel overview 🌍</p>
      </div>
      <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
        + Add New Place
      </button>
    </header>
  );
}
