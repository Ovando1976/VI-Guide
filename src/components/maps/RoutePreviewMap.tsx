import React from 'react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIconRetina from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIconRetina,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RoutePreviewMapProps {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };
}

function MapAutoCenter({ pickup, dropoff }: RoutePreviewMapProps) {
  const map = useMap();

  React.useEffect(() => {
    const bounds = L.latLngBounds([pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]);
    map.fitBounds(bounds, { padding: [50, 50] });

    const frameId = window.requestAnimationFrame(() => map.invalidateSize());

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [map, pickup, dropoff]);

  return null;
}

export default function RoutePreviewMap({ pickup, dropoff }: RoutePreviewMapProps) {
  return (
    <div className="h-full w-full overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-inner">
      <MapContainer
        center={[pickup.lat, pickup.lng]}
        zoom={13}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[pickup.lat, pickup.lng]} />
        <Marker position={[dropoff.lat, dropoff.lng]} />
        <Polyline
          positions={[[pickup.lat, pickup.lng], [dropoff.lat, dropoff.lng]]}
          color="#10b981"
          weight={4}
          dashArray="10, 10"
        />
        <MapAutoCenter pickup={pickup} dropoff={dropoff} />
      </MapContainer>
    </div>
  );
}
