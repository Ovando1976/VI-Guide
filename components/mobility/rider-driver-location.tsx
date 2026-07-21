"use client";

import { Crosshair, MapPin, Navigation, Radio, ShieldCheck } from "lucide-react";

import type { RideBooking } from "@/types/mobility";

const TRACKABLE_STATUSES: RideBooking["status"][] = [
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

export function RiderDriverLocation({ booking }: { booking: RideBooking }) {
  const location = booking.driverLocation;
  const trackable = TRACKABLE_STATUSES.includes(booking.status);

  if (!trackable) return null;

  if (!location) {
    return (
      <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700">
            <Radio className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-slate-400">
              Live driver position
            </div>
            <h3 className="mt-1 text-xl font-black text-[#043331]">
              Waiting for the first location update
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
              The assigned driver must enable precise location sharing. This card will update automatically when the first verified position arrives.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${location.latitude},${location.longitude}`)}`;
  const recordedAt = new Date(location.recordedAt);
  const ageSeconds = Math.max(
    0,
    Math.round((Date.now() - recordedAt.getTime()) / 1000),
  );
  const fresh = ageSeconds <= 30;

  return (
    <section className="overflow-hidden rounded-[30px] border border-teal-900/10 bg-white shadow-sm">
      <div className="relative min-h-56 overflow-hidden bg-[#082f2d] p-6 text-white">
        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,.16)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.16)_1px,transparent_1px)] [background-size:32px_32px]" />
        <div className="absolute left-[58%] top-[48%] h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border border-teal-300/30 bg-teal-300/10" />
        <div className="absolute left-[58%] top-[48%] grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[#f5b942] text-[#043331] shadow-[0_0_0_10px_rgba(245,185,66,.16),0_18px_40px_rgba(0,0,0,.35)]">
          <Navigation className="h-6 w-6" />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-[#7ce0d4]">
              <Radio className="h-4 w-4" /> Rider live map
            </div>
            <h3 className="mt-2 text-2xl font-black tracking-[-.04em]">
              Driver’s latest verified position
            </h3>
          </div>
          <span
            className={`rounded-full px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] ${
              fresh
                ? "bg-emerald-400/15 text-emerald-200"
                : "bg-amber-300/15 text-amber-100"
            }`}
          >
            {fresh ? "Live" : "Updating"}
          </span>
        </div>

        <div className="relative z-10 mt-20 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[.13em] text-white/70">
          <span className="rounded-full border border-white/10 bg-black/15 px-3 py-2">
            {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </span>
          <span className="rounded-full border border-white/10 bg-black/15 px-3 py-2">
            {formatAge(ageSeconds)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-center sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-bold text-slate-600">
            <span className="inline-flex items-center gap-2">
              <Crosshair className="h-4 w-4 text-teal-700" />
              Accuracy {location.accuracy ? `±${Math.round(location.accuracy)} m` : "pending"}
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-teal-700" />
              Assigned driver only
            </span>
          </div>
          <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
            Positions are published by the assigned driver and refreshed during active trip stages.
          </p>
        </div>
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.16em] text-white"
        >
          <MapPin className="h-4 w-4" /> Open live position
        </a>
      </div>
    </section>
  );
}

function formatAge(seconds: number) {
  if (seconds < 5) return "Updated now";
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `Updated ${minutes}m ago`;
}
