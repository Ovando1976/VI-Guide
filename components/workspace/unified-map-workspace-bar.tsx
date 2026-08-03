"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Map,
  MapPin,
  Navigation,
  Route,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { TRIP_STORAGE_KEY, type TripItem } from "@/components/trip-planner/trip-types";
import { useUnifiedWorkspace } from "@/components/workspace/unified-workspace-controller";
import type { TerritoryMapLens, TerritoryMapSelection } from "@/types/territory-map";
import type { IslandCode } from "@/types/usvi";

const ISLAND_LABELS: Record<IslandCode, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const PANELS = [
  { id: "map", label: "Map", icon: Map },
  { id: "timeline", label: "Today", icon: CalendarDays },
  { id: "actions", label: "Actions", icon: CheckCircle2 },
  { id: "concierge", label: "Concierge", icon: Sparkles },
] as const;

function validIsland(value: string | null): IslandCode {
  return value === "stj" || value === "stx" ? value : "stt";
}

function validLens(value: string | null): TerritoryMapLens {
  return value === "beaches" ||
    value === "stays" ||
    value === "historic" ||
    value === "drivers" ||
    value === "demand"
    ? value
    : "places";
}

function parsePlace(params: URLSearchParams): TerritoryMapSelection | null {
  const id = params.get("place")?.trim();
  const name = params.get("placeName")?.trim();
  const type = params.get("placeType");
  const lat = Number(params.get("placeLat"));
  const lng = Number(params.get("placeLng"));

  if (
    !id ||
    !name ||
    (type !== "beach" && type !== "place" && type !== "stay" && type !== "historic") ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng)
  ) {
    return null;
  }

  return { id, name, type, lat, lng };
}

function readTripCount() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(TRIP_STORAGE_KEY) ?? "[]") as TripItem[];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function UnifiedMapWorkspaceBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state, patch, setActivePanel } = useUnifiedWorkspace();
  const [expanded, setExpanded] = useState(false);

  const island = validIsland(searchParams.get("island"));
  const lens = validLens(searchParams.get("lens") ?? searchParams.get("filter"));
  const selectedPlace = useMemo(
    () => parsePlace(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const pickupGeoid = searchParams.get("pickup")?.trim() || null;
  const destinationGeoid = searchParams.get("destination")?.trim() || null;

  useEffect(() => {
    patch({
      island,
      lens,
      selection: selectedPlace,
      pickupGeoid,
      destinationGeoid,
      tripItemCount: readTripCount(),
    });
  }, [destinationGeoid, island, lens, patch, pickupGeoid, selectedPlace]);

  useEffect(() => {
    const syncTrip = () => patch({ tripItemCount: readTripCount() });
    window.addEventListener("vi-guide-trip-updated", syncTrip);
    window.addEventListener("storage", syncTrip);
    return () => {
      window.removeEventListener("vi-guide-trip-updated", syncTrip);
      window.removeEventListener("storage", syncTrip);
    };
  }, [patch]);

  function changeIsland(nextIsland: IslandCode) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("island", nextIsland);
    params.delete("estate");
    params.delete("place");
    params.delete("placeName");
    params.delete("placeType");
    params.delete("placeLat");
    params.delete("placeLng");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    patch({ island: nextIsland, selection: null, lastAction: "island.changed" });
  }

  const selectionLabel =
    selectedPlace?.name ??
    (searchParams.get("estate") ? "Selected estate" : "Choose a destination");

  const briefing = selectedPlace
    ? `Explore ${selectedPlace.name}, add it to today, or prepare a route.`
    : `Start with a beach, stay, historic site, or local favorite on ${ISLAND_LABELS[island]}.`;

  return (
    <aside
      className={`fixed inset-x-3 top-[max(.75rem,env(safe-area-inset-top))] z-[1400] mx-auto max-w-5xl overflow-hidden rounded-[22px] border border-white/50 bg-[#073b39]/96 text-white shadow-[0_16px_55px_rgba(4,51,49,.28)] backdrop-blur-xl transition-[max-height,padding] duration-300 sm:inset-x-5 ${
        expanded ? "max-h-[360px] p-3" : "max-h-[92px] p-2.5"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[15px] bg-[#f5c451] text-[#493300] shadow-sm">
          <Route size={18} />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <MapPin size={13} className="shrink-0 text-cyan-200" />
            <p className="truncate text-sm font-black tracking-[-.02em]">{selectionLabel}</p>
            <span className="shrink-0 rounded-full bg-white/[.08] px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-white/65">
              {island.toUpperCase()}
            </span>
          </div>
          <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] font-semibold text-white/58">
            <Sparkles size={11} className="shrink-0 text-[#f5c451]" />
            <span className="truncate">{briefing}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/[.08] text-white/75 transition hover:bg-white/[.14]"
          aria-expanded={expanded}
          aria-label={expanded ? "Collapse trip workspace" : "Expand trip workspace"}
        >
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      <div
        className={`grid transition-[grid-template-rows,opacity,margin] duration-300 ${
          expanded ? "mt-3 grid-rows-[1fr] opacity-100" : "mt-0 grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[8px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                Island workspace
              </p>
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.12em] text-white/45">
                <Navigation size={11} className="text-cyan-200" />
                {pickupGeoid && destinationGeoid ? "Route ready" : "Route not set"}
                <span className="text-white/20">·</span>
                {state.tripItemCount} saved
              </div>
            </div>

            <div className="mt-3 flex gap-1 overflow-x-auto pb-1">
              {(Object.keys(ISLAND_LABELS) as IslandCode[]).map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => changeIsland(code)}
                  className={`shrink-0 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] transition ${
                    island === code
                      ? "bg-white text-[#073b39]"
                      : "bg-white/[.07] text-white/58 hover:bg-white/[.12]"
                  }`}
                >
                  {ISLAND_LABELS[code]}
                </button>
              ))}
            </div>

            <nav className="mt-2 grid grid-cols-4 gap-1.5" aria-label="Workspace panels">
              {PANELS.map(({ id, label, icon: Icon }) => {
                const active = state.activePanel === id;
                const href =
                  id === "map"
                    ? undefined
                    : id === "timeline"
                      ? "/today"
                      : id === "actions"
                        ? "/today#action-center"
                        : "/concierge";
                const className = `inline-flex min-h-11 items-center justify-center gap-1.5 rounded-[14px] px-2 text-[8px] font-black uppercase tracking-[.1em] transition ${
                  active
                    ? "bg-[#f5c451] text-[#493300]"
                    : "bg-white/[.07] text-white/62 hover:bg-white/[.12]"
                }`;

                return href ? (
                  <Link
                    key={id}
                    href={href}
                    onClick={() => setActivePanel(id)}
                    className={className}
                  >
                    <Icon size={13} /> {label}
                  </Link>
                ) : (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActivePanel(id)}
                    className={className}
                  >
                    <Icon size={13} /> {label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </aside>
  );
}
