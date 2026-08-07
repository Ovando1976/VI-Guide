"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeDollarSign,
  FileCheck2,
  Loader2,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

import { TravelAdvisorCommercePanel } from "@/components/admin/travel-advisor-commerce-panel";
import { OpsMetric, OpsPill, OpsSection } from "@/components/ops/ops-ui";
import type {
  AdvisorCommerceBooking,
  AdvisorCommerceSummary,
} from "@/lib/travel-advisor-commerce";
import type { TravelAdvisorConversionStage } from "@/lib/travel-advisor-conversion";

type RevenueRequest = {
  id: string;
  reference: string;
  travelerName: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  proposalSentAt: string | null;
  proposalHref: string | null;
  conversionStartedAt: string | null;
  commerceBookings: AdvisorCommerceBooking[];
  commerceSummary: AdvisorCommerceSummary;
  conversionStage: TravelAdvisorConversionStage;
  conversionStageLabel: string;
  nextAction: string;
};

type Funnel = {
  leads: number;
  proposalsSent: number;
  bookingRequests: number;
  travelersWithBookings: number;
  confirmed: number;
  travelersConfirmed: number;
  paidAmountCents: number;
  leadToProposalRate: number;
  proposalToBookingRate: number;
  bookingToConfirmationRate: number;
};

type Payload = {
  requests?: RevenueRequest[];
  funnel?: Funnel;
  error?: string;
};

const EMPTY_FUNNEL: Funnel = {
  leads: 0,
  proposalsSent: 0,
  bookingRequests: 0,
  travelersWithBookings: 0,
  confirmed: 0,
  travelersConfirmed: 0,
  paidAmountCents: 0,
  leadToProposalRate: 0,
  proposalToBookingRate: 0,
  bookingToConfirmationRate: 0,
};

