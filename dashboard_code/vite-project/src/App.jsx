import { useState, useEffect } from "react";
import MapCanvas from "./components/MapCanvas";
import CornerProfilePanel from "./components/CornerProfilePanel";
import ModeSelector from "./components/ModeSelector";
import ChatbotWidget from "./components/ChatbotWidget";

export default function App() {
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [selectedMode, setSelectedMode] = useState("drive");
  const [profileExpanded, setProfileExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("active");
  const [routes, setRoutes] = useState(null);
  const [geolocationStatus, setGeolocationStatus] = useState("offline");

  useEffect(() => {
    requestGeolocation();
  }, []);

  useEffect(() => {
    if (origin?.lat && destination?.lat) {
      calculateRoutes();
    }
  }, [origin, destination, selectedMode]);

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      setGeolocationStatus("searching");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setOrigin({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: "Current Location",
          });
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

  const calculateRoutes = async () => {
    if (!origin?.lat || !destination?.lat) return;

    const modes = ["drive", "transit", "walk", "bike"];
    const newRoutes = {};

    for (const mode of modes) {
      try {
        const response = await fetch(
          `https://routes.googleapis.com/directions/v1:computeRoutes?key=${
            import.meta.env.VITE_GOOGLE_MAPS_API_KEY
          }`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
              destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
              travelMode: mode.toUpperCase(),
              computeAlternativeRoutes: false,
            }),
          }
        );

        const data = await response.json();
        if (data.routes && data.routes[0]) {
          const route = data.routes[0];
          newRoutes[mode] = {
            duration: route.duration,
            distance: route.distance,
            transitInfo: mode === "transit" ? getTransitInfo(route) : null,
          };
        }
      } catch (error) {
        console.error(`Error calculating ${mode} route:`, error);
        newRoutes[mode] = { duration: { text: "N/A" }, distance: { text: "N/A" } };
      }
    }

    setRoutes(newRoutes);
  };

  const getTransitInfo = (route) => {
    if (route.legs && route.legs[0]) {
      const leg = route.legs[0];
      if (leg.transitDetails) {
        const details = leg.transitDetails;
        if (details.transitLine) {
          const line = details.transitLine;
          return `${line.vehicle?.type || "Transit"} • ${line.shortName || line.name}`;
        }
      }
    }
    return null;
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <MapCanvas
        origin={origin}
        destination={destination}
        selectedMode={selectedMode}
        routes={routes}
        onOriginChange={setOrigin}
        onDestinationChange={setDestination}
      />

      <ModeSelector
        selectedMode={selectedMode}
        onModeChange={setSelectedMode}
        transitInfo={routes?.transit?.transitInfo}
      />

      <ChatbotWidget
        origin={origin}
        destination={destination}
        selectedMode={selectedMode}
        routes={routes}
      />

      <CornerProfilePanel
        isExpanded={profileExpanded}
        onToggle={() => setProfileExpanded(!profileExpanded)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={geolocationStatus}
        origin={origin}
        destination={destination}
        routes={routes}
        onRouteSelect={setSelectedMode}
        selectedMode={selectedMode}
      />
    </div>
  );
}
