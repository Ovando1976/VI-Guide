"use client";

import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

type BookingPayload = {
  booking?: {
    id?: string;
    paymentStatus?: string;
    status?: string;
    origin?: { estateName?: string };
    destination?: { estateName?: string };
  };
  reviewRequired?: boolean;
  integrityIssue?: string | null;
  error?: string;
};

type NoticeState =
  | "idle"
  | "checking"
  | "paid"
  | "pending"
  | "review"
  | "error";

const MAX_CONFIRMATION_ATTEMPTS = 8;
const CONFIRMATION_DELAY_MS = 1800;

export function TripReturnNotice() {
  const params = useSearchParams();
  const bookingId = params.get("booking")?.trim() ?? "";
  const paymentReturn = params.get("payment") === "return";
  const [state, setState] = useState<NoticeState>(
    bookingId && paymentReturn ? "checking" : "idle",
  );
  const [message, setMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  const verifyBooking = useCallback(
    async (signal?: AbortSignal) => {
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(bookingId)}/payment-status`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          signal,
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | BookingPayload
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to verify this ride.");
      }

      const booking = payload?.booking;
      const route = [
        booking?.origin?.estateName,
        booking?.destination?.estateName,
      ]
        .filter(Boolean)
        .join(" → ");
      const paymentStatus = booking?.paymentStatus ?? "unpaid";

      if (payload?.reviewRequired) {
        setMessage(
          `${route || "Your ride"} has a captured or protected payment record that requires staff review. Do not submit another payment. ${payload.integrityIssue || "VI Guide is preserving the payment while the record is reviewed."}`,
        );
        setState("review");
        return true;
      }

      if (paymentStatus === "paid") {
        setMessage(`${route || "Your ride"} is paid and ready for dispatch.`);
        setState("paid");
        return true;
      }

      if (paymentStatus === "failed" || paymentStatus === "canceled") {
        setMessage(
          `${route || "Your ride"} is saved, but payment was not completed. You can safely try again.`,
        );
        setState("error");
        return true;
      }

      setMessage(
        `${route || "Your ride"} is recorded. We are waiting for secure payment confirmation.`,
      );
      setState("pending");
      return false;
    },
    [bookingId],
  );

  useEffect(() => {
    if (!bookingId || !paymentReturn) return;
    const controller = new AbortController();
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;

    async function check(attemptNumber: number) {
      try {
        setAttempt(attemptNumber);
        if (attemptNumber === 1) setState("checking");
        const terminal = await verifyBooking(controller.signal);
        if (terminal || cancelled) return;

        if (attemptNumber < MAX_CONFIRMATION_ATTEMPTS) {
          timeoutId = setTimeout(
            () => void check(attemptNumber + 1),
            CONFIRMATION_DELAY_MS,
          );
        }
      } catch (error) {
        if (controller.signal.aborted || cancelled) return;
        setMessage(
          error instanceof Error ? error.message : "Unable to verify this ride.",
        );
        setState("error");
      }
    }

    void check(1);
    return () => {
      cancelled = true;
      controller.abort();
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [bookingId, paymentReturn, verifyBooking]);

  async function retryNow() {
    try {
      setState("checking");
      setAttempt(1);
      await verifyBooking();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to verify this ride.",
      );
      setState("error");
    }
  }

  if (state === "idle") return null;

  const isError = state === "error";
  const isPaid = state === "paid";
  const isReview = state === "review";
  const isChecking = state === "checking";

  return (
    <section
      className={`mb-6 rounded-[28px] border p-5 shadow-sm sm:p-6 ${
        isError
          ? "border-rose-200 bg-rose-50"
          : isPaid
            ? "border-emerald-200 bg-emerald-50"
            : "border-amber-200 bg-amber-50"
      }`}
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            isError
              ? "bg-rose-100 text-rose-700"
              : isPaid
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {isChecking ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : isError ? (
            <AlertCircle className="h-5 w-5" />
          ) : isPaid ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-black uppercase tracking-[.18em] text-slate-500">
            Mobility payment handoff
          </div>
          <h2 className="mt-1 text-xl font-black text-[#043331]">
            {isChecking
              ? "Confirming payment and dispatch readiness"
              : isReview
                ? "Payment preserved—staff review required"
                : isError
                  ? "Payment needs attention"
                  : isPaid
                    ? "Your ride is ready for dispatch"
                    : "Payment confirmation is still processing"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            {isChecking
              ? `VI Guide is checking Stripe and the booking record before dispatch begins${attempt > 1 ? ` · attempt ${attempt}` : ""}.`
              : message}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {!isPaid && !isReview && bookingId ? (
              <Link
                href={`/checkout/${encodeURIComponent(bookingId)}`}
                className="rounded-full bg-[#043331] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] text-white"
              >
                Return to secure payment
              </Link>
            ) : (
              <Link
                href="/mobility"
                className="rounded-full bg-[#043331] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] text-white"
              >
                {isReview ? "Return to rides" : "Book another ride"}
              </Link>
            )}

            {!isPaid && !isReview ? (
              <button
                type="button"
                onClick={() => void retryNow()}
                disabled={isChecking}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] text-slate-700 disabled:opacity-60"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`}
                />
                Check again
              </button>
            ) : null}

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
