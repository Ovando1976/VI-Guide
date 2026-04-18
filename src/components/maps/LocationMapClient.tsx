import React from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import type { Coordinates } from '../../types';
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

function MapResizeHandler() {
  const map = useMap();

  React.useEffect(() => {
    const resize = () => map.invalidateSize();

    const frameId = window.requestAnimationFrame(resize);
    window.addEventListener('resize', resize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', resize);
    };
  }, [map]);

  return null;
}

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
        className="z-0 h-[320px] w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[coordinates.lat, coordinates.lng]}>
          <Popup>{title}</Popup>
        </Marker>
        <MapResizeHandler />
      </MapContainer>
    </div>
  );
}
