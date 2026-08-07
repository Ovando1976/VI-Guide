"use client";

import Link from "next/link";
import {
  ArrowRight,
  Compass,
  MapPin,
  Navigation,
  Route,
  Sparkles,
} from "lucide-react";
import type { EstateRecord } from "@/types/usvi";
import type { TerritoryMapSelection } from "@/types/territory-map";

type Props = {
  islandTitle: string;
  islandFocus: string;
  signatureRoute: string;
  selectedEstate: EstateRecord | null;
  selectedPlace?: TerritoryMapSelection | null;
  selectedPlaceEstate?: EstateRecord | null;
  fromEstate: EstateRecord | null;
  toEstate: EstateRecord | null;
  estateTags: string[];
  neighboringEstates: EstateRecord[];
  onSelectNeighbor: (geoid: string) => void;
  onUseAsPickup: (geoid: string) => void;
  onUseAsDestination: (geoid: string) => void;
  routeReady: boolean;
};

export function TerritoryIntelligenceRail({
  islandTitle,
  islandFocus,
  signatureRoute,
  selectedEstate,
  selectedPlace = null,
  selectedPlaceEstate = null,
  fromEstate,
  toEstate,
  estateTags,
  neighboringEstates,
  onSelectNeighbor,
  onUseAsPickup,
  onUseAsDestination,
  routeReady,
}: Props) {
  const activeEstate = selectedEstate ?? selectedPlaceEstate;
  const title = routeReady
    ? `${fromEstate?.baseName} → ${toEstate?.baseName}`
    : selectedPlace?.name ?? selectedEstate?.baseName ?? islandTitle;

  const description = routeReady
    ? "Your island corridor is set. Keep the route with your trip, then continue into Mobility when you are ready to arrange the ride."
    : selectedPlace
      ? selectedPlace.description ??
        `This ${placeTypeLabel(selectedPlace.type).toLowerCase()} is active. Use the nearby estate to connect it to the rest of your island day.`
      : selectedEstate
        ? "This estate is active. Explore what surrounds it or make it part of your movement plan."
        : "Tap a place or estate on the map and VI Guide will turn the selection into useful local context.";

  return (
    <aside className="territory-story-rail space-y-4 xl:sticky xl:top-[166px] xl:h-fit">
      <section className="territory-story-card overflow-hidden rounded-[30px] border border-[#d8e7e3] bg-white shadow-[0_24px_65px_rgba(4,51,49,.09)]">
        <div className="relative overflow-hidden bg-[linear-gradient(145deg,#032f2d_0%,#075e58_72%,#0f766e_100%)] p-5 text-white sm:p-6">
          <div className="pointer-events-none absolute -right-14 -top-16 h-44 w-44 rounded-full bg-[#28c8bd]/20 blur-3xl" />
          <div className="relative">
            <div className="flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-2 text-[8px] font-black uppercase tracking-[.18em] text-[#f5c451]">
                <Sparkles className="h-3.5 w-3.5" /> Local story
              </span>
              <span className={`h-2.5 w-2.5 rounded-full ${routeReady ? "bg-emerald-300" : "bg-[#7ce0d4]"}`} />
            </div>

            {selectedPlace ? (
              <div className="mt-4 inline-flex rounded-full border border-white/14 bg-white/[.08] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.14em] text-white/72">
                {placeTypeLabel(selectedPlace.type)} selected
              </div>
            ) : null}

            <h2 className="vi-display mt-3 text-3xl font-black leading-[.98] tracking-[-.045em] text-white">
              {title}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-white/64">
              {description}
            </p>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-2.5">
            <StoryFact icon={MapPin} label="Island" value={islandTitle} />
            <StoryFact
              icon={Compass}
              label="Context"
              value={
                routeReady
                  ? "Route ready"
                  : selectedPlace
                    ? "Place selected"
                    : selectedEstate
                      ? "Estate selected"
                      : "Exploring"
              }
            />
          </div>

          {selectedPlace ? (
            <div className="mt-4 rounded-[22px] border border-[#cfe8e3] bg-[#f1faf8] p-4">
              <div className="text-[8px] font-black uppercase tracking-[.16em] text-[#0f766e]">
                Why this selection matters
              </div>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#35514e]">
                {selectedPlace.location
                  ? `${selectedPlace.location} gives this stop a clear local anchor.`
                  : selectedPlaceEstate
                    ? `${selectedPlaceEstate.baseName} is the nearest estate context for this stop.`
                    : `${islandTitle} is the current island context.`}
                {typeof selectedPlace.rating === "number"
                  ? ` Traveler rating: ${selectedPlace.rating.toFixed(1)}.`
                  : ""}
              </p>
            </div>
          ) : null}

          <div className="mt-4 rounded-[24px] bg-[#043331] p-4 text-white shadow-[0_16px_36px_rgba(4,51,49,.14)]">
            <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.16em] text-[#f5c451]">
              <Route className="h-3.5 w-3.5" /> Your movement line
            </div>
            <div className="mt-4 space-y-3">
              <RoutePoint tone="teal" label="Start" value={fromEstate?.baseName ?? "Choose a pickup"} />
              <div className="ml-[6px] h-4 border-l border-dashed border-white/22" />
              <RoutePoint tone="amber" label="Finish" value={toEstate?.baseName ?? "Choose a destination"} />
            </div>
          </div>

          <div className="mt-4 space-y-3 rounded-[22px] border border-[#e1eae7] bg-[#fffdf8] p-4">
            {selectedPlaceEstate ? <InfoRow label="Nearest estate" value={selectedPlaceEstate.baseName} /> : null}
            <InfoRow label="Island character" value={islandFocus} />
            <InfoRow label="Signature movement" value={signatureRoute} />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {estateTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[#cfe7e2] bg-[#eef8f5] px-2.5 py-1.5 text-[8px] font-black uppercase tracking-[.08em] text-[#0f766e]"
              >
                {tag}
              </span>
            ))}
          </div>

          {activeEstate ? (
            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => onUseAsPickup(activeEstate.geoid)}
                disabled={toEstate?.geoid === activeEstate.geoid}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#bfe4dd] bg-[#eaf8f5] px-3 text-[9px] font-black uppercase tracking-[.11em] text-[#0f766e] transition hover:bg-[#dcf3ee] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Navigation className="h-3.5 w-3.5" />
                {selectedPlace ? "Start nearby" : "Set pickup"}
              </button>
              <button
                type="button"
                onClick={() => onUseAsDestination(activeEstate.geoid)}
                disabled={fromEstate?.geoid === activeEstate.geoid}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-3 text-[9px] font-black uppercase tracking-[.11em] text-[#043331] transition hover:bg-[#ffcf67] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <MapPin className="h-3.5 w-3.5" />
                {selectedPlace ? "Route here" : "Set destination"}
              </button>
              <Link
                href={`/estate/${activeEstate.geoid}`}
                className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#043331] px-3 text-[9px] font-black uppercase tracking-[.11em] text-white transition hover:bg-[#075e58]"
              >
                Open {selectedPlace ? "local area" : "estate story"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#d8e7e3] bg-[#fffdf8] p-4 shadow-[0_16px_45px_rgba(4,51,49,.06)]">
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <div className="text-[8px] font-black uppercase tracking-[.17em] text-[#b16a18]">
              Keep exploring
            </div>
            <h3 className="mt-1 text-lg font-black tracking-[-.025em] text-[#043331]">
              Nearby island areas
            </h3>
          </div>
          <span className="rounded-full bg-[#eef8f5] px-2.5 py-1 text-[8px] font-black text-[#0f766e]">
            {neighboringEstates.length}
          </span>
        </div>

        <div className="mt-3 space-y-1.5">
          {neighboringEstates.length ? (
            neighboringEstates.map((estate) => (
              <button
                key={estate.geoid}
                type="button"
                onClick={() => onSelectNeighbor(estate.geoid)}
                className="group flex w-full items-center justify-between rounded-2xl border border-transparent px-3 py-3 text-left transition hover:border-[#d8e7e3] hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28c8bd]"
              >
                <span className="truncate text-sm font-bold text-[#35514e] group-hover:text-[#043331]">
                  {estate.baseName}
                </span>
                <ArrowRight className="ml-3 h-4 w-4 shrink-0 text-[#9bb5b0] transition group-hover:translate-x-0.5 group-hover:text-[#0f766e]" />
              </button>
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-[#d8e7e3] bg-white p-4 text-sm font-semibold leading-6 text-slate-500">
              Tap an estate or mapped place to reveal the closest areas.
            </p>
          )}
        </div>
      </section>
    </aside>
  );
}

function placeTypeLabel(type: TerritoryMapSelection["type"]) {
  if (type === "beach") return "Beach";
  if (type === "stay") return "Stay";
  if (type === "historic") return "Historic site";
  return "Place";
}

function StoryFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[18px] border border-[#e0e9e6] bg-[#fbfdfc] p-3">
      <Icon className="h-4 w-4 text-[#0f766e]" />
      <div className="mt-2 text-[8px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-black text-[#043331]">{value}</div>
    </div>
  );
}

function RoutePoint({
  tone,
  label,
  value,
}: {
  tone: "teal" | "amber";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`h-3 w-3 shrink-0 rounded-full border-2 border-[#043331] ring-2 ${
          tone === "teal" ? "bg-[#7ce0d4] ring-[#7ce0d4]/20" : "bg-[#f5c451] ring-[#f5c451]/20"
        }`}
      />
      <span className="min-w-0">
        <span className="block text-[8px] font-black uppercase tracking-[.14em] text-white/38">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-black text-white/88">
          {value}
        </span>
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[8px] font-black uppercase tracking-[.14em] text-slate-400">{label}</dt>
      <dd className="mt-1 text-sm font-semibold leading-5 text-[#516966]">{value}</dd>
    </div>
  );
}
