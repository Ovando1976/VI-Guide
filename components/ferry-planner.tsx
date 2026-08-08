"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, Clock3, MapPinned, Ship, Sparkles } from "lucide-react";

import { FERRY_PORTS, findFerryRoute, ferryRoutesFrom, type FerryPortId } from "@/lib/ferry-planner";

export function FerryPlanner() {
  const [from, setFrom] = useState<FerryPortId>("red-hook");
  const destinations = useMemo(() => ferryRoutesFrom(from), [from]);
  const [to, setTo] = useState<FerryPortId>("cruz-bay");
  const route = findFerryRoute(from, to);

  function changeFrom(value: FerryPortId) {
    setFrom(value);
    const first = ferryRoutesFrom(value)[0];
    if (first) setTo(first.to);
  }

  return (
    <section className="rounded-[32px] border border-[#0b5b57]/15 bg-white p-5 shadow-[0_22px_70px_rgba(4,51,49,.12)] md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#b7861f]">USVI Ferry Planner</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#043331]">Connect the islands by water.</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Plan passenger ferry legs between Red Hook, Cruz Bay, Charlotte Amalie and Gallows Bay / Christiansted, then hand the terminal connection to VI Guide Mobility.</p>
        </div>
        <Ship className="h-10 w-10 text-[#0b817b]" />
      </div>

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-black text-[#043331]">From
          <select value={from} onChange={(event) => changeFrom(event.target.value as FerryPortId)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 font-bold outline-none focus:border-[#0b817b]">
            {FERRY_PORTS.filter((port) => ferryRoutesFrom(port.id).length).map((port) => <option key={port.id} value={port.id}>{port.label} · {port.island}</option>)}
          </select>
        </label>
        <label className="space-y-2 text-sm font-black text-[#043331]">To
          <select value={to} onChange={(event) => setTo(event.target.value as FerryPortId)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 font-bold outline-none focus:border-[#0b817b]">
            {destinations.map((item) => <option key={item.id} value={item.to}>{item.toLabel}</option>)}
          </select>
        </label>
      </div>

      {route ? (
        <div className="mt-6 overflow-hidden rounded-[28px] bg-[#043f3b] text-white">
          <div className="grid gap-5 p-6 md:grid-cols-[1.25fr_.75fr] md:p-8">
            <div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]"><MapPinned className="h-4 w-4" /> {route.serviceLabel}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-2xl font-black"><span>{route.fromLabel}</span><ArrowRight className="h-5 w-5 text-[#f3c44e]"/><span>{route.toLabel}</span></div>
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-white/80"><Clock3 className="h-4 w-4"/>About {route.durationMinutes} minutes · arrive {route.checkInMinutes} minutes early</div>
              <p className="mt-3 text-sm font-semibold text-white/70">{route.operatingDays}. {route.fareNote}</p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/8 p-4">
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]">Published departures</p>
              <div className="mt-3 flex flex-wrap gap-2">{route.departures.map((time) => <span key={time} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{time}</span>)}</div>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 border-t border-white/10 px-6 py-5 md:px-8">
            <Link href={`/mobility?mode=ferry-transfer&pickupName=${encodeURIComponent(route.fromLabel)}&destinationName=${encodeURIComponent(route.toLabel)}`} className="rounded-full bg-[#f3c44e] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-[#043331]">Plan terminal ride</Link>
            <Link href={`/concierge?prompt=${encodeURIComponent(`Help me plan the ferry from ${route.fromLabel} to ${route.toLabel}`)}`} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em]"><Sparkles className="h-4 w-4"/>Ask Concierge</Link>
            <a href={route.sourceUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em]">Verify schedule</a>
          </div>
        </div>
      ) : null}
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Schedules can change seasonally or operationally. VI Guide shows the published planning schedule and links to the government/port source for final verification before departure.</p>
    </section>
  );
}
