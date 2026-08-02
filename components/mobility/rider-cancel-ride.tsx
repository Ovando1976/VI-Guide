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

const REASONS = [
  ["plans_changed", "My plans changed"],
  ["pickup_issue", "Pickup details are wrong"],
  ["driver_delay", "Driver delay"],
  ["duplicate_booking", "Duplicate booking"],
  ["safety_concern", "Safety concern"],
  ["other", "Other"],
] as const;

export function RiderCancelRide({ riderId }: { riderId: string }) {
  const [bookings, setBookings] = useState<RideBooking[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reasonCode, setReasonCode] = useState("plans_changed");
  const [reason, setReason] = useState("My plans changed before the trip began.");
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
    if (!reason.trim()) {
      setMessage("Add a brief cancellation explanation before continuing.");
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(activeBooking.id)}/cancel`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reasonCode, reason }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | {
            error?: string;
            refund?: { status?: string } | null;
            reviewRequired?: boolean;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to cancel this ride.");
      }

      setConfirming(false);
      if (payload?.reviewRequired) {
        setMessage(
          "Your ride is cancelled and dispatch has stopped. The payment is protected for staff review; do not submit another payment.",
        );
      } else if (payload?.refund?.status === "succeeded") {
        setMessage(
          "Your ride is cancelled and a full refund was issued to the original payment method.",
        );
      } else if (payload?.refund?.status === "pending") {
        setMessage(
          "Your ride is cancelled. Stripe accepted the full refund and it is processing to the original payment method.",
        );
      } else {
        setMessage(
          "Your ride is cancelled. Dispatch and the assigned driver were updated immediately.",
        );
      }
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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.17em] text-slate-400">
            <AlertTriangle className="h-4 w-4 text-amber-600" /> Ride changes
          </div>
          <div className="mt-2 text-lg font-black tracking-[-.03em] text-[#043331]">
            {booking.origin.estateName} → {booking.destination.estateName}
          </div>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
            During the controlled pilot, cancellation is available until the trip begins. Dispatch stops immediately. Captured fares receive a full refund to the original payment method; pending or unusual payment records are protected for staff review.
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
        ) : null}
      </div>

      {confirming ? (
        <div className="mt-5 rounded-[24px] border border-rose-200 bg-rose-50/60 p-4 sm:p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">
                Reason
              </span>
              <select
                value={reasonCode}
                disabled={submitting}
                onChange={(event) => setReasonCode(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-[#043331] outline-none focus:border-rose-400"
              >
                {REASONS.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[9px] font-black uppercase tracking-[.15em] text-rose-700">
                Brief explanation
              </span>
              <textarea
                value={reason}
                disabled={submitting}
                onChange={(event) => setReason(event.target.value.slice(0, 400))}
                rows={3}
                className="mt-2 w-full resize-none rounded-2xl border border-rose-200 bg-white px-4 py-3 text-sm font-semibold text-[#043331] outline-none focus:border-rose-400"
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={submitting || !reason.trim()}
              onClick={() => void cancelRide(booking)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-rose-700 px-5 text-[9px] font-black uppercase tracking-[.15em] text-white disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Cancel ride and resolve payment
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.15em] text-slate-600"
            >
              Keep ride
            </button>
          </div>
        </div>
      ) : null}

      {message ? (
        <div className="mt-4 rounded-2xl bg-[#f8f4ea] px-4 py-3 text-sm font-semibold text-slate-700">
          {message}
        </div>
      ) : null}
    </section>
  );
}
