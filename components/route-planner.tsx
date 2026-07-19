"use client";

import { useMemo } from "react";
import Link from "next/link";
import { haversineKm } from "@/lib/geo";
import type { EstateRecord } from "@/types/usvi";

type Props = {
  estates: EstateRecord[];
  from: EstateRecord | null;
  to: EstateRecord | null;
  onSelectFrom: (geoid: string) => void;
  onSelectTo: (geoid: string) => void;
};

export function RoutePlanner({ estates, from, to, onSelectFrom, onSelectTo }: Props) {
  const distanceKm = useMemo(() => {
    if (!from || !to) return null;
    return Number(haversineKm(from.internalPoint, to.internalPoint).toFixed(1));
  }, [from, to]);

  return (
    <section className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-[11px] font-black uppercase tracking-[0.3em] text-amber-500">Territory routing</div>
      <h3 className="mt-3 text-3xl font-black italic tracking-tight text-[#043331]">Estate-to-estate planning</h3>
      <p className="mt-3 text-sm font-semibold text-slate-500">Route distance is geographic context only. Taxi fares come exclusively from the active official USVI tariff.</p>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        <SelectEstate label="Origin estate" value={from?.geoid ?? ""} estates={estates} onChange={onSelectFrom} />
        <SelectEstate label="Destination estate" value={to?.geoid ?? ""} estates={estates} onChange={onSelectTo} />
      </div>

      {from && to && distanceKm !== null ? (
        <div className="mt-8 grid gap-4 md:grid-cols-[0.7fr_1.3fr]">
          <Metric label="Geographic distance" value={`${distanceKm} km`} />
          <div className="rounded-[24px] bg-[#043331] p-5 text-white">
            <div className="text-[11px] font-black uppercase tracking-[0.25em] text-white/60">Official taxi fare</div>
            <div className="mt-3 text-lg font-black">Load the published tariff quote in Ride</div>
            <Link href={`/mobility?from=${from.geoid}&to=${to.geoid}`} className="mt-4 inline-flex rounded-full bg-amber-400 px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-amber-950">View official quote</Link>
          </div>
        </div>
      ) : (
        <div className="mt-8 rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">Choose both estates to plan the route.</div>
      )}
    </section>
  );
}

function SelectEstate({ label, value, estates, onChange }: { label: string; value: string; estates: EstateRecord[]; onChange: (value: string) => void }) {
  return <label className="block"><div className="mb-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">{label}</div><select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-sm font-semibold text-[#043331] outline-none"><option value="">Select estate</option>{estates.map((estate) => <option key={estate.geoid} value={estate.geoid}>{estate.baseName}</option>)}</select></label>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <div className="rounded-[24px] bg-slate-50 p-5 text-[#043331]"><div className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400">{label}</div><div className="mt-3 text-2xl font-black tracking-tight">{value}</div></div>;
}
