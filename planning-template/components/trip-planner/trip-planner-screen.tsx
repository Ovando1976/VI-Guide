"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  ChevronDown,
  Map,
  Navigation,
  Sparkles,
  Trash2,
  WandSparkles,
} from "lucide-react";
import type { TripItem } from "./trip-types";
import {
  optimizeTrip,
  readTrip,
  readTripDays,
  subscribeToTrip,
  writeTrip,
  writeTripDays,
} from "./trip-store";

const ISLAND_NAMES = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" } as const;
const DAYPARTS = ["morning", "afternoon", "evening", "flexible"] as const;
const DAYPART_RANK = { morning: 0, afternoon: 1, evening: 2, flexible: 3 } as const;

export function TripPlannerScreen() {
  const [items, setItems] = useState<TripItem[]>([]);
  const [days, setDays] = useState(3);
  const [ready, setReady] = useState(false);
  const lastSerializedRef = useRef("");

  useEffect(() => {
    const initial = readTrip();
    lastSerializedRef.current = JSON.stringify(initial);
    setItems(initial);
    setDays(readTripDays());
    setReady(true);
    return subscribeToTrip((next) => {
      const serialized = JSON.stringify(next);
      if (serialized === lastSerializedRef.current) return;
      lastSerializedRef.current = serialized;
      setItems(next);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    const serialized = JSON.stringify(items);
    if (serialized === lastSerializedRef.current) return;
    lastSerializedRef.current = serialized;
    writeTrip(items);
  }, [items, ready]);

  const scheduled = useMemo(
    () => [...items].sort((a, b) => a.day - b.day || DAYPART_RANK[a.timeOfDay] - DAYPART_RANK[b.timeOfDay]),
    [items],
  );
  const islands = useMemo(
    () => Array.from(new Set(items.map((item) => ISLAND_NAMES[item.island]))),
    [items],
  );
  const warnings = useMemo(() => buildWarnings(items, days), [days, items]);
  const conciergePrompt = useMemo(() => {
    const stops = scheduled.map((item) =>
      `Day ${item.day} ${item.timeOfDay}: ${item.name} (${ISLAND_NAMES[item.island]})`,
    ).join("; ");
    const text = `Review and improve my ${days}-day USVI itinerary: ${stops || "No stops selected yet"}. Keep island transfers realistic, group nearby stops, suggest meal breaks and transport, identify conflicts, and give me a practical day-by-day plan. Ask before removing any saved stop.`;
    return `/map?concierge=open&prompt=${encodeURIComponent(text)}`;
  }, [days, scheduled]);

  function update(key: string, patch: Partial<TripItem>) {
    setItems((current) => current.map((item) => itemKey(item) === key ? { ...item, ...patch } : item));
  }

  function remove(key: string) {
    setItems((current) => current.filter((item) => itemKey(item) !== key));
  }

  function changeDays(nextDays: number) {
    setDays(nextDays);
    writeTripDays(nextDays);
    setItems((current) => current.map((item) => ({ ...item, day: Math.min(item.day, nextDays) })));
  }

  function move(key: string, direction: -1 | 1) {
    setItems((current) => {
      const index = current.findIndex((item) => itemKey(item) === key);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-7 pb-36 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#043331,#0f766e)] p-7 text-white shadow-[0_28px_70px_rgba(4,51,49,.22)] sm:p-10">
          <div className="text-[10px] font-black uppercase tracking-[.26em] text-[#f5c558]">Your island plan</div>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl font-black italic tracking-[-.05em] sm:text-6xl">One plan. Every island moment.</h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/70">Build it with one-click saves, arrange it yourself, or ask the Concierge to turn your ideas into a realistic USVI itinerary.</p>
            </div>
            <label className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.18em]">
              Trip length
              <select value={days} onChange={(event) => changeDays(Number(event.target.value))} className="ml-3 bg-transparent text-white outline-none">
                {Array.from({ length: 14 }, (_, index) => index + 1).map((day) => <option key={day} value={day} className="text-[#043331]">{day} day{day === 1 ? "" : "s"}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={conciergePrompt} className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-5 py-3 text-[10px] font-black uppercase tracking-[.17em] text-[#043331]"><Sparkles className="h-4 w-4" /> Improve with AI</Link>
            <button type="button" disabled={!items.length} onClick={() => setItems(optimizeTrip(items, days))} className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.17em] disabled:opacity-40"><WandSparkles className="h-4 w-4" /> Quick optimize</button>
            <Link href="/map" className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.17em]"><Map className="h-4 w-4" /> Add from map</Link>
          </div>
        </section>

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_330px]">
          <section className="space-y-6">
            {items.length ? Array.from({ length: days }, (_, index) => index + 1).map((day) => {
              const dayItems = scheduled.filter((item) => item.day === day);
              return (
                <section key={day} className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
                  <header className="flex items-center justify-between border-b border-slate-100 bg-[#f2eee4] px-5 py-4">
                    <div><div className="text-[9px] font-black uppercase tracking-[.2em] text-amber-600">Day {day}</div><h2 className="text-xl font-black">{dayItems.length ? dayTitle(dayItems) : "Open for discovery"}</h2></div>
                    <span className="rounded-full bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">{dayItems.length} stop{dayItems.length === 1 ? "" : "s"}</span>
                  </header>
                  <div className="space-y-3 p-4">
                    {dayItems.length ? dayItems.map((item) => {
                      const key = itemKey(item);
                      return <TripStop key={key} item={item} days={days} onUpdate={(patch) => update(key, patch)} onRemove={() => remove(key)} onMove={(direction) => move(key, direction)} />;
                    }) : <Link href="/map" className="block rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm font-bold text-slate-500 hover:border-teal-600 hover:text-teal-800">Add a beach, place, stay, or historic site</Link>}
                  </div>
                </section>
              );
            }) : <EmptyTrip />}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="text-[10px] font-black uppercase tracking-[.2em] text-amber-600">Trip snapshot</div>
              <div className="mt-4 text-4xl font-black">{items.length}</div>
              <div className="text-sm font-bold text-slate-500">saved stop{items.length === 1 ? "" : "s"} · {days} day{days === 1 ? "" : "s"}</div>
              <div className="mt-5 border-t border-slate-100 pt-5 text-sm font-semibold leading-6 text-slate-600">{islands.length ? islands.join(" · ") : "No island selected yet"}</div>
            </div>
            {warnings.length ? <div className="rounded-[28px] border border-amber-200 bg-amber-50 p-5"><div className="text-[10px] font-black uppercase tracking-[.18em] text-amber-800">Planning check</div><ul className="mt-3 space-y-2 text-xs font-semibold leading-5 text-amber-950">{warnings.map((warning) => <li key={warning}>• {warning}</li>)}</ul></div> : null}
            {items.length ? <button onClick={() => setItems([])} className="w-full rounded-full border border-rose-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-rose-700">Clear trip</button> : null}
          </aside>
        </div>
      </div>
    </main>
  );
}

function TripStop({ item, days, onUpdate, onRemove, onMove }: { item: TripItem; days: number; onUpdate: (patch: Partial<TripItem>) => void; onRemove: () => void; onMove: (direction: -1 | 1) => void }) {
  const mapHref = item.lat != null && item.lng != null ? `/map?island=${item.island}&focus=${encodeURIComponent(item.slug)}&lat=${item.lat}&lng=${item.lng}` : `/map?island=${item.island}&focus=${encodeURIComponent(item.slug)}`;
  const rideHref = item.lat != null && item.lng != null ? `/mobility?island=${item.island}&destination=${encodeURIComponent(item.name)}&toLat=${item.lat}&toLng=${item.lng}` : `/mobility?island=${item.island}&destination=${encodeURIComponent(item.name)}`;
  return <article className="grid gap-4 rounded-[24px] border border-slate-200 p-4 sm:grid-cols-[90px_1fr_auto] sm:items-center">
    <div className="h-24 overflow-hidden rounded-2xl bg-[#dceee9] bg-cover bg-center" style={item.image ? { backgroundImage: `url('${item.image.replaceAll("'", "%27")}')` } : undefined} />
    <div className="min-w-0">
      <div className="text-[9px] font-black uppercase tracking-[.17em] text-amber-600">{item.kind} · {ISLAND_NAMES[item.island]}</div>
      <Link href={item.href} className="mt-1 block truncate text-xl font-black tracking-tight hover:text-teal-700">{item.name}</Link>
      {item.location ? <div className="mt-1 truncate text-xs font-semibold text-slate-500">{item.location}</div> : null}
      <div className="mt-3 flex flex-wrap gap-2">
        <label className="relative"><select value={item.day} onChange={(event) => onUpdate({ day: Number(event.target.value) })} className="appearance-none rounded-full border border-slate-200 bg-[#f8f4ea] py-2 pl-3 pr-8 text-[9px] font-black uppercase tracking-[.13em] outline-none">{Array.from({ length: days }, (_, index) => index + 1).map((day) => <option key={day} value={day}>Day {day}</option>)}</select><ChevronDown className="pointer-events-none absolute right-2 top-2.5 h-3.5 w-3.5" /></label>
        <select value={item.timeOfDay} onChange={(event) => onUpdate({ timeOfDay: event.target.value as TripItem["timeOfDay"] })} className="rounded-full border border-slate-200 bg-[#f8f4ea] px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] outline-none">{DAYPARTS.map((part) => <option key={part} value={part}>{part}</option>)}</select>
        <Link href={mapHref} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"><Map className="h-3 w-3" /> Map</Link>
        <Link href={rideHref} className="inline-flex items-center gap-1 rounded-full bg-[#043331] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white"><Navigation className="h-3 w-3" /> Ride</Link>
      </div>
    </div>
    <div className="flex gap-1 sm:flex-col"><button onClick={() => onMove(-1)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-400" aria-label={`Move ${item.name} earlier`}><ArrowUp className="h-3.5 w-3.5" /></button><button onClick={() => onMove(1)} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-400" aria-label={`Move ${item.name} later`}><ArrowDown className="h-3.5 w-3.5" /></button><button onClick={onRemove} className="grid h-9 w-9 place-items-center rounded-full border border-slate-200 text-slate-400 hover:border-rose-300 hover:text-rose-600" aria-label={`Remove ${item.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div>
  </article>;
}

function EmptyTrip() { return <div className="rounded-[30px] border border-dashed border-slate-300 bg-white p-10 text-center"><CalendarDays className="mx-auto h-10 w-10 text-teal-700" /><h2 className="mt-4 text-2xl font-black">Your trip is ready for its first stop.</h2><p className="mx-auto mt-3 max-w-md text-sm font-semibold leading-6 text-slate-500">Add an idea with one click, or ask the Concierge to build a trip around your interests.</p><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/map" className="inline-flex items-center gap-2 rounded-full bg-[#043331] px-6 py-3 text-[10px] font-black uppercase tracking-[.17em] text-white"><Map className="h-4 w-4" /> Explore map</Link><Link href="/map?concierge=open&prompt=Help%20me%20build%20my%20USVI%20trip" className="inline-flex items-center gap-2 rounded-full bg-[#f5b942] px-6 py-3 text-[10px] font-black uppercase tracking-[.17em]"><Sparkles className="h-4 w-4" /> Ask AI</Link></div></div>; }

function itemKey(item: Pick<TripItem, "id" | "kind">) { return `${item.kind}:${item.id}`; }
function dayTitle(items: TripItem[]) { const names = Array.from(new Set(items.map((item) => ISLAND_NAMES[item.island]))); return names.length === 1 ? names[0] : names.join(" + "); }
function buildWarnings(items: TripItem[], days: number) {
  const warnings: string[] = [];
  for (let day = 1; day <= days; day++) {
    const dayItems = items.filter((item) => item.day === day);
    const islands = new Set(dayItems.map((item) => item.island));
    if (islands.has("stx") && islands.size > 1) warnings.push(`Day ${day} combines St. Croix with another island; allow for a flight or move stops to separate days.`);
    if (dayItems.length > 5) warnings.push(`Day ${day} has ${dayItems.length} stops and may feel rushed.`);
    for (const part of DAYPARTS.slice(0, 3)) if (dayItems.filter((item) => item.timeOfDay === part).length > 2) warnings.push(`Day ${day} has more than two ${part} stops.`);
  }
  return warnings.slice(0, 4);
}
