"use client";

import Link from "next/link";
import {
  ChevronDown,
  Layers3,
  MapPinned,
  Search,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { TerritoryMapLens as Lens } from "@/types/territory-map";
import type { EstateRecord } from "@/types/usvi";

type Props = {
  activeLens: Lens;
  onChangeLens: (lens: Lens) => void;
  lensOrder?: Lens[];
  manifestCount: number;
  estates: EstateRecord[];
  selectedEstateGeoid: string | null;
  fromGeoid: string;
  toGeoid: string;
  onSelectEstate: (geoid: string) => void;
  children: ReactNode;
  manifestAction: (estate: EstateRecord) => ReactNode;
  routeStatus?: "idle" | "loading" | "ready" | "error";
  routeMessage?: string | null;
};

const LENSES: Array<{ value: Lens; label: string }> = [
  { value: "places", label: "Places" },
  { value: "beaches", label: "Beaches" },
  { value: "stays", label: "Stays" },
  { value: "historic", label: "History" },
  { value: "drivers", label: "Drivers" },
  { value: "demand", label: "Demand" },
];

export function TerritoryMapWorkspace({
  activeLens,
  onChangeLens,
  lensOrder,
  manifestCount,
  estates,
  selectedEstateGeoid,
  fromGeoid,
  toGeoid,
  onSelectEstate,
  children,
  manifestAction,
  routeStatus = "idle",
  routeMessage,
}: Props) {
  const [manifestOpen, setManifestOpen] = useState(false);
  const [manifestQuery, setManifestQuery] = useState("");

  const visibleLenses = useMemo(() => {
    const lensMap = new Map(LENSES.map((lens) => [lens.value, lens]));

    return (lensOrder ?? LENSES.map((lens) => lens.value))
      .map((value) => lensMap.get(value))
      .filter((lens): lens is (typeof LENSES)[number] => Boolean(lens));
  }, [lensOrder]);

  const activeLensLabel =
    visibleLenses.find((lens) => lens.value === activeLens)?.label ?? "Map";

  const visibleEstates = useMemo(() => {
    const normalizedQuery = manifestQuery.trim().toLowerCase();
    if (!normalizedQuery) return estates;
    return estates.filter((estate) =>
      `${estate.baseName} ${estate.fullName} ${estate.geoid} ${
        estate.estateCode ?? ""
      }`
        .toLowerCase()
        .includes(normalizedQuery),
    );
  }, [estates, manifestQuery]);

  return (
    <section className="territory-map-stage overflow-hidden rounded-[34px] border border-[#0f766e]/15 bg-[#032f2d] shadow-[0_32px_90px_rgba(3,47,45,.18)]">
      <div className="territory-map-stage__header relative overflow-hidden border-b border-white/10 px-4 py-4 text-white md:px-5 md:py-5">
        <div className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[#28c8bd]/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-12 bottom-[-120px] h-52 w-52 rounded-full bg-[#f5c451]/10 blur-3xl" />

        <div className="relative flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-[#f5c451]/10 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.18em] text-[#f8d77c]">
                <MapPinned className="h-3.5 w-3.5" /> Live island view
              </span>
              <RouteStatus status={routeStatus} message={routeMessage} />
            </div>
            <h2 className="vi-display mt-3 text-3xl font-black leading-none tracking-[-.045em] text-white md:text-4xl">
              Explore the island, not a dashboard.
            </h2>
            <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-white/58">
              Tap a marker to reveal local context. Change the lens to move between places, beaches, stays, and history without leaving the map.
            </p>
          </div>

          <div className="min-w-0 xl:max-w-[620px]">
            <div className="mb-2 flex items-center gap-2 text-[8px] font-black uppercase tracking-[.16em] text-white/40">
              <Layers3 className="h-3.5 w-3.5 text-[#7ce0d4]" /> Choose a map lens
            </div>
            <div
              role="group"
              aria-label="Map layers"
              className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleLenses.map((lens) => {
                const active = activeLens === lens.value;
                return (
                  <button
                    key={lens.value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => onChangeLens(lens.value)}
                    className={`shrink-0 rounded-full border px-4 py-2.5 text-[9px] font-black uppercase tracking-[.12em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7ce0d4] ${
                      active
                        ? "border-[#f5c451] bg-[#f5c451] text-[#043331] shadow-[0_10px_26px_rgba(245,196,81,.18)]"
                        : "border-white/12 bg-white/[.07] text-white/68 hover:border-white/20 hover:bg-white/[.12] hover:text-white"
                    }`}
                  >
                    {lens.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="territory-map-stage__canvas relative min-h-[510px] bg-[#06131b] p-2 md:min-h-[610px] md:p-3">
        <div className="pointer-events-none absolute left-5 top-5 z-[450] hidden max-w-[280px] rounded-2xl border border-white/16 bg-[#032f2d]/88 px-4 py-3 text-white shadow-[0_14px_40px_rgba(2,31,29,.25)] backdrop-blur-xl sm:block">
          <div className="text-[8px] font-black uppercase tracking-[.17em] text-[#f5c451]">
            {activeLensLabel} lens active
          </div>
          <p className="mt-1 text-[11px] font-semibold leading-5 text-white/65">
            Select a marker to turn the map into a trip decision: save it, route to it, or open its story.
          </p>
        </div>
        {children}
      </div>

      <div className="territory-map-stage__directory border-t border-[#dce8e5] bg-[#fffdf8] text-[#043331]">
        <button
          type="button"
          aria-expanded={manifestOpen}
          aria-controls="territory-estate-directory"
          onClick={() => setManifestOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left md:px-5"
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#e7f6f2] text-[#0f766e]">
              <MapPinned className="h-4.5 w-4.5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-black text-[#043331]">
                Browse the island by estate
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                {manifestCount} visible {manifestCount === 1 ? "estate" : "estates"} · use this only when you want the geographic index
              </span>
            </span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#d8e7e3] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[.11em] text-[#043331] shadow-sm">
            {manifestOpen ? "Close" : "Browse"}
            <ChevronDown className={`h-3.5 w-3.5 transition ${manifestOpen ? "rotate-180" : ""}`} />
          </span>
        </button>

        {manifestOpen ? (
          <div id="territory-estate-directory" className="border-t border-[#e5eeeb] p-4 md:p-5">
            <label className="relative block">
              <span className="sr-only">Filter estate directory</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#0f766e]" />
              <input
                type="search"
                value={manifestQuery}
                onChange={(event) => setManifestQuery(event.target.value)}
                placeholder="Search an estate, quarter, or code"
                className="h-12 w-full rounded-2xl border border-[#d8e7e3] bg-white pl-11 pr-4 text-sm font-semibold text-[#043331] outline-none placeholder:text-slate-400 focus:border-[#28c8bd] focus:ring-4 focus:ring-[#28c8bd]/10"
              />
            </label>

            <div className="mt-4 grid max-h-[430px] gap-2.5 overflow-y-auto pr-1 md:grid-cols-2">
              {visibleEstates.map((estate) => {
                const isSelected = selectedEstateGeoid === estate.geoid;
                const isPickup = fromGeoid === estate.geoid;
                const isDestination = toGeoid === estate.geoid;
                return (
                  <article
                    key={estate.geoid}
                    className={`rounded-[20px] border p-3.5 transition ${
                      isPickup
                        ? "border-[#58c8bc] bg-[#edf9f6]"
                        : isDestination
                          ? "border-[#e4c36c] bg-[#fff9ea]"
                          : isSelected
                            ? "border-[#8fd8d1] bg-[#f1faf8]"
                            : "border-[#e0e9e6] bg-white hover:-translate-y-0.5 hover:border-[#b8dcd6] hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectEstate(estate.geoid)}
                        className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28c8bd]"
                      >
                        <span className="block truncate text-sm font-black text-[#043331]">
                          {estate.baseName}
                        </span>
                        <span className="mt-1 block truncate text-[9px] font-bold uppercase tracking-[.1em] text-slate-400">
                          {estate.geoid}
                        </span>
                      </button>
                      <div className="flex gap-1">
                        {isPickup ? <Badge label="Pickup" tone="teal" /> : null}
                        {isDestination ? <Badge label="Drop-off" tone="amber" /> : null}
                        {!isPickup && !isDestination && isSelected ? <Badge label="Active" tone="cyan" /> : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/estate/${estate.geoid}`}
                        className="rounded-full bg-[#043331] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.1em] text-white transition hover:bg-[#075e58]"
                      >
                        Open estate
                      </Link>
                      {manifestAction(estate)}
                    </div>
                  </article>
                );
              })}
            </div>

            {!visibleEstates.length ? (
              <div className="mt-3 rounded-2xl border border-dashed border-[#d8e7e3] bg-white p-6 text-center text-sm font-semibold text-slate-500">
                No estates match that search.
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

function RouteStatus({
  status,
  message,
}: {
  status: Props["routeStatus"];
  message?: string | null;
}) {
  if (status === "idle") return null;
  const styles =
    status === "ready"
      ? "border-emerald-300/25 bg-emerald-300/12 text-emerald-100"
      : status === "error"
        ? "border-rose-300/25 bg-rose-300/12 text-rose-100"
        : "border-sky-300/25 bg-sky-300/12 text-sky-100";
  const label =
    status === "ready"
      ? "Route ready"
      : status === "error"
        ? "Route unavailable"
        : "Routing…";
  return (
    <span
      title={message ?? label}
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] ${styles}`}
    >
      {label}
    </span>
  );
}

function Badge({
  label,
  tone,
}: {
  label: string;
  tone: "teal" | "amber" | "cyan";
}) {
  const styles =
    tone === "teal"
      ? "bg-[#def5ef] text-[#0f766e]"
      : tone === "amber"
        ? "bg-[#fff1c7] text-[#8b5d13]"
        : "bg-[#e7f6f4] text-[#0b6b65]";
  return (
    <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] ${styles}`}>
      {label}
    </span>
  );
}
