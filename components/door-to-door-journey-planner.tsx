"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CarFront, Clock3, Route, Ship, Sparkles } from "lucide-react";

import {
  DOOR_TO_DOOR_PRESETS,
  buildDoorToDoorJourney,
  doorToDoorConciergeHref,
  type DoorToDoorPresetId,
} from "@/lib/door-to-door-journey";

const MODE_ICON = { taxi: CarFront, ferry: Ship, walk: Route } as const;

export function DoorToDoorJourneyPlanner() {
  const [selected, setSelected] = useState<DoorToDoorPresetId>("airport-cruz-bay");
  const journey = useMemo(() => buildDoorToDoorJourney(selected), [selected]);
  if (!journey) return null;

  return (
    <section className="mt-8 rounded-[32px] border border-[#0b5b57]/15 bg-[#f8f4ea] p-5 shadow-[0_22px_70px_rgba(4,51,49,.08)] md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#b7861f]">Door-to-door island journey</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#043331]">One trip. Ground + water + arrival.</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">USVI Compass turns the ferry into one connected traveler journey instead of making you plan each transfer separately.</p>
        </div>
        <Route className="h-10 w-10 text-[#0b817b]" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {DOOR_TO_DOOR_PRESETS.map((preset) => (
          <button key={preset.id} type="button" onClick={() => setSelected(preset.id)} className={`rounded-full px-4 py-2.5 text-xs font-black transition ${selected === preset.id ? "bg-[#043f3b] text-white" : "border border-[#0b5b57]/15 bg-white text-[#043331]"}`}>
            {preset.title}
          </button>
        ))}
      </div>

      <div className="mt-6 overflow-hidden rounded-[28px] bg-white">
        <div className="border-b border-slate-100 p-5 md:p-7">
          <h3 className="text-2xl font-black text-[#043331]">{journey.title}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{journey.summary}</p>
        </div>
        <div className="grid gap-0 md:grid-cols-3">
          {journey.legs.map((leg, index) => {
            const Icon = MODE_ICON[leg.mode];
            return (
              <div key={leg.id} className="relative border-b border-slate-100 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0 md:p-6">
                <div className="flex items-center justify-between gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e5f4f1] text-[#08746f]"><Icon className="h-5 w-5" /></span>
                  <span className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Leg {index + 1}</span>
                </div>
                <h4 className="mt-4 text-lg font-black text-[#043331]">{leg.title}</h4>
                <div className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-700"><span>{leg.from}</span><ArrowRight className="h-4 w-4 shrink-0 text-[#b7861f]"/><span>{leg.to}</span></div>
                {leg.durationMinutes ? <div className="mt-3 flex items-center gap-2 text-xs font-black uppercase tracking-[.12em] text-[#08746f]"><Clock3 className="h-4 w-4"/>About {leg.durationMinutes} min</div> : null}
                <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{leg.note}</p>
                {leg.actionHref ? <Link href={leg.actionHref} className="mt-4 inline-flex rounded-full bg-[#f3c44e] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.13em] text-[#043331]">Plan this ride</Link> : null}
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-3 border-t border-slate-100 bg-[#043f3b] p-5 md:px-7">
          <Link href={doorToDoorConciergeHref(journey)} className="inline-flex items-center gap-2 rounded-full bg-[#f3c44e] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-[#043331]"><Sparkles className="h-4 w-4"/>Coordinate with Concierge</Link>
          <Link href={`/planner?title=${encodeURIComponent(journey.title)}`} className="rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-white">Add to itinerary</Link>
          <Link href="/trips" className="rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-white">Open My Trip</Link>
        </div>
      </div>
    </section>
  );
}
