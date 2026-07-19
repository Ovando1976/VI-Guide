"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { RideMode } from "@/types/mobility";
import type { EstateRecord } from "@/types/usvi";

type Props = {
  estates: EstateRecord[];
  fromGeoid: string;
  toGeoid: string;
  fromEstate: EstateRecord | null;
  toEstate: EstateRecord | null;
  mode: RideMode;
  passengers: number;
  luggage: number;
  onSelectFrom: (value: string) => void;
  onSelectTo: (value: string) => void;
  onChangeMode: (value: RideMode) => void;
  onChangePassengers: (value: number) => void;
  onChangeLuggage: (value: number) => void;
  onSubmit?: () => void;
  distanceMeters?: number | null;
  durationSeconds?: number | null;
};

const RIDE_MODES: Array<{ value: RideMode; title: string }> = [
  { value: "standard", title: "Standard" },
  { value: "premium", title: "Premium" },
  { value: "shared", title: "Shared" },
  { value: "airport", title: "Airport" },
  { value: "ferry-transfer", title: "Ferry" },
  { value: "executive", title: "Executive" },
];

export function MobilityActionDock({
  estates,
  fromGeoid,
  toGeoid,
  fromEstate,
  toEstate,
  mode,
  passengers,
  luggage,
  onSelectFrom,
  onSelectTo,
  onChangeMode,
  onChangePassengers,
  onChangeLuggage,
  onSubmit,
  distanceMeters,
  durationSeconds,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const sortedEstates = useMemo(
    () => [...estates].sort((a, b) => a.baseName.localeCompare(b.baseName)),
    [estates],
  );
  const canContinue = Boolean(fromGeoid && toGeoid && fromGeoid !== toGeoid);
  const routeMetric = useMemo(() => {
    if (!distanceMeters || !durationSeconds) return null;
    const miles = distanceMeters / 1609.344;
    const minutes = Math.max(1, Math.round(durationSeconds / 60));
    return `${miles.toFixed(miles < 10 ? 1 : 0)} mi · ${minutes} min`;
  }, [distanceMeters, durationSeconds]);

  useEffect(() => {
    if (fromGeoid && !toGeoid) setExpanded(true);
  }, [fromGeoid, toGeoid]);

  function swapEndpoints() {
    onSelectFrom(toGeoid);
    onSelectTo(fromGeoid);
  }

  const summary = canContinue
    ? `${fromEstate?.baseName} → ${toEstate?.baseName}`
    : fromEstate
      ? `From ${fromEstate.baseName} · choose a destination`
      : "Build an island trip";

  return (
    <section className="relative z-20 pb-[max(0px,env(safe-area-inset-bottom))]">
      <div className="overflow-hidden rounded-[24px] border border-[#d8c79e] bg-[#f5eedf] text-[#102f32] shadow-[0_24px_80px_rgba(0,0,0,0.38)]">
        <div className="flex items-center gap-3 px-4 py-3 md:px-5">
          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            aria-expanded={expanded}
            className="min-w-0 flex-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b5554]"
          >
            <span className="block text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8b7956]">
              Trip composer
            </span>
            <span className="mt-0.5 block truncate text-sm font-extrabold md:text-base">
              {summary}
            </span>
          </button>

          <div className="hidden items-center gap-1.5 md:flex">
            {routeMetric ? <Pill>{routeMetric}</Pill> : null}
            <Pill>{mode.replace("-", " ")}</Pill>
            <Pill>{passengers} pax</Pill>
            <Pill>{luggage} bags</Pill>
          </div>

          <button
            type="button"
            onClick={() => setExpanded((value) => !value)}
            className="rounded-xl border border-[#d8c79e] bg-white/45 px-3 py-2 text-[10px] font-extrabold"
          >
            {expanded ? "Collapse" : "Edit trip"}
          </button>
          <button
            type="button"
            disabled={!canContinue}
            onClick={onSubmit}
            className="rounded-xl bg-[#0b4a49] px-4 py-2.5 text-[10px] font-extrabold text-white shadow-sm transition hover:bg-[#0d5b59] disabled:cursor-not-allowed disabled:bg-[#d9d0bf] disabled:text-[#9a9388]"
          >
            Continue
          </button>
        </div>

        {expanded ? (
          <div className="border-t border-[#dfd1b1] p-4 md:p-5">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
                <DockSelect
                  label="Pickup estate"
                  value={fromGeoid}
                  options={sortedEstates}
                  disabledValue={toGeoid}
                  onChange={onSelectFrom}
                />
                <button
                  type="button"
                  onClick={swapEndpoints}
                  disabled={!fromGeoid && !toGeoid}
                  aria-label="Swap pickup and destination"
                  className="h-11 rounded-xl border border-[#d8c79e] bg-white/50 px-3 text-lg transition hover:bg-white disabled:opacity-40"
                >
                  ⇄
                </button>
                <DockSelect
                  label="Destination estate"
                  value={toGeoid}
                  options={sortedEstates}
                  disabledValue={fromGeoid}
                  onChange={onSelectTo}
                />
              </div>

              <div>
                <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8b7956]">
                  Ride type
                </div>
                <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {RIDE_MODES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      aria-pressed={item.value === mode}
                      onClick={() => onChangeMode(item.value)}
                      className={`shrink-0 rounded-full border px-3 py-2 text-[10px] font-extrabold transition ${
                        item.value === mode
                          ? "border-[#0b4a49] bg-[#0b4a49] text-white"
                          : "border-[#d8c79e] bg-white/45 hover:bg-white"
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-[180px_180px_minmax(0,1fr)]">
              <Stepper
                label="Passengers"
                value={passengers}
                min={1}
                max={12}
                onChange={onChangePassengers}
              />
              <Stepper
                label="Luggage"
                value={luggage}
                min={0}
                max={12}
                onChange={onChangeLuggage}
              />
              <div className="rounded-2xl border border-[#d8c79e] bg-white/35 px-4 py-3">
                <div className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8b7956]">
                  Next step
                </div>
                <p className="mt-1 text-sm font-bold">
                  {canContinue
                    ? routeMetric
                      ? `${routeMetric} estimated roadway travel. Continue to pricing and confirmation.`
                      : "Continue to pricing and request confirmation."
                    : "Choose two different estates to create a valid trip."}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function DockSelect({
  label,
  value,
  options,
  disabledValue,
  onChange,
}: {
  label: string;
  value: string;
  options: EstateRecord[];
  disabledValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-[#8b7956]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 min-w-0 rounded-xl border border-[#d8c79e] bg-white/55 px-3 text-sm font-bold outline-none focus:border-[#0b4a49] focus:ring-4 focus:ring-[#0b4a49]/10"
      >
        <option value="">Choose estate</option>
        {options.map((estate) => (
          <option
            key={estate.geoid}
            value={estate.geoid}
            disabled={estate.geoid === disabledValue}
          >
            {estate.baseName}
          </option>
        ))}
      </select>
    </label>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-[#d8c79e] bg-white/35 px-3 py-2.5">
      <div className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#8b7956]">
        {label}
      </div>
      <div className="mt-1.5 flex items-center justify-between">
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
          className="h-8 w-8 rounded-full border border-[#d8c79e] bg-white/55 font-extrabold disabled:opacity-35"
        >
          −
        </button>
        <span className="text-lg font-extrabold">{value}</span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
          className="h-8 w-8 rounded-full border border-[#d8c79e] bg-white/55 font-extrabold disabled:opacity-35"
        >
          +
        </button>
      </div>
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-[#d8c79e] bg-white/40 px-2.5 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.08em]">
      {children}
    </span>
  );
}
