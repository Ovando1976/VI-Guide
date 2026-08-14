"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeDollarSign, CalendarClock, Clock3, ExternalLink, Luggage, MapPinned, Minus, Plus, ShieldCheck, Ship, Sparkles, Users } from "lucide-react";

import { FERRY_PORTS, findFerryRoute, ferryRoutesFrom, getNextFerryDeparture, type FerryPortId, type NextFerryDeparture } from "@/lib/ferry-planner";

function Stepper({ label, value, onChange, minimum = 0 }: { label: string; value: number; onChange: (value: number) => void; minimum?: number }) {
  return (
    <div className="rounded-2xl border border-white/15 bg-white/10 p-3">
      <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/65">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <button type="button" aria-label={`Remove ${label.toLowerCase()}`} onClick={() => onChange(Math.max(minimum, value - 1))} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"><Minus className="h-4 w-4" /></button>
        <strong className="text-lg">{value}</strong>
        <button type="button" aria-label={`Add ${label.toLowerCase()}`} onClick={() => onChange(value + 1)} className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"><Plus className="h-4 w-4" /></button>
      </div>
    </div>
  );
}

function countdownLabel(minutes: number) {
  if (minutes <= 0) return "Departing now";
  if (minutes < 60) return `in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return `in ${hours}h${remainder ? ` ${remainder}m` : ""}`;
}

export function FerryPlanner() {
  const [from, setFrom] = useState<FerryPortId>("red-hook");
  const destinations = useMemo(() => ferryRoutesFrom(from), [from]);
  const [to, setTo] = useState<FerryPortId>("cruz-bay");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [bags, setBags] = useState(0);
  const [roundTrip, setRoundTrip] = useState(false);
  const [residentFare, setResidentFare] = useState(false);
  const [nextDeparture, setNextDeparture] = useState<NextFerryDeparture | null>(null);
  const route = findFerryRoute(from, to);

  useEffect(() => {
    function updateDeparture() {
      setNextDeparture(route ? getNextFerryDeparture(route) : null);
    }
    updateDeparture();
    const timer = window.setInterval(updateDeparture, 30_000);
    return () => window.clearInterval(timer);
  }, [route]);

  const fareTotal = useMemo(() => {
    if (!route?.fare) return null;
    const fare = route.fare;
    const adultOneWay = residentFare && fare.residentOneWay ? fare.residentOneWay : fare.adultOneWay;
    const childOneWay = fare.childOneWay ?? adultOneWay;
    const passengerTotal = roundTrip && !residentFare && fare.adultRoundTrip
      ? adults * fare.adultRoundTrip + children * childOneWay * 2
      : (adults * adultOneWay + children * childOneWay) * (roundTrip ? 2 : 1);
    return passengerTotal + bags * (fare.bagOneWay ?? 0) * (roundTrip ? 2 : 1);
  }, [adults, bags, children, residentFare, roundTrip, route]);

  function changeFrom(value: FerryPortId) {
    setFrom(value);
    const first = ferryRoutesFrom(value)[0];
    if (first) setTo(first.to);
  }

  return (
    <section className="rounded-[32px] border border-[#0b5b57]/15 bg-white p-5 shadow-[0_22px_70px_rgba(4,51,49,.12)] md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#b7861f]">USVI Ferry Intelligence</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#043331]">Know when to leave — and what it costs.</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Choose the ferry, see the next published departure in island time, price the whole party and connect the terminal ride.</p>
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
          <div className="grid gap-5 p-6 lg:grid-cols-[1.05fr_.95fr] lg:p-8">
            <div>
              <div className="flex items-center gap-3 text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]"><MapPinned className="h-4 w-4" /> {route.serviceLabel}</div>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-2xl font-black"><span>{route.fromLabel}</span><ArrowRight className="h-5 w-5 text-[#f3c44e]"/><span>{route.toLabel}</span></div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold text-white/80">
                <span className="flex items-center gap-2"><Clock3 className="h-4 w-4"/>About {route.durationMinutes} minutes</span>
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>USVI domestic route</span>
              </div>

              <div className="mt-6 rounded-3xl border border-[#f3c44e]/40 bg-[#f3c44e]/10 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]"><CalendarClock className="h-4 w-4"/>Next published departure</p>
                    {nextDeparture ? <p className="mt-2 text-3xl font-black">{nextDeparture.label} <span className="text-base text-white/70">{nextDeparture.dayLabel}</span></p> : <p className="mt-2 text-lg font-black">Checking island schedule…</p>}
                  </div>
                  {nextDeparture ? <span className="rounded-full bg-[#f3c44e] px-3 py-1.5 text-xs font-black text-[#043331]">{countdownLabel(nextDeparture.minutesUntil)}</span> : null}
                </div>
                {nextDeparture ? <p className="mt-3 text-sm font-semibold text-white/75">Be at the terminal {route.checkInMinutes} minutes early · {nextDeparture.leaveForTerminalInMinutes > 0 ? `the check-in deadline is ${countdownLabel(nextDeparture.leaveForTerminalInMinutes)}` : "the check-in window is open now"}.</p> : null}
                <p className="mt-2 text-[11px] font-bold text-white/55">Planning schedule, not live vessel tracking. Confirm with the operator before leaving.</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/15 bg-white/8 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]"><BadgeDollarSign className="h-4 w-4"/>Fare builder</p>
                {fareTotal !== null ? <strong className="text-2xl">${fareTotal.toFixed(2)}</strong> : <span className="text-xs font-bold text-white/60">Verify fare</span>}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stepper label="Adults" value={adults} onChange={setAdults} minimum={1} />
                <Stepper label="Children" value={children} onChange={setChildren} />
                <Stepper label="Bags" value={bags} onChange={setBags} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black"><input type="checkbox" checked={roundTrip} onChange={(event) => setRoundTrip(event.target.checked)} className="h-4 w-4 accent-[#f3c44e]"/>Round trip</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black"><input type="checkbox" checked={residentFare} disabled={!route.fare?.residentOneWay} onChange={(event) => setResidentFare(event.target.checked)} className="h-4 w-4 accent-[#f3c44e]"/>USVI resident fare</label>
              </div>
              <div className="mt-4 space-y-2 text-xs font-semibold text-white/70">
                <p className="flex items-center gap-2"><Users className="h-4 w-4"/>{route.fare ? `Adult $${(residentFare && route.fare.residentOneWay ? route.fare.residentOneWay : route.fare.adultOneWay).toFixed(2)} each way${route.fare.childOneWay !== undefined ? ` · child $${route.fare.childOneWay.toFixed(2)}` : ""}` : "Current passenger fare requires verification."}</p>
                <p className="flex items-center gap-2"><Luggage className="h-4 w-4"/>{route.fare?.bagOneWay !== undefined ? `$${route.fare.bagOneWay.toFixed(2)} per bag, each way` : "Ask the operator about baggage fees and limits."}</p>
              </div>
              <p className="mt-3 text-[11px] font-semibold leading-5 text-white/55">Estimate excludes taxis, parking and special cargo. Bring proof for resident pricing.</p>
            </div>
          </div>

          <div className="border-t border-white/10 px-6 py-5 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]">All published departures</p>
              <span className="text-[11px] font-bold text-white/55">{route.operatingDays}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">{route.departures.map((time) => <span key={time} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{time}</span>)}</div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 px-6 py-5 lg:px-8">
            <Link href={`/mobility?mode=ferry-transfer&pickupName=${encodeURIComponent(route.fromLabel)}&destinationName=${encodeURIComponent(route.toLabel)}`} className="rounded-full bg-[#f3c44e] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-[#043331]">Plan terminal ride</Link>
            <Link href={`/concierge?prompt=${encodeURIComponent(`Help me plan the ferry from ${route.fromLabel} to ${route.toLabel} for ${adults} adult${adults === 1 ? "" : "s"}, ${children} children and ${bags} bags`)}`} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em]"><Sparkles className="h-4 w-4"/>Ask Concierge</Link>
            <a href={route.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em]">Verify official source<ExternalLink className="h-3.5 w-3.5"/></a>
          </div>
        </div>
      ) : null}
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Schedules can change seasonally or operationally. VI Guide shows the published planning schedule and links to the government/port source for final verification before departure. U.S. citizens do not need a passport for travel solely within the U.S. Virgin Islands.</p>
    </section>
  );
}
