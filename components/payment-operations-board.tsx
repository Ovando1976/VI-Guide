"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  Loader2,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

type PaymentRecord = {
  id: string;
  riderId: string;
  island: string;
  status: string;
  paymentStatus: string;
  paymentIntegrityStatus: string;
  paymentIntegrityIssue?: string | null;
  financialHoldStatus?: string | null;
  paymentIntentId?: string | null;
  amountAuthorized?: number | null;
  amountCaptured?: number | null;
  unexpectedCapturedPaymentIntentId?: string | null;
  unexpectedCapturedAmount?: number | null;
  cancellationStatus?: string | null;
  cancellationReason?: string | null;
  refundId?: string | null;
  refundStatus?: string | null;
  refundAmount?: number | null;
  refundFailureReason?: string | null;
  disputeId?: string | null;
  disputeStatus?: string | null;
  disputeAmount?: number | null;
  disputeReason?: string | null;
  disputeFundsReinstated?: boolean | null;
  settlementStatus?: string | null;
  settlementGrossFare?: number | null;
  settlementServiceFee?: number | null;
  operatorSettlement?: number | null;
  settlementHoldReason?: string | null;
  settlementReviewReference?: string | null;
  origin: string;
  destination: string;
  createdAt: string;
  updatedAt: string;
};

type QueuePayload = {
  counts?: {
    reviewRequired: number;
    processing: number;
    failed: number;
    refunds: number;
    disputes: number;
    settlements: number;
  };
  bookings?: PaymentRecord[];
  error?: string;
};

const EMPTY_COUNTS = {
  reviewRequired: 0,
  processing: 0,
  failed: 0,
  refunds: 0,
  disputes: 0,
  settlements: 0,
};

