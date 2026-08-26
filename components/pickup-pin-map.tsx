"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import "leaflet/dist/leaflet.css";

import type { LngLat } from "@/types/usvi";

type Props = {
  center: LngLat;
  position: LngLat;
  precise: boolean;
  onChange: (point: LngLat) => void;
};

export function PickupPinMap({ center, position, precise, onChange }: Props) {
  const icon = useMemo(() => makePickupIcon(precise), [precise]);

  return (
    <div className="h-[250px] overflow-hidden rounded-[22px] border border-teal-100 bg-[#dcefeb] sm:h-[280px]">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={15}
        zoomControl={false}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution="© OpenStreetMap contributors © CARTO"
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={20}
        />
        <Marker
          position={[position.lat, position.lng]}
          icon={icon}
          draggable
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const next = marker.getLatLng();
              onChange({ lat: next.lat, lng: next.lng });
            },
          }}
        />
        <PickupMapEvents onChange={onChange} />
        <Recenter center={center} position={position} />
      </MapContainer>
    </div>
  );
}

function PickupMapEvents({ onChange }: { onChange: (point: LngLat) => void }) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });
  return null;
}

function Recenter({ center, position }: { center: LngLat; position: LngLat }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize(false);
      map.setView([position.lat || center.lat, position.lng || center.lng], 16, {
        animate: true,
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [center.lat, center.lng, map, position.lat, position.lng]);

  return null;
}

function makePickupIcon(precise: boolean) {
  const color = precise ? "#0f766e" : "#64748b";
  const label = precise ? "P" : "•";
  return L.divIcon({
    className: "",
    html: `<div style="width:42px;height:42px;border-radius:17px 17px 17px 5px;transform:rotate(-45deg);display:grid;place-items:center;background:${color};border:3px solid white;box-shadow:0 12px 28px rgba(4,51,49,.28)"><span style="transform:rotate(45deg);font:900 13px/1 system-ui;color:white">${label}</span></div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 37],
  });
}
