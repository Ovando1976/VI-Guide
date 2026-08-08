"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  HandCoins,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

type PaymentRecord = {
  id: string;
  island: string;
  paymentStatus: string;
  paymentIntegrityStatus: string;
  paymentIntegrityIssue?: string | null;
  financialHoldStatus?: string | null;
  paymentIntentId?: string | null;
  amountAuthorized?: number | null;
  amountCaptured?: number | null;
  refundStatus?: string | null;
  disputeStatus?: string | null;
  settlementStatus?: string | null;
  settlementHoldReason?: string | null;
  settlementReviewReference?: string | null;
  origin: string;
  destination: string;
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

export function DispatcherPaymentOperationsBoard() {
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
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to load payment operations.");
      }
      setRecords(Array.isArray(payload.bookings) ? payload.bookings : []);
      setCounts(payload.counts ?? EMPTY_COUNTS);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to load payment operations.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  async function reconcile(record: PaymentRecord) {
    const actionKey = `reconcile:${record.id}`;
    try {
      setActiveAction(actionKey);
      setMessage(null);
      setErrorMessage(null);
      const response = await fetch(
        `/api/bookings/${encodeURIComponent(record.id)}/payment-status`,
        { method: "POST" },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to reconcile payment status.");
      }
      setMessage(`Booking ${record.id.slice(0, 12)} was reconciled with Stripe.`);
      await loadQueue();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to reconcile payment status.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function holdSettlement(params: {
    record: PaymentRecord;
    reviewReference: string;
    reason: string;
  }) {
    const actionKey = `hold:${params.record.id}`;
    try {
      setActiveAction(actionKey);
      setMessage(null);
      setErrorMessage(null);
      const response = await fetch(
        `/api/admin/settlements/${encodeURIComponent(params.record.id)}/hold`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            attested: true,
            reviewReference: params.reviewReference,
            reason: params.reason,
          }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to place settlement on hold.");
      }
      setMessage(
        `Settlement ${params.record.id.slice(0, 12)} remains on an audited hold.`,
      );
      await loadQueue();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to place settlement on hold.",
      );
    } finally {
      setActiveAction(null);
    }
  }

  const capturedTotal = useMemo(
    () => records.reduce((sum, record) => sum + Number(record.amountCaptured ?? 0), 0),
    [records],
  );

  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-8 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[34px] bg-[linear-gradient(135deg,#032d2b,#075e58)] p-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.18)] sm:p-9">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#f7d778]">
                Financial control desk · dispatcher
              </div>
              <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">
                Payment exception review
              </h1>
              <p className="mt-4 max-w-3xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                Inspect payment integrity, refund, dispute, and settlement status. Dispatchers may reconcile a booking with Stripe and place an audited settlement hold; settlement approval remains administrator-only.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadQueue()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>
        </section>

        <section className="rounded-[24px] border border-sky-200 bg-sky-50 p-5 text-sm font-semibold leading-6 text-sky-950">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
            <p>
              <strong>Dispatcher capability.</strong> Stripe reconciliation and audited settlement holds remain available for operational risk control. Only an administrator can approve a settlement for payout.
            </p>
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
          <Metric label="Captured in queue" value={`$${(capturedTotal / 100).toFixed(2)}`} />
        </section>

        <section className="overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5 sm:p-6">
            <div className="text-[9px] font-black uppercase tracking-[.18em] text-teal-700">
              Dispatcher financial queue
            </div>
            <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">
              Records needing attention
            </h2>
          </div>

          {loading ? (
            <div className="grid min-h-72 place-items-center">
              <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
            </div>
          ) : records.length ? (
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <DispatcherPaymentCard
                  key={record.id}
                  record={record}
                  activeAction={activeAction}
                  onReconcile={reconcile}
                  onHold={holdSettlement}
                />
              ))}
            </div>
          ) : (
            <div className="grid min-h-64 place-items-center p-8 text-center">
              <div>
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-700" />
                <div className="mt-4 text-lg font-black">No financial exceptions</div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function DispatcherPaymentCard({
  record,
  activeAction,
  onReconcile,
  onHold,
}: {
  record: PaymentRecord;
  activeAction: string | null;
  onReconcile: (record: PaymentRecord) => Promise<void>;
  onHold: (params: {
    record: PaymentRecord;
    reviewReference: string;
    reason: string;
  }) => Promise<void>;
}) {
  const [reviewReference, setReviewReference] = useState(
    record.settlementReviewReference ?? "",
  );
  const [holdReason, setHoldReason] = useState(
    record.settlementHoldReason ?? "",
  );
  const reconciliationKey = `reconcile:${record.id}`;
  const holdKey = `hold:${record.id}`;
  const settlementActionable = ["pending_review", "held"].includes(
    record.settlementStatus ?? "",
  );

  return (
    <article className="p-5 sm:p-6">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              label={
                record.paymentIntegrityStatus === "review_required"
                  ? "review required"
                  : record.paymentStatus
              }
            />
            <Badge label={record.financialHoldStatus || "no financial hold"} />
            {record.refundStatus ? <Badge label={`refund ${record.refundStatus}`} /> : null}
            {record.disputeStatus ? <Badge label={`dispute ${record.disputeStatus}`} /> : null}
            {record.settlementStatus ? <Badge label={`settlement ${record.settlementStatus}`} /> : null}
            <Badge label={islandLabel(record.island)} />
          </div>
          <h3 className="mt-3 text-lg font-black">
            {record.origin} → {record.destination}
          </h3>
          <div className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-slate-500">
            <span>Authorized {cents(record.amountAuthorized)}</span>
            <span>Captured {cents(record.amountCaptured)}</span>
            <span>Updated {formatDate(record.updatedAt)}</span>
          </div>
          {record.paymentIntegrityIssue ? <Issue text={record.paymentIntegrityIssue} /> : null}
          {record.settlementHoldReason ? <Issue text={`Settlement hold: ${record.settlementHoldReason}`} /> : null}
        </div>

        <div className="w-full shrink-0 space-y-3 xl:w-[360px]">
          <button
            type="button"
            onClick={() => void onReconcile(record)}
            disabled={activeAction !== null || !record.paymentIntentId}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            {activeAction === reconciliationKey ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CircleDollarSign className="h-4 w-4" />
            )}
            Reconcile Stripe
          </button>

          {settlementActionable ? (
            <section className="rounded-[22px] border border-amber-200 bg-amber-50 p-4">
              <div className="text-[9px] font-black uppercase tracking-[.15em] text-amber-900">
                Audited settlement hold
              </div>
              <input
                value={reviewReference}
                onChange={(event) =>
                  setReviewReference(event.target.value.slice(0, 180))
                }
                placeholder="Review reference"
                className="mt-3 w-full rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-amber-500"
              />
              <textarea
                value={holdReason}
                onChange={(event) =>
                  setHoldReason(event.target.value.slice(0, 400))
                }
                placeholder="Operational hold reason"
                rows={2}
                className="mt-2 w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs font-semibold outline-none focus:border-amber-500"
              />
              <button
                type="button"
                disabled={
                  activeAction !== null ||
                  !reviewReference.trim() ||
                  !holdReason.trim()
                }
                onClick={() =>
                  void onHold({
                    record,
                    reviewReference: reviewReference.trim(),
                    reason: holdReason.trim(),
                  })
                }
                className="mt-3 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full border border-amber-300 bg-white px-3 text-[8px] font-black uppercase tracking-[.12em] text-amber-900 disabled:opacity-40"
              >
                {activeAction === holdKey ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <HandCoins className="h-3.5 w-3.5" />
                )}
                Place audited hold
              </button>
              <p className="mt-3 text-[10px] font-semibold leading-4 text-amber-900/70">
                A hold blocks settlement progression. It does not approve or send a payout.
              </p>
            </section>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[.16em] text-slate-500">{label}</div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.13em] text-slate-600">
      {label.replaceAll("_", " ")}
    </span>
  );
}

function Issue({ text }: { text: string }) {
  return (
    <div className="mt-4 rounded-[20px] border border-amber-200 bg-amber-50 p-4 text-xs font-semibold leading-5 text-amber-950">
      {text}
    </div>
  );
}

function Notice({ tone, text }: { tone: "success" | "error"; text: string }) {
  return (
    <div className={`flex items-start gap-3 rounded-[24px] border p-5 text-sm font-semibold ${tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
      {tone === "success" ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" /> : <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />}
      {text}
    </div>
  );
}

function cents(value?: number | null) {
  return typeof value === "number" ? `$${(value / 100).toFixed(2)}` : "—";
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
