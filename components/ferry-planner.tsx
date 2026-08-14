"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, BadgeDollarSign, CalendarClock, Clock3, ExternalLink, Info, Luggage, MapPinned, Minus, Phone, Plus, Route, ShieldCheck, Ship, Sparkles, TicketCheck, Users } from "lucide-react";

import { CAR_BARGE_ROUTES, FERRY_PORTS, FERRY_ROUTES, findFerryRoute, ferryRoutesFrom, getNextFerryDeparture, type FerryMode, type FerryPortId, type FerryRoute, type NextFerryDeparture } from "@/lib/ferry-planner";

const FerryNetworkMap = dynamic(
  () =>
    import("@/components/ferry-network-map").then(
      (module) => module.FerryNetworkMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="h-[280px] animate-pulse bg-[#dcefeb] sm:h-[340px]" />
    ),
  },
);

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

function NetworkOverview({ mode, selectedRoute, onSelect }: { mode: FerryMode; selectedRoute: FerryRoute | null; onSelect: (route: FerryRoute) => void }) {
  const routes = mode === "car-barge" ? CAR_BARGE_ROUTES : FERRY_ROUTES;
  return (
    <div className="mt-6 overflow-hidden rounded-[26px] border border-[#0b5b57]/15 bg-[#082f3b] text-white">
      <FerryNetworkMap
        mode={mode}
        selectedRouteId={selectedRoute?.id ?? null}
        onSelect={onSelect}
      />
      <div className="border-t border-white/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#f3c44e]">Popular connections</p>
            <p className="mt-1 text-[11px] font-semibold text-white/60">Select a route here or directly on the map.</p>
          </div>
          <MapPinned className="h-5 w-5 shrink-0 text-[#65d8cf]" />
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {routes.slice(0, mode === "passenger" ? 8 : 2).map((item) => <button key={item.id} type="button" onClick={() => onSelect(item)} aria-pressed={selectedRoute?.id === item.id} className={`min-w-0 rounded-2xl px-3 py-2.5 text-left text-[11px] font-black leading-4 transition ${selectedRoute?.id === item.id ? "bg-[#f3c44e] text-[#043331] shadow" : "bg-white/10 text-white hover:bg-white/15"}`}><span className="block truncate">{item.fromLabel.split(",")[0]}</span><span className="block truncate text-[9px] opacity-70">→ {item.toLabel.split(",")[0]}</span></button>)}
        </div>
      </div>
    </div>
  );
}

