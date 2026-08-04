"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  MapPinned,
  Navigation,
  Save,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  createLivingMapFocusDetail,
  dispatchIntelligenceMapFocus,
  dispatchLivingMapFocus,
  type LivingMapFocusItem,
} from "@/lib/intelligence/map-focus-events";
import {
  createJourneyPlan,
  upsertJourneyPlan,
} from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

export function ItineraryTimeline({
  plan,
  onSelectStop,
}: {
  plan: IntelligencePlanStop[];
  onSelectStop(stop: IntelligencePlanStop): void;
}) {
  const [stops, setStops] = useState(plan);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setStops(plan);
    setSaved(false);
  }, [plan]);

  const positionedStops = useMemo(
    () =>
      stops.filter(
        (stop) =>
          typeof stop.lat === "number" && typeof stop.lng === "number",
      ),
    [stops],
  );

  function selectStop(stop: IntelligencePlanStop) {
    dispatchIntelligenceMapFocus(stop, "concierge-itinerary");
    onSelectStop(stop);
  }

  function updateStops(next: IntelligencePlanStop[]) {
    setStops(next);
    setSaved(false);
    const detail = createLivingMapFocusDetail(
      next.map(stopToMapFocusItem),
      "concierge-itinerary",
      next[0]?.placeId ?? next[0]?.id,
    );
    if (detail) dispatchLivingMapFocus(detail);
  }

  function move(index: number, offset: -1 | 1) {
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= stops.length) return;
    const next = [...stops];
    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
    updateStops(next);
  }

  function remove(index: number) {
    updateStops(stops.filter((_, candidateIndex) => candidateIndex !== index));
  }

  function showWholeTrip() {
    const detail = createLivingMapFocusDetail(
      positionedStops.map(stopToMapFocusItem),
      "concierge-itinerary",
      positionedStops[0]?.placeId ?? positionedStops[0]?.id,
    );
    if (detail) dispatchLivingMapFocus(detail);
  }

  function saveTrip() {
    if (!stops.length) return;
    const journey = createJourneyPlan(stops[0]?.island ?? "stt", "VI Mission itinerary");
    upsertJourneyPlan({
      ...journey,
      status: "ready",
      plan: stops,
      notes: "Edited and saved from the VI Concierge smart timeline.",
    });
    setSaved(true);
  }

  if (!stops.length) {
    return (
      <div className="rounded-[22px] border border-dashed border-white/10 bg-white/[.025] px-4 py-6 text-center text-xs font-semibold text-white/40">
        This itinerary has no stops. Ask the Concierge to rebuild the mission.
      </div>
    );
  }

  return (
    <section className="overflow-hidden rounded-[22px] border border-white/10 bg-white/[.04]">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-100/45">
            Smart timeline
          </div>
          <div className="mt-1 text-xs font-bold text-white/70">
            {stops.length} {stops.length === 1 ? "stop" : "stops"} · reorder, review, and save
          </div>
        </div>
        <div className="flex items-center gap-2">
          {positionedStops.length ? (
            <button
              type="button"
              onClick={showWholeTrip}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-[9px] font-black text-white/60 transition hover:border-cyan-300/30 hover:text-cyan-100"
            >
              <MapPinned size={13} /> Show route
            </button>
          ) : null}
          <button
            type="button"
            onClick={saveTrip}
            className={`inline-flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-[9px] font-black transition ${
              saved
                ? "bg-emerald-300/15 text-emerald-100"
                : "bg-cyan-300 text-[#05242c] hover:bg-cyan-200"
            }`}
          >
            {saved ? <Check size={13} /> : <Save size={13} />}
            {saved ? "Saved" : "Save trip"}
          </button>
        </div>
      </div>

      <ol className="px-4 py-3">
        {stops.map((stop, index) => (
          <li key={stop.id} className="relative pl-7">
            {index ? (
              <div className="pb-2 text-[10px] font-bold text-white/35">
                <span className="absolute bottom-0 left-[5px] top-0 w-px bg-gradient-to-b from-cyan-300/40 to-white/10" />
                <span className="inline-flex items-center gap-1.5">
                  <Navigation size={10} /> {travelLabel(stop)}
                </span>
              </div>
            ) : null}

            <div className="group relative rounded-xl px-2 py-2.5 transition hover:bg-white/[.055]">
              <span className="absolute -left-[25px] top-4 grid h-4 w-4 place-items-center rounded-full border-2 border-[#09202a] bg-cyan-300 text-[8px] font-black text-[#05242c] shadow-[0_0_0_2px_rgba(103,232,249,.2)]">
                {index + 1}
              </span>

              <button
                type="button"
                onClick={() => selectStop(stop)}
                className="w-full text-left"
              >
                <span className="flex items-center justify-between gap-3">
                  <strong className="text-sm text-white/90 group-hover:text-cyan-100">
                    {stop.title}
                  </strong>
                  {stop.startTime ? (
                    <small className="inline-flex shrink-0 items-center gap-1 text-[9px] font-bold text-white/35">
                      <Clock3 size={10} /> {stop.startTime}
                    </small>
                  ) : null}
                </span>
                <span className="mt-0.5 block line-clamp-2 text-[10px] font-medium leading-4 text-white/40">
                  {stop.summary}
                </span>
              </button>

              <div className="mt-2 flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/45 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                  aria-label={`Move ${stop.title} earlier`}
                >
                  <ArrowUp size={13} />
                </button>
                <button
                  type="button"
                  disabled={index === stops.length - 1}
                  onClick={() => move(index, 1)}
                  className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-white/45 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-20"
                  aria-label={`Move ${stop.title} later`}
                >
                  <ArrowDown size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="ml-auto grid h-8 w-8 place-items-center rounded-lg border border-rose-200/10 text-rose-100/45 transition hover:bg-rose-300/10 hover:text-rose-100"
                  aria-label={`Remove ${stop.title}`}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function stopToMapFocusItem(stop: IntelligencePlanStop): LivingMapFocusItem {
  return {
    id: stop.placeId ?? stop.id,
    title: stop.title,
    kind: stop.kind,
    island: stop.island,
    ...(typeof stop.lat === "number" ? { lat: stop.lat } : {}),
    ...(typeof stop.lng === "number" ? { lng: stop.lng } : {}),
    ...(stop.href ? { href: stop.href } : {}),
    ...(stop.mapHref ? { mapHref: stop.mapHref } : {}),
    ...(stop.summary ? { summary: stop.summary } : {}),
  };
}

function travelLabel(stop: IntelligencePlanStop) {
  if (!stop.mobility) {
    return stop.durationMinutes ? `${stop.durationMinutes} min` : "Next stop";
  }
  const duration = stop.mobility.estimatedMinutes
    ? `${stop.mobility.estimatedMinutes} min `
    : "";
  return `${duration}${stop.mobility.mode.replaceAll("_", " ")}`;
}
