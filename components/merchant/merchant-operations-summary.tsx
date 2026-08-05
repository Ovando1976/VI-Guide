"use client";

import Link from "next/link";
import {
  ArrowRight,
  CalendarCheck2,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import {
  summarizeMerchantBookings,
  type MerchantOperationsSummary,
} from "@/lib/merchant-portal";

const EMPTY_SUMMARY: MerchantOperationsSummary = {
  total: 0,
  active: 0,
  needsAction: 0,
  awaitingPayment: 0,
  readyToConfirm: 0,
  confirmed: 0,
  completed: 0,
  closed: 0,
};

export function MerchantOperationsSummary() {
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSummary = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);

    try {
      const response = await fetch("/api/merchant-bookings", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { bookings?: unknown[]; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load business activity.");
      }
      setSummary(summarizeMerchantBookings(payload?.bookings));
      setError(null);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load business activity.",
        );
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary(false);

    function refreshWhenVisible() {
      if (document.visibilityState === "visible") {
        void loadSummary(true);
      }
    }

    const timer = window.setInterval(refreshWhenVisible, 60_000);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [loadSummary]);

  return (
    <section className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
            Live booking pulse
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-.04em]">
            What needs attention now
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">
            Scoped to the businesses your account is authorized to manage.
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void loadSummary(false)}
          className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCcw className="h-4 w-4" />
          )}
          Refresh
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          icon={CalendarCheck2}
          label="Needs review"
          value={summary.needsAction}
          detail="New and reviewing requests"
        />
        <SummaryCard
          icon={Clock3}
          label="Awaiting payment"
          value={summary.awaitingPayment}
          detail="Deposit requested from traveler"
        />
        <SummaryCard
          icon={CircleDollarSign}
          label="Ready to confirm"
          value={summary.readyToConfirm}
          detail="Stripe-verified paid bookings"
        />
        <SummaryCard
          icon={CheckCircle2}
          label="Confirmed"
          value={summary.confirmed}
          detail="Upcoming committed services"
        />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-[#f8f4ea] px-5 py-4">
        <p className="text-sm font-bold text-slate-600">
          {summary.active} active · {summary.completed} completed · {summary.closed} closed
        </p>
        <Link
          href="/merchant/reservations"
          className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-[#043331]"
        >
          Work the reservation queue <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof CalendarCheck2;
  label: string;
  value: number;
  detail: string;
}) {
  return (
    <article className="rounded-[24px] border border-slate-200 bg-[#fbfaf6] p-5">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-4 text-3xl font-black tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-400">
        {detail}
      </p>
    </article>
  );
}
