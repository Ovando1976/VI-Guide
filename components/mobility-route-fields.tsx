"use client";

import { ArrowDownUp, Circle, MapPin, Navigation, ShieldCheck } from "lucide-react";

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

export function MobilityRouteFields({
  estates,
  island,
  fromGeoid,
  toGeoid,
  onSelectFrom,
  onSelectTo,
  onSwapRoute,
}: Props) {
  const pickupEstate = estates.find((estate) => estate.geoid === fromGeoid) ?? null;
  const destinationEstate = estates.find((estate) => estate.geoid === toGeoid) ?? null;

  return (
    <div className="mt-5">
      <div className="relative rounded-[30px] border border-[#d9e6e2] bg-white p-3 shadow-[0_18px_55px_rgba(4,51,49,.09)] sm:p-4">
        <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)] sm:gap-4">
          <div className="relative flex justify-center pt-5">
            <span className="grid h-4 w-4 place-items-center rounded-full border-[4px] border-[#0f766e] bg-white shadow-[0_0_0_4px_rgba(15,118,110,.1)]" />
            <span className="absolute bottom-[-20px] top-10 w-px border-l-2 border-dashed border-slate-200" />
          </div>
          <div className="min-w-0 pb-5 pr-12 sm:pr-14">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">
                <MapPin className="h-4 w-4" /> Pickup
              </div>
              {pickupEstate ? (
                <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] text-emerald-700 sm:inline-flex">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : null}
            </div>
            <MobilityPlacePicker
              value={fromGeoid}
              placeholder="Where are you now?"
              estates={estates}
              island={island}
              onChange={onSelectFrom}
            />
          </div>
        </div>

        <div className="ml-11 border-t border-slate-100 sm:ml-12" />

        <div className="grid grid-cols-[28px_minmax(0,1fr)] gap-3 sm:grid-cols-[32px_minmax(0,1fr)] sm:gap-4">
          <div className="flex justify-center pt-10">
            <span className="grid h-4 w-4 place-items-center rounded-[4px] bg-[#f5c451] shadow-[0_0_0_4px_rgba(245,196,81,.18)]">
              <Circle className="h-2 w-2 fill-[#043331] text-[#043331]" />
            </span>
          </div>
          <div className="min-w-0 pb-2 pr-12 pt-5 sm:pr-14">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#8a6815]">
                <Navigation className="h-4 w-4" /> Destination
              </div>
              {destinationEstate ? (
                <span className="hidden items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black uppercase tracking-[.08em] text-emerald-700 sm:inline-flex">
                  <ShieldCheck className="h-3 w-3" /> Verified
                </span>
              ) : null}
            </div>
            <MobilityPlacePicker
              value={toGeoid}
              placeholder="Where to?"
              estates={estates}
              island={island}
              onChange={onSelectTo}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={onSwapRoute}
          disabled={!fromGeoid && !toGeoid}
          className="absolute right-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border-4 border-white bg-[#043331] text-white shadow-[0_10px_30px_rgba(4,51,49,.22)] transition hover:-translate-y-[54%] hover:bg-[#0f766e] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:opacity-70 sm:right-5 sm:h-12 sm:w-12"
          aria-label="Swap pickup and destination"
        >
          <ArrowDownUp className="h-5 w-5" />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1">
        <p className="max-w-2xl text-[10px] font-semibold leading-5 text-slate-500">
          Search hotels, beaches, airports, ferry terminals, landmarks, recent stops, or Saved Places. The rider sees the place name; pricing still uses the governed rate area underneath.
        </p>
        {pickupEstate && destinationEstate ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eaf8f5] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.1em] text-[#0f766e] ring-1 ring-[#b8e2dc]">
            <ShieldCheck className="h-3.5 w-3.5" /> Route verified
          </span>
        ) : null}
      </div>
    </div>
  );
}
