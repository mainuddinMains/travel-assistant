import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";

const styles = {
  container: {
    position: "relative",
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    backgroundColor: "#f3f4f6",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  mapPlaceholder: {
    position: "absolute",
    inset: 0,
    backgroundImage: "url('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=80')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
  },
  modeSelector: {
    position: "absolute",
    top: "16px",
    left: "16px",
    zIndex: 10,
    display: "flex",
    backgroundColor: "white",
    borderRadius: "8px",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
    padding: "4px",
  },
  modeButton: {
    padding: "8px 12px",
    borderRadius: "6px",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 500,
    transition: "all 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  chatButton: {
    position: "absolute",
    top: "16px",
    right: "16px",
    zIndex: 10,
    width: "48px",
    height: "48px",
    borderRadius: "full",
    backgroundColor: "#2563eb",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
  },
  profilePanel: {
    position: "absolute",
    bottom: "16px",
    left: "16px",
    zIndex: 20,
    backgroundColor: "white",
    borderRadius: "12px",
    boxShadow: "0 10px 15px rgba(0,0,0,0.1)",
    overflow: "hidden",
    transition: "all 0.3s",
    width: "320px",
  },
  profileCollapsed: {
    width: "auto",
  },
};

const modes = [
  { id: "drive", icon: "🚗", label: "Drive" },
  { id: "transit", icon: "🚇", label: "Transit" },
  { id: "walk", icon: "🚶", label: "Walk" },
  { id: "bike", icon: "🚴", label: "Bike" },
];

const tabs = [
  { id: "active", icon: "🚗", label: "Active" },
  { id: "saved", icon: "⭐", label: "Saved" },
  { id: "history", icon: "📜", label: "History" },
  { id: "settings", icon: "⚙️", label: "Settings" },
];

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedMode, setSelectedMode] = useState("drive");
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [geolocationStatus, setGeolocationStatus] = useState("offline");

  useEffect(() => {
    requestGeolocation();
  }, []);

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      setGeolocationStatus("searching");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOrigin({ lat: position.coords.latitude, lng: position.coords.longitude, label: "Current Location" });
          setGeolocationStatus("connected");
        },
        () => setGeolocationStatus("offline")
      );
    } else {
      setGeolocationStatus("offline");
    }
  };

  const routes = origin && destination ? {
    drive: { duration: "18 min", distance: "9.2 km" },
    transit: { duration: "28 min", distance: "walk 0.9 km", transitInfo: "Next bus in 6 min" },
    walk: { duration: "1 hr 45 min", distance: "7.8 km" },
    bike: { duration: "34 min", distance: "8.1 km" },
  } : null;

  const getStatusColor = () => {
    switch (geolocationStatus) {
      case "connected": return "#22c55e";
      case "searching": return "#eab308";
      default: return "#9ca3af";
    }
  };

  return (
    <div style={styles.container}>
      {/* Map / Background Image */}
      <div style={styles.mapPlaceholder}>
        <div style={{ backgroundColor: "rgba(0,0,0,0.4)", padding: "40px", borderRadius: "20px", textAlign: "center" }}>
          <span style={{ fontSize: "64px", marginBottom: "16px", display: "block" }}>🌍</span>
          <p style={{ color: "white", fontSize: "24px", fontWeight: "bold", marginBottom: "8px" }}>Travel Assistant</p>
          <p style={{ color: "#e5e7eb", marginBottom: "16px" }}>Your AI-powered travel companion</p>
          <p style={{ fontSize: "14px", color: "#9ca3af" }}>{origin ? "📍 " + origin.label : "Click profile to set location"}</p>
        </div>
      </div>

      {/* Mode Selector - Top Left */}
      <div style={styles.modeSelector}>
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setSelectedMode(mode.id)}
            style={{
              ...styles.modeButton,
              backgroundColor: selectedMode === mode.id ? "#2563eb" : "transparent",
              color: selectedMode === mode.id ? "white" : "#374151",
            }}
          >
            {mode.icon} {mode.label}
          </button>
        ))}
      </div>

      {/* Chat Button - Top Right */}
      <button style={styles.chatButton}>
        <span style={{ fontSize: "24px" }}>🤖</span>
      </button>

      {/* Profile Panel - Bottom Left */}
      <div style={{ ...styles.profilePanel, ...(profileExpanded ? {} : styles.profileCollapsed) }}>
        {!profileExpanded ? (
          <div 
            onClick={() => setProfileExpanded(true)}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px", cursor: "pointer" }}
          >
            <div style={{ width: "40px", height: "40px", borderRadius: "full", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
              U
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "#1f2937" }}>Traveler</p>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "full", backgroundColor: getStatusColor() }}></span>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  {geolocationStatus === "connected" ? "GPS Connected" : geolocationStatus === "searching" ? "Searching..." : "GPS Offline"}
                </span>
              </div>
            </div>
            <button style={{ backgroundColor: "#2563eb", color: "white", padding: "6px 16px", borderRadius: "6px", fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer" }}>
              Active Trip
            </button>
          </div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px", borderBottom: "1px solid #e5e7eb" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "full", backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "bold" }}>
                  U
                </div>
                <div>
                  <p style={{ fontWeight: 500, color: "#1f2937" }}>Traveler</p>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "full", backgroundColor: getStatusColor() }}></span>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>GPS Connected</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setProfileExpanded(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "16px", color: "#9ca3af" }}>
                ▲
              </button>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb" }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{ flex: 1, padding: "8px", fontSize: "12px", display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", background: "none", border: "none", cursor: "pointer", color: activeTab === tab.id ? "#2563eb" : "#6b7280", borderBottom: activeTab === tab.id ? "2px solid #2563eb" : "none" }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div style={{ padding: "12px", maxHeight: "320px", overflowY: "auto" }}>
              {activeTab === "active" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {!origin && (
                    <button onClick={requestGeolocation} style={{ backgroundColor: "#2563eb", color: "white", padding: "8px 16px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px" }}>
                      📍 Use Current Location
                    </button>
                  )}
                  
                  <div>
                    <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "4px" }}>Destination</p>
                    <input
                      type="text"
                      placeholder="Where to?"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "14px", boxSizing: "border-box" }}
                      onChange={(e) => setDestination({ lat: 38.627, lng: -90.1994, label: e.target.value })}
                    />
                  </div>

                  {routes && (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <p style={{ fontSize: "12px", color: "#6b7280" }}>Routes</p>
                      {Object.entries(routes).map(([mode, route]) => (
                        <button
                          key={mode}
                          onClick={() => setSelectedMode(mode)}
                          style={{ padding: "12px", borderRadius: "8px", border: selectedMode === mode ? "2px solid #2563eb" : "1px solid #e5e7eb", backgroundColor: selectedMode === mode ? "#eff6ff" : "white", textAlign: "left", cursor: "pointer" }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontWeight: 500, textTransform: "capitalize" }}>{mode}</span>
                            <span style={{ color: "#6b7280", fontSize: "14px" }}>{route.duration}</span>
                          </div>
                          <div style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px" }}>
                            {route.distance} {route.transitInfo && `• ${route.transitInfo}`}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <button style={{ width: "100%", backgroundColor: "#22c55e", color: "white", padding: "8px", borderRadius: "6px", border: "none", cursor: "pointer", fontSize: "14px", fontWeight: 500, marginTop: "8px" }}>
                    Start Trip
                  </button>
                </div>
              )}

              {activeTab === "saved" && (
                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                  <p>No saved places yet</p>
                </div>
              )}

              {activeTab === "history" && (
                <div style={{ textAlign: "center", padding: "32px", color: "#6b7280" }}>
                  <p>No trip history</p>
                </div>
              )}

              {activeTab === "settings" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>Notifications</button>
                  <button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>Distance Units</button>
                  <button style={{ textAlign: "left", padding: "8px", borderRadius: "4px", border: "none", background: "none", cursor: "pointer", fontSize: "14px" }}>About</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
