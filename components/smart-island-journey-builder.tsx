"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CarFront, Clock3, LoaderCircle, Route, Save, Ship, Sparkles, TriangleAlert } from "lucide-react";

import { createJourneyPlan, upsertJourneyPlan } from "@/lib/journey-planner";
import { writeSelectedTravelerTripPlanId } from "@/lib/traveler-trip-selection";
import {
  FERRY_TERMINAL_COORDS,
  JOURNEY_PLACES,
  ferryPortsForIsland,
  planSmartIslandJourney,
  type JourneyPlace,
  type JourneyTimeMode,
  type SmartJourneyPlan,
} from "@/lib/smart-island-journey";
import type { FerryPortId } from "@/lib/ferry-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

function todayInVi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/St_Thomas", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function SmartIslandJourneyBuilder({ catalogPlaces = [] }: { catalogPlaces?: JourneyPlace[] }) {
  const router = useRouter();
  const places = useMemo(() => [...JOURNEY_PLACES, ...catalogPlaces], [catalogPlaces]);
  const [originId, setOriginId] = useState("stt-airport");
  const [destinationId, setDestinationId] = useState("cruz-bay");
  const [travelDate, setTravelDate] = useState(todayInVi);
  const [requestedTime, setRequestedTime] = useState("09:00");
  const [timeMode, setTimeMode] = useState<JourneyTimeMode>("departAfter");
  const [routedOrigin, setRoutedOrigin] = useState<JourneyPlace | null>(null);
  const [routedDestination, setRoutedDestination] = useState<JourneyPlace | null>(null);
  const [routing, setRouting] = useState(false);
  const [saved, setSaved] = useState(false);

  const origin = places.find((place) => place.id === originId) ?? null;
  const destination = places.find((place) => place.id === destinationId) ?? null;
  const sameIsland = Boolean(origin && destination && origin.island === destination.island);

  useEffect(() => {
    let cancelled = false;
    setSaved(false);

    if (!origin || !destination || sameIsland) {
      setRoutedOrigin(origin);
      setRoutedDestination(destination);
      setRouting(false);
      return () => { cancelled = true; };
    }

    async function routeSelections() {
      setRouting(true);
      const [nextOrigin, nextDestination] = await Promise.all([
        resolveTerminalTransfers(origin, "origin"),
        resolveTerminalTransfers(destination, "destination"),
      ]);
      if (cancelled) return;
      setRoutedOrigin(nextOrigin);
      setRoutedDestination(nextDestination);
      setRouting(false);
    }

    void routeSelections();
    return () => { cancelled = true; };
  }, [origin, destination, sameIsland]);

  const plan = useMemo(() => {
    if (routing || !routedOrigin || !routedDestination) return null;
    return planSmartIslandJourney({
      origin: routedOrigin,
      destination: routedDestination,
      travelDate,
      requestedTime,
      timeMode,
    });
  }, [routing, routedOrigin, routedDestination, travelDate, requestedTime, timeMode]);

  function savePlan(planToSave: SmartJourneyPlan) {
    const journey = createJourneyPlan(planToSave.origin.island, `${planToSave.origin.label} → ${planToSave.destination.label}`);
    const stops: IntelligencePlanStop[] = planToSave.legs.map((leg, index) => {
      const isFirst = index === 0;
      const isLast = index === planToSave.legs.length - 1;
      const terminal = leg.mode === "ferry" ? FERRY_TERMINAL_COORDS[planToSave.route.from] : null;
      const lat = isFirst ? planToSave.origin.lat : isLast ? planToSave.destination.lat : terminal?.lat;
      const lng = isFirst ? planToSave.origin.lng : isLast ? planToSave.destination.lng : terminal?.lng;
      return {
        id: `island_journey_${journey.id}_${index}`.slice(0, 160),
        title: leg.mode === "ferry" ? `${leg.from} → ${leg.to}` : `Transfer · ${leg.to}`,
        island: isLast ? planToSave.destination.island : planToSave.origin.island,
        kind: leg.mode === "ferry" ? "ferry" : "mobility",
        summary: leg.note,
        startTime: leg.startTime,
        durationMinutes: leg.minutes,
        ...(typeof lat === "number" ? { lat } : {}),
        ...(typeof lng === "number" ? { lng } : {}),
        ...(leg.mobilityHref ? { bookingHref: leg.mobilityHref } : {}),
        ...(isFirst && planToSave.origin.sourceHref ? { href: planToSave.origin.sourceHref } : {}),
        ...(isLast && planToSave.destination.sourceHref ? { href: planToSave.destination.sourceHref } : {}),
      };
    });

    upsertJourneyPlan({
      ...journey,
      date: planToSave.travelDate,
      status: "ready",
      notes: `VI Guide connected journey. Published ferry departure ${planToSave.ferryDepartureTime}; road timing uses VI Guide routing estimates and the ferry schedule must be verified before travel.`,
      plan: stops,
    });
    writeSelectedTravelerTripPlanId(journey.id);
    setSaved(true);
    router.push("/trips");
  }

  return (
    <section className="rounded-[32px] border border-[#0b5b57]/15 bg-white p-5 shadow-[0_22px_70px_rgba(4,51,49,.08)] md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#b7861f]">Smart Island Journey</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#043331]">Choose any mapped VI Guide place.</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">VI Guide now uses place coordinates and the existing road-routing API to estimate the terminal connection, then combines that with the governed ferry schedule and check-in buffer.</p>
        </div>
        <Route className="h-10 w-10 text-[#0b817b]" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Field label="From">
          <select value={originId} onChange={(event) => setOriginId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 text-sm font-bold text-[#043331]">
            {renderPlaceOptions(places)}
          </select>
        </Field>
        <Field label="To">
          <select value={destinationId} onChange={(event) => setDestinationId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 text-sm font-bold text-[#043331]">
            {renderPlaceOptions(places)}
          </select>
        </Field>
        <Field label="Date">
          <div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#0b817b]"/><input type="date" value={travelDate} onChange={(event) => setTravelDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] py-3 pl-10 pr-3 text-sm font-bold text-[#043331]"/></div>
        </Field>
        <Field label="Timing">
          <select value={timeMode} onChange={(event) => setTimeMode(event.target.value as JourneyTimeMode)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 text-sm font-bold text-[#043331]"><option value="departAfter">Leave after</option><option value="arriveBy">Arrive by</option></select>
        </Field>
        <Field label="Time">
          <div className="relative"><Clock3 className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-[#0b817b]"/><input type="time" value={requestedTime} onChange={(event) => setRequestedTime(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] py-3 pl-10 pr-3 text-sm font-bold text-[#043331]"/></div>
        </Field>
      </div>

      {routing ? (
        <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-teal-100 bg-teal-50 p-5 text-sm font-bold text-teal-900"><LoaderCircle className="h-5 w-5 animate-spin"/>Calculating the road connections to the best ferry terminals…</div>
      ) : plan ? (
        <div className="mt-6 overflow-hidden rounded-[28px] border border-[#0b5b57]/12 bg-[#f8f4ea]">
          <div className="grid gap-4 border-b border-[#0b5b57]/10 p-5 md:grid-cols-4 md:p-6">
            <Stat label="Leave origin" value={plan.leaveOriginTime}/><Stat label="Ferry" value={plan.ferryDepartureTime}/><Stat label="Arrive" value={plan.destinationArrivalTime}/><Stat label="Journey time" value={`${plan.totalMinutes} min`}/>
          </div>
          {plan.warning ? <div className="flex gap-2 border-b border-amber-200 bg-amber-50 px-5 py-3 text-xs font-bold text-amber-900"><TriangleAlert className="h-4 w-4 shrink-0"/>{plan.warning}</div> : null}
          <div className="grid md:grid-cols-3">
            {plan.legs.map((leg, index) => {
              const Icon = leg.mode === "ferry" ? Ship : CarFront;
              return <div key={`${leg.mode}-${index}`} className="border-b border-slate-200 p-5 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0"><div className="flex items-center justify-between"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e5f4f1] text-[#08746f]"><Icon className="h-5 w-5"/></span><span className="text-[10px] font-black uppercase tracking-[.16em] text-slate-400">{leg.startTime} → {leg.endTime}</span></div><h3 className="mt-4 text-lg font-black text-[#043331]">{leg.from} <ArrowRight className="mx-1 inline h-4 w-4 text-[#b7861f]"/> {leg.to}</h3><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{leg.note}</p>{leg.mobilityHref ? <Link href={leg.mobilityHref} className="mt-4 inline-flex rounded-full border border-[#0b817b]/20 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[.12em] text-[#08746f]">Open ride</Link> : null}</div>;
            })}
          </div>
          <div className="flex flex-wrap gap-3 bg-[#043f3b] p-5 md:px-6">
            <button type="button" onClick={() => savePlan(plan)} className="inline-flex items-center gap-2 rounded-full bg-[#f3c44e] px-5 py-3 text-xs font-black uppercase tracking-[.13em] text-[#043331]"><Save className="h-4 w-4"/>{saved ? "Saved" : "Save to My Trip"}</button>
            <Link href={`/concierge?prompt=${encodeURIComponent(`Coordinate my complete VI Guide journey from ${plan.origin.label} to ${plan.destination.label} on ${plan.travelDate}. Recommended ferry departure: ${plan.ferryDepartureTime}. Verify the published sailing and help with each ground transfer.`)}`} className="inline-flex items-center gap-2 rounded-full border border-white/25 px-5 py-3 text-xs font-black uppercase tracking-[.13em] text-white"><Sparkles className="h-4 w-4"/>Ask Concierge</Link>
            <a href={plan.route.sourceUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/25 px-5 py-3 text-xs font-black uppercase tracking-[.13em] text-white">Verify ferry source</a>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-[24px] border border-dashed border-[#0b5b57]/20 bg-[#f8f4ea] p-6">
          <h3 className="font-black text-[#043331]">{sameIsland ? "No ferry needed for this pair." : "No supported ferry connection fits these selections."}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{sameIsland ? "Use VI Guide Mobility for an on-island ride, or choose a destination on another island." : "Try another time/date or a different mapped place. If road routing is unavailable for a location, VI Concierge can coordinate the connection manually."}</p>
          <div className="mt-4 flex gap-3"><Link href="/mobility" className="rounded-full bg-[#043f3b] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.12em] text-white">Open Mobility</Link><Link href="/concierge?prompt=Help%20me%20coordinate%20an%20inter-island%20connection" className="rounded-full border border-[#043f3b]/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-[.12em] text-[#043f3b]">Ask Concierge</Link></div>
        </div>
      )}
    </section>
  );
}

async function resolveTerminalTransfers(place: JourneyPlace, direction: "origin" | "destination") {
  if (Object.keys(place.terminalTransfers).length || place.lat == null || place.lng == null) return place;
  const terminalTransfers: Partial<Record<FerryPortId, number>> = {};

  await Promise.all(ferryPortsForIsland(place.island).map(async (port) => {
    const terminal = FERRY_TERMINAL_COORDS[port];
    const from = direction === "origin" ? { lat: place.lat!, lng: place.lng! } : terminal;
    const to = direction === "origin" ? terminal : { lat: place.lat!, lng: place.lng! };
    try {
      const response = await fetch("/api/route", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ from, to }),
      });
      if (!response.ok) return;
      const result = await response.json() as { durationSeconds?: number };
      if (typeof result.durationSeconds === "number" && Number.isFinite(result.durationSeconds)) {
        terminalTransfers[port] = Math.max(3, Math.ceil(result.durationSeconds / 60));
      }
    } catch {
      // A missing road estimate should remove only this terminal candidate, not break the planner.
    }
  }));

  return { ...place, terminalTransfers };
}

function renderPlaceOptions(places: JourneyPlace[]) {
  const islands = [["stt", "St. Thomas"], ["stj", "St. John"], ["stx", "St. Croix"]] as const;
  return islands.map(([island, label]) => (
    <optgroup key={island} label={label}>
      {places.filter((place) => place.island === island).map((place) => <option key={place.id} value={place.id}>{place.label}</option>)}
    </optgroup>
  ));
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-500">{label}</span>{children}</label>; }
function Stat({ label, value }: { label: string; value: string }) { return <div><div className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{label}</div><div className="mt-1 text-xl font-black text-[#043331]">{value}</div></div>; }
