import { useState } from "react";

const modes = [
  { 
    id: "drive", 
    label: "Drive", 
    icon: "🚗",
    availability: "Traffic moderate",
    color: "bg-blue-500" 
  },
  { 
    id: "transit", 
    label: "Transit", 
    icon: "🚇",
    availability: "Next bus in 6 min",
    color: "bg-green-500",
    alert: true
  },
  { 
    id: "walk", 
    label: "Walk", 
    icon: "🚶",
    availability: "Always available",
    color: "bg-purple-500" 
  },
  { 
    id: "bike", 
    label: "Bike", 
    icon: "🚴",
    availability: "Bike lanes preferred",
    color: "bg-orange-500" 
  },
];

export default function ModeSelector({ selectedMode, onModeChange, transitInfo }) {
  const [showTooltip, setShowTooltip] = useState(null);

  return (
    <div className="absolute top-4 left-4 z-10">
      <div className="bg-white rounded-lg shadow-lg p-1 flex">
        {modes.map((mode) => (
          <div key={mode.id} className="relative">
            <button
              onClick={() => onModeChange(mode.id)}
              onMouseEnter={() => setShowTooltip(mode.id)}
              onMouseLeave={() => setShowTooltip(null)}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-all ${
                selectedMode === mode.id
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-1">{mode.icon}</span>
              <span className="hidden sm:inline">{mode.label}</span>
            </button>
            
            {showTooltip === mode.id && (
              <div className="absolute top-full left-0 mt-1 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-20">
                {mode.availability}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedMode === "transit" && transitInfo && (
        <div className="mt-2 bg-white rounded-lg shadow px-3 py-1.5 text-xs text-green-600 font-medium">
          {transitInfo}
        </div>
      )}
      
      {selectedMode === "drive" && (
        <div className="mt-2 bg-white rounded-lg shadow px-3 py-1.5 text-xs text-gray-600">
          Traffic moderate
        </div>
      )}
    </div>
  );
}
