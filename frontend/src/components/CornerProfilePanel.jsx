import { useState } from "react";

const tabs = [
  { id: "active", label: "Active Trip", icon: "🚗" },
  { id: "saved", label: "Saved Places", icon: "⭐" },
  { id: "history", label: "History", icon: "📜" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

export default function CornerProfilePanel({ 
  isExpanded, 
  onToggle, 
  activeTab, 
  onTabChange,
  status = "connected",
  origin,
  destination,
  routes,
  onRouteSelect,
  selectedMode 
}) {
  const [geolocationStatus, setGeolocationStatus] = useState("searching");

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      setGeolocationStatus("searching");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeolocationStatus("connected");
        },
        () => {
          setGeolocationStatus("offline");
        }
      );
    } else {
      setGeolocationStatus("offline");
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "connected": return "bg-green-500";
      case "offline": return "bg-gray-400";
      case "searching": return "bg-yellow-500";
      default: return "bg-gray-400";
    }
  };

  const getStatusText = () => {
    switch (geolocationStatus) {
      case "connected": return "GPS Connected";
      case "offline": return "GPS Offline";
      case "searching": return "Searching...";
      default: return "Unknown";
    }
  };

  return (
    <div 
      className={`absolute bottom-4 left-4 z-20 transition-all duration-300 ${
        isExpanded ? "w-80" : "w-auto"
      }`}
    >
      <div className="bg-white rounded-xl shadow-xl overflow-hidden">
        {!isExpanded ? (
          <div 
            onClick={onToggle}
            className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              U
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">Traveler</p>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
                <span className="text-xs text-gray-500">{getStatusText()}</span>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
              Active Trip
            </button>
            <span className="text-gray-400">▼</span>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between p-3 border-b">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
                  U
                </div>
                <div>
                  <p className="font-medium text-gray-800">Traveler</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${getStatusColor()}`}></span>
                    <span className="text-xs text-gray-500">{getStatusText()}</span>
                  </div>
                </div>
              </div>
              <button onClick={onToggle} className="text-gray-400 hover:text-gray-600">
                ▲
              </button>
            </div>

            <div className="flex border-b">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex-1 py-2 text-xs flex flex-col items-center gap-1 ${
                    activeTab === tab.id
                      ? "text-blue-600 border-b-2 border-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            <div className="p-3 max-h-80 overflow-y-auto">
              {activeTab === "active" && (
                <div className="space-y-3">
                  {!origin?.lat ? (
                    <div className="text-center py-4">
                      <button
                        onClick={requestGeolocation}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 w-full"
                      >
                        📍 Use Current Location
                      </button>
                      <p className="text-xs text-gray-500 mt-2">
                        Or set origin manually above
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm">
                      <p className="text-gray-500 text-xs mb-1">Origin</p>
                      <p className="font-medium">{origin.label || "Current Location"}</p>
                    </div>
                  )}

                  {destination?.lat && routes && (
                    <div className="space-y-2 mt-4">
                      <p className="text-gray-500 text-xs">Routes</p>
                      {Object.entries(routes).map(([mode, route]) => (
                        <button
                          key={mode}
                          onClick={() => onRouteSelect(mode)}
                          className={`w-full p-3 rounded-lg border text-left transition-all ${
                            selectedMode === mode
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium capitalize">{mode}</span>
                            <span className="text-sm text-gray-600">
                              {route.duration?.text || "--"}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {route.distance?.text || "--"}
                            {route.transitInfo && ` • ${route.transitInfo}`}
                          </div>
                        </button>
                      ))}

                      <div className="flex gap-2 mt-3">
                        <button className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">
                          Start Trip
                        </button>
                        <button className="px-3 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
                          ⚡
                        </button>
                      </div>
                    </div>
                  )}

                  {!destination?.lat && (
                    <p className="text-sm text-gray-500 text-center py-4">
                      Search for a destination on the map to see routes
                    </p>
                  )}
                </div>
              )}

              {activeTab === "saved" && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No saved places yet</p>
                  <button className="text-blue-600 hover:underline mt-2">
                    Add a place
                  </button>
                </div>
              )}

              {activeTab === "history" && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>No trip history</p>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-3">
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                    Notifications
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                    Distance Units
                  </button>
                  <button className="w-full text-left p-2 rounded hover:bg-gray-50 text-sm">
                    About
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
