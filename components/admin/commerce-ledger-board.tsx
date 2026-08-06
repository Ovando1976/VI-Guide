"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type LedgerPolicy = {
  feeBps: number;
  source: "environment" | "unconfigured";
};

type LedgerSummary = {
  captureCount: number;
  refundCount: number;
  reviewCount: number;
  processingCount: number;
  failedCount: number;
  grossCapturedCents: number;
  grossRefundedCents: number;
  netGrossCents: number;
  platformFeeReserveCents: number;
  merchantSettlementCents: number;
  unallocatedCents: number;
};

type ReconciliationSummary = {
  scannedBookings: number;
  financialBookings: number;
  missingCaptureEntries: number;
  reviewRequiredBookings: number;
};

type ListingSummary = {
  listingId: string;
  listingName: string;
  captures: number;
  refunds: number;
  grossCents: number;
  platformFeeCents: number;
  merchantSettlementCents: number;
  unallocatedCents: number;
  reviewCount: number;
  latestAt: string;
};

type LedgerEntry = {
  id: string;
  kind: "capture" | "refund";
  status: "held" | "posted" | "processing" | "review_required" | "failed";
  bookingId: string;
  bookingReference: string;
  listingId: string;
  listingName: string;
  paymentIntentId: string;
  checkoutSessionId: string | null;
  refundId: string | null;
  reversalOfEntryId: string | null;
  stripeEventId: string;
  currency: string;
  feeBps: number;
  feePolicySource: "environment" | "unconfigured";
  grossAmountCents: number;
  platformFeeCents: number;
  merchantSettlementCents: number;
  reportedRefundAmountCents: number | null;
  unallocatedAmountCents: number;
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
};

type LedgerPayload = {
  policy: LedgerPolicy;
  summary: LedgerSummary;
  reconciliation: ReconciliationSummary;
  listings: ListingSummary[];
  entries: LedgerEntry[];
};

type ReconciliationResult = {
  scannedBookings: number;
  captureEntries: number;
  refundEntries: number;
  reviewedEntries: number;
  skippedBookings: number;
};

const EMPTY_SUMMARY: LedgerSummary = {
  captureCount: 0,
  refundCount: 0,
  reviewCount: 0,
  processingCount: 0,
  failedCount: 0,
  grossCapturedCents: 0,
  grossRefundedCents: 0,
  netGrossCents: 0,
  platformFeeReserveCents: 0,
  merchantSettlementCents: 0,
  unallocatedCents: 0,
};

const EMPTY_RECONCILIATION: ReconciliationSummary = {
  scannedBookings: 0,
  financialBookings: 0,
  missingCaptureEntries: 0,
  reviewRequiredBookings: 0,
};

