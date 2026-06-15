import { useMemo, useState } from "react";
import {
  Anchor,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPinned,
  ShipWheel,
  Trash2,
} from "lucide-react";

import type { IslandCode } from "../types";
import {
  clearDayPlan,
  loadDayPlan,
  removePointFromDayPlan,
} from "../lib/dayPlanStorage";
import type { MapPoint } from "./maps/IslandMap";

type PlanStop = MapPoint & {
  distanceMiles?: number;
};

type TimeBlock = {
  id: string;
  label: string;
  time: string;
  description: string;
};

const DEFAULT_TIME_BLOCKS: TimeBlock[] = [
  {
    id: "arrival",
    time: "9:00 AM",
    label: "Ship Arrival",
    description: "Get off the ship, clear the pier area, and confirm return time.",
  },
  {
    id: "morning",
    time: "10:00 AM",
    label: "Morning Stop",
    description: "Start with the furthest or most important stop first.",
  },
  {
    id: "lunch",
    time: "12:30 PM",
    label: "Lunch",
    description: "Leave room for local food, traffic, and walking time.",
  },
  {
    id: "afternoon",
    time: "2:00 PM",
    label: "Afternoon Stop",
    description: "Keep this close enough to return safely.",
  },
  {
    id: "return",
    time: "3:30 PM",
    label: "Return Buffer",
    description: "Head back early. Never plan the last stop too close to sail time.",
  },
];

function islandLabel(island?: IslandCode | "all") {
  if (island === "st_thomas") return "St. Thomas";
  if (island === "st_john") return "St. John";
  if (island === "st_croix") return "St. Croix";
  if (island === "water_island") return "Water Island";
  return "Virgin Islands";
}

function categoryLabel(point: PlanStop) {
  return (
    point.sourceCategory ||
    point.sourceCollection ||
    point.type ||
    "place"
  )
    .replaceAll("_", " ")
    .replaceAll("-", " ");
}

export default function CruisePlanner({
  selectedIsland = "st_thomas",
}: {
  selectedIsland?: IslandCode;
}) {
  const [stops, setStops] = useState<PlanStop[]>(() => loadDayPlan() as PlanStop[]);
  const [message, setMessage] = useState("");

  const suggestedTimeline = useMemo(() => {
    return DEFAULT_TIME_BLOCKS.map((block, index) => ({
      ...block,
      stop: stops[index - 1] ?? null,
    }));
  }, [stops]);

  function handleClear() {
    clearDayPlan();
    setStops([]);
    setMessage("Your cruise day plan was cleared.");
  }

  function handleRemove(point: PlanStop) {
    const result = removePointFromDayPlan(point.id);
    setStops(result as PlanStop[]);
    setMessage(`${point.title} was removed from your plan.`);
  }

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-6 pb-32 text-stone-950">
      <section className="overflow-hidden rounded-[2rem] bg-sky-950 text-white shadow-2xl">
        <div className="bg-gradient-to-br from-sky-800 via-sky-950 to-stone-950 p-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white/10">
            <ShipWheel className="h-8 w-8 text-sky-200" />
          </div>

          <p className="mt-5 text-[10px] font-black uppercase tracking-[0.35em] text-sky-300">
            Cruise Planner
          </p>

          <h1 className="mt-3 text-4xl font-black leading-tight">
            Build your island day
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-sky-50">
            Plan a safe port-day route for {islandLabel(selectedIsland)} with
            saved stops, timeline buffers, and return-to-ship awareness.
          </p>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <StatCard value={stops.length} label="Stops" />
            <StatCard value="5" label="Blocks" />
            <StatCard value="Safe" label="Return" />
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-800">
          {message}
        </div>
      )}

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-700">
              Saved Stops
            </p>
            <h2 className="mt-1 text-3xl font-black">Your plan</h2>
          </div>

          {stops.length > 0 && (
            <button
              onClick={handleClear}
              className="rounded-2xl bg-red-50 px-4 py-3 text-xs font-black uppercase tracking-[0.16em] text-red-700"
              type="button"
            >
              Clear
            </button>
          )}
        </div>

        {stops.length === 0 ? (
          <div className="mt-4 rounded-[2rem] bg-white p-8 text-center shadow-xl">
            <Anchor className="mx-auto h-10 w-10 text-stone-300" />
            <h3 className="mt-4 text-xl font-black text-stone-950">
              No stops saved yet
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              Open the live map, choose places, and tap “Add to Trip” to build
              a cruise-day itinerary.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {stops.map((stop, index) => (
              <article
                key={stop.id}
                className="rounded-[2rem] bg-white p-5 shadow-xl"
              >
                <div className="flex gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sky-100 text-sky-900">
                    <span className="text-sm font-black">{index + 1}</span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-700">
                      {categoryLabel(stop)}
                    </p>

                    <h3 className="mt-1 text-xl font-black leading-tight">
                      {stop.title}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-stone-600">
                      {stop.description || "No description available yet."}
                    </p>

                    <div className="mt-3 flex items-center gap-2 text-xs font-bold text-stone-500">
                      <MapPinned className="h-4 w-4 text-emerald-700" />
                      {stop.lat?.toFixed?.(4)}, {stop.lng?.toFixed?.(4)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemove(stop)}
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-stone-100 text-stone-500"
                    type="button"
                    aria-label={`Remove ${stop.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-8">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-700">
          Suggested Timing
        </p>

        <h2 className="mt-1 text-3xl font-black">Port-day timeline</h2>

        <div className="mt-4 space-y-3">
          {suggestedTimeline.map((block) => (
            <article
              key={block.id}
              className="rounded-[2rem] bg-white p-5 shadow-xl"
            >
              <div className="flex gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800">
                  {block.stop ? (
                    <CheckCircle2 className="h-6 w-6" />
                  ) : (
                    <Clock3 className="h-6 w-6" />
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-emerald-700">
                    {block.time}
                  </p>

                  <h3 className="mt-1 text-xl font-black">{block.label}</h3>

                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {block.stop
                      ? `Suggested stop: ${block.stop.title}`
                      : block.description}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-[2rem] bg-amber-50 p-5 shadow-xl">
        <div className="flex gap-3">
          <CalendarDays className="h-6 w-6 shrink-0 text-amber-700" />

          <div>
            <h2 className="text-xl font-black text-amber-950">
              Return-to-ship rule
            </h2>

            <p className="mt-2 text-sm leading-relaxed text-amber-900">
              Always plan your final stop close to the pier and leave a return
              buffer. Island traffic, ferry timing, weather, and taxi
              availability can change quickly.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function StatCard({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-2xl bg-white/10 p-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-100">
        {label}
      </p>
    </div>
  );
}