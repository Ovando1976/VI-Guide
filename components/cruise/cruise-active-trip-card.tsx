"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  MapPin,
  Route,
  ShieldCheck,
  ShipWheel,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  CRUISE_TRIP_UPDATED_EVENT,
  buildShoreExcursionHref,
  type CanonicalCruiseTrip,
} from "@/lib/cruise-trip";
import { readSelectedCruiseTrip } from "@/lib/cruise-trip-client";

const CRUISE_CONCIERGE_HREF =
  "/concierge?open=true&prompt=Help%20me%20plan%20my%20cruise%20and%20USVI%20port%20days%20around%20my%20ship%20schedule";

export function CruiseActiveTripCard() {
  const [trip, setTrip] = useState<CanonicalCruiseTrip | null>(null);

  useEffect(() => {
    const sync = () => setTrip(readSelectedCruiseTrip());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(CRUISE_TRIP_UPDATED_EVENT, sync as EventListener);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(CRUISE_TRIP_UPDATED_EVENT, sync as EventListener);
    };
  }, []);

  const usviCalls = useMemo(
    () => trip?.portCalls.filter((call) => Boolean(call.island)) ?? [],
    [trip],
  );
  const firstUsviCall = usviCalls[0] ?? null;

  if (!trip) {
    return (
      <section className="px-4 pb-2 sm:px-6">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-teal-900/10 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-teal-50 text-teal-700">
                <ShipWheel className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                  Selected cruise
                </p>
                <h2 className="mt-1 text-xl font-black tracking-[-.035em] text-[#043331]">
                  Connect a sailing to make the whole portal trip-aware.
                </h2>
                <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-500">
                  Choose a sailing below and USVI Explorer will carry its ship, cruise line, USVI port days, schedule context, and shore-day handoffs into My Trip.
                </p>
              </div>
            </div>
            <Link
              href="#sailings"
              className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              Find a sailing <ArrowRight className="h-4 w-4 text-[#f5c451]" />
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 pb-2 sm:px-6">
      <div className="mx-auto max-w-7xl overflow-hidden rounded-[32px] border border-teal-900/10 bg-white shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[1fr_auto]">
          <div className="p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-teal-50 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-teal-700">
                Selected cruise
              </span>
              <span
                className={`rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] ${
                  trip.liveVerified
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}
              >
                {trip.liveVerified ? "Supplier verified" : "Planning inventory"}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-3xl font-black tracking-[-.045em] text-[#043331] sm:text-4xl">
                  {trip.ship.name}
                </h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {trip.cruiseLine.name} · {trip.nights} nights
                </p>
                <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-slate-500">
                  <span className="inline-flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-teal-700" />
                    {formatDate(trip.departureDate)} → {formatDate(trip.returnDate)}
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-teal-700" />
                    {usviCalls.length} USVI port {usviCalls.length === 1 ? "day" : "days"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/trips"
                  className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white"
                >
                  <Route className="h-4 w-4 text-[#f5c451]" /> My Trip
                </Link>
                {firstUsviCall ? (
                  <Link
                    href={buildShoreExcursionHref(trip, firstUsviCall)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-5 text-[9px] font-black uppercase tracking-[.14em] text-teal-900"
                  >
                    First port day <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : null}
                <Link
                  href={CRUISE_CONCIERGE_HREF}
                  className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
                >
                  <Sparkles className="h-4 w-4 text-teal-700" /> Ask Concierge
                </Link>
              </div>
            </div>
          </div>

          <div className="border-t border-teal-900/10 bg-[#043331] p-5 text-white lg:w-[280px] lg:border-l lg:border-t-0 lg:p-6">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-[#f5c451]">
              <ShieldCheck className="h-4 w-4" /> Ship-clock protection
            </div>
            <p className="mt-3 text-xs font-semibold leading-5 text-white/66">
              Port-day planning uses the sailing schedule as context, but the ship&apos;s onboard all-aboard announcement remains authoritative.
            </p>
            {firstUsviCall ? (
              <div className="mt-4 rounded-2xl border border-white/10 bg-white/[.07] p-3">
                <p className="text-[8px] font-black uppercase tracking-[.12em] text-white/45">
                  First USVI call
                </p>
                <p className="mt-1 text-sm font-black">{firstUsviCall.portName}</p>
                <p className="mt-1 text-[10px] font-semibold text-white/58">
                  {formatDate(firstUsviCall.date)}
                  {firstUsviCall.planningAllAboardTime
                    ? ` · planning all aboard ${firstUsviCall.planningAllAboardTime}`
                    : " · verify all aboard onboard"}
                </p>
              </div>
            ) : (
              <p className="mt-4 text-[10px] font-semibold leading-4 text-white/55">
                No U.S. Virgin Islands port call was detected in this sailing itinerary.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function formatDate(value: string) {
  const parsed = Date.parse(`${value}T12:00:00.000Z`);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/St_Thomas",
  }).format(parsed);
}
