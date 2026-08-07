"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { BadgeDollarSign, Loader2, RefreshCw, TrendingUp } from "lucide-react";

import { OpsMetric, OpsPill, OpsSection } from "@/components/ops/ops-ui";
import { TravelAdvisorCommercePanel } from "@/components/admin/travel-advisor-commerce-panel";
import type {
  AdvisorCommerceBooking,
  AdvisorCommerceSummary,
} from "@/lib/travel-advisor-commerce";

type RevenueRequest = {
  id: string;
  reference: string;
  travelerName: string;
  conversionStartedAt: string | null;
  commerceBookings: AdvisorCommerceBooking[];
  commerceSummary: AdvisorCommerceSummary;
};

type Payload = {
  requests?: RevenueRequest[];
  error?: string;
};

export function TravelAdvisorRevenueOverview() {
  const [requests, setRequests] = useState<RevenueRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/travel-advisor/requests", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok || !payload?.requests) {
        throw new Error(payload?.error || "Unable to load advisor revenue activity.");
      }
      setRequests(
        payload.requests.filter(
          (request) => request.commerceSummary?.totalBookings > 0,
        ),
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load advisor revenue activity.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo(() => {
    return requests.reduce(
      (totals, request) => ({
        bookingRequests:
          totals.bookingRequests + request.commerceSummary.totalBookings,
        paymentRequired:
          totals.paymentRequired + request.commerceSummary.paymentRequired,
        confirmed:
          totals.confirmed + request.commerceSummary.confirmedBookings,
        paidAmountCents:
          totals.paidAmountCents + request.commerceSummary.paidAmountCents,
      }),
      {
        bookingRequests: 0,
        paymentRequired: 0,
        confirmed: 0,
        paidAmountCents: 0,
      },
    );
  }, [requests]);

  return (
    <div className="space-y-4">
      <OpsSection
        eyebrow="Conversion command center"
        title="Advisor bookings & recorded revenue"
        subtitle="See which Travel Advisor proposals have entered commerce and follow them through request, review, payment, confirmation, and completed revenue."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#043331] disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh revenue
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OpsMetric
            label="Booking requests"
            value={String(metrics.bookingRequests)}
            footnote="from advisor proposals"
          />
          <OpsMetric
            label="Payment required"
            value={String(metrics.paymentRequired)}
            tone={metrics.paymentRequired ? "warning" : "default"}
            footnote="traveler action pending"
          />
          <OpsMetric
            label="Confirmed"
            value={String(metrics.confirmed)}
            tone="success"
            footnote="converted reservations"
          />
          <OpsMetric
            label="Recorded revenue"
            value={formatMoney(metrics.paidAmountCents)}
            tone="success"
            footnote="paid amount in linked bookings"
          />
        </div>

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading && requests.length === 0 ? (
          <div className="mt-4 grid min-h-32 place-items-center rounded-[24px] border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-black text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-teal-700" /> Loading booking conversion activity
            </div>
          </div>
        ) : !loading && requests.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-[#043331]">No proposal bookings yet.</p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  As travelers use Request booking from advisor proposals, their booking and payment progress will appear here automatically.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {requests.map((request) => (
              <section key={request.id} className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <OpsPill label="Travel Advisor conversion" tone="emerald" />
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        {request.reference}
                      </span>
                    </div>
                    <h3 className="mt-2 text-xl font-black tracking-[-.035em] text-[#043331]">
                      {request.travelerName}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
                    <BadgeDollarSign className="h-5 w-5" />
                    {formatMoney(request.commerceSummary.paidAmountCents)} recorded
                  </div>
                </div>

                <TravelAdvisorCommercePanel
                  bookings={request.commerceBookings}
                  summary={request.commerceSummary}
                  conversionStartedAt={request.conversionStartedAt}
                />
              </section>
            ))}
          </div>
        )}
      </OpsSection>
    </div>
  );
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
