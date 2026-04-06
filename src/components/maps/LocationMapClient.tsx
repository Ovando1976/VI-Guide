import React from 'react';
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import type { Coordinates } from "../../types";
import "leaflet/dist/leaflet.css";
import L from 'leaflet';

// Fix for default marker icon
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

export default function LocationMapClient({
  coordinates,
  title,
}: {
  coordinates: Coordinates;
  title: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-stone-200 shadow-sm">
      <MapContainer
        center={[coordinates.lat, coordinates.lng]}
        zoom={14}
        scrollWheelZoom={false}
        className="h-[320px] w-full z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coordinates.lat, coordinates.lng]}>
          <Popup>{title}</Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
