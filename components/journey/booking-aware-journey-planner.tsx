"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CalendarCheck2, Loader2, ShieldCheck } from "lucide-react";

import { ProactiveTripIntelligence } from "@/components/intelligence/proactive-trip-intelligence";
import { JourneyPlanner } from "@/components/journey/journey-planner";
import { JourneyMobilityBookings } from "@/components/journey/journey-mobility-bookings";
import { JourneyRouteDashboard } from "@/components/journey/journey-route-dashboard";
import {
  createBookingJourneyPlan,
  parseBookingPlannerHandoff,
  type BookingPlannerHandoff,
} from "@/lib/booking/booking-planner-handoff";
import { upsertJourneyPlan } from "@/lib/journey-planner";

export function BookingAwareJourneyPlanner() {
  const searchParams = useSearchParams();
  const serializedSearchParams = searchParams.toString();
  const [ready, setReady] = useState(false);
  const [handoff, setHandoff] = useState<BookingPlannerHandoff | null>(null);
  const [handoffError, setHandoffError] = useState<string | null>(null);

  const parsedHandoff = useMemo(
    () => parseBookingPlannerHandoff(new URLSearchParams(serializedSearchParams)),
    [serializedSearchParams],
  );

  useEffect(() => {
    try {
      if (parsedHandoff) {
        upsertJourneyPlan(createBookingJourneyPlan(parsedHandoff));
        setHandoff(parsedHandoff);
        window.history.replaceState(window.history.state, "", "/planner");
      }
    } catch {
      setHandoffError(
        "VI Guide could not add this booking request automatically. Your planner is still available below.",
      );
    } finally {
      setReady(true);
    }
  }, [parsedHandoff]);

  if (!ready) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f2e7] px-6 text-center text-[#043331]">
        <div>
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" />
          <p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-teal-700">
            Preparing your journey
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      {handoff ? <BookingAddedNotice handoff={handoff} /> : null}
      {handoffError ? (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-4 text-center text-sm font-semibold text-amber-900">
          {handoffError}
        </div>
      ) : null}
      <JourneyMobilityBookings />
      <ProactiveTripIntelligence />
      <JourneyPlanner />
      <JourneyRouteDashboard />
    </>
  );
}

function BookingAddedNotice({ handoff }: { handoff: BookingPlannerHandoff }) {
  return (
    <section className="border-b border-emerald-200 bg-emerald-50 px-4 py-4 text-[#043331] sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-100 text-emerald-700">
            <CalendarCheck2 className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-700">
              Booking request added
            </p>
            <h1 className="mt-1 text-lg font-black">
              Plan around {handoff.listingName}
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Request {handoff.reference} is in your planner as an unconfirmed stop.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {handoff.listingHref ? (
            <Link
              href={handoff.listingHref}
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-emerald-200 bg-white px-4 text-[10px] font-black uppercase tracking-[.14em]"
            >
              View listing
            </Link>
          ) : null}
          <Link
            href="/bookings"
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-[#043331] px-4 text-[10px] font-black uppercase tracking-[.14em] text-white"
          >
            <ShieldCheck className="h-4 w-4" /> Check status
          </Link>
        </div>
      </div>
    </section>
  );
}
