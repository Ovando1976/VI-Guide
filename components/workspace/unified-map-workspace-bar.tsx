"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Map,
  MapPin,
  Navigation,
  Route,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo } from "react";

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
  { id: "timeline", label: "Timeline", icon: CalendarDays },
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
    (searchParams.get("estate") ? "Selected estate" : "No place selected");

  return (
    <aside className="fixed inset-x-3 top-3 z-[1400] mx-auto max-w-6xl rounded-[24px] border border-white/70 bg-[#073b39]/95 p-3 text-white shadow-[0_20px_70px_rgba(4,51,49,.30)] backdrop-blur-xl sm:inset-x-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#f5c451] text-[#493300]">
            <Route size={19} />
          </span>
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-[.18em] text-[#f5c451]">Unified trip workspace</p>
            <div className="mt-1 flex min-w-0 items-center gap-2 text-sm font-black">
              <MapPin size={14} className="shrink-0 text-cyan-200" />
              <span className="truncate">{selectionLabel}</span>
              <span className="shrink-0 text-white/35">·</span>
              <span className="shrink-0 text-white/65">{ISLAND_LABELS[island]}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 lg:pb-0">
          {(Object.keys(ISLAND_LABELS) as IslandCode[]).map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => changeIsland(code)}
              className={`shrink-0 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] ${
                island === code ? "bg-white text-[#073b39]" : "bg-white/[.07] text-white/60"
              }`}
            >
              {code.toUpperCase()}
            </button>
          ))}
        </div>

        <nav className="flex gap-1 overflow-x-auto pb-1 lg:pb-0" aria-label="Workspace panels">
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
            const className = `inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] ${
              active ? "bg-[#f5c451] text-[#493300]" : "bg-white/[.07] text-white/65"
            }`;
            return href ? (
              <Link key={id} href={href} onClick={() => setActivePanel(id)} className={className}>
                <Icon size={13} /> {label}
              </Link>
            ) : (
              <button key={id} type="button" onClick={() => setActivePanel(id)} className={className}>
                <Icon size={13} /> {label}
              </button>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 text-[9px] font-black uppercase tracking-[.12em] text-white/55">
          <Navigation size={13} className="text-cyan-200" />
          {pickupGeoid && destinationGeoid ? "Route ready" : "Route not set"}
          <span className="text-white/25">·</span>
          {state.tripItemCount} saved
        </div>
      </div>
    </aside>
  );
}
