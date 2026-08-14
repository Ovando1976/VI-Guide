"use client";

import Link from "next/link";
import {
  BadgeCheck,
  CalendarCheck,
  CircleAlert,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { useState } from "react";

import { WorkspaceBookingForm } from "@/components/booking/workspace-booking-form";
import type { JourneyPlan } from "@/lib/journey-planner";
import type { IntelligencePlanStop } from "@/types/intelligence";

export function WorkspaceReservations({ journey }: { journey: JourneyPlan }) {
  const reservableStops = journey.plan.filter(isReservableStop);
  const directBookingCount = reservableStops.filter((stop) => stop.bookingHref).length;
  const [selectedStop, setSelectedStop] = useState<IntelligencePlanStop | null>(null);

  return (
    <>
      <section className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <CalendarCheck className="h-5 w-5 text-teal-700" />
            <div>
              <h2 className="text-xl font-black">Reservations</h2>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">
                {directBookingCount} direct links · {reservableStops.length} bookable stops
              </p>
            </div>
          </div>
          <Link
            href="/bookings"
            className="rounded-full border border-slate-200 px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-teal-700"
          >
            Manage
          </Link>
        </div>

        {reservableStops.length ? (
          <div className="mt-5 space-y-3">
            {reservableStops.slice(0, 5).map((stop) => (
              <ReservationStop
                key={stop.id}
                journey={journey}
                stop={stop}
                onRequest={() => setSelectedStop(stop)}
              />
            ))}
            {reservableStops.length > 5 ? (
              <p className="px-1 text-[10px] font-bold text-slate-400">
                {reservableStops.length - 5} additional bookable stops remain in the itinerary.
              </p>
            ) : null}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl bg-[#f8f4ea] p-4">
            <p className="text-sm font-black">No reservation-required stops yet</p>
            <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
              Add a stay, tour, charter, restaurant, rental, or ticketed experience and USVI Explorer will surface its booking action here.
            </p>
            <Link
              href={`/map?concierge=open&prompt=${encodeURIComponent(`Add one or two bookable experiences to my ${journey.title} itinerary on ${journey.island}. Keep the existing route and timing practical.`)}`}
              className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-teal-700"
            >
              <Sparkles className="h-3.5 w-3.5" /> Find bookable experiences
            </Link>
          </div>
        )}
      </section>

      {selectedStop ? (
        <WorkspaceBookingForm
          journey={journey}
          stop={selectedStop}
          onClose={() => setSelectedStop(null)}
        />
      ) : null}
    </>
  );
}

function ReservationStop({
  journey,
  stop,
  onRequest,
}: {
  journey: JourneyPlan;
  stop: IntelligencePlanStop;
  onRequest: () => void;
}) {
  const bookingHref = stop.bookingHref?.trim();
  const conciergeHref = `/map?concierge=open&prompt=${encodeURIComponent(
    `Help me reserve ${stop.title} as part of my active mission ${journey.title}. Keep the rest of the itinerary intact and tell me the next concrete booking step.`,
  )}`;

  return (
    <article className="rounded-2xl border border-slate-200 bg-[#fbfaf6] p-4">
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
            bookingHref
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {bookingHref ? <BadgeCheck className="h-5 w-5" /> : <CircleAlert className="h-5 w-5" />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black">{stop.title}</p>
          <p className="mt-1 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            {bookingHref ? "Direct booking available" : "Request through USVI Explorer"}
          </p>
        </div>
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {bookingHref ? (
          <Link
            href={bookingHref}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#043331] px-3 text-[9px] font-black uppercase tracking-[.13em] text-white"
          >
            <ExternalLink className="h-3.5 w-3.5" /> Book or manage
          </Link>
        ) : (
          <button
            type="button"
            onClick={onRequest}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-[#f5b942] px-3 text-[9px] font-black uppercase tracking-[.13em] text-[#043331]"
          >
            Submit request
          </button>
        )}
        <Link
          href={stop.href || stop.mapHref || conciergeHref}
          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-[.13em]"
        >
          View details
        </Link>
      </div>

      {!bookingHref ? (
        <Link
          href={conciergeHref}
          className="mt-3 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.13em] text-teal-700"
        >
          <Sparkles className="h-3.5 w-3.5" /> Ask Concierge instead
        </Link>
      ) : null}
    </article>
  );
}

function isReservableStop(stop: IntelligencePlanStop) {
  if (stop.bookingHref) return true;
  const text = `${stop.kind} ${stop.title}`.toLowerCase();
  return [
    "accommodation",
    "hotel",
    "resort",
    "villa",
    "stay",
    "tour",
    "experience",
    "activity",
    "charter",
    "fishing",
    "restaurant",
    "dining",
    "rental",
    "ticket",
    "event",
    "cruise",
  ].some((token) => text.includes(token));
}
