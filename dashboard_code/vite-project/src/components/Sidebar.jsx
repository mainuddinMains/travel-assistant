import { useState } from "react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  const [active, setActive] = useState("Home");

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Analytics", path: "/analytics" },
    { name: "Settings", path: "/settings" },
  ];

  return (
    <aside className="w-64 bg-white shadow-lg p-5">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>

      <ul className="space-y-4">
        {menuItems.map((item) => (
          <li key={item.name}>
            <Link
              to={item.path}
              onClick={() => setActive(item.name)}
              className={`block p-3 rounded-lg font-medium ${
                active === item.name
                  ? "bg-blue-500 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