export function CommerceLedgerBoard() {
  const [data, setData] = useState<LedgerPayload>({
    policy: { feeBps: 0, source: "unconfigured" },
    summary: EMPTY_SUMMARY,
    reconciliation: EMPTY_RECONCILIATION,
    listings: [],
    entries: [],
  });
  const [loading, setLoading] = useState(true);
  const [reconciling, setReconciling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/commerce-ledger", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | (Partial<LedgerPayload> & { error?: string })
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load commerce accounting.");
      }
      const nextListings = payload?.listings;
      const nextEntries = payload?.entries;
      setData({
        policy: payload?.policy ?? { feeBps: 0, source: "unconfigured" },
        summary: payload?.summary ?? EMPTY_SUMMARY,
        reconciliation: payload?.reconciliation ?? EMPTY_RECONCILIATION,
        listings: Array.isArray(nextListings) ? nextListings : [],
        entries: Array.isArray(nextEntries) ? nextEntries : [],
      });
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load commerce accounting.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const refresh = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  async function reconcile() {
    setReconciling(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/commerce-ledger", {
        method: "POST",
      });
      const payload = (await response.json().catch(() => null)) as
        | (ReconciliationResult & { error?: string })
        | null;
      if (!response.ok || !payload) {
        throw new Error(payload?.error || "Unable to reconcile accounting.");
      }
      setMessage(
        `Reconciliation scanned ${payload.scannedBookings} bookings, wrote ${payload.captureEntries} capture entries and ${payload.refundEntries} refund entries, and left ${payload.reviewedEntries} entries for review.`,
      );
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reconcile accounting.",
      );
    } finally {
      setReconciling(false);
    }
  }

  const attentionCount = useMemo(
    () =>
      data.summary.reviewCount +
      data.summary.processingCount +
      data.summary.failedCount +
      data.reconciliation.missingCaptureEntries,
    [data],
  );

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 pb-32 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.32),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_30px_90px_rgba(4,51,49,.22)] sm:p-10 lg:p-12">
          <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
                Financial operations
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-black leading-[.94] tracking-[-.055em] sm:text-6xl">
                Know what VI Guide collected, reserved, and owes.
              </h1>
              <p className="mt-5 max-w-3xl text-sm font-semibold leading-7 text-white/65">
                Stripe-verified captures and refunds create deterministic ledger
                entries. This control room records accounting obligations; it does
                not send merchant payouts or move funds.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <HeroMetric
                icon={Scale}
                label="Fee policy"
                value={
                  data.policy.source === "environment"
                    ? `${formatBps(data.policy.feeBps)} configured`
                    : "0% · unconfigured"
                }
              />
              <HeroMetric
                icon={AlertTriangle}
                label="Needs attention"
                value={String(attentionCount)}
              />
            </div>
          </div>
        </section>

        {data.policy.source === "unconfigured" ? (
          <section className="mt-6 flex gap-4 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-950">
            <AlertTriangle className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
            <div>
              <h2 className="text-xl font-black">Platform fee policy is not configured</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-amber-900/70">
                New verified captures are recorded with a zero platform-fee reserve
                until <code>VI_GUIDE_COMMERCE_PLATFORM_FEE_BPS</code> contains a
                valid whole-number basis-point value. VI Guide never invents or
                retroactively deducts a fee.
              </p>
            </div>
          </section>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Metric
            icon={CircleDollarSign}
            label="Gross captured"
            value={formatMoney(data.summary.grossCapturedCents)}
            detail={`${data.summary.captureCount} capture entries`}
          />
          <Metric
            icon={RefreshCcw}
            label="Verified refunds"
            value={formatMoney(data.summary.grossRefundedCents)}
            detail={`${data.summary.refundCount} refund entries`}
          />
          <Metric
            icon={Scale}
            label="Net payment balance"
            value={formatMoney(data.summary.netGrossCents)}
            detail="Captures less verified reversals"
          />
          <Metric
            icon={ShieldCheck}
            label="Platform fee reserve"
            value={formatMoney(data.summary.platformFeeReserveCents)}
            detail="Accounting reserve, not recognized payout"
          />
          <Metric
            icon={Store}
            label="Merchant settlement obligation"
            value={formatMoney(data.summary.merchantSettlementCents)}
            detail="Recorded obligation; no payout sent"
          />
          <Metric
            icon={AlertTriangle}
            label="Unallocated review amount"
            value={formatMoney(data.summary.unallocatedCents)}
            detail={`${data.summary.reviewCount} entries require review`}
            attention={
              data.summary.unallocatedCents !== 0 ||
              data.summary.reviewCount > 0
            }
          />
        </section>

        <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">
                Deterministic recovery
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
                Reconcile historical verified bookings
              </h2>
              <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-slate-500">
                Reconciliation creates only deterministic missing ledger records
                from existing booking evidence. It never contacts Stripe, issues a
                refund, changes a charge, or sends a payout.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => void load()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4" />
                )}
                Refresh
              </button>
              <button
                type="button"
                disabled={reconciling}
                onClick={() => void reconcile()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
              >
                {reconciling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                Reconcile ledger
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SmallMetric
              label="Financial bookings"
              value={data.reconciliation.financialBookings}
            />
            <SmallMetric
              label="Missing captures"
              value={data.reconciliation.missingCaptureEntries}
              attention={data.reconciliation.missingCaptureEntries > 0}
            />
            <SmallMetric
              label="Booking reviews"
              value={data.reconciliation.reviewRequiredBookings}
              attention={data.reconciliation.reviewRequiredBookings > 0}
            />
            <SmallMetric
              label="Processing / failed"
              value={
                data.summary.processingCount + data.summary.failedCount
              }
              attention={
                data.summary.processingCount + data.summary.failedCount > 0
              }
            />
          </div>
        </section>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}
        {message ? (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">
            {message}
          </div>
        ) : null}

        <section className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
          <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <Store className="h-6 w-6 text-teal-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
                  Business obligations
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                  Merchant settlement balances
                </h2>
              </div>
            </div>

            {data.listings.length ? (
              <div className="mt-5 space-y-3">
                {data.listings.slice(0, 20).map((listing) => (
                  <div
                    key={listing.listingId}
                    className="rounded-[22px] border border-slate-100 bg-[#fbfaf6] p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="font-black tracking-[-.025em]">
                          {listing.listingName}
                        </h3>
                        <p className="mt-1 truncate font-mono text-[9px] font-bold text-slate-400">
                          {listing.listingId}
                        </p>
                      </div>
                      <p className="text-right text-xl font-black">
                        {formatMoney(listing.merchantSettlementCents)}
                      </p>
                    </div>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <TinyValue label="Net gross" value={formatMoney(listing.grossCents)} />
                      <TinyValue label="Fee reserve" value={formatMoney(listing.platformFeeCents)} />
                      <TinyValue label="Reviews" value={String(listing.reviewCount)} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="Verified commerce activity will appear here after the first ledger entry." />
            )}
          </article>

          <article className="rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
            <div className="flex items-center gap-3">
              <Clock3 className="h-6 w-6 text-teal-700" />
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">
                  Immutable activity
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                  Recent ledger entries
                </h2>
              </div>
            </div>

            {data.entries.length ? (
              <div className="mt-5 space-y-3">
                {data.entries.slice(0, 25).map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[22px] border border-slate-100 bg-[#fbfaf6] p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <EntryStatus status={entry.status} />
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-600">
                            {entry.kind}
                          </span>
                        </div>
                        <h3 className="mt-3 font-black tracking-[-.025em]">
                          {entry.listingName}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {entry.bookingReference} · {formatTime(entry.occurredAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-black">
                          {formatMoney(entry.grossAmountCents)}
                        </p>
                        <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
                          Gross effect
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <TinyValue
                        label="Fee reserve"
                        value={formatMoney(entry.platformFeeCents)}
                      />
                      <TinyValue
                        label="Merchant obligation"
                        value={formatMoney(entry.merchantSettlementCents)}
                      />
                      <TinyValue
                        label="Unallocated"
                        value={formatMoney(entry.unallocatedAmountCents)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState text="No commerce ledger entries have been recorded yet." />
            )}
          </article>
        </section>
      </div>
    </main>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-xl font-black tracking-[-.03em]">{value}</p>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  detail,
  attention = false,
}: {
  icon: typeof CircleDollarSign;
  label: string;
  value: string;
  detail: string;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-[26px] border p-5 shadow-sm ${
        attention
          ? "border-rose-200 bg-rose-50"
          : "border-slate-200 bg-white"
      }`}
    >
      <Icon className={`h-5 w-5 ${attention ? "text-rose-700" : "text-teal-700"}`} />
      <p className="mt-4 text-3xl font-black tracking-[-.045em]">{value}</p>
      <p className="mt-2 text-[9px] font-black uppercase tracking-[.13em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
        {detail}
      </p>
    </div>
  );
}

function SmallMetric({
  label,
  value,
  attention = false,
}: {
  label: string;
  value: number;
  attention?: boolean;
}) {
  return (
    <div
      className={`rounded-[22px] border p-4 ${
        attention
          ? "border-rose-200 bg-rose-50"
          : "border-slate-100 bg-[#fbfaf6]"
      }`}
    >
      <p className="text-2xl font-black">{value}</p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function TinyValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white px-3 py-2">
      <p className="text-[7px] font-black uppercase tracking-[.11em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 text-xs font-black">{value}</p>
    </div>
  );
}

function EntryStatus({ status }: { status: LedgerEntry["status"] }) {
  const styles: Record<LedgerEntry["status"], string> = {
    held: "bg-sky-100 text-sky-800",
    posted: "bg-emerald-100 text-emerald-800",
    processing: "bg-amber-100 text-amber-800",
    review_required: "bg-rose-100 text-rose-800",
    failed: "bg-slate-200 text-slate-700",
  };
  const Icon = status === "posted" ? CheckCircle2 : status === "processing" ? Clock3 : status === "review_required" ? AlertTriangle : ShieldCheck;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${styles[status]}`}>
      <Icon className="h-3.5 w-3.5" /> {status.replaceAll("_", " ")}
    </span>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="mt-5 rounded-[22px] border border-emerald-100 bg-emerald-50 p-7 text-center">
      <ShieldCheck className="mx-auto h-7 w-7 text-emerald-700" />
      <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-6 text-emerald-950/65">
        {text}
      </p>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

function formatBps(bps: number) {
  return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 2)}%`;
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(date);
}
