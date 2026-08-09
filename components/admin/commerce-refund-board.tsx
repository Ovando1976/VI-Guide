"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  RefreshCcw,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type RefundBooking = {
  id: string;
  reference: string;
  listingName: string;
  guestName: string;
  email: string;
  status: string;
  paymentStatus: string;
  paymentIntentId: string | null;
  paidAmountCents: number;
  paidAt: string | null;
  refundStatus: string;
  refundId: string | null;
  refundOperationId: string | null;
  refundAmountCents: number | null;
  refundReason: string | null;
  refundFailureReason: string | null;
  refundRequestedAt: string | null;
  refundUpdatedAt: string | null;
  cancellationRequestStatus: string;
  cancellationReasonCode: string | null;
  cancellationReason: string | null;
  cancellationRefundEstimateCents: number;
  cancellationRequestedAt: string | null;
  updatedAt: string;
};

type RefundCounts = {
  refundable: number;
  processing: number;
  failed: number;
  refunded: number;
  cancellationRequested: number;
};

export function CommerceRefundBoard() {
  const [bookings, setBookings] = useState<RefundBooking[]>([]);
  const [counts, setCounts] = useState<RefundCounts>({
    refundable: 0,
    processing: 0,
    failed: 0,
    refunded: 0,
    cancellationRequested: 0,
  });
  const [canIssueRefunds, setCanIssueRefunds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch("/api/admin/commerce-refunds", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            canIssueRefunds?: boolean;
            bookings?: RefundBooking[];
            counts?: RefundCounts;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load refund operations.");
      }
      setCanIssueRefunds(payload?.canIssueRefunds === true);
      setBookings(payload?.bookings ?? []);
      setCounts(
        payload?.counts ?? {
          refundable: 0,
          processing: 0,
          failed: 0,
          refunded: 0,
          cancellationRequested: 0,
        },
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load refund operations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(timer);
  }, [load]);

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[36px] bg-[linear-gradient(145deg,#1f2937,#064e3b)] p-7 text-white shadow-xl sm:p-10">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-amber-300">
                Financial operations
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-6xl">
                Commerce refunds
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-white/70">
                Issue one verified full-refund attempt against the exact Stripe PaymentIntent, then reconcile every result through the signed commerce webhook.
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
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
            Automatic actions are limited to the complete captured amount. Failed, uncertain, partial, mismatched, or duplicate refund outcomes remain visible but require manual financial review before any further attempt.
          </div>
          {!loading && !canIssueRefunds ? (
            <div className="mt-3 flex max-w-3xl items-start gap-3 rounded-2xl border border-sky-300/20 bg-sky-300/10 p-4 text-xs font-semibold leading-5 text-sky-50">
              <Eye className="mt-0.5 h-4 w-4 shrink-0" />
              Dispatcher access is read-only. Only an administrator can authorize a Stripe refund.
            </div>
          ) : null}
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Metric label="Traveler requests" value={counts.cancellationRequested} />
          <Metric label="Refundable" value={counts.refundable} />
          <Metric label="Processing" value={counts.processing} />
          <Metric label="Failed" value={counts.failed} />
          <Metric label="Refunded" value={counts.refunded} />
        </section>

        {error ? (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <section className="mt-6 space-y-4">
          {loading ? (
            <div className="grid min-h-64 place-items-center rounded-[30px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-emerald-700" />
            </div>
          ) : bookings.length ? (
            bookings.map((booking) => (
              <RefundCard
                key={booking.id}
                booking={booking}
                canIssueRefunds={canIssueRefunds}
                onUpdated={load}
              />
            ))
          ) : (
            <div className="rounded-[30px] border border-slate-200 bg-white p-10 text-center shadow-sm">
              <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
              <h2 className="mt-4 text-2xl font-black">
                No paid bookings in the refund queue
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                Stripe-verified paid commerce bookings will appear here automatically.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RefundCard({
  booking,
  canIssueRefunds,
  onUpdated,
}: {
  booking: RefundBooking;
  canIssueRefunds: boolean;
  onUpdated: () => Promise<void>;
}) {
  const [reason, setReason] = useState(
    booking.refundReason ??
      (booking.cancellationRequestStatus === "review_required"
        ? `Traveler cancellation: ${booking.cancellationReasonCode?.replaceAll("_", " ") ?? "unspecified"}${booking.cancellationReason ? ` — ${booking.cancellationReason}` : ""}`
        : ""),
  );
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eligiblePayment =
    booking.paymentStatus === "paid" && booking.refundStatus === "not_requested";
  const policyAllowsFullRefund =
    booking.cancellationRequestStatus !== "review_required" ||
    booking.cancellationRefundEstimateCents === booking.paidAmountCents;
  const refundable = canIssueRefunds && eligiblePayment && policyAllowsFullRefund;
  const confirmed = confirmation.trim() === booking.reference;

  async function issueRefund() {
    if (!canIssueRefunds) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/commerce-refunds/${encodeURIComponent(booking.id)}/issue`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            reason,
            confirmReference: confirmation,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to issue this refund.");
      }
      setConfirmation("");
      await onUpdated();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to issue this refund.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.15em] text-emerald-700">
            {booking.reference}
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.03em]">
            {booking.listingName}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            {booking.guestName} · {booking.email}
          </p>
        </div>
        <span className={statusClass(booking.refundStatus)}>
          {booking.refundStatus.replaceAll("_", " ")}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Captured" value={formatMoney(booking.paidAmountCents)} />
        <Detail label="Payment" value={booking.paymentStatus.replaceAll("_", " ")} />
        <Detail label="Booking" value={booking.status.replaceAll("_", " ")} />
        <Detail label="Updated" value={formatDate(booking.updatedAt)} />
      </div>

      {booking.cancellationRequestStatus === "review_required" ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Traveler requested cancellation{booking.cancellationRequestedAt ? ` on ${formatDate(booking.cancellationRequestedAt)}` : ""}.
            {booking.cancellationRefundEstimateCents > 0 ? ` Policy estimate: ${formatMoney(booking.cancellationRefundEstimateCents)}.` : " Policy or timing requires review."}
            {booking.cancellationReason ? ` Reason: ${booking.cancellationReason}` : ""}
          </span>
        </div>
      ) : null}
      {eligiblePayment && !policyAllowsFullRefund ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold leading-5 text-rose-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          <span>Automatic full refund is locked because the policy result is partial or requires judgment. Reconcile this request manually before changing the financial record.</span>
        </div>
      ) : null}

      {booking.refundFailureReason ? (
        <div className="mt-4 flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold leading-5 text-rose-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            {booking.refundFailureReason} Automatic retry is disabled; reconcile this refund manually before taking further action.
          </span>
        </div>
      ) : null}

      {booking.refundId ? (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 font-mono text-xs text-slate-600">
          Stripe refund: {booking.refundId}
        </div>
      ) : null}

      {refundable ? (
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_260px_auto]">
          <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Refund reason
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              className="mt-2 min-h-24 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold normal-case tracking-normal text-[#043331] outline-none focus:border-emerald-600"
              placeholder="Document why the full deposit is being returned."
            />
          </label>
          <label className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
            Type booking reference
            <input
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 font-mono text-sm font-black normal-case tracking-normal text-[#043331] outline-none focus:border-emerald-600"
              placeholder={booking.reference}
            />
          </label>
          <button
            type="button"
            disabled={submitting || reason.trim().length < 4 || !confirmed}
            onClick={() => void issueRefund()}
            className="inline-flex min-h-12 items-center justify-center gap-2 self-end rounded-xl bg-rose-700 px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Issue full refund
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-bold text-red-700">
          {error}
        </div>
      ) : null}
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black">{value}</p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8f4ea] p-4">
      <p className="text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm font-black capitalize">{value}</p>
    </div>
  );
}

function statusClass(status: string) {
  const base =
    "rounded-full px-3 py-2 text-[9px] font-black uppercase tracking-[.13em]";
  if (status === "succeeded") return `${base} bg-emerald-100 text-emerald-800`;
  if (status === "processing") return `${base} bg-sky-100 text-sky-800`;
  if (status === "failed" || status === "review_required") {
    return `${base} bg-rose-100 text-rose-800`;
  }
  return `${base} bg-amber-100 text-amber-800`;
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}
