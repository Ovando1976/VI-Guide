import Image from "next/image";
import Link from "next/link";
import {
  CalendarCheck2,
  CalendarDays,
  Clock3,
  FileCheck2,
  Map,
  MapPin,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { notFound } from "next/navigation";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { SaveSharedJourneyButton } from "@/components/journey/save-shared-journey-button";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import { buildJourneyMapHref, normalizeJourneyPlan } from "@/lib/journey-planner";
import { buildTravelAdvisorBookingHref } from "@/lib/travel-advisor-booking-handoff";

export const dynamic = "force-dynamic";

const ISLANDS = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
} as const;

const ISLAND_CONTEXT_IMAGES = {
  stt: "/images/usvi-harbor-hero.jpg",
  stj: "/images/places/st-john/trunk-bay-overlook-1.jpg",
  stx: "/images/places/st-croix/cane-bay-beach-1.jpg",
} as const;

export default async function SharedTripPage({
  params,
}: {
  params: { shareId: string };
}) {
  if (
    !hasFirebaseAdminConfiguration() ||
    !/^[a-zA-Z0-9]{12,40}$/.test(params.shareId)
  ) {
    notFound();
  }

  const snapshot = await getAdminDb()
    .collection("sharedJourneys")
    .doc(params.shareId)
    .get();
  const data = snapshot.exists ? snapshot.data() ?? {} : {};
  const plan = snapshot.exists ? normalizeJourneyPlan(data.plan) : null;
  if (!plan) notFound();

  const isAdvisorProposal = data.source === "travel_advisor_proposal";
  const proposalVersion = Number.isInteger(Number(data.proposalVersion))
    ? Math.max(1, Number(data.proposalVersion))
    : 1;
  const bookableStopCount = isAdvisorProposal
    ? plan.plan.filter((stop) =>
        Boolean(
          buildTravelAdvisorBookingHref({
            shareId: params.shareId,
            date: plan.date,
            stop,
          }),
        ),
      ).length
    : 0;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8f4ea_0%,#fff_55%,#edf6f2_100%)] px-4 py-5 text-[#043331] sm:px-6 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <ViPublicHeader
          actionHref="/planner"
          actionLabel="My Trip"
          actionIcon={Route}
          secondaryHref="/concierge"
          secondaryLabel="VI Concierge"
        />
      </div>

      <div className="mx-auto mt-6 max-w-4xl space-y-6 lg:mt-8">
        <section className="relative isolate overflow-hidden rounded-[36px] text-white shadow-[0_28px_80px_rgba(4,51,49,.22)]">
          <Image
            src={ISLAND_CONTEXT_IMAGES[plan.island]}
            alt={`${ISLANDS[plan.island]} island context`}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 896px"
            className="-z-30 object-cover object-center"
          />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(120deg,rgba(3,45,43,.97)_0%,rgba(3,45,43,.88)_48%,rgba(3,45,43,.48)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.2),transparent_34%)]" />

          <div className="p-6 sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.18em] text-[#f5d36f] backdrop-blur">
                {isAdvisorProposal ? (
                  <FileCheck2 size={14} />
                ) : (
                  <Sparkles size={14} />
                )}
                {isAdvisorProposal
                  ? `VI Guide travel proposal · v${proposalVersion}`
                  : "Shared VI Guide journey"}
              </div>
              <span className="rounded-full border border-white/15 bg-black/15 px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-white/80 backdrop-blur">
                Island context · {ISLANDS[plan.island]}
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-black tracking-[-.05em] sm:text-5xl">
              {plan.title}
            </h1>
            <div className="mt-5 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.14em] text-white/70">
              <span className="rounded-full bg-white/10 px-3 py-2">
                {ISLANDS[plan.island]}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2">
                <CalendarDays size={12} /> {plan.date}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-2">
                {plan.plan.length} stops
              </span>
              {bookableStopCount ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-2">
                  <CalendarCheck2 size={12} /> {bookableStopCount} booking option
                  {bookableStopCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            {plan.notes ? (
              <p className="mt-5 max-w-3xl text-sm font-semibold leading-6 text-white/72">
                {plan.notes}
              </p>
            ) : null}

            {isAdvisorProposal ? (
              <div className="mt-6 rounded-[22px] border border-white/15 bg-white/10 p-4 backdrop-blur sm:p-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#f5c451]" />
                  <div>
                    <p className="text-sm font-black">
                      Prepared through the VI Guide Travel Advisor workflow
                    </p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-white/68">
                      This is a planning proposal for review, not a confirmation.
                      Availability, operating schedules, transportation,
                      reservations, terms, and pricing must still be confirmed
                      before commitment or payment.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-7 flex flex-wrap gap-3">
              <SaveSharedJourneyButton plan={plan} />
              <Link
                href={buildJourneyMapHref(plan)}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#4c3500]"
              >
                <Map size={15} /> Open trip map
              </Link>
              <Link
                href="/today"
                className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/20 bg-black/10 px-5 text-[10px] font-black uppercase tracking-[.14em] text-white backdrop-blur"
              >
                <Sparkles size={15} /> Build my own day
              </Link>
            </div>
          </div>
        </section>

        {isAdvisorProposal && bookableStopCount ? (
          <section className="rounded-[30px] border border-teal-200 bg-teal-50 p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-teal-700 shadow-sm">
                <CalendarCheck2 className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                  Move from plan to booking
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
                  Request the bookable parts when you are ready.
                </h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-teal-950/70">
                  Bookable stops below now connect directly into VI Guide&apos;s
                  booking workflow. You review the dates and enter your contact
                  details before any request is created. A request does not
                  guarantee availability and does not create a charge.
                </p>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">
            {isAdvisorProposal ? "Read-only proposal" : "Read-only itinerary"}
          </div>
          <div className="mt-6 space-y-3">
            {plan.plan.map((stop, index) => {
              const bookingHref = isAdvisorProposal
                ? buildTravelAdvisorBookingHref({
                    shareId: params.shareId,
                    date: plan.date,
                    stop,
                  })
                : null;

              return (
                <article
                  key={stop.id}
                  className="rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-4 sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#043331] text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">{stop.title}</h2>
                        {stop.startTime ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
                            <Clock3 size={13} /> {stop.startTime}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                        {stop.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {bookingHref ? (
                          <Link
                            href={bookingHref}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#043331] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-white"
                          >
                            <CalendarCheck2 size={12} /> Request booking
                          </Link>
                        ) : null}
                        {stop.href ? (
                          <Link
                            href={stop.href}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"
                          >
                            <MapPin size={12} /> Place
                          </Link>
                        ) : null}
                        {stop.mapHref ? (
                          <Link
                            href={stop.mapHref}
                            className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"
                          >
                            <Map size={12} /> Map
                          </Link>
                        ) : null}
                        {stop.mobility ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-slate-500">
                            <Route size={12} /> {stop.mobility.mode}
                          </span>
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
