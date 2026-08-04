"use client";

import {
  CheckCircle2,
  CircleDollarSign,
  Loader2,
  LockKeyhole,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type LifecycleBooking = {
  id: string;
  reference: string;
  status: string;
  listingName: string;
  guestName: string;
  startDate: string;
  email: string;
  depositAmountCents?: number | null;
  paidAmountCents?: number | null;
  paymentStatus?: string | null;
  paymentHref?: string | null;
  checkoutSessionId?: string | null;
  updatedAt: string;
};

type MerchantTransition =
  | "payment_required"
  | "confirmed"
  | "completed";

export function BookingLifecycleBoard() {
  const [bookings, setBookings] = useState<LifecycleBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/merchant-bookings", { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: LifecycleBooking[]; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to load bookings.");
      setBookings(payload?.bookings ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  const active = useMemo(
    () =>
      bookings.filter((booking) =>
        ["requested", "reviewing", "payment_required", "paid", "confirmed"].includes(
          booking.status,
        ),
      ),
    [bookings],
  );

  async function transition(
    booking: LifecycleBooking,
    status: MerchantTransition,
    depositAmountCents?: number,
  ) {
    setSavingId(booking.id);
    setError(null);
    try {
      const response = await fetch(`/api/merchant-bookings/${booking.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, depositAmountCents }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { booking?: Partial<LifecycleBooking>; error?: string }
        | null;
      if (!response.ok) throw new Error(payload?.error || "Unable to update booking.");
      setBookings((current) =>
        current.map((item) =>
          item.id === booking.id ? { ...item, ...payload?.booking } : item,
        ),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update booking.");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Booking lifecycle
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                Payment readiness
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/65">
                Request deposits, monitor Stripe-verified payments, and move paid bookings through confirmation and completion.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.15em]"
            >
              <RefreshCcw className="h-4 w-4" /> Refresh
            </button>
          </div>
          <div className="mt-6 flex max-w-3xl items-start gap-3 rounded-2xl border border-white/10 bg-black/15 p-4 text-xs font-semibold leading-5 text-white/75">
            <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#f5c451]" />
            Paid status is controlled only by the signed Stripe webhook. Staff cannot manually mark a booking paid.
          </div>
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="grid min-h-64 place-items-center rounded-[30px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : active.length ? (
            active.map((booking) => (
              <LifecycleCard
                key={booking.id}
                booking={booking}
                saving={savingId === booking.id}
                onTransition={transition}
              />
            ))
          ) : (
            <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
              <h2 className="mt-4 text-2xl font-black">No active payment workflows</h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Accepted requests will appear here when they are ready for a deposit or final confirmation.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function LifecycleCard({
  booking,
  saving,
  onTransition,
}: {
  booking: LifecycleBooking;
  saving: boolean;
  onTransition: (
    booking: LifecycleBooking,
    status: MerchantTransition,
    depositAmountCents?: number,
  ) => Promise<void>;
}) {
  const [deposit, setDeposit] = useState(
    booking.depositAmountCents ? String(booking.depositAmountCents / 100) : "",
  );
  const depositCents = Math.round(Number(deposit || 0) * 100);
  const canRequestPayment = ["requested", "reviewing"].includes(booking.status);
  const awaitingPayment = booking.status === "payment_required";
  const canConfirm = booking.status === "paid" && booking.paymentStatus === "paid";
  const canComplete = booking.status === "confirmed";

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
            {booking.reference}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">
            {booking.listingName}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {booking.guestName} · {booking.startDate} · {booking.email}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-amber-800">
            {booking.status.replaceAll("_", " ")}
          </span>
          <span className="rounded-full bg-slate-100 px-3 py-2 text-[9px] font-black uppercase tracking-[.13em] text-slate-600">
            Payment {String(booking.paymentStatus ?? "unpaid").replaceAll("_", " ")}
          </span>
        </div>
      </div>

      {canRequestPayment ? (
        <div className="mt-5 grid gap-3 sm:grid-cols-[220px_1fr]">
          <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Deposit amount (USD)
            <input
              type="number"
              min="1"
              step="0.01"
              value={deposit}
              onChange={(event) => setDeposit(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-teal-600"
              placeholder="50.00"
            />
          </label>
          <div className="rounded-2xl bg-[#f8f4ea] p-4 text-xs font-semibold leading-5 text-slate-600">
            The traveler receives a secure VI Guide Checkout link. Payment is accepted only when Stripe confirms the exact session, amount, currency, email, and booking reference.
          </div>
        </div>
      ) : null}

      {awaitingPayment ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
          Awaiting the traveler’s verified Stripe payment of {formatMoney(booking.depositAmountCents)}. This status updates automatically after the webhook succeeds.
        </div>
      ) : null}

      {canConfirm ? (
        <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
          Stripe verified {formatMoney(booking.paidAmountCents)}. This booking can now be confirmed.
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        {canRequestPayment ? (
          <button
            type="button"
            disabled={saving || depositCents <= 0}
            onClick={() => void onTransition(booking, "payment_required", depositCents)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] disabled:opacity-50"
          >
            <CircleDollarSign className="h-4 w-4" /> Request deposit
          </button>
        ) : null}
        {canConfirm ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onTransition(booking, "confirmed")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-700 px-4 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" /> Confirm booking
          </button>
        ) : null}
        {canComplete ? (
          <button
            type="button"
            disabled={saving}
            onClick={() => void onTransition(booking, "completed")}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            Complete service
          </button>
        ) : null}
        {saving ? <Loader2 className="h-5 w-5 animate-spin self-center text-teal-700" /> : null}
      </div>
    </article>
  );
}

function formatMoney(cents?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(cents ?? 0) / 100);
}
