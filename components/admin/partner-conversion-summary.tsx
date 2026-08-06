"use client";

import {
  BadgeCheck,
  CheckCircle2,
  Clock3,
  Loader2,
  RefreshCcw,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type ConversionSummary = {
  approved: number;
  converted: number;
  awaitingOnboarding: number;
  declined: number;
};

const EMPTY_SUMMARY: ConversionSummary = {
  approved: 0,
  converted: 0,
  awaitingOnboarding: 0,
  declined: 0,
};

export function PartnerConversionSummary() {
  const [summary, setSummary] = useState<ConversionSummary>(EMPTY_SUMMARY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/partner-pipeline", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | { summary?: Partial<ConversionSummary>; error?: string }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load conversion metrics.");
      }
      setSummary({
        approved: Number(payload?.summary?.approved ?? 0),
        converted: Number(payload?.summary?.converted ?? 0),
        awaitingOnboarding: Number(
          payload?.summary?.awaitingOnboarding ?? 0,
        ),
        declined: Number(payload?.summary?.declined ?? 0),
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load conversion metrics.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const conversionRate = summary.approved
    ? Math.round((summary.converted / summary.approved) * 100)
    : 0;

  return (
    <section className="bg-[#f7f2e7] px-4 pt-5 text-[#043331] sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.14em] text-emerald-700">
              Merchant conversion
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-.04em] sm:text-3xl">
              Approval is not the finish line
            </h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-emerald-950/65">
              Track which approved businesses still need onboarding and which
              accounts now hold verified listing-scoped merchant access.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh conversion
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric
            icon={BadgeCheck}
            label="Approved"
            value={summary.approved}
          />
          <Metric
            icon={Clock3}
            label="Awaiting onboarding"
            value={summary.awaitingOnboarding}
            emphasis={summary.awaitingOnboarding > 0}
          />
          <Metric
            icon={CheckCircle2}
            label="Converted merchants"
            value={summary.converted}
          />
          <Metric
            icon={CheckCircle2}
            label="Approval conversion"
            value={`${conversionRate}%`}
          />
        </div>
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  emphasis = false,
}: {
  icon: typeof BadgeCheck;
  label: string;
  value: number | string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-[24px] border p-5 shadow-sm ${
        emphasis
          ? "border-amber-200 bg-amber-50"
          : "border-emerald-100 bg-white"
      }`}
    >
      <Icon className="h-5 w-5 text-emerald-700" />
      <p className="mt-4 text-3xl font-black tracking-[-.04em]">{value}</p>
      <p className="mt-1 text-[9px] font-black uppercase tracking-[.13em] text-slate-400">
        {label}
      </p>
    </div>
  );
}
