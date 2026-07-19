"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, ChevronDown, GripVertical, Map, Sparkles, Trash2 } from "lucide-react";
import { TRIP_STORAGE_KEY, type TripItem } from "./trip-types";

const ISLAND_NAMES = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" } as const;
const DAYPARTS = ["morning", "afternoon", "evening", "flexible"] as const;

export function TripPlannerScreen() {
  const [items, setItems] = useState<TripItem[]>([]);
  const [days, setDays] = useState(3);

  useEffect(() => setItems(readTrip()), []);
  useEffect(() => localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(items)), [items]);

  const islands = useMemo(() => Array.from(new Set(items.map((item) => ISLAND_NAMES[item.island]))), [items]);
  const conciergePrompt = useMemo(() => {
    const stops = items.map((item) => `${item.name} (${ISLAND_NAMES[item.island]})`).join(", ");
    return `/map?concierge=open&prompt=${encodeURIComponent(`Turn these saved ideas into a practical ${days}-day USVI itinerary: ${stops || "I have not chosen stops yet"}. Group nearby stops, include realistic travel time, meals, transportation, and backup options.`)}`;
  }, [days, items]);

  function update(id: string, patch: Partial<TripItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function remove(id: string) {
    setItems((current) => current.filter((item) => item.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-7 pb-36 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#043331,#0f766e)] p-7 text-white shadow-[0_28px_70px_rgba(4,51,49,.22)] sm:p-10">
          <div className="text-[10px] font-black uppercase tracking-[.26em] text-[#f5c558]">Your island plan</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black italic tracking-[-.05em] sm:text-6xl">Build the trip, not just a list.</h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70">Save beaches, stays, food, history, and attractions. Organize them by day, then let the Concierge turn the plan into a realistic route.</p>
            </div>
            <label className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em]">
              Trip length
              <select value={days} onChange={(event) => setDays(Number(event.target.value))} className="ml-3 bg-transparent text-white outline-none">
                {[1,2,3,4,5,6,7].map((day) => <option key={day} value={day} className="text-[#043331]">{day} day{day === 1 ? "" : "s"}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={conciergePrompt} className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-5 py-3 text-[10px] font-black uppercase tracking-[.17em] text-[#043331]"><Sparkles className="h-4 w-4" /> Build with Concierge</Link>
            <Link href="/map" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.17em]"><Map className="h-4 w-4" /> Open territory map</Link>
          </div>
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="space-y-4">
            {items.length ? items.map((item, index) => (
              <article key={`${item.kind}-${item.id}`} className="grid gap-4 rounded-[26px] border border-slate-200 bg-white p-4 shadow-sm sm:grid-cols-[90px_1fr_auto] sm:items-center">
                <div className="h-24 overflow-hidden rounded-2xl bg-[#dceee9] bg-cover bg-center" style={item.image ? { backgroundImage: `url('${item.image}')` } : undefined} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.17em] text-amber-600"><GripVertical className="h-4 w-4 text-slate-300" /> Stop {index + 1} · {item.kind}</div>
                  <Link href={item.href} className="mt-1 block truncate text-xl font-black tracking-tight hover:text-teal-700">{item.name}</Link>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <label className="relative">
                      <select value={item.day} onChange={(event) => update(item.id, { day: Number(event.target.value) })} className="appearance-none rounded-full border border-slate-200 bg-[#f8f4ea] py-2 pl-3 pr-8 text-[9px] font-black uppercase tracking-[.13em] outline-none">
                        {Array.from({ length: days }, (_, i) => i + 1).map((day) => <option key={day} value={day}>Day {day}</option>)}
                      </select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5" />
                    </label>
                    <select value={item.timeOfDay} onChange={(event) => update(item.id, { timeOfDay: event.target.value as TripItem["timeOfDay"] })} className="rounded-full border border-slate-200 bg-[#f8f4ea] px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] outline-none">
                      {DAYPARTS.map((part) => <option key={part} value={part}>{part}</option>)}
                    </select>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-slate-500">{ISLAND_NAMES[item.island]}</span>
                  </div>
                </div>
                <button onClick={() => remove(item.id)} className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600" aria-label={`Remove ${item.name}`}><Trash2 className="h-4 w-4" /></button>
              </article>
            )) : (
              <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center">
                <CalendarDays className="mx-auto h-10 w-10 text-teal-700" />
                <h2 className="mt-4 text-2xl font-black">Your trip is ready for its first stop.</h2>
                <p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">Open Explore and add a beach, restaurant, attraction, historic site, or stay.</p>
                <Link href="/places" className="mt-6 inline-flex rounded-full bg-[#043331] px-6 py-3 text-[10px] font-black uppercase tracking-[.17em] text-white">Explore the islands</Link>
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-amber-600">Trip snapshot</div>
              <div className="mt-4 text-4xl font-black">{items.length}</div>
              <div className="text-sm font-bold text-slate-500">saved stop{items.length === 1 ? "" : "s"}</div>
              <div className="mt-5 border-t border-slate-100 pt-5 text-sm font-semibold leading-6 text-slate-600">{islands.length ? islands.join(" · ") : "No island selected yet"}</div>
            </div>
            {items.length ? <button onClick={() => setItems([])} className="w-full rounded-full border border-rose-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-rose-700">Clear trip</button> : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function readTrip(): TripItem[] {
  try { const raw = localStorage.getItem(TRIP_STORAGE_KEY); return raw ? JSON.parse(raw) as TripItem[] : []; }
  catch { return []; }
}
