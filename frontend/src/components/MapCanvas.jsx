import { useState, useEffect, useCallback } from "react";
import { GoogleMap, LoadScript, Marker, Polyline, InfoWindow } from "@react-google-maps/api";

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
};

const defaultCenter = { lat: 38.627, lng: -90.1994 };

const libraries = ["places", "geometry"];

export default function MapCanvas({
  origin,
  destination,
  selectedMode,
  routes,
  onOriginChange,
  onDestinationChange
}) {
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({ origin: null, destination: null });
  const [infoWindow, setInfoWindow] = useState(null);
  const [searchBox, setSearchBox] = useState(null);
  const [directions, setDirections] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  const center = origin?.lat ? origin : (currentLocation || defaultCenter);

  const onLoad = useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    if (map && window.google) {
      const originInput = document.getElementById("origin-search");
      const destInput = document.getElementById("destination-search");
      
      if (originInput && !searchBox) {
        const box = new window.google.maps.places.SearchBox(originInput);
        box.addListener("places_changed", () => {
          const places = box.getPlaces();
          if (places.length > 0) {
            onOriginChange({
              lat: places[0].geometry.location.lat(),
              lng: places[0].geometry.location.lng(),
              label: places[0].name,
            });
          }
        });
        setSearchBox(box);
      }

      if (destInput) {
        const destBox = new window.google.maps.places.SearchBox(destInput);
        destBox.addListener("places_changed", () => {
          const places = destBox.getPlaces();
          if (places.length > 0) {
            onDestinationChange({
              lat: places[0].geometry.location.lat(),
              lng: places[0].geometry.location.lng(),
              label: places[0].name,
            });
          }
        });
      }
    }
  }, [map, onOriginChange, onDestinationChange]);

  useEffect(() => {
    if (origin?.lat && destination?.lat && map && window.google) {
      const directionsService = new window.google.maps.DirectionsService();
      const travelMode = selectedMode?.toUpperCase() || "DRIVING";
      
      directionsService.route(
        {
          origin: new window.google.maps.LatLng(origin.lat, origin.lng),
          destination: new window.google.maps.LatLng(destination.lat, destination.lng),
          travelMode: window.google.maps.TravelMode[travelMode],
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
          }
        }
      );
    }
  }, [origin, destination, selectedMode, map]);

  const currentRoute = routes?.[selectedMode?.toLowerCase()];

  return (
    <div className="relative w-full h-screen">
      <LoadScript
        googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={center}
          zoom={12}
          options={mapOptions}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {currentLocation && !origin?.lat && (
            <Marker
              position={currentLocation}
              title="Your current location"
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: "#3B82F6",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 3,
              }}
            />
          )}

          {origin?.lat && (
            <Marker
              position={{ lat: origin.lat, lng: origin.lng }}
              label={{
                text: "A",
                color: "white",
                fontWeight: "bold",
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#22C55E",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
            />
          )}
          
          {destination?.lat && (
            <Marker
              position={{ lat: destination.lat, lng: destination.lng }}
              label={{
                text: "B",
                color: "white",
                fontWeight: "bold",
              }}
              icon={{
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#EF4444",
                fillOpacity: 1,
                strokeColor: "white",
                strokeWeight: 2,
              }}
            />
          )}

          {directions && (
            <Polyline
              path={directions.routes[0].overview_path}
              options={{
                strokeColor: "#3B82F6",
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
            />
          )}
        </GoogleMap>
      </LoadScript>

      {currentRoute && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg px-4 py-2 z-10">
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-gray-700">
              {currentRoute.duration?.text || "Calculating..."}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-600">
              {currentRoute.distance?.text || "..."}
            </span>
            {currentRoute.transitInfo && (
              <>
                <span className="text-gray-400">|</span>
                <span className="text-blue-600">{currentRoute.transitInfo}</span>
              </>
            )}
          </div>
        </div>
      )}

      <div className="absolute top-4 z-10 flex gap-2 w-72">
        <input
          id="origin-search"
          type="text"
          placeholder="Where are you?"
          className="w-full px-3 py-2 rounded-lg shadow border border-gray-200 text-sm"
          defaultValue={origin?.label || ""}
        />
      </div>
      <div className="absolute top-14 z-10 flex gap-2 w-72">
        <input
          id="destination-search"
          type="text"
          placeholder="Where to?"
          className="w-full px-3 py-2 rounded-lg shadow border border-gray-200 text-sm"
          defaultValue={destination?.label || ""}
        />
      </div>
    </div>
  );
}
