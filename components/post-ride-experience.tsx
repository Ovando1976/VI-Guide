"use client";

import Link from "next/link";
import { CheckCircle2, MessageCircle, RotateCcw, Star } from "lucide-react";
import { useState } from "react";

import type { RideBooking } from "@/types/mobility";

export function PostRideExperience({ booking }: { booking: RideBooking }) {
  const [rating, setRating] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fare = booking.finalFare ?? booking.quotedFare.total;

  async function submitFeedback() {
    if (!rating || saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${encodeURIComponent(booking.id)}/feedback`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ rating, note }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to save feedback.");
      setSaved(true);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to save feedback.");
    } finally {
      setSaving(false);
    }
  }

  if (booking.status !== "completed") return null;

  return (
    <section className="mt-5 overflow-hidden rounded-[28px] border border-emerald-200 bg-white shadow-sm">
      <div className="bg-[linear-gradient(135deg,#043331,#0f766e)] px-5 py-5 text-white">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/10 text-[#7ce0d4]">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">Ride complete</p>
            <h4 className="mt-1 text-2xl font-black tracking-[-.04em]">Your ride record is complete.</h4>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
              {booking.origin.estateName} → {booking.destination.estateName} · Final ride amount ${fare.toFixed(2)}.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_auto] lg:items-start">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">How was your ride?</p>
          {saved ? (
            <div className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm font-black text-emerald-800">
              Feedback saved. Thank you for helping us improve USVI transportation.
            </div>
          ) : (
            <>
              <div className="mt-3 flex gap-2" aria-label="Rate this completed ride">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    aria-label={`${value} star${value === 1 ? "" : "s"}`}
                    aria-pressed={rating === value}
                    className={`grid h-11 w-11 place-items-center rounded-2xl border transition ${rating && value <= rating ? "border-amber-300 bg-amber-50 text-amber-600" : "border-slate-200 bg-white text-slate-300 hover:border-amber-200"}`}
                  >
                    <Star className={`h-5 w-5 ${rating && value <= rating ? "fill-current" : ""}`} />
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value.slice(0, 500))}
                placeholder="Optional note about pickup, driver, vehicle, or service"
                className="mt-3 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-teal-400"
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={!rating || saving}
                  onClick={() => void submitFeedback()}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {saving ? "Saving…" : "Send feedback"}
                </button>
                {error ? <p className="text-xs font-semibold text-rose-700">{error}</p> : null}
              </div>
            </>
          )}
        </div>

        <div className="grid min-w-[220px] gap-2">
          <Link
            href="/mobility"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#043331]"
          >
            <RotateCcw className="h-4 w-4" /> Book another ride
          </Link>
          <Link
            href={`/concierge?prompt=${encodeURIComponent(`Help me plan the next leg after my ride from ${booking.origin.estateName} to ${booking.destination.estateName}.`)}`}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#043331]"
          >
            <MessageCircle className="h-4 w-4" /> Plan what’s next
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-[#f8f4ea] px-5 py-4 text-xs font-semibold leading-5 text-slate-600">
        Receipt summary: official tariff {booking.quotedFare.tariffVersion} · route ${booking.quotedFare.routeFare.toFixed(2)} · riders ${booking.quotedFare.passengerFare.toFixed(2)} · bags ${booking.quotedFare.luggageFare.toFixed(2)} · total ${fare.toFixed(2)}.
      </div>
    </section>
  );
}
