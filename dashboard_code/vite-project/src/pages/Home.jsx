import { useState } from "react";
import Card from "../components/Card";

export default function Home() {
  // ACTIVE TRAVEL STATE
  const [activeTravel, setActiveTravel] = useState({
    country: "Japan",
    city: "Tokyo",
    status: "Currently Traveling ✈️"
  });

  // WISH LIST STATE
  const [wishCountry, setWishCountry] = useState("");
  const [wishPlace, setWishPlace] = useState("");
  const [wishList, setWishList] = useState({});  
  // Example: { Japan: ["Tokyo Tower", "Osaka Castle"] }

  const handleAddWish = () => {
    if (!wishCountry || !wishPlace) return;

    setWishList((prev) => ({
      ...prev,
      [wishCountry]: [...(prev[wishCountry] || []), wishPlace],
    }));

    setWishPlace("");
  };

  return (
    <div>
      {/* Dashboard Title */}
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>

      {/* TOP STATS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card title="Total Trips" value="24" />
        <Card title="Distance Traveled" value="164 km" />
        <Card title="AI Recommendations" value="8" />
      </div>

      {/* ACTIVE TRAVEL SECTION */}
      <section className="bg-white p-6 rounded-xl shadow-md mb-10">
        <h2 className="text-2xl font-bold mb-4">Active Travel 🌍</h2>

        <p className="text-lg">
          <span className="font-semibold">Country:</span> {activeTravel.country}
        </p>
        <p className="text-lg">
          <span className="font-semibold">City:</span> {activeTravel.city}
        </p>
        <p className="text-lg mt-2 text-blue-600 font-medium">
          {activeTravel.status}
        </p>
      </section>

      {/* WISH LIST SECTION */}
      <section className="bg-white p-6 rounded-xl shadow-md">
        <h2 className="text-2xl font-bold mb-4">Wish List ✨</h2>

        {/* ADD NEW PLACE FORM */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Country"
            value={wishCountry}
            onChange={(e) => setWishCountry(e.target.value)}
            className="border rounded-lg px-4 py-2 w-full"
          />

          <input
            type="text"
            placeholder="Place (e.g., Shibuya Crossing)"
            value={wishPlace}
            onChange={(e) => setWishPlace(e.target.value)}
            className="border rounded-lg px-4 py-2 w-full"
          />

          <button
            onClick={handleAddWish}
            className="bg-blue-600 text-white rounded-lg px-6 py-2 hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* DISPLAY WISHES */}
        {Object.keys(wishList).length === 0 ? (
          <p className="text-gray-500">No wishlist items yet.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(wishList).map(([country, places]) => (
              <div key={country} className="border p-4 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">{country}</h3>
                <ul className="list-disc ml-6 text-gray-700">
                  {places.map((place, index) => (
                    <li key={index}>{place}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