export function TravelAdvisorRevenueOverview() {
  const [requests, setRequests] = useState<RevenueRequest[]>([]);
  const [funnel, setFunnel] = useState<Funnel>(EMPTY_FUNNEL);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/travel-advisor/conversion", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as Payload | null;
      if (!response.ok || !payload?.requests || !payload.funnel) {
        throw new Error(
          payload?.error || "Unable to load advisor conversion activity.",
        );
      }
      setRequests(payload.requests);
      setFunnel(payload.funnel);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to load advisor conversion activity.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const actionQueue = useMemo(
    () =>
      requests
        .filter(
          (request) =>
            request.conversionStage !== "completed" &&
            request.conversionStage !== "closed",
        )
        .slice(0, 8),
    [requests],
  );

  const bookedRequests = useMemo(
    () =>
      requests.filter((request) => request.commerceSummary.totalBookings > 0),
    [requests],
  );

  const alternativeCount = requests.filter(
    (request) => request.conversionStage === "needs_alternative",
  ).length;
  const paymentRequired = requests.reduce(
    (total, request) => total + request.commerceSummary.paymentRequired,
    0,
  );

  return (
    <div className="space-y-4">
      <OpsSection
        eyebrow="Conversion command center"
        title="Travel Advisor funnel, actions & recorded revenue"
        subtitle="Manage the full path from qualified lead to proposal, booking request, payment, provider confirmation, and completed revenue without inventing availability or financial results."
        actions={
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#043331] disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
            />
            Refresh funnel
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <OpsMetric
            label="Qualified leads"
            value={String(funnel.leads)}
            footnote={`${funnel.leadToProposalRate}% reached proposal`}
          />
          <OpsMetric
            label="Proposals sent"
            value={String(funnel.proposalsSent)}
            tone="success"
            footnote={`${funnel.proposalToBookingRate}% produced booking intent`}
          />
          <OpsMetric
            label="Booking requests"
            value={String(funnel.bookingRequests)}
            tone={paymentRequired ? "warning" : "default"}
            footnote={
              paymentRequired
                ? `${paymentRequired} waiting for payment`
                : "from advisor proposals"
            }
          />
          <OpsMetric
            label="Confirmed"
            value={String(funnel.confirmed)}
            tone="success"
            footnote={`${funnel.bookingToConfirmationRate}% traveler conversion`}
          />
          <OpsMetric
            label="Recorded revenue"
            value={formatMoney(funnel.paidAmountCents)}
            tone="success"
            footnote="verified paid amount in linked bookings"
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
              <Loader2 className="h-5 w-5 animate-spin text-teal-700" /> Loading
              conversion command center
            </div>
          </div>
        ) : !loading && requests.length === 0 ? (
          <div className="mt-4 rounded-[24px] border border-slate-200 bg-white p-6">
            <div className="flex items-start gap-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <TrendingUp className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-black text-[#043331]">
                  The funnel will populate with the first qualified request.
                </p>
                <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                  Leads, sent proposals, booking requests, payments, confirmations,
                  and recorded revenue are all measured from server-verified VI Guide
                  records.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[.16em] text-teal-700">
                    Next-action queue
                  </p>
                  <h3 className="mt-1 text-xl font-black tracking-[-.035em] text-[#043331]">
                    What should move next
                  </h3>
                  <p className="mt-1 max-w-3xl text-xs font-semibold leading-5 text-slate-500">
                    The stage is derived from the actual proposal and commerce records,
                    so the desk can prioritize work without manually reconciling systems.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OpsPill label={`${actionQueue.length} active`} tone="teal" />
                  {alternativeCount ? (
                    <OpsPill
                      label={`${alternativeCount} alternative${
                        alternativeCount === 1 ? "" : "s"
                      } needed`}
                      tone="rose"
                    />
                  ) : null}
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {actionQueue.map((request) => (
                  <article
                    key={request.id}
                    className="rounded-[20px] border border-slate-200 bg-[#fbfaf6] p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <OpsPill
                        label={request.conversionStageLabel}
                        tone={conversionTone(request.conversionStage)}
                      />
                      <span className="font-mono text-[9px] font-bold text-slate-400">
                        {request.reference}
                      </span>
                    </div>
                    <div className="mt-3 flex items-start gap-3">
                      {request.conversionStage === "needs_alternative" ? (
                        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
                      ) : (
                        <TrendingUp className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" />
                      )}
                      <div className="min-w-0">
                        <h4 className="font-black text-[#043331]">
                          {request.travelerName}
                        </h4>
                        <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
                          {request.nextAction}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {request.proposalHref ? (
                        <Link
                          href={request.proposalHref}
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-[.12em] text-[#043331]"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" /> Proposal
                        </Link>
                      ) : (
                        <Link
                          href="/admin/travel-proposals"
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 text-[9px] font-black uppercase tracking-[.12em] text-[#043331]"
                        >
                          <FileCheck2 className="h-3.5 w-3.5" /> Proposal desk
                        </Link>
                      )}
                      {request.commerceSummary.totalBookings > 0 ? (
                        <Link
                          href="/merchant/reservations"
                          className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-[#043331] px-3 text-[9px] font-black uppercase tracking-[.12em] text-white"
                        >
                          Reservation operations
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {bookedRequests.length ? (
              <div className="mt-5 space-y-5">
                {bookedRequests.map((request) => (
                  <section
                    key={request.id}
                    className="rounded-[26px] border border-slate-200 bg-white p-4 sm:p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <OpsPill
                            label={request.conversionStageLabel}
                            tone={conversionTone(request.conversionStage)}
                          />
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
            ) : null}
          </>
        )}
      </OpsSection>
    </div>
  );
}

function conversionTone(
  stage: TravelAdvisorConversionStage,
): "neutral" | "teal" | "amber" | "emerald" | "rose" {
  if (stage === "lead" || stage === "payment_required") return "amber";
  if (
    stage === "planning" ||
    stage === "proposal_sent" ||
    stage === "booking_requested"
  ) {
    return "teal";
  }
  if (stage === "paid" || stage === "confirmed" || stage === "completed") {
    return "emerald";
  }
  if (stage === "needs_alternative") return "rose";
  return "neutral";
}

function formatMoney(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}
