import React, { useEffect, useRef, useState } from "react";
import { type Place } from "../services/googleMaps";

interface SimpleGoogleMapProps {
  places: Place[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onPlaceClick?: (place: Place) => void;
  showRoute?: boolean;
  className?: string;
  style?: React.CSSProperties;
  onError?: () => void;
}

const GOOGLE_SCRIPT_ATTRIBUTE = "data-google-maps-script";

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (window.google && window.google.maps) {
    return Promise.resolve();
  }

  const existingScript = document.querySelector<HTMLScriptElement>(
    `script[${GOOGLE_SCRIPT_ATTRIBUTE}]`
  );

  if (existingScript) {
    return new Promise((resolve, reject) => {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener(
        "error",
        () => reject(new Error("Google Maps failed to load.")),
        { once: true }
      );
    });
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.setAttribute(GOOGLE_SCRIPT_ATTRIBUTE, "true");

    script.addEventListener("load", () => resolve());
    script.addEventListener("error", () => reject(new Error("Google Maps failed to load.")));

    document.head.appendChild(script);
  });
}

export function SimpleGoogleMap({
  places,
  center = { lat: 43.6532, lng: -79.3832 },
  zoom = 13,
  onPlaceClick,
  showRoute = false,
  className = "w-full h-96",
  style,
  onError,
}: SimpleGoogleMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const directionsRendererRef =
    useRef<google.maps.DirectionsRenderer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiKey] = useState<string | null>(
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? null
  );

  useEffect(() => {
    if (!apiKey) {
      setError(
        "Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your environment."
      );
      setLoading(false);
      onError?.();
      return;
    }

    let isMounted = true;

    const initialise = async () => {
      try {
        await loadGoogleMaps(apiKey);
        if (!isMounted || !containerRef.current) {
          return;
        }

        if (!window.google || !window.google.maps) {
          throw new Error("Google Maps library is unavailable after loading.");
        }

        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: true,
        });

        const renderer = new window.google.maps.DirectionsRenderer({
          draggable: false,
          suppressMarkers: true,
        });
        renderer.setMap(map);

        mapRef.current = map;
        directionsRendererRef.current = renderer;
        setLoading(false);
        setError(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        setLoading(false);
        onError?.();
      }
    };

    initialise();

    return () => {
      isMounted = false;
      directionsRendererRef.current?.setMap(null);
      directionsRendererRef.current = null;
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
    };
  }, [apiKey, center, zoom, onError]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !window.google || !window.google.maps) {
      return;
    }

    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    const newMarkers = places.map(place => {
      const marker = new window.google.maps.Marker({
        position: place.coordinates,
        map,
        title: place.name,
      });

      marker.addListener("click", () => onPlaceClick?.(place));
      return marker;
    });

    markersRef.current = newMarkers;

    if (places.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      places.forEach(place => bounds.extend(place.coordinates));
      map.fitBounds(bounds);
    }
  }, [places, onPlaceClick]);

  useEffect(() => {
    const directionsRenderer = directionsRendererRef.current;
    const map = mapRef.current;

    if (!map || !directionsRenderer || !window.google || !window.google.maps) {
      return;
    }

    if (showRoute && places.length > 1) {
      const service = new window.google.maps.DirectionsService();
      const origin = places[0].coordinates;
      const destination = places[places.length - 1].coordinates;
      const waypoints = places.slice(1, -1).map(place => ({
        location: place.coordinates,
        stopover: true,
      }));

      service.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (
          result: google.maps.DirectionsResult | null,
          status: google.maps.DirectionsStatus
        ) => {
          if (status === window.google.maps.DirectionsStatus.OK && result) {
            directionsRenderer.setDirections(result);
          } else {
            console.error("Directions request failed:", status);
          }
        }
      );
    } else {
      directionsRenderer.setDirections(null);
    }
  }, [places, showRoute]);

  if (loading) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}
        style={{ minHeight: "320px", ...style }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
          <p className="text-sm text-gray-600">Loading Google Maps…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${className} flex items-center justify-center bg-gray-100 rounded-lg`}
        style={{ minHeight: "320px", ...style }}
      >
        <div className="text-center max-w-sm p-4 bg-white rounded-lg shadow">
          <div className="text-red-500 mb-2">
            <svg className="w-10 h-10 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Map unavailable</h3>
          <p className="text-sm text-gray-600 mb-3">{error}</p>
          <ol className="text-left text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded">
            <li>1. Enable Maps JavaScript API and Places API</li>
            <li>2. Set VITE_GOOGLE_MAPS_API_KEY in your .env</li>
            <li>3. Restart the application</li>
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className={className}
        style={{ minHeight: "320px", ...style }}
        data-testid="map-container"
      />

      {places.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow px-3 py-2 text-sm text-gray-700">
          <span className="font-medium">{places.length}</span> places on map
        </div>
      )}
    </div>
  );
}
