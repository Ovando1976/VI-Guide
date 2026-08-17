"use client";

import { ArrowLeftRight, MapPin, Route } from "lucide-react";

import { MobilityPlacePicker } from "@/components/mobility-place-picker";
import type { EstateRecord, IslandCode } from "@/types/usvi";

type Props = {
  estates: EstateRecord[];
  island: IslandCode;
  fromGeoid: string;
  toGeoid: string;
  onSelectFrom: (geoid: string) => void;
  onSelectTo: (geoid: string) => void;
  onSwapRoute: () => void;
};

export function MobilityRouteFields({ estates, island, fromGeoid, toGeoid, onSelectFrom, onSelectTo, onSwapRoute }: Props) {
  return (
    <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-start">
      <div>
        <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
          <MapPin className="h-4 w-4 text-teal-700" /> Pickup
        </div>
        <MobilityPlacePicker
          value={fromGeoid}
          placeholder="Search airport, hotel, beach, ferry…"
          estates={estates}
          island={island}
          onChange={onSelectFrom}
        />
      </div>
      <button
        type="button"
        onClick={onSwapRoute}
        disabled={!fromGeoid && !toGeoid}
        className="mx-auto mt-6 grid h-12 w-12 place-items-center rounded-2xl border border-slate-200 bg-white text-[#0f766e] shadow-sm transition hover:-translate-y-0.5 hover:border-teal-300 disabled:opacity-40"
        aria-label="Swap pickup and destination"
      >
        <ArrowLeftRight className="h-5 w-5" />
      </button>
      <div>
        <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
          <Route className="h-4 w-4 text-teal-700" /> Destination
        </div>
        <MobilityPlacePicker
          value={toGeoid}
          placeholder="Search beach, hotel, town, harbor…"
          estates={estates}
          island={island}
          onChange={onSelectTo}
        />
      </div>
    </div>
  );
}
