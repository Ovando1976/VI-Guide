"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarDays, CarFront, Clock3, Route, Save, Ship, Sparkles, TriangleAlert } from "lucide-react";

import { createJourneyPlan, upsertJourneyPlan } from "@/lib/journey-planner";
import { writeSelectedTravelerTripPlanId } from "@/lib/traveler-trip-selection";
import {
  JOURNEY_PLACES,
  planSmartIslandJourney,
  type JourneyTimeMode,
  type SmartJourneyPlan,
} from "@/lib/smart-island-journey";
import type { IntelligencePlanStop } from "@/types/intelligence";

function todayInVi() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/St_Thomas", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
}

export function SmartIslandJourneyBuilder() {
  const router = useRouter();
  const [originId, setOriginId] = useState("stt-airport");
  const [destinationId, setDestinationId] = useState("cruz-bay");
  const [travelDate, setTravelDate] = useState(todayInVi);
  const [requestedTime, setRequestedTime] = useState("09:00");
  const [timeMode, setTimeMode] = useState<JourneyTimeMode>("departAfter");
  const [saved, setSaved] = useState(false);

  const plan = useMemo(
    () => planSmartIslandJourney({ originId, destinationId, travelDate, requestedTime, timeMode }),
    [originId, destinationId, travelDate, requestedTime, timeMode],
  );

  function savePlan(planToSave: SmartJourneyPlan) {
    const journey = createJourneyPlan(planToSave.origin.island, `${planToSave.origin.label} → ${planToSave.destination.label}`);
    const ferryIsland = planToSave.origin.island;
    const stops: IntelligencePlanStop[] = planToSave.legs.map((leg, index) => ({
      id: `island_journey_${journey.id}_${index}`.slice(0, 160),
      title: leg.mode === "ferry" ? `${leg.from} → ${leg.to}` : leg.mode === "taxi" ? `Transfer · ${leg.to}` : leg.to,
      island: leg.mode === "ferry" ? ferryIsland : index === planToSave.legs.length - 1 ? planToSave.destination.island : planToSave.origin.island,
      kind: leg.mode === "ferry" ? "ferry" : "mobility",
      summary: leg.note,
      startTime: leg.startTime,
      durationMinutes: leg.minutes,
      ...(leg.mobilityHref ? { bookingHref: leg.mobilityHref } : {}),
    }));
    upsertJourneyPlan({
      ...journey,
      date: planToSave.travelDate,
      status: "ready",
      notes: `VI Guide connected journey. Published ferry departure ${planToSave.ferryDepartureTime}; verify the operating schedule before travel.`,
      plan: stops,
    });
    writeSelectedTravelerTripPlanId(journey.id);
    setSaved(true);
    router.push("/trips");
  }

  const sameIsland = JOURNEY_PLACES.find((place) => place.id === originId)?.island === JOURNEY_PLACES.find((place) => place.id === destinationId)?.island;

  return (
    <section className="rounded-[32px] border border-[#0b5b57]/15 bg-white p-5 shadow-[0_22px_70px_rgba(4,51,49,.08)] md:p-8">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[.22em] text-[#b7861f]">Smart Island Journey</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#043331]">Tell us where. VI Guide connects the trip.</h2>
          <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">Choose an origin, destination and timing preference. VI Guide evaluates the supported ferry corridors, terminal transfer time and check-in buffer, then recommends the best published connection.</p>
        </div>
        <Route className="h-10 w-10 text-[#0b817b]" />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Field label="From">
          <select value={originId} onChange={(event) => { setOriginId(event.target.value); setSaved(false); }} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 text-sm font-bold text-[#043331]">
            {JOURNEY_PLACES.map((place) => <option key={place.id} value={place.id}>{place.label}</option>)}
          </select>
        </Field>
        <Field label="To">
          <select value={destinationId} onChange={(event) => { setDestinationId(event.target.value); setSaved(false); }} className="w-full rounded-2xl border border-slate-200 bg-[#f8f4ea] px-4 py-3 text-sm font-bold text-[#043331]">
            {JOURNEY_PLACES.map((place) => <option key={place.id} value={place.id}>{place.label}</option>)}
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

      {plan ? (
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
          <h3 className="font-black text-[#043331]">{sameIsland ? "No ferry needed for this pair." : "No supported direct ferry connection fits these selections."}</h3>
          <p className="mt-2 text-sm font-semibold text-slate-600">{sameIsland ? "Use VI Guide Mobility for an on-island ride, or choose a destination on another island." : "Try a different time/date, or ask VI Concierge to coordinate a multi-ferry or alternate connection. Published schedules remain subject to operator changes."}</p>
          <div className="mt-4 flex gap-3"><Link href="/mobility" className="rounded-full bg-[#043f3b] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.12em] text-white">Open Mobility</Link><Link href="/concierge?prompt=Help%20me%20coordinate%20an%20inter-island%20connection" className="rounded-full border border-[#043f3b]/20 px-4 py-2.5 text-[10px] font-black uppercase tracking-[.12em] text-[#043f3b]">Ask Concierge</Link></div>
        </div>
      )}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-black uppercase tracking-[.14em] text-slate-500">{label}</span>{children}</label>; }
function Stat({ label, value }: { label: string; value: string }) { return <div><div className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">{label}</div><div className="mt-1 text-xl font-black text-[#043331]">{value}</div></div>; }
