import Link from "next/link";
import {
  CalendarCheck,
  CalendarDays,
  Clock3,
  FileCheck2,
  Map,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { notFound } from "next/navigation";

import { SaveSharedJourneyButton } from "@/components/journey/save-shared-journey-button";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { buildJourneyMapHref, normalizeJourneyPlan } from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

export const dynamic = "force-dynamic";

const ISLANDS = { stt: "St. Thomas", stj: "St. John", stx: "St. Croix" } as const;

export default async function SharedTripPage({ params }: { params: { shareId: string } }) {
  if (!hasFirebaseAdminConfiguration() || !/^[a-zA-Z0-9]{12,40}$/.test(params.shareId)) notFound();
  const snapshot = await getAdminDb().collection("sharedJourneys").doc(params.shareId).get();
  const data = snapshot.exists ? snapshot.data() ?? {} : {};
  const plan = snapshot.exists ? normalizeJourneyPlan(data.plan) : null;
  if (!plan) notFound();

  const isAdvisorProposal = data.source === "travel_advisor_proposal";
  const proposalVersion = Number.isInteger(Number(data.proposalVersion))
    ? Math.max(1, Number(data.proposalVersion))
    : 1;
  const proposalArrival = cleanDate(data.proposalArrival);
  const proposalDeparture = cleanDate(data.proposalDeparture);
  const proposalTravelers = Math.max(1, Math.min(20, safeInteger(data.proposalTravelers) || 2));
  const bookableStops = isAdvisorProposal
    ? plan.plan.filter((stop) => Boolean(buildProposalBookingHref({
        stop,
        shareId: params.shareId,
        planDate: plan.date,
        arrival: proposalArrival,
        departure: proposalDeparture,
        travelers: proposalTravelers,
      }))).length
    : 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#fff_55%,#edf6f2_100%)] px-4 py-7 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#032d2b,#08736c)] p-6 text-white shadow-[0_28px_80px_rgba(4,51,49,.22)] sm:p-9">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5d36f]">
            {isAdvisorProposal ? <FileCheck2 size={14} /> : <Sparkles size={14} />}
            {isAdvisorProposal ? `VI Guide travel proposal · v${proposalVersion}` : "Shared VI Guide journey"}
          </div>
          <h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">{plan.title}</h1>
          <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/65">
            <span className="rounded-full bg-white/10 px-3 py-2">{ISLANDS[plan.island]}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><CalendarDays size={12} /> {plan.date}</span>
            <span className="rounded-full bg-white/10 px-3 py-2">{plan.plan.length} stops</span>
            {isAdvisorProposal ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2"><Users size={12} /> {proposalTravelers} traveler{proposalTravelers === 1 ? "" : "s"}</span>
            ) : null}
            {bookableStops > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f5c451] px-3 py-2 text-[#4c3500]"><CalendarCheck size={12} /> {bookableStops} request option{bookableStops === 1 ? "" : "s"}</span>
            ) : null}
          </div>
          {plan.notes ? <p className="mt-5 max-w-3xl text-sm font-semibold leading-6 text-white/65">{plan.notes}</p> : null}

          {isAdvisorProposal ? (
            <div className="mt-6 rounded-[22px] border border-white/15 bg-white/10 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f5c451]" />
                <div>
                  <p className="text-sm font-black">Prepared through the VI Guide Travel Advisor workflow</p>
                  <p className="mt-2 text-xs font-semibold leading-5 text-white/65">
                    This is a planning proposal for review, not a confirmation. Availability, operating schedules, transportation, reservations, terms, and pricing must still be confirmed before commitment or payment. Booking buttons below start a request; they do not create a confirmed reservation.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-7 flex flex-wrap gap-3">
            <SaveSharedJourneyButton plan={plan} />
            <Link href={buildJourneyMapHref(plan)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#4c3500]"><Map size={15} /> Open trip map</Link>
            <Link href="/today" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-[10px] font-black uppercase tracking-[.14em] text-white"><Sparkles size={15} /> Build my own day</Link>
          </div>
        </section>

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">
            {isAdvisorProposal ? "Read-only proposal" : "Read-only itinerary"}
          </div>
          <div className="mt-6 space-y-3">
            {plan.plan.map((stop, index) => {
              const proposalBookingHref = isAdvisorProposal
                ? buildProposalBookingHref({
                    stop,
                    shareId: params.shareId,
                    planDate: plan.date,
                    arrival: proposalArrival,
                    departure: proposalDeparture,
                    travelers: proposalTravelers,
                  })
                : "";
              return (
                <article key={stop.id} className="rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-4 sm:p-5">
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#043331] text-sm font-black text-white">{index + 1}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-black">{stop.title}</h2>{stop.startTime ? <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700"><Clock3 size={13} /> {stop.startTime}</span> : null}</div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{stop.summary}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stop.href ? <Link href={stop.href} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"><MapPin size={12} /> Place</Link> : null}
                        {stop.mapHref ? <Link href={stop.mapHref} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"><Map size={12} /> Map</Link> : null}
                        {stop.mobility ? <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-slate-500"><Route size={12} /> {stop.mobility.mode}</span> : null}
                        {proposalBookingHref ? (
                          <Link href={proposalBookingHref} className="inline-flex items-center gap-1.5 rounded-full bg-[#043331] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white">
                            <CalendarCheck size={12} /> Request booking
                          </Link>
                        ) : stop.bookingHref ? (
                          <Link href={stop.bookingHref} className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-teal-800">
                            <CalendarCheck size={12} /> Booking options
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function buildProposalBookingHref({
  stop,
  shareId,
  planDate,
  arrival,
  departure,
  travelers,
}: {
  stop: IntelligencePlanStop;
  shareId: string;
  planDate: string;
  arrival: string;
  departure: string;
  travelers: number;
}) {
  const kind = commerceKindForStop(stop.kind);
  if (!kind) return "";

  const listingId = (stop.placeId || stop.id).trim().slice(0, 160);
  const listingName = stop.title.trim().slice(0, 180);
  if (!listingId || !listingName) return "";

  const params = new URLSearchParams({
    kind,
    listingId,
    listingName,
    island: stop.island,
    adults: String(Math.max(1, Math.min(20, travelers))),
    proposal: shareId,
  });
  if (stop.href?.startsWith("/") && !stop.href.startsWith("//")) {
    params.set("listingHref", stop.href);
  }

  if (kind === "accommodation") {
    const startDate = arrival || planDate;
    if (startDate) params.set("startDate", startDate);
    if (departure && departure > startDate) params.set("endDate", departure);
  } else if (planDate) {
    params.set("startDate", planDate);
  }

  return `/book?${params.toString()}`;
}

function commerceKindForStop(value: string): "accommodation" | "tour" | "experience" | null {
  const normalized = value.trim().toLowerCase();
  if (["stay", "hotel", "resort", "villa", "accommodation", "lodging"].includes(normalized)) {
    return "accommodation";
  }
  if (["tour", "shore-excursion", "shore_excursion", "excursion"].includes(normalized)) {
    return "tour";
  }
  if (["experience", "activity", "attraction", "adventure"].includes(normalized)) {
    return "experience";
  }
  return null;
}

function cleanDate(value: unknown) {
  const text = typeof value === "string" ? value.trim().slice(0, 10) : "";
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function safeInteger(value: unknown) {
  const number = Number(value);
  return Number.isInteger(number) ? number : 0;
}
