import React from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { LatLng } from "../data/stThomasZones";

type ItineraryRouteMapProps = {
  routeCoordinates: LatLng[];
};

function FitRoute({ coordinates }: { coordinates: LatLng[] }) {
  const map = useMap();

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => map.invalidateSize());

    if (coordinates.length > 1) {
      const bounds = coordinates.map((point) => [point.lat, point.lng]) as [
        number,
        number
      ][];
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => window.cancelAnimationFrame(id);
  }, [map, coordinates]);

  return null;
}

export default function ItineraryRouteMap({
  routeCoordinates,
}: ItineraryRouteMapProps) {
  const center = routeCoordinates[0] ?? { lat: 18.3419, lng: -64.9307 };
  const polyline = routeCoordinates.map((point) => [point.lat, point.lng]) as [
    number,
    number
  ][];

  return (
    <div className="h-72 overflow-hidden rounded-3xl bg-stone-200 shadow-xl">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {polyline.length > 1 && (
          <Polyline
            positions={polyline}
            pathOptions={{
              color: "#047857",
              weight: 5,
              opacity: 0.9,
            }}
          />
        )}

        {routeCoordinates.map((point, index) => (
          <CircleMarker
            key={`${point.lat}-${point.lng}-${index}`}
            center={[point.lat, point.lng]}
            radius={index === 0 || index === routeCoordinates.length - 1 ? 10 : 8}
            pathOptions={{
              color: "#ffffff",
              weight: 3,
              fillColor: index === 0 ? "#064e3b" : "#059669",
              fillOpacity: 1,
            }}
          >
            <Popup>Stop {index + 1}</Popup>
          </CircleMarker>
        ))}

        <FitRoute coordinates={routeCoordinates} />
      </MapContainer>
    </div>
  );
}