export function PaymentOperationsBoard() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [counts, setCounts] = useState(EMPTY_COUNTS);
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch("/api/admin/payment-operations", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | QueuePayload
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load payment operations.");
      }
      setRecords(Array.isArray(payload?.bookings) ? payload.bookings : []);
      setCounts(payload?.counts ?? EMPTY_COUNTS);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to load payment operations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  async function postAction(params: {
    key: string;
    url: string;
    body?: Record<string, unknown>;
    success: string;
  }) {
    try {
      setActiveAction(params.key);
      setMessage(null);
      setErrorMessage(null);
      const response = await fetch(params.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: params.body ? JSON.stringify(params.body) : undefined,
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Financial operation failed.");
      }
      setMessage(params.success);
      await loadQueue();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Financial operation failed.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  const capturedTotal = useMemo(
    () =>
      records.reduce(
        (total, record) => total + Number(record.amountCaptured ?? 0),
        0,
      ),
    [records],
  );

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#032d2b,#075e58)] p-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.18)] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#f7d778]">
                Financial control desk
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
                Payments, refunds, disputes, and settlements
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                Reconcile Stripe without creating a charge, monitor refund and dispute holds, and approve operator settlement only after the captured fare and live financial record pass review.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/pilot-readiness"
                className="rounded-full border border-white/15 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
              >
                Pilot readiness
              </Link>
              <Link
                href="/admin/taxi-operations"
                className="rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#5f3d00]"
              >
                Taxi operations
              </Link>
            </div>
          </div>
        </section>

        {message ? <Notice tone="success" text={message} /> : null}
        {errorMessage ? <Notice tone="error" text={errorMessage} /> : null}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <Metric label="Integrity review" value={counts.reviewRequired} />
          <Metric label="Processing" value={counts.processing} />
          <Metric label="Failed" value={counts.failed} />
          <Metric label="Refunds" value={counts.refunds} />
          <Metric label="Disputes" value={counts.disputes} />
          <Metric label="Settlements" value={counts.settlements} />
          <Metric
            label="Captured in queue"
            value={`$${(capturedTotal / 100).toFixed(2)}`}
          />
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
                Financial operations queue
              </div>
              <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
                Records needing attention
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void loadQueue()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 px-4 py-2.5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
            </div>
          ) : records.length ? (
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <PaymentCard
                  key={record.id}
                  record={record}
                  activeAction={activeAction}
                  onAction={postAction}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
                <div className="mt-4 text-lg font-black">
                  No financial exceptions
                </div>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  There are no payment, refund, dispute, or settlement records requiring attention.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function PaymentCard({
  record,
  activeAction,
  onAction,
}: {
  record: PaymentRecord;
  activeAction: string | null;
  onAction: (params: {
    key: string;
    url: string;
    body?: Record<string, unknown>;
    success: string;
  }) => Promise<void>;
}) {
  const [reviewReference, setReviewReference] = useState(
    record.settlementReviewReference ?? "",
  );
  const [holdReason, setHoldReason] = useState(
    record.settlementHoldReason ?? "",
  );
  const review = record.paymentIntegrityStatus === "review_required";
  const settlementActionable = ["pending_review", "held"].includes(
    record.settlementStatus ?? "",
  );
  const reconcileKey = `reconcile:${record.id}`;
  const approveKey = `approve:${record.id}`;
  const holdKey = `hold:${record.id}`;

  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={record.paymentStatus} review={review} />
            <SmallBadge label={record.financialHoldStatus || "no financial hold"} />
            {record.refundStatus ? (
              <SmallBadge label={`refund ${record.refundStatus}`} />
            ) : null}
            {record.disputeStatus ? (
              <SmallBadge label={`dispute ${record.disputeStatus}`} />
            ) : null}
            {record.settlementStatus ? (
              <SmallBadge label={`settlement ${record.settlementStatus}`} />
            ) : null}
            <SmallBadge label={islandLabel(record.island)} />
            <span className="font-mono text-[9px] font-black text-slate-400">
              {record.id}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-black">
            {record.origin} → {record.destination}
          </h3>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            <span>Authorized {cents(record.amountAuthorized)}</span>
            <span>Captured {cents(record.amountCaptured)}</span>
            {record.refundAmount ? (
              <span>Refund {cents(record.refundAmount)}</span>
            ) : null}
            {record.operatorSettlement != null ? (
              <span>Operator settlement {dollars(record.operatorSettlement)}</span>
            ) : null}
            <span>Updated {formatDate(record.updatedAt)}</span>
          </div>

          {record.paymentIntegrityIssue ? (
            <Issue text={record.paymentIntegrityIssue} />
          ) : null}
          {record.refundFailureReason ? (
            <Issue text={`Refund: ${record.refundFailureReason}`} />
          ) : null}
          {record.disputeId ? (
            <Issue
              text={`Dispute ${record.disputeId}: ${record.disputeReason || record.disputeStatus || "review required"}${record.disputeFundsReinstated ? " · funds reinstated" : ""}`}
            />
          ) : null}
          {record.settlementHoldReason ? (
            <Issue text={`Settlement hold: ${record.settlementHoldReason}`} />
          ) : null}
          {record.cancellationReason ? (
            <div className="mt-3 text-xs font-semibold text-slate-600">
              Cancellation: {record.cancellationReason}
            </div>
          ) : null}
          {record.unexpectedCapturedPaymentIntentId ? (
            <div className="mt-3 text-xs font-semibold text-rose-700">
              Unexpected captured intent {record.unexpectedCapturedPaymentIntentId} · {cents(record.unexpectedCapturedAmount)}
            </div>
          ) : null}
        </div>

        <div className="w-full shrink-0 space-y-3 xl:w-[360px]">
          <button
            type="button"
            onClick={() =>
              void onAction({
                key: reconcileKey,
                url: `/api/bookings/${encodeURIComponent(record.id)}/payment-status`,
                success: `Booking ${record.id.slice(0, 12)} was reconciled directly with Stripe.`,
              })
            }
            disabled={activeAction !== null || !record.paymentIntentId}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {activeAction === reconcileKey ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CircleDollarSign className="h-4 w-4" />
            )}
            Reconcile Stripe
          </button>

          {settlementActionable ? (
            <section className="rounded-[22px] border border-slate-200 bg-[#f8f4ea] p-4">
              <div className="text-[9px] font-black uppercase tracking-[.15em] text-slate-500">
                Settlement review
              </div>
              <input
                value={reviewReference}
                onChange={(event) => setReviewReference(event.target.value.slice(0, 180))}
                placeholder="Review reference"
                className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-teal-500"
              />
              <textarea
                value={holdReason}
                onChange={(event) => setHoldReason(event.target.value.slice(0, 400))}
                placeholder="Hold reason, when applicable"
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-teal-500"
              />
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={activeAction !== null || !reviewReference.trim()}
                  onClick={() =>
                    void onAction({
                      key: approveKey,
                      url: `/api/admin/settlements/${encodeURIComponent(record.id)}/approve`,
                      body: {
                        attested: true,
                        reviewReference: reviewReference.trim(),
                      },
                      success: `Settlement ${record.id.slice(0, 12)} passed live financial review and was approved.`,
                    })
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full bg-emerald-700 px-3 text-[8px] font-black uppercase tracking-[.12em] text-white disabled:opacity-40"
                >
                  {activeAction === approveKey ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="h-3.5 w-3.5" />
                  )}
                  Admin approve
                </button>
                <button
                  type="button"
                  disabled={
                    activeAction !== null ||
                    !reviewReference.trim() ||
                    !holdReason.trim()
                  }
                  onClick={() =>
                    void onAction({
                      key: holdKey,
                      url: `/api/admin/settlements/${encodeURIComponent(record.id)}/hold`,
                      body: {
                        attested: true,
                        reviewReference: reviewReference.trim(),
                        reason: holdReason.trim(),
                      },
                      success: `Settlement ${record.id.slice(0, 12)} remains on an audited hold.`,
                    })
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-amber-300 bg-amber-50 px-3 text-[8px] font-black uppercase tracking-[.12em] text-amber-900 disabled:opacity-40"
                >
                  {activeAction === holdKey ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <HandCoins className="h-3.5 w-3.5" />
                  )}
                  Hold
                </button>
              </div>
              <p className="mt-3 text-[10px] font-semibold leading-4 text-slate-500">
                Approval records authorization only. It does not send an operator payout.
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Issue({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950">
      <div className="flex items-start gap-2">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{text}</span>
      </div>
    </div>
  );
}

function StatusBadge({ status, review }: { status: string; review: boolean }) {
  const label = review ? "Review required" : status.replaceAll("_", " ");
  const classes = review
    ? "bg-amber-100 text-amber-800"
    : status === "processing"
      ? "bg-sky-100 text-sky-800"
      : status === "paid" || status === "refunded"
        ? "bg-emerald-100 text-emerald-800"
        : "bg-rose-100 text-rose-800";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.13em] ${classes}`}
    >
      {label}
    </span>
  );
}

function SmallBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.13em] text-slate-600">
      {label.replaceAll("_", " ")}
    </span>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">
        {label}
      </div>
    </div>
  );
}

function Notice({ tone, text }: { tone: "success" | "error"; text: string }) {
  return (
    <div
      className={`flex items-start gap-3 rounded-[24px] border p-5 text-sm font-semibold ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {tone === "success" ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      )}
      {text}
    </div>
  );
}

function cents(value?: number | null) {
  return typeof value === "number" ? `$${(value / 100).toFixed(2)}` : "—";
}

function dollars(value?: number | null) {
  return typeof value === "number" ? `$${value.toFixed(2)}` : "—";
}

function formatDate(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp) || timestamp === 0) return "Unknown";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

function islandLabel(island: string) {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return island.toUpperCase();
}
