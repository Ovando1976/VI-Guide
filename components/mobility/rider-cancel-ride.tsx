"use client";

import { AlertTriangle, Loader2, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { subscribeToRiderBookings } from "@/lib/firestore-trips";
import type { RideBooking } from "@/types/mobility";

const CANCELLABLE: RideBooking["status"][] = [
  "requested",
  "matched",
  "driver_en_route",
  "arrived",
];

export function RiderCancelRide({ riderId }: { riderId: string }) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(
    () =>
      subscribeToRiderBookings(
        riderId,
        (next) => setBookings(next),
        (error) => setMessage(error.message),
      ),
    [riderId],
  );

  const booking = useMemo(
    () => bookings.find((entry) => CANCELLABLE.includes(entry.status)) ?? null,
    [bookings],
  );

  async function cancelRide(activeBooking: RideBooking) {
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/bookings/${activeBooking.id}/status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: "cancelled",
            message: "Rider cancelled the trip from the trip center.",
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to cancel this ride.");
      }
      setConfirming(false);
      setMessage("Your ride was cancelled and dispatch has been updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to cancel this ride.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (!booking) return null;

  return (
    <section className="mb-6 rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.17em] text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Ride changes
          </div>
          <div className="mt-2 text-lg font-black tracking-[-.03em] text-[#043331]">
            {booking.origin.estateName} → {booking.destination.estateName}
          </div>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Cancellation is available until the trip begins. Dispatch and the assigned driver are updated immediately.
          </p>
        </div>

        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-[9px] font-black uppercase tracking-[.15em] text-rose-700"
          >
            <XCircle className="h-4 w-4" /> Cancel ride
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={() => void cancelRide(booking)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rose-700 px-5 text-[9px] font-black uppercase tracking-[.15em] text-white disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Confirm cancellation
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-full border border-slate-200 px-5 text-[9px] font-black uppercase tracking-[.15em] text-slate-600"
            >
              Keep ride
            </button>
          </div>
        )}
      </div>

      {message ? (
        <div className="mt-4 rounded-2xl bg-[#f8f4ea] px-4 py-3 text-sm font-semibold text-slate-700">
          {message}
        </div>
      ) : null}
    </section>
  );
}
