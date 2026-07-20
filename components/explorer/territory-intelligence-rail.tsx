"use client";

import Link from "next/link";
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
    ? "Your corridor is ready. Review the movement context, then continue to trip setup."
    : selectedPlace
    ? selectedPlace.description ??
      `This ${placeTypeLabel(
        selectedPlace.type
      ).toLowerCase()} is active. Review its local context or use the nearest estate as a trip endpoint.`
    : selectedEstate
    ? "This estate is active. Set it as a trip endpoint or explore nearby territory."
    : "Select an estate or territory marker on the map to open its local context.";

  return (
    <aside className="space-y-4 xl:sticky xl:top-[166px] xl:h-fit">
      <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] shadow-[0_24px_60px_rgba(0,0,0,0.2)]">
        <div className="border-b border-white/10 p-5">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-300/80">
              Territory intelligence
            </span>
            <span
              className={`h-2 w-2 rounded-full ${
                routeReady ? "bg-emerald-300" : "bg-cyan-300"
              }`}
            />
          </div>

          {selectedPlace ? (
            <div className="mt-3 inline-flex rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.15em] text-cyan-100/80">
              {placeTypeLabel(selectedPlace.type)}
            </div>
          ) : null}

          <h2 className="mt-2 text-2xl font-extrabold tracking-[-0.025em] text-white">
            {title}
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/55">{description}</p>
        </div>

        <div className="p-5">
          <div className="grid grid-cols-2 gap-2">
            <DataPoint label="Island" value={islandTitle} />
            <DataPoint
              label="Status"
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
            <div className="mt-4 rounded-2xl border border-cyan-300/15 bg-cyan-300/[0.055] p-4">
              <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/45">
                Selected territory entry
              </div>
              <div className="mt-3 grid gap-3">
                <InfoRow
                  label="Category"
                  value={placeTypeLabel(selectedPlace.type)}
                />
                <InfoRow
                  label="Local area"
                  value={
                    selectedPlace.location ??
                    selectedPlaceEstate?.baseName ??
                    islandTitle
                  }
                />
                {typeof selectedPlace.rating === "number" ? (
                  <InfoRow
                    label="Rating"
                    value={`★ ${selectedPlace.rating.toFixed(1)}`}
                  />
                ) : null}
                <InfoRow
                  label="Coordinates"
                  value={`${selectedPlace.lat.toFixed(
                    5
                  )}, ${selectedPlace.lng.toFixed(5)}`}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl border border-white/10 bg-[#071a24] p-4">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/35">
              Movement corridor
            </div>
            <div className="mt-3 space-y-3">
              <RoutePoint
                tone="teal"
                label="Pickup"
                value={fromEstate?.baseName ?? "Choose an origin"}
              />
              <div className="ml-[5px] h-3 border-l border-dashed border-white/20" />
              <RoutePoint
                tone="amber"
                label="Destination"
                value={toEstate?.baseName ?? "Choose a destination"}
              />
            </div>
          </div>

          <dl className="mt-4 space-y-3 text-sm">
            {selectedPlaceEstate ? (
              <InfoRow
                label="Nearest estate"
                value={selectedPlaceEstate.baseName}
              />
            ) : null}
            <InfoRow label="Island profile" value={islandFocus} />
            <InfoRow label="Signature route" value={signatureRoute} />
          </dl>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {estateTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-2.5 py-1.5 text-[9px] font-bold text-cyan-100/80"
              >
                {tag}
              </span>
            ))}
          </div>

          {activeEstate ? (
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onUseAsPickup(activeEstate.geoid)}
                disabled={toEstate?.geoid === activeEstate.geoid}
                className="rounded-xl bg-teal-400 px-3 py-2.5 text-[10px] font-extrabold text-[#062923] transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selectedPlace ? "Pickup nearby" : "Set pickup"}
              </button>
              <button
                type="button"
                onClick={() => onUseAsDestination(activeEstate.geoid)}
                disabled={fromEstate?.geoid === activeEstate.geoid}
                className="rounded-xl bg-amber-300 px-3 py-2.5 text-[10px] font-extrabold text-[#3d2a00] transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {selectedPlace ? "Route here" : "Set destination"}
              </button>
              <Link
                href={`/estate/${activeEstate.geoid}`}
                className="col-span-2 rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-center text-[10px] font-extrabold text-white/80 transition hover:bg-white/10 hover:text-white"
              >
                Open {selectedPlace ? "nearest estate" : "estate"} profile
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-white/35">
              Nearby context
            </div>
            <h3 className="mt-1 text-base font-extrabold text-white">
              Closest estates
            </h3>
          </div>
          <span className="text-xs text-white/35">
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
                className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left transition hover:bg-white/[0.06] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
              >
                <span className="truncate text-sm font-semibold text-white/75">
                  {estate.baseName}
                </span>
                <span className="ml-3 text-white/25">→</span>
              </button>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-white/40">
              Select an estate or mapped territory entry to calculate nearby
              context.
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

function DataPoint({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2.5">
      <div className="text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/30">
        {label}
      </div>
      <div className="mt-1 truncate text-xs font-bold text-white/80">
        {value}
      </div>
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
        className={`h-3 w-3 shrink-0 rounded-full border-2 border-[#071a24] ring-2 ${
          tone === "teal"
            ? "bg-teal-300 ring-teal-300/20"
            : "bg-amber-300 ring-amber-300/20"
        }`}
      />
      <span className="min-w-0">
        <span className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-white/30">
          {label}
        </span>
        <span className="mt-0.5 block truncate text-sm font-bold text-white/85">
          {value}
        </span>
      </span>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/30">
        {label}
      </dt>
      <dd className="mt-1 leading-5 text-white/65">{value}</dd>
    </div>
  );
}
