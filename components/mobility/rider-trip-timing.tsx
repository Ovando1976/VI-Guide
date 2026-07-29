"use client";

import { Clock3, TimerReset } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import type { RideBooking } from "@/types/mobility";

const ACTIVE: RideBooking["status"][] = [
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
  "in_progress",
];

export function RiderTripTiming({ riderId }: { riderId: string }) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    return subscribeToRiderBookings(riderId, setBookings, () => undefined);
  }, [riderId]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const booking = useMemo(
    () => bookings.find((item) => ACTIVE.includes(item.status)) ?? null,
    [bookings],
  );

  if (!booking) return null;

  const startedAt = currentStageTimestamp(booking);
  const elapsed = startedAt ? Math.max(0, now - startedAt) : null;

  return (
    <section className="mb-6 rounded-[28px] border border-teal-900/10 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#edf6f2] text-teal-800">
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-800">
              Live trip timing
            </div>
            <div className="mt-1 text-xl font-black tracking-[-.03em] text-[#043331]">
              {stageLabel(booking.status)}
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {booking.origin.estateName} → {booking.destination.estateName}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-[#043331] px-5 py-4 text-white">
          <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.15em] text-white/45">
            <TimerReset className="h-3.5 w-3.5" /> Time in stage
          </div>
          <div className="mt-1 text-2xl font-black">
            {elapsed === null ? "Starting" : formatDuration(elapsed)}
          </div>
        </div>
      </div>
    </section>
  );
}

function currentStageTimestamp(booking: RideBooking) {
  switch (booking.status) {
    case "matched":
      return timestampMs(booking.matchedAt);
    case "driver_en_route":
      return timestampMs(booking.driverEnRouteAt);
    case "arrived":
      return timestampMs(booking.arrivedAt);
    case "in_progress":
      return timestampMs(booking.startedAt);
    default:
      return timestampMs(booking.createdAt);
  }
}

function timestampMs(
  value: string | { seconds?: number; nanoseconds?: number } | { toDate?: () => Date } | undefined,
) {
  if (!value) return null;
  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  if ("toDate" in value && typeof value.toDate === "function") {
    const parsed = value.toDate().getTime();
    return Number.isFinite(parsed) ? parsed : null;
  }
  return typeof value.seconds === "number" ? value.seconds * 1000 : null;
}

function stageLabel(status: RideBooking["status"]) {
  switch (status) {
    case "requested":
      return "Waiting for driver assignment";
    case "matched":
      return "Driver matched";
    case "driver_en_route":
      return "Driver heading to pickup";
    case "arrived":
      return "Driver waiting at pickup";
    case "in_progress":
      return "Ride in progress";
    default:
      return status.replaceAll("_", " ");
  }
}

function formatDuration(milliseconds: number) {
  const minutes = Math.floor(milliseconds / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`;
}
