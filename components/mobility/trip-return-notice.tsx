"use client";

import Link from "next/link";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type BookingPayload = {
  booking?: {
    id?: string;
    paymentStatus?: string;
    status?: string;
    origin?: { estateName?: string };
    destination?: { estateName?: string };
  };
  error?: string;
};

export function TripReturnNotice() {
  const params = useSearchParams();
  const bookingId = params.get("booking")?.trim() ?? "";
  const paymentReturn = params.get("payment") === "return";
  const [state, setState] = useState<"idle" | "checking" | "ready" | "error">(
    bookingId && paymentReturn ? "checking" : "idle",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!bookingId || !paymentReturn) return;
    const controller = new AbortController();

    async function check() {
      try {
        const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as BookingPayload | null;
        if (!response.ok) throw new Error(payload?.error || "Unable to verify this ride.");
        const booking = payload?.booking;
        const route = [booking?.origin?.estateName, booking?.destination?.estateName]
          .filter(Boolean)
          .join(" → ");
        setMessage(
          booking?.paymentStatus === "paid"
            ? `${route || "Your ride"} is paid and ready for dispatch.`
            : `${route || "Your ride"} is recorded. Payment confirmation may take a moment to appear.`,
        );
        setState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        setMessage(error instanceof Error ? error.message : "Unable to verify this ride.");
        setState("error");
      }
    }

    void check();
    return () => controller.abort();
  }, [bookingId, paymentReturn]);

  if (state === "idle") return null;

  return (
    <section
      className={`mb-6 rounded-[28px] border p-5 shadow-sm sm:p-6 ${
        state === "error"
          ? "border-rose-200 bg-rose-50"
          : "border-emerald-200 bg-emerald-50"
      }`}
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            state === "error"
              ? "bg-rose-100 text-rose-700"
              : "bg-emerald-100 text-emerald-700"
          }`}
        >
          {state === "checking" ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : state === "error" ? (
            <ShieldCheck className="h-5 w-5" />
          ) : (
            <CheckCircle2 className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">
            Mobility handoff
          </div>
          <h2 className="mt-1 text-xl font-black text-[#043331]">
            {state === "checking"
              ? "Confirming payment and dispatch status"
              : state === "error"
                ? "Ride verification needs attention"
                : "Your ride is in the trip center"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {state === "checking"
              ? "VI Guide is checking the booking before dispatch and live tracking begin."
              : message}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/mobility"
              className="rounded-full bg-[#043331] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] text-white"
            >
              Book another ride
            </Link>
            {bookingId ? (
              <span className="rounded-full border border-slate-200 bg-white px-4 py-2.5 font-mono text-[9px] font-black text-slate-500">
                Trip {bookingId.slice(0, 12)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
