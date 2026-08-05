"use client";

import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Loader2,
  MailCheck,
  RefreshCcw,
  RotateCcw,
  Send,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

type DeliveryStatus = "pending" | "processing" | "delivered" | "failed";
type Delivery = {
  id: string;
  bookingId: string;
  reference: string;
  event: string;
  audience: string;
  listingId: string;
  listingName: string;
  recipientEmail: string | null;
  title: string;
  status: DeliveryStatus;
  attempts: number;
  provider: string | null;
  providerMessageId: string | null;
  lastError: string | null;
  nextAttemptAt: string | null;
  leaseUntil: string | null;
  deliveredAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  retryable: boolean;
};

type Summary = {
  total: number;
  pending: number;
  processing: number;
  delivered: number;
  failed: number;
  retryable: number;
};

type Filter = "attention" | DeliveryStatus | "all";

const EMPTY_SUMMARY: Summary = {
  total: 0,
  pending: 0,
  processing: 0,
  delivered: 0,
  failed: 0,
  retryable: 0,
};

export function NotificationOutboxBoard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [summary, setSummary] = useState<Summary>(EMPTY_SUMMARY);
  const [canRetry, setCanRetry] = useState(false);
  const [filter, setFilter] = useState<Filter>("attention");
  const [loading, setLoading] = useState(true);
  const [workingIds, setWorkingIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/admin/notification-outbox", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            canRetry?: boolean;
            summary?: Summary;
            deliveries?: Delivery[];
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(
          payload?.error || "Unable to load notification operations.",
        );
      }
      setCanRetry(payload?.canRetry === true);
      setSummary(payload?.summary ?? EMPTY_SUMMARY);
      setDeliveries(Array.isArray(payload?.deliveries) ? payload.deliveries : []);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load notification operations.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
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

  const visibleDeliveries = useMemo(() => {
    if (filter === "all") return deliveries;
    if (filter === "attention") {
      return deliveries.filter(
        (delivery) => delivery.retryable || delivery.status === "processing",
      );
    }
    return deliveries.filter((delivery) => delivery.status === filter);
  }, [deliveries, filter]);

  const visibleRetryableIds = useMemo(
    () =>
      visibleDeliveries
        .filter((delivery) => delivery.retryable)
        .slice(0, 25)
        .map((delivery) => delivery.id),
    [visibleDeliveries],
  );

  async function retry(ids: string[]) {
    if (!canRetry || !ids.length) return;
    setWorkingIds(ids);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/notification-outbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            requeued?: number;
            delivery?: {
              delivered?: number;
              deferred?: number;
              skipped?: number;
              failed?: number;
            };
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to retry delivery.");
      }

      const delivered = Number(payload?.delivery?.delivered ?? 0);
      const deferred = Number(payload?.delivery?.deferred ?? 0);
      setMessage(
        `${Number(payload?.requeued ?? ids.length)} notification${ids.length === 1 ? "" : "s"} requeued · ${delivered} delivered · ${deferred} deferred.`,
      );
      await load(true);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Unable to retry delivery.",
      );
    } finally {
      setWorkingIds([]);
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f2e7] px-4 py-8 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em]"
          >
            <ArrowLeft className="h-4 w-4" /> Admin
          </Link>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load(false)}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh
          </button>
        </div>

        <section className="mt-5 overflow-hidden rounded-[38px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.28),transparent_35%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-xl sm:p-10">
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-[#f5c451]">
            Delivery operations
          </p>
          <div className="mt-4 grid gap-7 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
            <div>
              <h1 className="text-4xl font-black leading-[.95] tracking-[-.055em] sm:text-6xl">
                Booking notification control room
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                Inspect traveler, merchant, and operations email delivery. Failed
                and unresolved messages remain durable until they are delivered
                or explicitly retried by an administrator.
              </p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-white/[.07] p-5">
              <MailCheck className="h-6 w-6 text-[#f5c451]" />
              <p className="mt-4 text-[9px] font-black uppercase tracking-[.15em] text-white/45">
                Current access
              </p>
              <p className="mt-1 text-xl font-black">
                {canRetry ? "Admin retry controls" : "Read-only operations"}
              </p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric icon={Send} label="Pending" value={summary.pending} />
          <Metric icon={Clock3} label="Processing" value={summary.processing} />
          <Metric icon={CheckCircle2} label="Delivered" value={summary.delivered} />
          <Metric icon={AlertTriangle} label="Failed" value={summary.failed} />
          <Metric icon={RotateCcw} label="Retryable" value={summary.retryable} />
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

        <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["attention", "Needs attention"],
                  ["pending", "Pending"],
                  ["processing", "Processing"],
                  ["failed", "Failed"],
                  ["delivered", "Delivered"],
                  ["all", "All"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`min-h-10 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] ${
                    filter === value
                      ? "bg-[#043331] text-white"
                      : "border border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {canRetry && visibleRetryableIds.length ? (
              <button
                type="button"
                disabled={workingIds.length > 0}
                onClick={() => void retry(visibleRetryableIds)}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
              >
                {workingIds.length ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4" />
                )}
                Retry visible
              </button>
            ) : null}
          </div>
        </section>

        <section className="mt-5 space-y-3">
          {loading && !deliveries.length ? (
            <div className="grid min-h-56 place-items-center rounded-[30px] border border-slate-200 bg-white">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : !visibleDeliveries.length ? (
            <div className="rounded-[30px] border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-700" />
              <h2 className="mt-4 text-xl font-black">No matching deliveries</h2>
              <p className="mt-2 text-sm font-semibold text-emerald-900/65">
                This queue is clear for the selected filter.
              </p>
            </div>
          ) : (
            visibleDeliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                canRetry={canRetry}
                working={workingIds.includes(delivery.id)}
                onRetry={() => void retry([delivery.id])}
              />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function DeliveryCard({
  delivery,
  canRetry,
  working,
  onRetry,
}: {
  delivery: Delivery;
  canRetry: boolean;
  working: boolean;
  onRetry: () => void;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={delivery.status} />
            <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-600">
              {delivery.audience || "unknown audience"}
            </span>
            <span className="rounded-full bg-teal-50 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-teal-700">
              {delivery.event.replaceAll("_", " ")}
            </span>
          </div>
          <h2 className="mt-4 text-xl font-black tracking-[-.03em]">
            {delivery.title || "Booking notification"}
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {delivery.listingName} · {delivery.reference}
          </p>
          <p className="mt-2 break-all font-mono text-[10px] font-bold text-slate-400">
            {delivery.recipientEmail || "Recipient resolved at delivery time"}
          </p>
        </div>
        {canRetry && delivery.retryable ? (
          <button
            type="button"
            disabled={working}
            onClick={onRetry}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
          >
            {working ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4" />
            )}
            Retry
          </button>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 text-xs font-semibold text-slate-500 sm:grid-cols-2 lg:grid-cols-4">
        <Detail label="Attempts" value={String(delivery.attempts)} />
        <Detail label="Updated" value={formatTime(delivery.updatedAt)} />
        <Detail
          label="Next attempt"
          value={delivery.nextAttemptAt ? formatTime(delivery.nextAttemptAt) : "—"}
        />
        <Detail
          label="Provider"
          value={delivery.providerMessageId || delivery.provider || "—"}
        />
      </div>

      {delivery.lastError ? (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-5 text-amber-900">
          {delivery.lastError}
        </div>
      ) : null}
    </article>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Send;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-4 text-3xl font-black tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#fbfaf6] px-4 py-3">
      <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 break-all text-xs font-bold text-slate-600">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: DeliveryStatus }) {
  const className =
    status === "delivered"
      ? "bg-emerald-100 text-emerald-800"
      : status === "failed"
        ? "bg-rose-100 text-rose-700"
        : status === "processing"
          ? "bg-sky-100 text-sky-700"
          : "bg-amber-100 text-amber-800";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${className}`}
    >
      {status}
    </span>
  );
}

function formatTime(value: string) {
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value || "—";
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(parsed));
}
