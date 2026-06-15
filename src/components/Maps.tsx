import { useMemo, useState } from "react";
import {
  Archive,
  Compass,
  ExternalLink,
  History,
  LocateFixed,
  MapPinned,
  Route,
  Search,
  X,
} from "lucide-react";

import type { IslandCode } from "../types";

type MapPoint = {
  id: string;
  title: string;
  description: string;
  island: IslandCode | "all";
  type:
    | "beach"
    | "food"
    | "shopping"
    | "history"
    | "transport"
    | "event"
    | "archive";
  location: string;
  lat: number;
  lng: number;
  tags: string[];
};

type MapsProps = {
  selectedIsland: IslandCode;
  user?: unknown;
};

const MAP_POINTS: MapPoint[] = [
  {
    id: "magens-bay",
    title: "Magens Bay",
    description:
      "One of St. Thomas’s most recognized beaches, useful for visitor planning and beach discovery.",
    island: "st_thomas",
    type: "beach",
    location: "Northside, St. Thomas",
    lat: 18.3628,
    lng: -64.9307,
    tags: ["beach", "northside", "tourism"],
  },
  {
    id: "fort-christian",
    title: "Fort Christian",
    description:
      "Historic Danish fort in Charlotte Amalie connected to colonial government and harbor defense.",
    island: "st_thomas",
    type: "history",
    location: "Charlotte Amalie",
    lat: 18.3411,
    lng: -64.9306,
    tags: ["fort", "danish-west-indies", "history"],
  },
  {
    id: "charlotte-amalie-harbor",
    title: "Charlotte Amalie Harbor",
    description:
      "Historic free port, cruise harbor, maritime center, and major map-linked heritage zone.",
    island: "st_thomas",
    type: "archive",
    location: "Charlotte Amalie",
    lat: 18.3379,
    lng: -64.9332,
    tags: ["harbor", "free-port", "archives"],
  },
  {
    id: "fortsberg",
    title: "Fortsberg",
    description:
      "Coral Bay fort site connected to Danish occupation and the 1733 Akwamu revolt.",
    island: "st_john",
    type: "history",
    location: "Coral Bay",
    lat: 18.342,
    lng: -64.713,
    tags: ["fort", "akwamu", "st-john"],
  },
  {
    id: "fort-frederik",
    title: "Fort Frederik",
    description:
      "Frederiksted fort associated with emancipation and St. Croix labor history.",
    island: "st_croix",
    type: "history",
    location: "Frederiksted",
    lat: 17.7115,
    lng: -64.8815,
    tags: ["fort", "emancipation", "buddhoe"],
  },
  {
    id: "christiansted",
    title: "Christiansted Historic District",
    description:
      "Historic Danish townscape tied to trade, administration, harbor activity, and plantation records.",
    island: "st_croix",
    type: "history",
    location: "Christiansted",
    lat: 17.7466,
    lng: -64.7032,
    tags: ["christiansted", "architecture", "harbor"],
  },
];

const FILTERS: { id: MapPoint["type"] | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "beach", label: "Beaches" },
  { id: "food", label: "Food" },
  { id: "shopping", label: "Shopping" },
  { id: "history", label: "History" },
  { id: "transport", label: "Transport" },
  { id: "event", label: "Events" },
  { id: "archive", label: "Archives" },
];

function islandLabel(island?: IslandCode | "all") {
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  if (island === "water_island") return "Water Island";
  return "Virgin Islands";
}

