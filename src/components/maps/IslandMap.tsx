import React from "react";
import {
  MapContainer,
  Popup,
  TileLayer,
  CircleMarker,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { IslandCode } from "../../types";

export type MapFilter =
  | "all"
  | "beach"
  | "history"
  | "transport"
  | "food"
  | "event"
  | "attraction";

export type MapPoint = {
  id: string;
  title: string;
  type: Exclude<MapFilter, "all">;
  lat: number;
  lng: number;
  description: string;
};

type IslandMapProps = {
  selectedIsland: IslandCode;
  activeFilter: MapFilter;
  selectedPointId: string | null;
  points: MapPoint[];
  onSelectPoint: (point: MapPoint) => void;
};

export const MAP_FILTERS: { id: MapFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "beach", label: "Beaches" },
  { id: "history", label: "History" },
  { id: "transport", label: "Transport" },
  { id: "food", label: "Food" },
  { id: "event", label: "Events" },
  { id: "attraction", label: "Attractions" },
];

const ISLAND_CENTER: Record<
  string,
  { lat: number; lng: number; zoom: number }
> = {
  st_thomas: { lat: 18.3419, lng: -64.9307, zoom: 12 },
  st_john: { lat: 18.3358, lng: -64.7281, zoom: 12 },
  st_croix: { lat: 17.7246, lng: -64.8348, zoom: 11 },
};

function MapController({
  selectedPoint,
}: {
  selectedPoint: MapPoint | undefined;
}) {
  const map = useMap();

  React.useEffect(() => {
    const id = window.requestAnimationFrame(() => map.invalidateSize());
    return () => window.cancelAnimationFrame(id);
  }, [map]);

  React.useEffect(() => {
    if (!selectedPoint) return;

    map.flyTo([selectedPoint.lat, selectedPoint.lng], 15, {
      duration: 0.8,
    });
  }, [map, selectedPoint]);

  return null;
}

function getColor(type: MapPoint["type"]) {
  if (type === "beach") return "#0891b2";
  if (type === "history") return "#b45309";
  if (type === "transport") return "#059669";
  if (type === "food") return "#dc2626";
  if (type === "event") return "#7c3aed";
  return "#4f46e5";
}

export default function IslandMap({
  selectedIsland,
  activeFilter,
  selectedPointId,
  points,
  onSelectPoint,
}: IslandMapProps) {
  const center =
    ISLAND_CENTER[selectedIsland as keyof typeof ISLAND_CENTER] ??
    ISLAND_CENTER.st_thomas;

  const visiblePoints =
    activeFilter === "all"
      ? points
      : points.filter((point) => point.type === activeFilter);

  const selectedPoint = points.find((point) => point.id === selectedPointId);

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={center.zoom}
      scrollWheelZoom
      className="h-full w-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {visiblePoints.map((point) => {
        const selected = point.id === selectedPointId;

        return (
          <CircleMarker
            key={`${point.type}-${point.id}`}
            center={[point.lat, point.lng]}
            radius={selected ? 15 : 9}
            eventHandlers={{
              click: () => onSelectPoint(point),
            }}
            pathOptions={{
              color: "#ffffff",
              weight: selected ? 5 : 3,
              fillColor: getColor(point.type),
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>{point.title}</strong>
              <br />
              {point.description}
            </Popup>
          </CircleMarker>
        );
      })}

      <MapController selectedPoint={selectedPoint} />
    </MapContainer>
  );
}
