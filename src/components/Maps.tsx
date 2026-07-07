import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Compass,
  Landmark,
  MapPin,
  Search,
  Ship,
  Target,
  Sparkles,
  Umbrella,
  Utensils,
  X,
} from "lucide-react";

import IslandMap, {
  MAP_FILTERS,
  getMapMarkerStyle,
  type MapFilter,
  type MapPoint,
  type MapStyleMode,
} from "./maps/IslandMap";
import { useMapPoints } from "../hooks/useMapPoints";
import { trackMapLeadAction } from "../lib/businessDemo/mapLeadTracking";
import type { IslandCode } from "../types";

type MapsProps = {
  selectedIsland: IslandCode;
  user: unknown;
};

const islandName: Record<string, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

const styleOptions: Array<{ id: MapStyleMode; label: string }> = [
  { id: "streets", label: "Street" },
  { id: "outdoors", label: "Terrain" },
  { id: "satellite", label: "Satellite" },
];

function openDirections(point: MapPoint) {
  void trackMapLeadAction({
    action: "directions_click",
    point,
    source: "map_directions_button",
  });

  const url = `https://www.google.com/maps/search/?api=1&query=${point.lat},${point.lng}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

function iconForFilter(filter: MapFilter) {
  if (filter === "beach") return Umbrella;
  if (filter === "history") return Landmark;
  if (filter === "transport") return Ship;
  if (filter === "food") return Utensils;
  if (filter === "event") return CalendarDays;
  if (filter === "attraction") return Sparkles;
  return Compass;
}

export default function Maps({ selectedIsland }: MapsProps) {
  const [activeFilter, setActiveFilter] = useState<MapFilter>("all");
  const [selectedPoint, setSelectedPoint] = useState<MapPoint | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dayPlan, setDayPlan] = useState<MapPoint[]>(() => {
    try {
      return JSON.parse(
        window.localStorage.getItem("viNavigatorDayPlan") || "[]"
      );
    } catch {
      return [];
    }
  });
  const [mapStyleMode, setMapStyleMode] = useState<MapStyleMode>("streets");
  const [fitToResultsTrigger, setFitToResultsTrigger] = useState(0);

  const navigate = useNavigate();
  const { points, loading, error } = useMapPoints(selectedIsland);

  const selectPoint = (
    point: MapPoint,
    source:
      | "map_marker_select"
      | "search_result_select"
      | "featured_card_select"
      | "day_plan_select" = "map_marker_select"
  ) => {
    setSelectedPoint(point);
    void trackMapLeadAction({
      action: source,
      point,
      source: `map_${source}`,
    });
  };

  const activeLabel = useMemo(
    () =>
      MAP_FILTERS.find((filter) => filter.id === activeFilter)?.label ?? "All",
    [activeFilter]
  );

  const counts = useMemo(() => {
    const next: Record<string, number> = {
      all: points.length,
    };

    for (const point of points) {
      next[point.type] = (next[point.type] || 0) + 1;
    }

    return next;
  }, [points]);

  const filteredPoints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return points.filter((point) => {
      const filterMatch =
        activeFilter === "all" || point.type === activeFilter;

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

    return filteredPoints.slice(0, 8);
  }, [filteredPoints, searchQuery]);

  const featuredPoints = useMemo(() => {
    return filteredPoints.slice(0, 6);
  }, [filteredPoints]);

  const addToDayPlan = (point: MapPoint) => {
    void trackMapLeadAction({
      action: "day_plan_save",
      point,
      source: "map_day_plan_button",
    });

    setDayPlan((current) => {
      const next = current.some((item) => item.id === point.id)
        ? current
        : [...current, point];

      window.localStorage.setItem("viNavigatorDayPlan", JSON.stringify(next));

      return next;
    });
  };

  const clearDayPlan = () => {
    setDayPlan([]);
    window.localStorage.removeItem("viNavigatorDayPlan");
  };

  const requestRideToPoint = (point: MapPoint) => {
    void trackMapLeadAction({
      action: "ride_request_start",
      point,
      source: "map_request_ride_button",
    });

    window.localStorage.setItem(
      "viNavigatorRideDestination",
      JSON.stringify({
        title: point.title,
        lat: point.lat,
        lng: point.lng,
        type: point.type,
      })
    );

    navigate("/mobility");
  };

  return (
    <main className="min-h-screen bg-[#f8f0da] pb-72 text-ink">
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="overflow-hidden rounded-[2.75rem] bg-ink text-white shadow-2xl">
          <div className="grid gap-6 p-5 md:p-8 lg:grid-cols-[1fr_0.8fr] lg:p-10">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-turquoise/15 px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-turquoise">
                <MapPin className="h-4 w-4" />
                Live Island Map
              </div>

              <h1 className="mt-5 text-4xl font-black leading-tight md:text-6xl">
                Explore {islandName[selectedIsland] || "the Virgin Islands"}.
              </h1>

              <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 md:text-base">
                Search beaches, ports, restaurants, historic sites, events, and
                visitor places. Tap a marker to plan a stop, get directions, or
                request a ride.
              </p>

              <div className="mt-7 grid gap-3 sm:grid-cols-3">
                <HeroStat label="Places" value={points.length} />
                <HeroStat label="Showing" value={filteredPoints.length} />
                <HeroStat label="Day Plan" value={dayPlan.length} />
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => navigate("/map-intent")}
                  className="inline-flex items-center gap-2 rounded-2xl bg-turquoise px-5 py-3 text-sm font-black text-ink active:scale-95"
                >
                  View Map Intent Dashboard
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <aside className="rounded-[2.25rem] bg-white p-5 text-ink">
              <p className="text-xs font-black uppercase tracking-[0.24em] text-emerald-700">
                Map controls
              </p>
              <h2 className="mt-2 text-3xl font-black">Choose your view.</h2>

              <div className="mt-5 grid grid-cols-3 gap-2">
                {styleOptions.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setMapStyleMode(style.id)}
                    className={[
                      "rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-[0.16em] active:scale-95",
                      mapStyleMode === style.id
                        ? "bg-emerald-700 text-white"
                        : "bg-stone-100 text-stone-600",
                    ].join(" ")}
                  >
                    {style.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 rounded-[2rem] bg-stone-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-stone-400">
                  Legend
                </p>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  {MAP_FILTERS.filter((filter) => filter.id !== "all").map(
                    (filter) => {
                      const style = getMapMarkerStyle(
                        filter.id as Exclude<MapFilter, "all">
                      );
                      const Icon = style.icon;

                      return (
                        <div
                          key={filter.id}
                          className="flex items-center gap-2 rounded-xl bg-white px-3 py-2"
                        >
                          <span
                            className="grid h-7 w-7 place-items-center rounded-full text-white"
                            style={{ background: style.background }}
                          >
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-xs font-black">
                            {filter.label}
                          </span>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>

        <section className="mt-5 rounded-[2.5rem] bg-white p-4 shadow-xl md:p-5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search Magens Bay, ferry, history, food..."
              className="w-full rounded-2xl border border-stone-100 bg-stone-50 py-4 pl-12 pr-12 text-sm font-bold text-stone-900 outline-none ring-emerald-700/20 focus:ring-4"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedPoint(null);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white p-2 text-stone-400 shadow"
              >
                <X size={18} />
              </button>
            )}

            {searchResults.length > 0 && (
              <div className="absolute inset-x-0 top-full z-[900] mt-2 overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-stone-100">
                {searchResults.map((point) => {
                  const style = getMapMarkerStyle(point.type);
                  const Icon = style.icon;

                  return (
                    <button
                      key={`${point.type}-${point.id}`}
                      onClick={() => {
                        selectPoint(point, "search_result_select");
                        setSearchQuery(point.title);
                      }}
                      className="flex w-full items-start gap-3 border-b border-stone-100 p-4 text-left last:border-b-0 hover:bg-stone-50"
                    >
                      <span
                        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
                        style={{ background: style.background }}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <span>
                        <p className="text-sm font-black text-stone-950">
                          {point.title}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-700">
                          {point.type}
                        </p>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {MAP_FILTERS.map((filter) => {
              const Icon = iconForFilter(filter.id);
              const active = activeFilter === filter.id;

              return (
                <button
                  key={filter.id}
                  onClick={() => {
                    setActiveFilter(filter.id);
                    setSelectedPoint(null);
                  }}
                  className={[
                    "inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-3 text-xs font-black uppercase tracking-[0.16em] shadow-sm active:scale-95",
                    active
                      ? "bg-emerald-950 text-white"
                      : "bg-stone-50 text-stone-500",
                  ].join(" ")}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                  <span
                    className={[
                      "rounded-full px-2 py-0.5 text-[10px]",
                      active
                        ? "bg-white/15 text-white"
                        : "bg-white text-stone-500",
                    ].join(" ")}
                  >
                    {counts[filter.id] || 0}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setFitToResultsTrigger((value) => value + 1)}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-950 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-white shadow-sm active:scale-95"
            >
              <Target className="h-4 w-4" />
              Zoom to Results
            </button>

            <p className="text-xs font-bold text-stone-500">
              Tap a cluster to zoom in. Tap an icon to plan, route, or request a ride.
            </p>
          </div>

          <div className="relative h-[72vh] min-h-[620px] overflow-hidden rounded-[2rem] bg-stone-200 shadow-2xl">
            <IslandMap
              selectedIsland={selectedIsland}
              activeFilter={activeFilter}
              selectedPointId={selectedPoint?.id ?? null}
              points={filteredPoints}
              mapStyleMode={mapStyleMode}
              fitToResultsTrigger={fitToResultsTrigger}
              onSelectPoint={(point) => selectPoint(point, "map_marker_select")}
            />

            <div className="absolute left-4 top-4 z-[500] rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Showing
              </p>
              <p className="text-sm font-black text-stone-950">
                {loading
                  ? "Loading..."
                  : `${activeLabel} • ${filteredPoints.length}`}
              </p>
            </div>

            <div className="absolute right-4 top-4 z-[500] hidden rounded-2xl bg-white/95 px-4 py-3 shadow-xl backdrop-blur md:block">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                Island
              </p>
              <p className="text-sm font-black text-stone-950">
                {islandName[selectedIsland] || "Virgin Islands"}
              </p>
            </div>

            {error && (
              <div className="absolute inset-x-4 top-24 z-[500] rounded-2xl bg-red-50 p-4 text-sm font-bold text-red-700 shadow-xl">
                {error}
              </div>
            )}

            {!loading && !error && filteredPoints.length === 0 && (
              <div className="absolute inset-x-4 bottom-4 z-[500] rounded-3xl bg-white p-4 text-sm font-bold text-stone-700 shadow-2xl">
                No places match this search or filter.
              </div>
            )}

            {selectedPoint && (
              <div className="absolute inset-x-4 bottom-28 z-[600] rounded-[2rem] bg-white p-4 shadow-2xl md:bottom-4 md:left-auto md:w-[420px]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <PointTypeBadge type={selectedPoint.type} />
                    <h2 className="mt-2 text-2xl font-black text-stone-950">
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

                <p className="mt-3 text-sm font-bold leading-6 text-stone-600">
                  {selectedPoint.description}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => addToDayPlan(selectedPoint)}
                    className="rounded-2xl bg-emerald-950 px-4 py-3 text-sm font-black text-white active:scale-95"
                  >
                    Add to Plan
                  </button>
                  <button
                    onClick={() => openDirections(selectedPoint)}
                    className="rounded-2xl bg-stone-100 px-4 py-3 text-sm font-black text-stone-800 active:scale-95"
                  >
                    Directions
                  </button>
                  <button
                    onClick={() => requestRideToPoint(selectedPoint)}
                    className="col-span-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-turquoise px-4 py-3 text-sm font-black text-ink active:scale-95"
                  >
                    Request Ride Here
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid gap-4 pb-40 md:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Day Plan
            </p>
            <h2 className="mt-2 text-3xl font-black">
              {dayPlan.length} stop{dayPlan.length === 1 ? "" : "s"}
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-stone-600">
              Add places from the map to build a visitor route, cruise day, or
              local itinerary.
            </p>

            {dayPlan.length > 0 ? (
              <div className="mt-4 space-y-2">
                {dayPlan.slice(0, 5).map((point, index) => (
                  <button
                    key={`${point.id}-${index}`}
                    onClick={() => selectPoint(point, "featured_card_select")}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl bg-stone-50 px-4 py-3 text-left"
                  >
                    <span>
                      <span className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                        Stop {index + 1}
                      </span>
                      <span className="mt-1 block text-sm font-black text-stone-950">
                        {point.title}
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-stone-400" />
                  </button>
                ))}

                {dayPlan.length > 5 ? (
                  <p className="text-xs font-bold text-stone-500">
                    +{dayPlan.length - 5} more stop
                    {dayPlan.length - 5 === 1 ? "" : "s"}
                  </p>
                ) : null}

                <div className="flex flex-wrap gap-2 pt-2">
                  <button
                    onClick={() => navigate("/cruise")}
                    className="inline-flex items-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-black text-white active:scale-95"
                  >
                    Open Day Plan
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={clearDayPlan}
                    className="rounded-2xl bg-stone-100 px-5 py-3 text-sm font-black text-stone-700 active:scale-95"
                  >
                    Clear
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-stone-50 p-4">
                <p className="text-sm font-bold leading-6 text-stone-600">
                  Tap any marker and add it to your plan. This turns the map
                  into an itinerary builder.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-xl">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
              Featured nearby
            </p>
            <h2 className="mt-2 text-3xl font-black">
              Places to explore
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {featuredPoints.map((point) => (
                <button
                  key={point.id}
                  onClick={() => selectPoint(point, "featured_card_select")}
                  className="rounded-2xl bg-stone-50 p-4 text-left transition hover:-translate-y-1 active:scale-[0.99]"
                >
                  <PointTypeBadge type={point.type} />
                  <p className="mt-2 text-sm font-black text-stone-950">
                    {point.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs font-bold leading-5 text-stone-500">
                    {point.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function HeroStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[2rem] bg-white/10 p-4">
      <p className="text-4xl font-black">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-white/50">
        {label}
      </p>
    </div>
  );
}

function PointTypeBadge({ type }: { type: Exclude<MapFilter, "all"> }) {
  const style = getMapMarkerStyle(type);
  const Icon = style.icon;

  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-stone-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-stone-600">
      <span
        className="grid h-5 w-5 place-items-center rounded-full text-white"
        style={{ background: style.background }}
      >
        <Icon className="h-3 w-3" />
      </span>
      {style.label}
    </span>
  );
}
