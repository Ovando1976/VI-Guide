import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "../lib/utils";
import type { BeachDoc, EventDoc, IslandCode, PlaceDoc } from "../types";

type IslandFilter = IslandCode | "all";

type ExploreMapItem = {
  id: string;
  slug: string;
  title: string;
  description: string;
  category?: string;
  islandCode: IslandCode | string;
  coordinates?: { lat: number; lng: number };
  coverImage?: string;
};

const MAPBOX_TOKEN =
  import.meta.env.VITE_MAPBOX_TOKEN ||
  import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
  process.env.MAPBOX_TOKEN ||
  process.env.VITE_MAPBOX_TOKEN ||
  "";

const ISLAND_VIEW: Record<string, { center: [number, number]; zoom: number }> = {
  st_thomas: { center: [-64.9307, 18.3419], zoom: 11.4 },
  st_john: { center: [-64.742, 18.3358], zoom: 11.5 },
  st_croix: { center: [-64.7466, 17.7397], zoom: 10.2 },
  water_island: { center: [-64.9558, 18.317], zoom: 13 },
  all: { center: [-64.79, 18.05], zoom: 8.8 },
};

const CATEGORY_COLOR: Record<string, string> = {
  beach: "#06b6d4",
  restaurant: "#f97316",
  shopping: "#14b8a6",
  attraction: "#8b5cf6",
  history: "#a16207",
  event: "#ec4899",
  provisioning: "#22c55e",
};

function getIslandView(selectedIsland: IslandFilter) {
  return ISLAND_VIEW[selectedIsland] ?? ISLAND_VIEW.st_thomas;
}

function getColor(category?: string) {
  return CATEGORY_COLOR[category ?? ""] ?? "#10b981";
}

export default function ExploreMapView({
  items,
  selectedIsland,
  onSelectListing,
}: {
  items: ExploreMapItem[];
  selectedIsland: IslandFilter;
  onSelectListing: (listing: BeachDoc | PlaceDoc | EventDoc) => void;
}) {
  const mapNode = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [selectedItem, setSelectedItem] = useState<ExploreMapItem | null>(null);

  const mappedItems = useMemo(
    () =>
      items.filter(
        (item) =>
          typeof item.coordinates?.lat === "number" &&
          typeof item.coordinates?.lng === "number"
      ),
    [items]
  );

  useEffect(() => {
    if (!mapNode.current || mapRef.current) return;

    if (!MAPBOX_TOKEN) {
      console.warn("Missing Mapbox token. Set VITE_MAPBOX_TOKEN in .env.local.");
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const view = getIslandView(selectedIsland);

    mapRef.current = new mapboxgl.Map({
      container: mapNode.current,
      style: "mapbox://styles/mapbox/satellite-streets-v12",
      center: view.center,
      zoom: view.zoom,
      pitch: 45,
      bearing: -12,
      attributionControl: false,
    });

    mapRef.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      "top-right"
    );

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const view = getIslandView(selectedIsland);

    map.flyTo({
      center: view.center,
      zoom: view.zoom,
      pitch: 45,
      bearing: -12,
      duration: 900,
      essential: true,
    });
  }, [selectedIsland]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    mappedItems.forEach((item) => {
      const el = document.createElement("button");
      el.type = "button";
      el.className =
        "grid h-10 w-10 place-items-center rounded-full border-4 border-white shadow-xl transition hover:scale-110";
      el.style.background = getColor(item.category);
      el.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

      el.addEventListener("click", () => {
        setSelectedItem(item);
        map.flyTo({
          center: [item.coordinates!.lng, item.coordinates!.lat],
          zoom: Math.max(map.getZoom(), 14),
          duration: 700,
          essential: true,
        });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([item.coordinates!.lng, item.coordinates!.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    if (mappedItems.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();

      mappedItems.forEach((item) => {
        bounds.extend([item.coordinates!.lng, item.coordinates!.lat]);
      });

      map.fitBounds(bounds, {
        padding: 70,
        maxZoom: 13.8,
        duration: 800,
      });
    }
  }, [mappedItems]);

  if (!MAPBOX_TOKEN) {
    return (
      <div className="rounded-[2.5rem] bg-emerald-950 p-8 text-white shadow-2xl">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-emerald-200">
          Map setup needed
        </p>
        <p className="mt-3 text-sm text-emerald-50">
          Add <code>VITE_MAPBOX_TOKEN</code> to <code>.env.local</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[2.5rem] bg-emerald-950 shadow-2xl">
      <div className="relative h-[540px] w-full">
        <div ref={mapNode} className="absolute inset-0" />

        <div className="absolute left-5 top-5 rounded-2xl bg-white/95 px-5 py-4 shadow-xl backdrop-blur">
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
            Map View
          </p>
          <p className="mt-1 text-sm font-black text-stone-900">
            {mappedItems.length} mapped discoveries
          </p>
        </div>

        {!selectedItem && (
          <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 px-5 py-4 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3 text-sm font-bold text-stone-800">
              <Navigation className="h-4 w-4 text-emerald-700" />
              Tap a marker to preview a place.
            </div>
          </div>
        )}

        {selectedItem && (
          <div className="absolute bottom-5 left-5 right-5 overflow-hidden rounded-[2rem] bg-white shadow-2xl">
            {selectedItem.coverImage && (
              <img
                src={selectedItem.coverImage}
                alt={selectedItem.title}
                className="h-36 w-full object-cover"
              />
            )}

            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                    {selectedItem.category ?? "Place"}
                  </p>
                  <h3 className="mt-1 font-serif text-2xl italic text-stone-950">
                    {selectedItem.title}
                  </h3>
                </div>

                <MapPin className="h-6 w-6 shrink-0 text-emerald-700" />
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-stone-500">
                {selectedItem.description}
              </p>

              <button
                onClick={() => onSelectListing(selectedItem as any)}
                className={cn(
                  "mt-5 w-full rounded-2xl px-5 py-4 text-sm font-black",
                  "bg-emerald-950 text-white active:scale-[0.98]"
                )}
              >
                View Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}