export function FerryPlanner() {
  const [mode, setMode] = useState<FerryMode>("passenger");
  const [from, setFrom] = useState<FerryPortId>("red-hook");
  const destinations = useMemo(() => ferryRoutesFrom(from, mode), [from, mode]);
  const [to, setTo] = useState<FerryPortId>("cruz-bay");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [bags, setBags] = useState(0);
  const [residentSeniors, setResidentSeniors] = useState(0);
  const [roundTrip, setRoundTrip] = useState(false);
  const [residentFare, setResidentFare] = useState(false);
  const [nextDeparture, setNextDeparture] = useState<NextFerryDeparture | null>(null);
  const route = findFerryRoute(from, to, mode);

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
    const seniorOneWay = residentFare && fare.residentSeniorOneWay ? fare.residentSeniorOneWay : adultOneWay;
    const passengerTotal = roundTrip && !residentFare && fare.adultRoundTrip
      ? adults * fare.adultRoundTrip + (children * childOneWay + residentSeniors * seniorOneWay) * 2
      : (adults * adultOneWay + children * childOneWay + residentSeniors * seniorOneWay) * (roundTrip ? 2 : 1);
    return passengerTotal + bags * (fare.bagOneWay ?? 0) * (roundTrip ? 2 : 1);
  }, [adults, bags, children, residentFare, residentSeniors, roundTrip, route]);

  function changeFrom(value: FerryPortId) {
    setFrom(value);
    setResidentSeniors(0);
    setResidentFare(false);
    const first = ferryRoutesFrom(value, mode)[0];
    if (first) setTo(first.to);
  }

  function changeMode(value: FerryMode) {
    setMode(value);
    setResidentFare(false);
    setResidentSeniors(0);
    const first = value === "car-barge" ? CAR_BARGE_ROUTES[0] : FERRY_ROUTES[0];
    setFrom(first.from);
    setTo(first.to);
  }

  function selectRoute(item: FerryRoute) {
    setFrom(item.from);
    setTo(item.to);
  }

  return (
    <section className="rounded-[32px] border border-[#0b5b57]/15 bg-white p-5 shadow-[0_22px_70px_rgba(4,51,49,.12)] md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#b7861f]">USVI + BVI Ferry Intelligence</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#043331]">Know when to leave — and what it costs.</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Explore passenger and car-barge routes, see the next published departure in island time, price the whole party and connect every terminal transfer.</p>
        </div>
        <Ship className="h-10 w-10 text-[#0b817b]" />
      </div>

      <div className="mt-6 inline-flex rounded-full border border-[#0b5b57]/15 bg-[#f8f4ea] p-1">
        <button type="button" onClick={() => changeMode("passenger")} className={`rounded-full px-5 py-2.5 text-xs font-black ${mode === "passenger" ? "bg-[#0b817b] text-white shadow" : "text-[#043331]"}`}>Passenger</button>
        <button type="button" onClick={() => changeMode("car-barge")} className={`rounded-full px-5 py-2.5 text-xs font-black ${mode === "car-barge" ? "bg-[#0b817b] text-white shadow" : "text-[#043331]"}`}>Car barge</button>
      </div>

      <NetworkOverview mode={mode} selectedRoute={route} onSelect={selectRoute} />

      <div className="mt-7 grid gap-4 md:grid-cols-2">
        <label className="space-y-2 text-sm font-black text-[#043331]">From
          <select value={from} onChange={(event) => changeFrom(event.target.value as FerryPortId)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 font-bold outline-none focus:border-[#0b817b]">
            {FERRY_PORTS.filter((port) => ferryRoutesFrom(port.id, mode).length).map((port) => <option key={port.id} value={port.id}>{port.label} · {port.island}</option>)}
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
                <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4"/>{route.requiresPassport ? "International · passport required" : route.serviceLabel.includes("BVI domestic") ? "BVI domestic route" : "USVI domestic route"}</span>
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
                {route.vehicleFare ? <strong className="text-2xl">From ${route.vehicleFare.oneWay.toFixed(2)}</strong> : fareTotal !== null ? <strong className="text-2xl">${fareTotal.toFixed(2)}</strong> : <span className="text-xs font-bold text-white/60">Verify fare</span>}
              </div>
              {route.vehicleFare ? <div className="mt-4 rounded-2xl border border-white/15 bg-white/10 p-4">
                <div className="flex items-center justify-between gap-3 text-sm font-black"><span>Vehicle one way</span><span>${route.vehicleFare.oneWay.toFixed(2)}</span></div>
                <div className="mt-3 flex items-center justify-between gap-3 text-sm font-black"><span>Vehicle round trip</span><span>${route.vehicleFare.roundTrip.toFixed(2)}</span></div>
                <p className="mt-3 text-xs font-semibold leading-5 text-white/60">{route.vehicleFare.note}</p>
              </div> : <>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Stepper label="Adults" value={adults} onChange={setAdults} minimum={1} />
                <Stepper label="Children" value={children} onChange={setChildren} />
                <Stepper label="Resident 60+" value={residentSeniors} onChange={(value) => { setResidentSeniors(value); if (value > 0) setResidentFare(true); }} />
                <Stepper label="Bags" value={bags} onChange={setBags} />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black"><input type="checkbox" checked={roundTrip} onChange={(event) => setRoundTrip(event.target.checked)} className="h-4 w-4 accent-[#f3c44e]"/>Round trip</label>
                <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-xs font-black"><input type="checkbox" checked={residentFare} disabled={!route.fare?.residentOneWay} onChange={(event) => { setResidentFare(event.target.checked); if (!event.target.checked) setResidentSeniors(0); }} className="h-4 w-4 accent-[#f3c44e]"/>USVI resident fare</label>
              </div>
              <div className="mt-4 space-y-2 text-xs font-semibold text-white/70">
                <p className="flex items-center gap-2"><Users className="h-4 w-4"/>{route.fare ? `Adult $${(residentFare && route.fare.residentOneWay ? route.fare.residentOneWay : route.fare.adultOneWay).toFixed(2)} each way${route.fare.childOneWay !== undefined ? ` · child $${route.fare.childOneWay.toFixed(2)}` : ""}${route.fare.residentSeniorOneWay !== undefined ? ` · resident 60+ $${route.fare.residentSeniorOneWay.toFixed(2)}` : ""}` : "Current passenger fare requires verification."}</p>
                <p className="flex items-center gap-2"><Luggage className="h-4 w-4"/>{route.fare?.bagOneWay !== undefined ? `$${route.fare.bagOneWay.toFixed(2)} per bag, each way` : "Ask the operator about baggage fees and limits."}</p>
              </div>
              </>}
              <p className="mt-3 text-[11px] font-semibold leading-5 text-white/55">Estimate excludes taxis, parking and special cargo. Bring proof for resident pricing.</p>
            </div>
          </div>

          <div className="grid gap-3 border-t border-white/10 px-6 py-5 md:grid-cols-3 lg:px-8">
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#f3c44e]"><TicketCheck className="h-4 w-4"/>Operator</p>
              <p className="mt-2 text-sm font-black">{route.operatorName ?? "Confirm with the listed port source"}</p>
              {route.operatorPhones?.map((phone) => <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="mt-2 flex items-center gap-2 text-xs font-bold text-white/70"><Phone className="h-3.5 w-3.5"/>{phone}</a>)}
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#f3c44e]"><MapPinned className="h-4 w-4"/>Departure terminal</p>
              <p className="mt-2 text-sm font-black">{route.terminalName ?? route.fromLabel}</p>
              {route.terminalNote ? <p className="mt-2 text-xs font-semibold leading-5 text-white/65">{route.terminalNote}</p> : null}
            </div>
            <div className="rounded-2xl bg-white/8 p-4">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em] text-[#f3c44e]"><Info className="h-4 w-4"/>Travel ready</p>
              <p className="mt-2 text-sm font-black">{route.requiresPassport ? "Valid passport required" : "Domestic island connection"}</p>
              <p className="mt-2 text-xs font-semibold leading-5 text-white/65">{route.requiresPassport ? "Allow extra time for immigration and customs. Taxes or port fees may be collected separately." : "Have tickets or QR codes ready before the scanner. Bring valid USVI ID for resident fares."}</p>
            </div>
          </div>

          {route.goodToKnow?.length ? <div className="border-t border-white/10 px-6 py-5 lg:px-8">
            <p className="text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]">Good to know</p>
            <ul className="mt-3 grid gap-2 md:grid-cols-3">{route.goodToKnow.map((item) => <li key={item} className="rounded-2xl bg-white/8 px-4 py-3 text-xs font-semibold leading-5 text-white/70">{item}</li>)}</ul>
          </div> : null}

          <div className="border-t border-white/10 px-6 py-5 lg:px-8">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-black uppercase tracking-[.18em] text-[#f3c44e]">All published departures</p>
              <span className="text-[11px] font-bold text-white/55">{route.operatingDays}</span>
            </div>
            {(route.weekdayDepartures || route.saturdayDepartures || route.sundayDepartures) ? <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/55">Monday–Friday</p>
              <div className="mt-2 flex flex-wrap gap-2">{(route.weekdayDepartures ?? route.departures).map((time) => <span key={`weekday-${time}`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{time}</span>)}</div>
            </div> : null}
            {route.weekendDepartures ? <div className="mt-4">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/55">Saturday–Sunday</p>
              <div className="mt-2 flex flex-wrap gap-2">{route.weekendDepartures.map((time) => <span key={`weekend-${time}`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{time}</span>)}</div>
            </div> : null}
            {route.saturdayDepartures ? <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/55">Saturday</p><div className="mt-2 flex flex-wrap gap-2">{route.saturdayDepartures.map((time) => <span key={`saturday-${time}`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{time}</span>)}</div></div> : null}
            {route.sundayDepartures ? <div className="mt-4"><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/55">Sunday + major holidays</p><div className="mt-2 flex flex-wrap gap-2">{route.sundayDepartures.map((time) => <span key={`sunday-${time}`} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{time}</span>)}</div></div> : null}
            {!route.weekdayDepartures && !route.weekendDepartures && !route.saturdayDepartures && !route.sundayDepartures ? <div className="mt-3 flex flex-wrap gap-2">{route.departures.map((time) => <span key={time} className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold">{time}</span>)}</div> : null}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/10 px-6 py-5 lg:px-8">
            <Link href={`/mobility?mode=ferry-transfer&pickupName=${encodeURIComponent(route.fromLabel)}&destinationName=${encodeURIComponent(route.toLabel)}`} className="rounded-full bg-[#f3c44e] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-[#043331]">Plan terminal ride</Link>
            {route.bookingUrl ? <a href={route.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full bg-[#0b817b] px-5 py-3 text-xs font-black uppercase tracking-[.14em] text-white"><TicketCheck className="h-4 w-4"/>Operator booking</a> : null}
            <a href="#door-to-door" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em]"><Route className="h-4 w-4"/>Build full journey</a>
            <Link href={`/concierge?prompt=${encodeURIComponent(`Coordinate my ferry from ${route.fromLabel} to ${route.toLabel}. We have ${adults} adult${adults === 1 ? "" : "s"}, ${children} children, ${residentSeniors} resident seniors and ${bags} bags${roundTrip ? ", round trip" : ""}. Use the next published departure, arrange terminal transportation and add the plan to my itinerary.`)}`} className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em]"><Sparkles className="h-4 w-4"/>Ask Concierge</Link>
            <a href={route.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-3 text-xs font-black uppercase tracking-[.14em]">Verify official source<ExternalLink className="h-3.5 w-3.5"/></a>
          </div>
        </div>
      ) : null}
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">Schedules can change seasonally or operationally. USVI Explorer shows the published planning schedule and links to the government, tourism-board or operator source for final verification. {route?.requiresPassport ? "USVI–BVI travel requires a valid passport and customs/immigration processing." : "U.S. citizens do not need a passport for travel solely within the U.S. Virgin Islands."}</p>
    </section>
  );
}
