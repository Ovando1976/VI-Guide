import Link from "next/link";
import { CalendarDays, Clock3, Map, MapPin, Route, Sparkles } from "lucide-react";
import { notFound } from "next/navigation";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { buildJourneyMapHref, normalizeJourneyPlan } from "@/lib/journey-planner";

export const dynamic = "force-dynamic";

const ISLANDS = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" } as const;

export default async function SharedTripPage({ params }: { params: { shareId: string } }) {
  if (!hasFirebaseAdminConfiguration() || !/^[a-zA-Z0-9]{12,40}$/.test(params.shareId)) notFound();
  const snapshot = await getAdminDb().collection("sharedJourneys").doc(params.shareId).get();
  const plan = snapshot.exists ? normalizeJourneyPlan(snapshot.data()?.plan) : null;
  if (!plan) notFound();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#fff_55%,#edf6f2_100%)] px-4 py-7 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#032d2b,#08736c)] p-6 text-white shadow-[0_28px_80px_rgba(4,51,49,.22)] sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5d36f]"><Sparkles size={14} /> Shared VI Guide journey</div>
          <h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">{plan.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/65">
            <span className="rounded-full bg-white/10 px-3 py-2">{ISLANDS[plan.island]}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><CalendarDays size={12} /> {plan.date}</span>
            <span className="rounded-full bg-white/10 px-3 py-2">{plan.plan.length} stops</span>
          </div>
          {plan.notes ? <p className="mt-5 max-w-3xl text-sm font-semibold leading-6 text-white/65">{plan.notes}</p> : null}
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href={buildJourneyMapHref(plan)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#4c3500]"><Map size={15} /> Open trip map</Link>
            <Link href="/today" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-[10px] font-black uppercase tracking-[.14em] text-white"><Sparkles size={15} /> Build my own day</Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Read-only itinerary</div>
          <div className="mt-6 space-y-3">
            {plan.plan.map((stop, index) => (
              <article key={stop.id} className="rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-4 sm:p-5">
                <div className="flex items-start gap-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#043331] text-sm font-black text-white">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black">{stop.title}</h2>{stop.startTime ? <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700"><Clock3 size={13} /> {stop.startTime}</span> : null}</div>
                    <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{stop.summary}</p>
                    <div className="mt-3 flex flex-wrap gap-2">{stop.href ? <Link href={stop.href} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"><MapPin size={12} /> Place</Link> : null}{stop.mapHref ? <Link href={stop.mapHref} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"><Map size={12} /> Map</Link> : null}{stop.mobility ? <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-slate-500"><Route size={12} /> {stop.mobility.mode}</span> : null}</div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