function openGoogleMaps(point: MapPoint) {
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`,
    "_blank",
    "noopener,noreferrer"
  );
}

function typeIcon(type: MapPoint["type"]) {
  if (type === "history") return History;
  if (type === "archive") return Archive;
  if (type === "transport") return Route;
  return MapPinned;
}

export default function Maps({ selectedIsland }: MapsProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<MapPoint["type"] | "all">("all");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);

  const points = useMemo(() => {
    const q = query.trim().toLowerCase();

    return MAP_POINTS.filter((point) => {
      const islandMatch =
        point.island === "all" || point.island === selectedIsland;

      const filterMatch = filter === "all" || point.type === filter;

      const searchMatch =
        !q ||
        point.title.toLowerCase().includes(q) ||
        point.description.toLowerCase().includes(q) ||
        point.location.toLowerCase().includes(q) ||
        point.tags.join(" ").toLowerCase().includes(q);

      return islandMatch && filterMatch && searchMatch;
    });
  }, [selectedIsland, query, filter]);

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <section className="overflow-hidden rounded-[2rem] bg-emerald-950 text-white shadow-2xl">
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-950 to-stone-950 p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
            <MapPinned className="h-8 w-8 text-emerald-200" />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-emerald-300">
            Live Island Map
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight">
            Explore {islandLabel(selectedIsland)}
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-emerald-50">
            Search places, historic sites, archive-linked locations, beaches,
            routes, and heritage zones.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatCard value={points.length} label="Visible" />
            <StatCard value={MAP_POINTS.length} label="Total" />
            <StatCard value="Map" label="Ready" />
          </div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <div className="relative">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Fort Christian, harbor, beach, archive..."
            className="w-full rounded-3xl bg-white py-5 pl-14 pr-12 text-sm font-bold text-stone-900 shadow-xl outline-none"
          />

          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-5 top-1/2 -translate-y-1/2 text-stone-400"
              type="button"
              aria-label="Clear search"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setFilter(item.id);
                setSelectedPoint(null);
              }}
              className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.18em] shadow ${
                filter === item.id
                  ? "bg-emerald-950 text-white"
                  : "bg-white text-stone-600"
              }`}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-4 overflow-hidden rounded-[2rem] bg-stone-900 shadow-2xl">
        <div className="relative min-h-[420px] bg-[radial-gradient(circle_at_top,_#166534,_#0c0a09_65%)] p-5 text-white">
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,.08)_25%,rgba(255,255,255,.08)_50%,transparent_50%,transparent_75%,rgba(255,255,255,.08)_75%)] bg-[length:32px_32px]" />
          </div>

          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-300">
                Map Preview
              </p>
              <h2 className="mt-1 text-2xl font-black">
                {islandLabel(selectedIsland)}
              </h2>
            </div>

            <button
              className="grid h-12 w-12 place-items-center rounded-full bg-white/10 backdrop-blur"
              type="button"
              aria-label="Locate me"
            >
              <LocateFixed className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 mt-8 grid grid-cols-1 gap-3">
            {points.map((point) => {
              const Icon = typeIcon(point.type);
              const active = selectedPoint?.id === point.id;

              return (
                <button
                  key={point.id}
                  onClick={() => setSelectedPoint(point)}
                  className={`rounded-3xl p-4 text-left backdrop-blur transition ${
                    active
                      ? "bg-white text-stone-950"
                      : "bg-white/10 text-white hover:bg-white/15"
                  }`}
                  type="button"
                >
                  <div className="flex gap-4">
                    <div
                      className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${
                        active ? "bg-emerald-100 text-emerald-900" : "bg-white/10"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-[10px] font-black uppercase tracking-[0.22em] ${
                          active ? "text-emerald-700" : "text-emerald-200"
                        }`}
                      >
                        {point.type}
                      </p>

                      <h3 className="mt-1 text-xl font-black">{point.title}</h3>

                      <p
                        className={`mt-2 line-clamp-2 text-sm leading-relaxed ${
                          active ? "text-stone-600" : "text-stone-300"
                        }`}
                      >
                        {point.description}
                      </p>

                      <p
                        className={`mt-3 text-xs font-bold ${
                          active ? "text-stone-500" : "text-stone-300"
                        }`}
                      >
                        {point.location}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {points.length === 0 && (
            <div className="relative z-10 mt-10 rounded-3xl bg-white/10 p-8 text-center">
              <Compass className="mx-auto h-10 w-10 text-white/60" />
              <p className="mt-4 text-sm font-bold text-white/80">
                No map points match this search.
              </p>
            </div>
          )}
        </div>
      </section>

      {selectedPoint && (
        <section className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-700">
                Selected Point
              </p>

              <h2 className="mt-1 text-2xl font-black">
                {selectedPoint.title}
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-stone-600">
                {selectedPoint.description}
              </p>
            </div>

            <button
              onClick={() => setSelectedPoint(null)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500"
              type="button"
              aria-label="Clear selected point"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              onClick={() => openGoogleMaps(selectedPoint)}
              className="flex items-center justify-center gap-2 rounded-2xl bg-stone-950 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-white"
              type="button"
            >
              <ExternalLink className="h-4 w-4" />
              Directions
            </button>

            <button
              onClick={() =>
                window.alert(
                  `${selectedPoint.title}\n${selectedPoint.lat}, ${selectedPoint.lng}`
                )
              }
              className="flex items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-4 py-4 text-xs font-black uppercase tracking-[0.16em] text-emerald-950"
              type="button"
            >
              <MapPinned className="h-4 w-4" />
              Coordinates
            </button>
          </div>
        </section>
      )}
    </main>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-100">
        {label}
      </p>
    </div>
  );
}