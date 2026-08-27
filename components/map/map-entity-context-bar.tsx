"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  MapPin,
  MessageCircleMore,
  Navigation,
  Route,
} from "lucide-react";

import { AddToJourneyButton } from "@/components/journey/add-to-journey-button";
import { SavePlaceButton } from "@/components/place/save-place-button";
import { buildContextualConciergeHref } from "@/lib/place/concierge-links";
import type { JourneyStopInput } from "@/lib/journey-planner";
import { buildMobilityRideHref } from "@/lib/mobility/ride-links";
import type { TerritoryMapPlaceType } from "@/types/territory-map";

export function MapEntityContextBar() {
  const searchParams = useSearchParams();
  const name = bounded(searchParams.get("placeName"), 220);
  const island = validIsland(searchParams.get("island"));
  const type = validType(searchParams.get("placeType"));
  const id = bounded(searchParams.get("place"), 180);

  if (!name || !island || !type || !id) return null;

  const mapHref = `/map?${searchParams.toString()}`;
  const detailHref = resolveDetailHref({
    type,
    slug: bounded(searchParams.get("placeSlug"), 220),
    href: safeInternalHref(searchParams.get("placeHref")),
  });
  const lat = finiteCoordinate(searchParams.get("placeLat"), -90, 90);
  const lng = finiteCoordinate(searchParams.get("placeLng"), -180, 180);
  const estateGeoid = bounded(searchParams.get("estate"), 180);
  const summary = bounded(searchParams.get("placeDescription"), 1000) || `${name} on ${islandLabel(island)}.`;
  // buildMobilityRideHref owns the canonical Mobility URL, including the #book anchor.
  const rideHref = buildMobilityRideHref({
    name,
    island,
    type,
    lat,
    lng,
    estateGeoid,
    source: "living-map",
    returnTo: mapHref,
  });
  const conciergeHref = buildContextualConciergeHref({
    name,
    island,
    mapHref,
    prompt: `Help me plan around ${name} on ${islandLabel(island)}. Include timing, access, nearby options, transportation, and a practical next step.`,
  });
  const stop: JourneyStopInput = {
    id,
    title: name,
    island,
    kind: type,
    summary,
    ...(typeof lat === "number" ? { lat } : {}),
    ...(typeof lng === "number" ? { lng } : {}),
    ...(detailHref ? { href: detailHref } : {}),
    mapHref,
  };

  return (
    <section className="relative z-[1240] mx-auto mb-3 max-w-7xl px-3 sm:px-5" aria-label={`Map actions for ${name}`}>
      <div className="overflow-hidden rounded-[26px] border border-[#0f766e]/15 bg-white/95 shadow-[0_18px_55px_rgba(4,51,49,.16)] backdrop-blur-xl">
        <div className="p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#043331] text-[#f5c451]">
              <MapPin className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase tracking-[.17em] text-teal-700">Selected · {typeLabel(type)} · {islandLabel(island)}</p>
              <h2 className="mt-1 truncate text-xl font-black tracking-[-.035em] text-[#043331]">{name}</h2>
              <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{summary}</p>
            </div>
            {detailHref ? (
              <Link href={detailHref} className="hidden min-h-10 shrink-0 items-center gap-1.5 rounded-full bg-[#043331] px-4 text-[8px] font-black uppercase tracking-[.12em] text-white sm:inline-flex">
                Details <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            <AddToJourneyButton stop={stop} className="min-h-12 px-3" />
            <Link href={rideHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-3 text-[9px] font-black uppercase tracking-[.1em] text-[#043331]">
              <Navigation className="h-4 w-4" /> Get official ride price
            </Link>
            <Link href={conciergeHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#0f766e] px-3 text-[9px] font-black uppercase tracking-[.1em] text-white">
              <MessageCircleMore className="h-4 w-4" /> Ask AI
            </Link>
            {detailHref ? (
              <Link href={detailHref} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-3 text-[9px] font-black uppercase tracking-[.1em] text-white sm:hidden">
                Explore <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link href="/planner" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-[.1em] text-[#043331]">
                <Route className="h-4 w-4 text-teal-700" /> My Trip
              </Link>
            )}
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <SavePlaceButton
              place={{
                id,
                title: name,
                island,
                kind: type,
                summary,
                ...(detailHref ? { href: detailHref } : {}),
                mapHref,
                rideHref,
                ...(typeof lat === "number" ? { lat } : {}),
                ...(typeof lng === "number" ? { lng } : {}),
              }}
              compact
              className="min-h-9 px-3"
            />
            <Link href="/planner" className="inline-flex min-h-9 items-center gap-2 rounded-full px-3 text-[8px] font-black uppercase tracking-[.12em] text-teal-800">
              <Route className="h-3.5 w-3.5" /> Open My Trip
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function resolveDetailHref({ type, slug, href }: { type: TerritoryMapPlaceType; slug: string; href: string }) {
  if (href) return href;
  if (!slug) return "";
  if (type === "beach") return `/beaches/${encodeURIComponent(slug)}`;
  if (type === "stay") return `/accommodations/${encodeURIComponent(slug)}`;
  if (type === "historic") return `/historic/${encodeURIComponent(slug)}`;
  return `/places/${encodeURIComponent(slug)}`;
}

function bounded(value: string | null, max: number) { return (value?.trim() || "").slice(0, max); }
function safeInternalHref(value: string | null) { const normalized = value?.trim() || ""; return !normalized.startsWith("/") || normalized.startsWith("//") ? "" : normalized.slice(0, 800); }
function finiteCoordinate(value: string | null, minimum: number, maximum: number) { if (value === null) return undefined; const parsed = Number(value); return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : undefined; }
function validIsland(value: string | null): "stt" | "stj" | "stx" | null { return value === "stt" || value === "stj" || value === "stx" ? value : null; }
function validType(value: string | null): TerritoryMapPlaceType | null { return value === "place" || value === "beach" || value === "stay" || value === "historic" ? value : null; }
function islandLabel(island: "stt" | "stj" | "stx") { return island === "stj" ? "St. John" : island === "stx" ? "St. Croix" : "St. Thomas"; }
function typeLabel(type: TerritoryMapPlaceType) { return type === "beach" ? "Beach" : type === "stay" ? "Stay" : type === "historic" ? "Historic" : "Place"; }
