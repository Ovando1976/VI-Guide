"use client";

import type { RideMode } from "@/types/mobility";

type Props = {
  islandName: string;
  visibleEstates: number;
  selectedEstate: string;
  pickup: string;
  destination: string;
  mode: RideMode;
  passengers: number;
  luggage: number;
};

export function TerritoryKpiBar(props: Props) {
  const hasActiveTrip =
    props.pickup !== "Not set" || props.destination !== "Not set";

  return (
    <section
      aria-label="Current territory status"
      className="flex min-h-14 items-center gap-3 overflow-x-auto rounded-[22px] border border-[#d8e7e3] bg-white/95 px-4 py-3 text-[#12312f] shadow-[0_12px_32px_rgba(18,49,47,.07)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="min-w-max pr-2">
        <div className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-[#0f766e]/55">
          Active island
        </div>
        <div className="mt-0.5 text-sm font-extrabold text-[#12312f]">
          {props.islandName}
        </div>
      </div>
      <StatusChip label="Estates" value={String(props.visibleEstates)} />
      {props.selectedEstate !== "None" ? (
        <StatusChip label="Selected" value={props.selectedEstate} />
      ) : null}
      {hasActiveTrip ? (
        <>
          <StatusChip label="From" value={props.pickup} />
          <span className="text-[#0f766e]/35">→</span>
          <StatusChip label="To" value={props.destination} />
        </>
      ) : (
        <span className="min-w-max text-xs font-semibold text-[#61716e]">
          Choose a place to explore, save, or plan a ride
        </span>
      )}
      <div className="ml-auto min-w-max rounded-full border border-[#ead29b] bg-[#fff8e8] px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-[#996313]">
        {props.mode.replace("-", " ")} · {props.passengers} pax · {props.luggage} bags
      </div>
    </section>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-max rounded-full border border-[#dbe8e5] bg-[#f7fbfa] px-3 py-2">
      <span className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-[#0f766e]/45">
        {label}
      </span>{" "}
      <span className="text-[10px] font-bold text-[#34514e]">{value}</span>
    </div>
  );
}
