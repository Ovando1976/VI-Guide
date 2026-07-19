"use client";

import Link from "next/link";
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
  { value: "historic", label: "Historic" },
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

  const visibleEstates = useMemo(() => {
    const normalizedQuery = manifestQuery.trim().toLowerCase();
    if (!normalizedQuery) return estates;
    return estates.filter((estate) =>
      `${estate.baseName} ${estate.fullName} ${estate.geoid} ${
        estate.estateCode ?? ""
      }`
        .toLowerCase()
        .includes(normalizedQuery)
    );
  }, [estates, manifestQuery]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-[#071a24] shadow-[0_28px_80px_rgba(0,0,0,0.3)]">
      <div className="border-b border-white/10 bg-white/[0.035] px-4 py-3 md:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-amber-300/80">
              Live territory map
            </div>
            <div className="mt-1 flex items-center gap-3">
              <h2 className="truncate text-lg font-extrabold tracking-tight text-white md:text-xl">
                Estates, routes, and local context
              </h2>
              <RouteStatus status={routeStatus} message={routeMessage} />
            </div>
          </div>

          <div
            role="group"
            aria-label="Map layers"
            className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visibleLenses.map((lens) => {
              const active = activeLens === lens.value;
              return (
                <button
                  key={lens.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onChangeLens(lens.value)}
                  className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-extrabold tracking-[0.08em] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 ${
                    active
                      ? "bg-cyan-300 text-[#06202a]"
                      : "border border-white/10 bg-white/[0.05] text-white/65 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {lens.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="relative min-h-[500px] bg-[#06131b] p-2 md:min-h-[580px] md:p-3">
        {children}
      </div>

      <div className="border-t border-white/10 bg-[#081720]">
        <button
          type="button"
          aria-expanded={manifestOpen}
          aria-controls="territory-estate-directory"
          onClick={() => setManifestOpen((value) => !value)}
        >
          <span>
            <span className="block text-sm font-extrabold text-white">
              Estate directory
            </span>
            <span className="mt-0.5 block text-xs text-white/45">
              {manifestCount} visible{" "}
              {manifestCount === 1 ? "estate" : "estates"} · open only when
              needed
            </span>
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[10px] font-extrabold text-white/70">
            {manifestOpen ? "Close" : "Browse"}
          </span>
        </button>

        {manifestOpen ? (
          <div
            id="territory-estate-directory"
            className="border-t border-white/10 p-4 md:p-5"
          >
            <label className="block">
              <span className="sr-only">Filter estate directory</span>
              <input
                type="search"
                value={manifestQuery}
                onChange={(event) => setManifestQuery(event.target.value)}
                placeholder="Filter this estate directory"
                className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.05] px-4 text-sm text-white outline-none placeholder:text-white/35 focus:border-cyan-300/50 focus:ring-4 focus:ring-cyan-300/10"
              />
            </label>

            <div className="mt-3 grid max-h-[420px] gap-2 overflow-y-auto pr-1 md:grid-cols-2">
              {visibleEstates.map((estate) => {
                const isSelected = selectedEstateGeoid === estate.geoid;
                const isPickup = fromGeoid === estate.geoid;
                const isDestination = toGeoid === estate.geoid;
                return (
                  <article
                    key={estate.geoid}
                    className={`rounded-2xl border p-3 transition ${
                      isPickup
                        ? "border-teal-300/40 bg-teal-300/10"
                        : isDestination
                        ? "border-amber-300/40 bg-amber-300/10"
                        : isSelected
                        ? "border-cyan-300/35 bg-cyan-300/10"
                        : "border-white/10 bg-white/[0.035] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectEstate(estate.geoid)}
                        className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                      >
                        <span className="block truncate text-sm font-extrabold text-white">
                          {estate.baseName}
                        </span>
                        <span className="mt-1 block truncate text-[10px] font-semibold tracking-[0.08em] text-white/40">
                          {estate.geoid}
                        </span>
                      </button>
                      <div className="flex gap-1">
                        {isPickup ? <Badge label="Pickup" tone="teal" /> : null}
                        {isDestination ? (
                          <Badge label="Drop-off" tone="amber" />
                        ) : null}
                        {!isPickup && !isDestination && isSelected ? (
                          <Badge label="Active" tone="cyan" />
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/estate/${estate.geoid}`}
                        className="rounded-full bg-white px-3 py-1.5 text-[10px] font-extrabold text-slate-950 transition hover:bg-cyan-50"
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
              <div className="mt-3 rounded-2xl border border-dashed border-white/10 p-6 text-center text-sm text-white/45">
                No estates match that directory filter.
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
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : status === "error"
      ? "border-rose-300/20 bg-rose-300/10 text-rose-100"
      : "border-sky-300/20 bg-sky-300/10 text-sky-100";
  const label =
    status === "ready"
      ? "Route ready"
      : status === "error"
      ? "Route unavailable"
      : "Routing…";
  return (
    <span
      title={message ?? label}
      className={`inline-flex shrink-0 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.12em] ${styles}`}
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
      ? "bg-teal-300/15 text-teal-100"
      : tone === "amber"
      ? "bg-amber-300/15 text-amber-100"
      : "bg-cyan-300/15 text-cyan-100";
  return (
    <span
      className={`rounded-full px-2 py-1 text-[9px] font-extrabold ${styles}`}
    >
      {label}
    </span>
  );
}
