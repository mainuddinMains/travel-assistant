import React, { useEffect, useRef, useState } from "react";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { type Place } from "../services/googleMaps";

interface ModernGoogleMapWrapperProps {
  places: Place[];
  center?: { lat: number; lng: number };
  zoom?: number;
  onPlaceClick?: (place: Place) => void;
  showRoute?: boolean;
  className?: string;
  style?: React.CSSProperties;
  apiKey: string;
}

const MapComponent: React.FC<{
  places: Place[];
  center: { lat: number; lng: number };
  zoom: number;
  onPlaceClick?: (place: Place) => void;
  showRoute?: boolean;
}> = ({ places, center, zoom, onPlaceClick, showRoute }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<google.maps.Marker[]>([]);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (map || !ref.current) {
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error("Google Maps library is not available on window");
      return;
    }

    const newMap = new window.google.maps.Map(ref.current, {
      center,
      zoom,
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
    });
    setMap(newMap);

    const renderer = new window.google.maps.DirectionsRenderer({
      draggable: false,
      suppressMarkers: true,
    });
    renderer.setMap(newMap);
    setDirectionsRenderer(renderer);
  }, [center, map, zoom]);

  useEffect(() => {
    if (!map) return;

    if (!window.google || !window.google.maps) {
      console.error("Google Maps library is not available on window");
      return;
    }

    markers.forEach(marker => marker.setMap(null));

    const newMarkers: google.maps.Marker[] = [];
    places.forEach(place => {
      const marker = new window.google.maps.Marker({
        position: place.coordinates,
        map,
        title: place.name,
      });

      marker.addListener("click", () => {
        onPlaceClick?.(place);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    if (showRoute && places.length > 1 && directionsRenderer) {
      const directionsService = new window.google.maps.DirectionsService();
      const origin = places[0].coordinates;
      const destination = places[places.length - 1].coordinates;
      const waypoints = places.slice(1, -1).map(place => ({
        location: place.coordinates,
        stopover: true,
      }));

      directionsService.route(
        {
          origin,
          destination,
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (
          response: google.maps.DirectionsResult | null,
          status: google.maps.DirectionsStatus
        ) => {
          if (status === window.google.maps.DirectionsStatus.OK && response) {
            directionsRenderer.setDirections(response);
          } else {
            console.error("Directions request failed due to " + status);
          }
        }
      );
    } else if (directionsRenderer) {
      directionsRenderer.setDirections(null);
    }
  }, [directionsRenderer, map, onPlaceClick, places, showRoute]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
};

const render = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700">Loading Google Maps...</p>
          </div>
        </div>
      );
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-full bg-red-50">
          <div className="text-center p-4 rounded-lg bg-white shadow-md">
            <svg
              className="mx-auto h-12 w-12 text-red-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Map Failed to Load
            </h3>
            <p className="text-gray-600 text-sm">
              Please check your Google Maps API key and try again.
            </p>
          </div>
        </div>
      );
    default:
      return <></>;
  }
};

export const ModernGoogleMapWrapper: React.FC<ModernGoogleMapWrapperProps> = ({
  places,
  center = { lat: 43.6532, lng: -79.3832 },
  zoom = 13,
  onPlaceClick,
  showRoute = false,
  className = "w-full h-96",
  style,
  apiKey,
}) => {
  if (!apiKey) {
    return (
      <div
        className={`flex items-center justify-center ${className} bg-gray-100`}
        style={style}
      >
        <div className="text-center p-4 rounded-lg bg-white shadow-md">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Google Maps API Key Required
          </h3>
          <p className="text-gray-600 text-sm">
            Please configure your Google Maps API key to display the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={style}>
      <Wrapper apiKey={apiKey} render={render} libraries={["places"]}>
        <MapComponent
          places={places}
          center={center}
          zoom={zoom}
          onPlaceClick={onPlaceClick}
          showRoute={showRoute}
        />
      </Wrapper>
    </div>
  );
};

export default ModernGoogleMapWrapper;
