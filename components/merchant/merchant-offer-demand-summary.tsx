"use client";

import {
  BadgeDollarSign,
  BarChart3,
  Clock3,
  Loader2,
  RefreshCcw,
  Sparkles,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type DemandSummary = {
  requests: number;
  offersWithDemand: number;
  highestRequestCount: number;
};

type DemandOffer = {
  id: string;
  listingId: string;
  listingName: string;
  title: string;
  status: string;
  requestCount: number;
  lastRequestedAt: string | null;
};

const EMPTY_SUMMARY: DemandSummary = {
  requests: 0,
  offersWithDemand: 0,
  highestRequestCount: 0,
};

export function MerchantOfferDemandSummary() {
  const [summary, setSummary] = useState<DemandSummary>(EMPTY_SUMMARY);
  const [topOffers, setTopOffers] = useState<DemandOffer[]>([]);
  const [latestRequestedAt, setLatestRequestedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/merchant-offer-demand", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as
        | {
            summary?: DemandSummary;
            topOffers?: DemandOffer[];
            latestRequestedAt?: string | null;
            error?: string;
          }
        | null;
      if (!response.ok) {
        throw new Error(payload?.error || "Unable to load package demand.");
      }
      const nextTopOffers = payload?.topOffers;
      setSummary(payload?.summary ?? EMPTY_SUMMARY);
      setTopOffers(Array.isArray(nextTopOffers) ? nextTopOffers : []);
      setLatestRequestedAt(payload?.latestRequestedAt ?? null);
    } catch (caught) {
      if (!silent) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to load package demand.",
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

  return (
    <section className="px-4 pt-6 sm:px-6">
      <div className="mx-auto max-w-7xl rounded-[30px] border border-violet-200 bg-violet-50 p-5 text-[#043331] shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.15em] text-violet-700">
              Package demand
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-.045em]">
              See which offers are generating traveler requests
            </h2>
            <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-violet-950/65">
              Counts represent unique same-day package requests. Repeated taps and
              transaction retries return the original booking without inflating
              demand.
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => void load()}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-violet-200 bg-white px-5 text-[9px] font-black uppercase tracking-[.14em] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCcw className="h-4 w-4" />
            )}
            Refresh demand
          </button>
        </div>

        {error ? (
          <div className="mt-5 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        {!error ? (
          <>
            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                icon={BadgeDollarSign}
                label="Unique requests"
                value={summary.requests}
              />
              <Metric
                icon={Sparkles}
                label="Offers with demand"
                value={summary.offersWithDemand}
              />
              <Metric
                icon={BarChart3}
                label="Top offer requests"
                value={summary.highestRequestCount}
              />
              <Metric
                icon={Clock3}
                label="Latest request"
                value={
                  latestRequestedAt ? formatTime(latestRequestedAt) : "No demand yet"
                }
                compact
              />
            </div>

            {topOffers.length ? (
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {topOffers.slice(0, 6).map((offer, index) => (
                  <article
                    key={offer.id}
                    className="rounded-[24px] border border-violet-100 bg-white p-5"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[8px] font-black uppercase tracking-[.13em] text-violet-700">
                          #{index + 1} package demand
                        </p>
                        <h3 className="mt-2 text-xl font-black tracking-[-.035em]">
                          {offer.title}
                        </h3>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {offer.listingName}
                        </p>
                      </div>
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-violet-100 text-2xl font-black text-violet-800">
                        {offer.requestCount}
                      </span>
                    </div>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-600">
                        {offer.status}
                      </span>
                      <p className="text-xs font-bold text-slate-400">
                        {offer.lastRequestedAt
                          ? `Latest ${formatTime(offer.lastRequestedAt)}`
                          : "No request timestamp"}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-[24px] border border-violet-100 bg-white p-6 text-center">
                <Sparkles className="mx-auto h-7 w-7 text-violet-700" />
                <p className="mt-3 text-sm font-bold text-violet-950/65">
                  Demand appears here after travelers submit their first live
                  package request.
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
  compact = false,
}: {
  icon: typeof BadgeDollarSign;
  label: string;
  value: number | string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-[22px] border border-violet-100 bg-white p-5">
      <Icon className="h-5 w-5 text-violet-700" />
      <p
        className={`mt-4 font-black tracking-[-.04em] ${
          compact ? "text-lg" : "text-3xl"
        }`}
      >
        {value}
      </p>
      <p className="mt-1 text-[8px] font-black uppercase tracking-[.12em] text-slate-400">
        {label}
      </p>
    </div>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/St_Thomas",
  }).format(date);
}
