"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Mail,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import { parseCommercePaymentReturn } from "@/lib/payments/commerce-payment-return";

type ReturnBooking = {
  reference: string;
  status: string;
  paymentStatus: string | null;
  listingName: string;
  depositAmountCents: number;
  paidAmountCents: number;
};

export function CommercePaymentReturnNotice() {
  const searchParams = useSearchParams();
  const paymentReturn = parseCommercePaymentReturn(
    searchParams.get("payment"),
    searchParams.get("reference"),
  );
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<ReturnBooking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!paymentReturn) return null;

  const returnReference = paymentReturn.reference;
  const returnedFromCompletedCheckout = paymentReturn.outcome === "success";
  const paymentVerified = isPaymentVerified(booking);

  async function verify(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (loading || !email) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/commerce-bookings/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: returnReference,
          email,
        }),
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { booking?: ReturnBooking; error?: string }
        | null;

      if (!response.ok || !payload?.booking) {
        throw new Error(
          payload?.error || "VI Guide could not verify this booking yet.",
        );
      }

      setBooking(payload.booking);
    } catch (verificationError) {
      setError(
        verificationError instanceof Error
          ? verificationError.message
          : "VI Guide could not verify this booking yet.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section
      aria-live="polite"
      className={`mx-auto mb-5 max-w-5xl rounded-[28px] border p-5 shadow-[0_18px_50px_rgba(4,51,49,.08)] sm:p-6 ${
        returnedFromCompletedCheckout
          ? "border-emerald-200 bg-emerald-50"
          : "border-amber-200 bg-amber-50"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
            returnedFromCompletedCheckout
              ? "bg-emerald-100 text-emerald-700"
              : "bg-amber-100 text-amber-700"
          }`}
        >
          {returnedFromCompletedCheckout ? (
            <CreditCard className="h-5 w-5" />
          ) : (
            <AlertTriangle className="h-5 w-5" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-[.17em] text-teal-700">
            Stripe checkout return
          </p>
          <h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-[#043331]">
            {returnedFromCompletedCheckout
              ? "Verify your payment"
              : "Checkout was not completed"}
          </h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
            {returnedFromCompletedCheckout
              ? "Stripe returned you to VI Guide, but the return URL alone is not proof of payment. Enter the email used for this booking to check the server-recorded status."
              : "No payment confirmation was received during this checkout return. Your booking may still be awaiting its deposit."}
          </p>
          <div className="mt-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/80 bg-white px-3 py-2 font-mono text-xs font-black text-[#043331]">
            <ShieldCheck className="h-4 w-4 shrink-0 text-teal-700" />
            <span className="truncate">{returnReference}</span>
          </div>
        </div>
      </div>

      <form onSubmit={verify} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
        <label className="flex min-h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 focus-within:border-teal-600/40 focus-within:ring-4 focus-within:ring-teal-600/10">
          <Mail className="h-4 w-4 shrink-0 text-teal-700" />
          <span className="sr-only">Booking email</span>
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full bg-transparent text-sm font-bold outline-none"
            placeholder="Email used for this booking"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#043331] px-6 text-[10px] font-black uppercase tracking-[.15em] text-white disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : booking ? (
            <RefreshCw className="h-4 w-4" />
          ) : (
            <ShieldCheck className="h-4 w-4" />
          )}
          {booking ? "Refresh status" : "Verify status"}
        </button>
      </form>

      {error ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {booking ? (
        <div
          className={`mt-4 flex items-start gap-3 rounded-2xl border bg-white p-4 ${
            paymentVerified ? "border-emerald-200" : "border-amber-200"
          }`}
        >
          {paymentVerified ? (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          ) : (
            <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          )}
          <div>
            <p
              className={`text-[9px] font-black uppercase tracking-[.15em] ${
                paymentVerified ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {paymentVerified ? "Payment verified" : "Verification pending"}
            </p>
            <p className="mt-1 text-sm font-bold leading-6 text-slate-700">
              {paymentVerified
                ? `${booking.listingName} shows ${formatMoney(
                    booking.paidAmountCents,
                  )} received. Current booking status: ${booking.status}.`
                : `VI Guide currently shows payment status ${
                    booking.paymentStatus || "pending"
                  } for ${booking.listingName}. Refresh shortly if you completed Stripe Checkout.`}
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function isPaymentVerified(booking: ReturnBooking | null) {
  if (!booking) return false;
  return (
    booking.paidAmountCents > 0 ||
    booking.paymentStatus === "paid" ||
    booking.paymentStatus === "succeeded" ||
    ["paid", "confirmed", "completed"].includes(booking.status)
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
