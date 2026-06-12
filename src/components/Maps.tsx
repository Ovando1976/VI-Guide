import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import IslandMap, { MAP_FILTERS, MapFilter, MapPoint } from "./maps/IslandMap";
import { useMapPoints } from "../hooks/useMapPoints";
import type { IslandCode } from "../types";

type MapsProps = {
  selectedIsland: IslandCode;
  user: any;
};

function openDirections(point: MapPoint) {
  const url = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

export default function Maps({ selectedIsland }: MapsProps) {
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dayPlan, setDayPlan] = useState<MapPoint[]>([]);
  const navigate = useNavigate();

  const { points, loading, error } = useMapPoints(selectedIsland);

  const activeLabel = useMemo(
    () =>
      MAP_FILTERS.find((filter) => filter.id === activeFilter)?.label ?? "All",
    [activeFilter]
  );

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return points.filter((point) => {
      const filterMatch = activeFilter === "all" || point.type === activeFilter;

      const searchMatch =
        !q ||
        point.title.toLowerCase().includes(q) ||
        point.description.toLowerCase().includes(q) ||
        point.type.toLowerCase().includes(q);

      return filterMatch && searchMatch;
    });
  }, [points, activeFilter, searchQuery]);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return filteredPoints.slice(0, 6);
  }, [filteredPoints, searchQuery]);

  const addToDayPlan = (point: MapPoint) => {
    setDayPlan((current) => {
      const next = current.some((item) => item.id === point.id)
        ? current
        : [...current, point];

      window.localStorage.setItem("viNavigatorDayPlan", JSON.stringify(next));

      return next;
    });

    navigate("/cruise");
  };

  return (
    <main className="min-h-screen bg-stone-50 pb-28">
      <section className="px-4 pt-6">
        <div className="rounded-3xl bg-emerald-950 p-5 text-white shadow-xl">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
            Live Map
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Explore the Virgin Islands
          </h1>

          <p className="mt-2 text-sm text-emerald-50">
            Search beaches, ports, historic sites, food, events, and visitor
            places.
          </p>

          {dayPlan.length > 0 && (
            <div className="mt-4 rounded-2xl bg-white/10 p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-100">
                Day Plan
              </p>
              <p className="mt-1 text-sm font-bold text-white">
                {dayPlan.length} stop{dayPlan.length === 1 ? "" : "s"} added
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="mt-5 px-4">
        <div className="relative mb-3">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search Magens Bay, ferry, history..."
            className="w-full rounded-2xl bg-white py-4 pl-12 pr-12 text-sm font-bold text-stone-900 shadow outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedPoint(null);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400"
            >
              <X size={18} />
            </button>
          )}

          {searchResults.length > 0 && (
            <div className="absolute inset-x-0 top-full z-[700] mt-2 overflow-hidden rounded-3xl bg-white shadow-2xl">
              {searchResults.map((point) => (
                <button
                  key={`${point.type}-${point.id}`}
                  onClick={() => {
                    setSelectedPoint(point);
                    setSearchQuery(point.title);
                  }}
                  className="w-full border-b border-stone-100 p-4 text-left last:border-b-0"
                >
                  <p className="text-sm font-black text-stone-950">
                    {point.title}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                    {point.type}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-3">
          {MAP_FILTERS.map((filter) => (
            <button
              key={filter.id}
              onClick={() => {
                setActiveFilter(filter.id);
                setSelectedPoint(null);
              }}
              className={`shrink-0 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-[0.18em] shadow ${
                activeFilter === filter.id
                  ? "bg-emerald-950 text-white"
                  : "bg-white text-stone-500"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative h-[68vh] overflow-hidden rounded-3xl bg-stone-200 shadow-2xl">
          <IslandMap
            selectedIsland={selectedIsland}
            activeFilter={activeFilter}
            selectedPointId={selectedPoint?.id ?? null}
            points={filteredPoints}
            onSelectPoint={setSelectedPoint}
          />

          <div className="absolute left-3 top-3 z-[500] rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
              Showing
            </p>
            <p className="text-sm font-bold text-stone-950">
              {loading
                ? "Loading..."
                : `${activeLabel} • ${filteredPoints.length}`}
            </p>
          </div>

          {error && (
            <div className="absolute inset-x-3 top-24 z-[500] rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 shadow-xl">
              {error}
            </div>
          )}

          {!loading && !error && filteredPoints.length === 0 && (
            <div className="absolute inset-x-3 bottom-3 z-[500] rounded-3xl bg-white p-4 text-sm font-bold text-stone-700 shadow-2xl">
              No places match this search or filter.
            </div>
          )}

          {selectedPoint && (
            <div className="absolute inset-x-3 bottom-3 z-[500] rounded-3xl bg-white p-4 shadow-2xl">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                    {selectedPoint.type}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-stone-950">
                    {selectedPoint.title}
                  </h2>
                </div>

                <button
                  onClick={() => setSelectedPoint(null)}
                  className="rounded-full bg-stone-100 p-2 text-stone-500"
                >
                  <X size={16} />
                </button>
              </div>

              <p className="mt-2 text-sm text-stone-600">
                {selectedPoint.description}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button
                  onClick={() => addToDayPlan(selectedPoint)}
                  className="rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-bold text-white"
                >
                  Add to Day Plan
                </button>
                <button
                  onClick={() => openDirections(selectedPoint)}
                  className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-bold text-stone-800"
                >
                  Directions
                </button>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
