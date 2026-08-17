"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";

import { MobilityRouteFields } from "@/components/mobility-route-fields";
import type { EstateRecord, IslandCode } from "@/types/usvi";

const RoutePreviewMap = dynamic(
  () => import("@/components/route-preview-map").then((module) => module.RoutePreviewMap),
  { ssr: false, loading: () => <div className="h-[300px] animate-pulse rounded-[28px] bg-slate-100" /> },
);

type Props = {
  estates: EstateRecord[];
  island: IslandCode;
  fromEstate: EstateRecord | null;
  toEstate: EstateRecord | null;
  fromGeoid: string;
  toGeoid: string;
  pickupInstructions: string;
  destinationInstructions: string;
  onSelectFrom: (geoid: string) => void;
  onSelectTo: (geoid: string) => void;
  onSwapRoute: () => void;
  onPickupInstructionsChange: (value: string) => void;
  onDestinationInstructionsChange: (value: string) => void;
};

export function MobilityRouteStep(props: Props) {
  const routeReady = Boolean(props.fromEstate && props.toEstate);
  return (
    <>
      <MobilityRouteFields
        estates={props.estates}
        island={props.island}
        fromGeoid={props.fromGeoid}
        toGeoid={props.toGeoid}
        onSelectFrom={props.onSelectFrom}
        onSelectTo={props.onSelectTo}
        onSwapRoute={props.onSwapRoute}
      />
      <div className={`mt-5 overflow-hidden rounded-[28px] transition-all ${routeReady ? "max-h-[520px]" : "max-h-[330px]"}`}>
        <RoutePreviewMap island={props.island} fromEstate={props.fromEstate} toEstate={props.toEstate} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-400"><MapPin className="h-4 w-4 text-teal-700" /> Pickup instructions (optional)</div>
          <textarea value={props.pickupInstructions} onChange={(event) => props.onPickupInstructionsChange(event.target.value)} placeholder="Hotel lobby, villa gate, dock, landmark…" rows={3} className="w-full resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none focus:border-teal-500" />
        </label>
        <label className="block">
          <div className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-slate-400"><MapPin className="h-4 w-4 text-teal-700" /> Drop-off instructions (optional)</div>
          <textarea value={props.destinationInstructions} onChange={(event) => props.onDestinationInstructionsChange(event.target.value)} placeholder="Resort entrance, ferry dock, beach access…" rows={3} className="w-full resize-none rounded-[20px] border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none focus:border-teal-500" />
        </label>
      </div>
    </>
  );
}
