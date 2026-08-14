"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRightLeft,
  BadgeCheck,
  CircleDollarSign,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Undo2,
  WalletCards,
} from "lucide-react";

type SettlementRow = {
  bookingId: string;
  reference: string;
  listingId: string;
  listingName: string;
  status: string;
  paymentStatus: string;
  paymentIntegrityStatus: string;
  refundStatus: string;
  settlementStatus: string;
  transferId: string | null;
  transferReversalId: string | null;
  connectedAccountId: string | null;
  connectedTransferStatus: string;
  merchantProfileMatches: number;
  grossAmountCents: number;
  platformFeeCents: number;
  merchantSettlementCents: number;
  feeBps: number;
  releaseEligible: boolean;
  eligibilityError: string | null;
  updatedAt: string;
};

type SettlementPayload = {
  rows: SettlementRow[];
  summary: {
    total: number;
    ready: number;
    transferred: number;
    reversed: number;
    reviewRequired: number;
    platformFeeCents: number;
    merchantSettlementCents: number;
  };
};

type Filter = "all" | "ready" | "transferred" | "review";

export function CommerceSettlementBoard() {
  const [payload, setPayload] = useState<SettlementPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState<Filter>("ready");
  const [workingBookingId, setWorkingBookingId] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/commerce-settlements", {
        cache: "no-store",
      });
      const data = (await response.json().catch(() => null)) as
        | (SettlementPayload & { error?: string })
        | null;
      if (!response.ok || !data?.rows || !data.summary) {
        throw new Error(data?.error || "Unable to load marketplace settlements.");
      }
      setPayload(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load marketplace settlements.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const rows = useMemo(() => {
    const source = payload?.rows ?? [];
    if (filter === "ready") return source.filter((row) => row.releaseEligible);
    if (filter === "transferred") {
      return source.filter((row) => row.settlementStatus === "transferred");
    }
    if (filter === "review") {
      return source.filter(
        (row) =>
          row.settlementStatus === "review_required" ||
          (!row.releaseEligible && row.settlementStatus !== "transferred"),
      );
    }
    return source;
  }, [filter, payload]);

  async function release(row: SettlementRow) {
    const confirmReference = window.prompt(
      `Release ${formatMoney(row.merchantSettlementCents)} to the merchant for ${row.reference}?\n\nType the exact booking reference to authorize the transfer:`,
    );
    if (confirmReference === null) return;

    setWorkingBookingId(row.bookingId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/commerce-settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: row.bookingId,
          confirmReference,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string; amountCents?: number; transferId?: string }
        | null;
      if (!response.ok) {
        throw new Error(data?.error || "Unable to release merchant settlement.");
      }
      setNotice(
        `${formatMoney(data?.amountCents ?? row.merchantSettlementCents)} released for ${row.reference}.`,
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to release merchant settlement.",
      );
    } finally {
      setWorkingBookingId("");
    }
  }

  async function reverse(row: SettlementRow) {
    const confirmReference = window.prompt(
      `Reverse merchant settlement for ${row.reference}?\n\nType the exact booking reference:`,
    );
    if (confirmReference === null) return;
    const reason = window.prompt(
      "Enter the financial reason for recovering this merchant settlement before a refund or correction:",
    );
    if (reason === null) return;

    setWorkingBookingId(row.bookingId);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/commerce-settlements/reverse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: row.bookingId,
          confirmReference,
          reason,
        }),
      });
      const data = (await response.json().catch(() => null)) as
        | { error?: string; amountCents?: number; refundUnlocked?: boolean }
        | null;
      if (!response.ok) {
        throw new Error(data?.error || "Unable to reverse merchant settlement.");
      }
      setNotice(
        `${formatMoney(data?.amountCents ?? row.merchantSettlementCents)} recovered for ${row.reference}. The traveler refund workflow is unlocked for review.`,
      );
      await load();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to reverse merchant settlement.",
      );
    } finally {
      setWorkingBookingId("");
    }
  }

  return (
    <main className="bg-[#f7f2e7] px-4 py-8 pb-32 text-[#043331] sm:px-6 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <section className="overflow-hidden rounded-[36px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.28),transparent_34%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.2)] sm:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5c451]">
                Marketplace settlement
              </p>
              <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-5xl">
                Release merchant money only when the booking is clean.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/65">
                USVI Explorer keeps the platform commission, releases the merchant net
                through Stripe Connect, and locks refunds until any released
                merchant settlement is recovered.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh queue
            </button>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              label="Ready to release"
              value={String(payload?.summary.ready ?? 0)}
              icon={BadgeCheck}
            />
            <SummaryCard
              label="Merchant obligation"
              value={formatMoney(payload?.summary.merchantSettlementCents ?? 0)}
              icon={WalletCards}
            />
            <SummaryCard
              label="USVI Explorer fee"
              value={formatMoney(payload?.summary.platformFeeCents ?? 0)}
              icon={CircleDollarSign}
            />
            <SummaryCard
              label="Released"
              value={String(payload?.summary.transferred ?? 0)}
              icon={ArrowRightLeft}
            />
          </div>
        </section>

        {notice ? (
          <div className="mt-5 rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-bold text-emerald-900">
            {notice}
          </div>
        ) : null}
        {error ? (
          <div className="mt-5 flex gap-3 rounded-[22px] border border-rose-200 bg-rose-50 p-5 text-sm font-bold leading-6 text-rose-900">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}

        <section className="mt-6 rounded-[30px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                Operations queue
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-[-.04em]">
                Booking settlements
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["ready", "all", "transferred", "review"] as Filter[]).map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`rounded-full px-4 py-2 text-[9px] font-black uppercase tracking-[.12em] ${
                      filter === value
                        ? "bg-[#043331] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {value}
                  </button>
                ),
              )}
            </div>
          </div>

          {loading && !payload ? (
            <div className="grid min-h-64 place-items-center">
              <Loader2 className="h-7 w-7 animate-spin text-teal-700" />
            </div>
          ) : rows.length ? (
            <div className="mt-6 space-y-4">
              {rows.map((row) => {
                const working = workingBookingId === row.bookingId;
                return (
                  <article
                    key={row.bookingId}
                    className="rounded-[26px] border border-slate-200 bg-[#fbfaf6] p-5 sm:p-6"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill value={row.settlementStatus} />
                          <StatusPill value={row.connectedTransferStatus} />
                          <span className="rounded-full bg-white px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-500 ring-1 ring-slate-200">
                            {row.reference}
                          </span>
                        </div>
                        <h3 className="mt-4 text-xl font-black tracking-[-.035em]">
                          {row.listingName}
                        </h3>
                        <p className="mt-1 break-all font-mono text-[10px] font-bold text-slate-400">
                          {row.listingId}
                        </p>

                        <div className="mt-5 grid gap-3 sm:grid-cols-3">
                          <MoneyCell label="Traveler paid" cents={row.grossAmountCents} />
                          <MoneyCell label="USVI Explorer fee" cents={row.platformFeeCents} />
                          <MoneyCell
                            label="Merchant net"
                            cents={row.merchantSettlementCents}
                            strong
                          />
                        </div>

                        {row.eligibilityError && row.settlementStatus !== "transferred" ? (
                          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900">
                            {row.eligibilityError}
                          </div>
                        ) : null}
                      </div>

                      <div className="w-full shrink-0 xl:w-72">
                        <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                          <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
                            Financial controls
                          </p>
                          <div className="mt-3 space-y-2 text-xs font-bold text-slate-600">
                            <ControlLine
                              label="Booking"
                              good={row.status === "completed"}
                              value={row.status}
                            />
                            <ControlLine
                              label="Payment"
                              good={
                                row.paymentStatus === "paid" ||
                                row.paymentStatus === "merchant_settled"
                              }
                              value={row.paymentStatus}
                            />
                            <ControlLine
                              label="Integrity"
                              good={row.paymentIntegrityStatus === "verified"}
                              value={row.paymentIntegrityStatus}
                            />
                            <ControlLine
                              label="Refund"
                              good={row.refundStatus === "not_requested"}
                              value={row.refundStatus}
                            />
                          </div>
                        </div>

                        {row.releaseEligible ? (
                          <button
                            type="button"
                            onClick={() => void release(row)}
                            disabled={working}
                            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#043331] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60"
                          >
                            {working ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <ShieldCheck className="h-4 w-4" />
                            )}
                            Release {formatMoney(row.merchantSettlementCents)}
                          </button>
                        ) : row.settlementStatus === "transferred" &&
                          !row.transferReversalId ? (
                          <button
                            type="button"
                            onClick={() => void reverse(row)}
                            disabled={working}
                            className="mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-5 text-[9px] font-black uppercase tracking-[.14em] text-rose-800 disabled:opacity-60"
                          >
                            {working ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Undo2 className="h-4 w-4" />
                            )}
                            Reverse before refund
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-slate-300 p-10 text-center text-sm font-semibold text-slate-500">
              No settlements match this filter.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof ShieldCheck;
}) {
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[.07] p-5">
      <Icon className="h-5 w-5 text-[#f5c451]" />
      <p className="mt-4 text-[8px] font-black uppercase tracking-[.14em] text-white/45">
        {label}
      </p>
      <p className="mt-1 text-xl font-black">{value}</p>
    </div>
  );
}

function MoneyCell({
  label,
  cents,
  strong = false,
}: {
  label: string;
  cents: number;
  strong?: boolean;
}) {
  return (
    <div className={`rounded-2xl p-4 ${strong ? "bg-teal-50" : "bg-white"}`}>
      <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
      <p className={`mt-2 text-lg font-black ${strong ? "text-teal-800" : ""}`}>
        {formatMoney(cents)}
      </p>
    </div>
  );
}

function StatusPill({ value }: { value: string }) {
  const good = value === "active" || value === "transferred" || value === "reversed";
  const review = value === "review_required" || value === "restricted";
  return (
    <span
      className={`rounded-full px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] ${
        good
          ? "bg-emerald-100 text-emerald-800"
          : review
            ? "bg-rose-100 text-rose-800"
            : "bg-amber-100 text-amber-800"
      }`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function ControlLine({
  label,
  value,
  good,
}: {
  label: string;
  value: string;
  good: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className={good ? "text-emerald-700" : "text-amber-700"}>
        {value.replaceAll("_", " ") || "unknown"}
      </span>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format((Number.isFinite(cents) ? cents : 0) / 100);
}
