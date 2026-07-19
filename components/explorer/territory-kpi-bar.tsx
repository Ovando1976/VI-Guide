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
      className="flex min-h-14 items-center gap-3 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div className="min-w-max pr-2">
        <div className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-cyan-100/40">
          Active territory
        </div>
        <div className="mt-0.5 text-sm font-extrabold text-white">
          {props.islandName}
        </div>
      </div>
      <StatusChip label="Estates" value={String(props.visibleEstates)} />
      {props.selectedEstate !== "None" ? (
        <StatusChip label="Focus" value={props.selectedEstate} />
      ) : null}
      {hasActiveTrip ? (
        <>
          <StatusChip label="Pickup" value={props.pickup} />
          <span className="text-white/25">→</span>
          <StatusChip label="Destination" value={props.destination} />
        </>
      ) : (
        <span className="min-w-max text-xs font-semibold text-white/40">
          Select a place or estate to begin
        </span>
      )}
      <div className="ml-auto min-w-max rounded-full border border-amber-200/15 bg-amber-200/[0.07] px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.1em] text-amber-100/75">
        {props.mode.replace("-", " ")} · {props.passengers} pax ·{" "}
        {props.luggage} bags
      </div>
    </section>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-max rounded-full border border-white/10 bg-black/10 px-3 py-2">
      <span className="text-[8px] font-extrabold uppercase tracking-[0.12em] text-white/30">
        {label}
      </span>{" "}
      <span className="text-[10px] font-bold text-white/80">{value}</span>
    </div>
  );
}
