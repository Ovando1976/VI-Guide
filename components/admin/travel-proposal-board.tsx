"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileCheck2,
  Loader2,
  RefreshCw,
  Route,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

import { AdminShell } from "@/components/admin-shell";
import { OpsMetric, OpsPill, OpsSection } from "@/components/ops/ops-ui";
import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  travelIslandLabel,
  travelPreferenceLabel,
  type TravelRequestStatus,
} from "@/lib/travel-advisor";

type ProposalRequest = {
  id: string;
  reference: string;
  travelerName: string;
  email: string;
  island: string;
  arrival: string | null;
  departure: string | null;
  travelers: number;
  status: TravelRequestStatus;
  proposalShareId: string | null;
  proposalHref: string | null;
  proposalVersion: number;
  proposalPlanId: string | null;
  proposalTitle: string | null;
  proposalPublishedAt: string | null;
  proposalSentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ProposalDraft = { subject: string; message: string };

type ProposalPayload = {
  requests?: ProposalRequest[];
  proposal?: {
    shareId: string;
    href: string;
    title: string;
    version: number;
    stopCount: number;
    publishedAt: string;
    sentAt: string | null;
    duplicate: boolean;
    sendQueued: boolean;
    sendDuplicate: boolean;
  };
  error?: string;
};

export function TravelProposalBoard() {
  const [requests, setRequests] = useState<ProposalRequest[]>([]);
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, ProposalDraft>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<{ requestId: string; send: boolean } | null>(null);
  const [result, setResult] = useState<{
    requestId: string;
    text: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/travel-advisor/proposals", {
        cache: "no-store",
      });
      const payload = (await response.json().catch(() => null)) as ProposalPayload | null;
      if (!response.ok || !payload?.requests) {
        throw new Error(payload?.error || "Unable to load the proposal queue.");
      }
      setRequests(payload.requests);
      setDrafts((current) => {
        const next = { ...current };
        for (const request of payload.requests ?? []) {
          next[request.id] ??= defaultProposalDraft(request);
        }
        return next;
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the proposal queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const syncPlans = () => setPlans(readJourneyPlans());
    syncPlans();
    void load();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, syncPlans);
    window.addEventListener("storage", syncPlans);
    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, syncPlans);
      window.removeEventListener("storage", syncPlans);
    };
  }, [load]);

  const activeRequests = useMemo(
    () => requests.filter((request) => request.status !== "booked" && request.status !== "closed"),
    [requests],
  );
  const metrics = useMemo(
    () => ({
      active: activeRequests.length,
      journeys: plans.filter((plan) => plan.plan.length > 0).length,
      published: requests.filter((request) => Boolean(request.proposalHref)).length,
      sent: requests.filter((request) => Boolean(request.proposalSentAt)).length,
    }),
    [activeRequests.length, plans, requests],
  );

  async function publish(request: ProposalRequest, sendToTraveler: boolean) {
    if (busy) return;
    const matching = matchingPlans(request, plans);
    const selectedId =
      selectedPlans[request.id] ||
      preferredPlan(request, matching)?.id ||
      "";
    const plan = matching.find((candidate) => candidate.id === selectedId);
    if (!plan) {
      setError("Choose a saved journey with at least one stop before publishing.");
      return;
    }
    const draft = drafts[request.id] ?? defaultProposalDraft(request);
    if (sendToTraveler && (!draft.subject.trim() || !draft.message.trim())) {
      setError("Review the traveler subject and message before sending the proposal.");
      return;
    }

    setBusy({ requestId: request.id, send: sendToTraveler });
    setResult(null);
    setError(null);
    try {
      const response = await fetch(
        `/api/travel-advisor/requests/${encodeURIComponent(request.id)}/proposal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan,
            sendToTraveler,
            subject: draft.subject,
            message: draft.message,
          }),
        },
      );
      const payload = (await response.json().catch(() => null)) as ProposalPayload | null;
      if (!response.ok || !payload?.proposal) {
        throw new Error(payload?.error || "Unable to publish this proposal.");
      }

      const proposal = payload.proposal;
      setRequests((current) =>
        current.map((candidate) =>
          candidate.id === request.id
            ? {
                ...candidate,
                status: sendToTraveler ? "contacted" : candidate.status,
                proposalShareId: proposal.shareId,
                proposalHref: proposal.href,
                proposalVersion: proposal.version,
                proposalPlanId: plan.id,
                proposalTitle: proposal.title,
                proposalPublishedAt: proposal.publishedAt,
                proposalSentAt: proposal.sentAt,
              }
            : candidate,
        ),
      );
      setSelectedPlans((current) => ({ ...current, [request.id]: plan.id }));

      setResult({
        requestId: request.id,
        text: sendToTraveler
          ? proposal.sendDuplicate
            ? "This proposal was already queued for this traveler. No duplicate delivery was created."
            : "Proposal published and queued for traveler delivery."
          : proposal.duplicate
            ? "This exact proposal is already published."
            : `Proposal version ${proposal.version} published.`,
      });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to publish this proposal.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AdminShell
      eyebrow="Travel Advisor OS"
      title="Traveler proposals"
      description="Publish a privacy-safe read-only itinerary from My Trip, review the traveler message, and move the proposal into USVI Explorer's audited delivery workflow."
      actions={
        <div className="flex flex-wrap gap-2">
          <Link
            href="/planner"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#043331]"
          >
            <Route className="h-4 w-4 text-teal-700" /> Open My Trip
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#043331] px-5 text-[10px] font-black uppercase tracking-[.14em] text-white disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <OpsMetric label="Active leads" value={String(metrics.active)} footnote="eligible for proposals" />
          <OpsMetric label="Saved journeys" value={String(metrics.journeys)} tone="success" footnote="with itinerary stops" />
          <OpsMetric label="Published" value={String(metrics.published)} tone="success" footnote="read-only proposals" />
          <OpsMetric label="Sent" value={String(metrics.sent)} tone="success" footnote="traveler proposal deliveries" />
        </section>

        <OpsSection
          eyebrow="Proposal workflow"
          title="My Trip → traveler proposal"
          subtitle="Build or refine the itinerary in My Trip, select it here, publish a read-only proposal, then explicitly send it after reviewing the message."
          actions={<OpsPill label="Human reviewed" tone="teal" />}
        >
          <div className="grid gap-3 lg:grid-cols-3">
            <Guardrail
              icon={Route}
              title="Use a saved journey"
              text="Only journeys already saved in this browser's My Trip workspace are available for publishing."
            />
            <Guardrail
              icon={ShieldCheck}
              title="Public snapshot is minimized"
              text="Contact strings and external links are removed from the public proposal snapshot before it is stored."
            />
            <Guardrail
              icon={FileCheck2}
              title="Nothing is auto-confirmed"
              text="The proposal never represents availability, reservations, schedules, or pricing as confirmed until the relevant workflow confirms them."
            />
          </div>
        </OpsSection>

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-bold text-rose-700">
            {error}
          </div>
        ) : null}

        {loading && !requests.length ? (
          <div className="grid min-h-64 place-items-center rounded-[28px] border border-slate-200 bg-white">
            <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
          </div>
        ) : !activeRequests.length ? (
          <div className="rounded-[28px] border border-slate-200 bg-white p-10 text-center shadow-sm">
            <FileCheck2 className="mx-auto h-9 w-9 text-slate-300" />
            <h2 className="mt-4 text-xl font-black">No active leads need a proposal</h2>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              New, reviewing, planned, and contacted travel requests will appear here.
            </p>
          </div>
        ) : (
          <section className="space-y-4">
            {activeRequests.map((request) => {
              const matching = matchingPlans(request, plans);
              const preferred = preferredPlan(request, matching);
              const selectedId = selectedPlans[request.id] || preferred?.id || "";
              const selected = matching.find((plan) => plan.id === selectedId) ?? null;
              const draft = drafts[request.id] ?? defaultProposalDraft(request);
              const isBusy = busy?.requestId === request.id;

              return (
                <article key={request.id} className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                  <div className="grid gap-6 p-5 lg:grid-cols-[1fr_390px] lg:p-7">
                    <div>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <OpsPill label={travelPreferenceLabel(request.status)} tone={request.status === "new" ? "amber" : "teal"} />
                            {request.proposalVersion > 0 ? (
                              <OpsPill label={`Proposal v${request.proposalVersion}`} tone="emerald" />
                            ) : null}
                            <span className="font-mono text-[10px] font-bold text-slate-400">{request.reference}</span>
                          </div>
                          <h2 className="mt-3 text-2xl font-black tracking-[-.04em] text-[#043331]">{request.travelerName}</h2>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {travelIslandLabel(request.island)} · {dateRange(request.arrival, request.departure)} · {request.travelers} traveler{request.travelers === 1 ? "" : "s"}
                          </p>
                        </div>
                        {request.proposalHref ? (
                          <Link
                            href={request.proposalHref}
                            target="_blank"
                            className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 text-[9px] font-black uppercase tracking-[.13em] text-emerald-800"
                          >
                            <ExternalLink className="h-3.5 w-3.5" /> Open proposal
                          </Link>
                        ) : null}
                      </div>

                      <div className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Select saved journey</p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              {matching.length
                                ? `${matching.length} compatible journey${matching.length === 1 ? "" : "s"} available.`
                                : "No compatible saved journey has itinerary stops yet."}
                            </p>
                          </div>
                          <Route className="h-5 w-5 text-teal-700" />
                        </div>
                        {matching.length ? (
                          <select
                            value={selectedId}
                            onChange={(event) =>
                              setSelectedPlans((current) => ({ ...current, [request.id]: event.target.value }))
                            }
                            className="mt-4 min-h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-black text-[#043331] outline-none"
                          >
                            {matching.map((plan) => (
                              <option key={plan.id} value={plan.id}>
                                {plan.title} · {plan.date} · {plan.plan.length} stops
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Link
                            href="/planner"
                            className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#043331] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white"
                          >
                            <Route className="h-4 w-4" /> Build journey in My Trip
                          </Link>
                        )}

                        {selected ? (
                          <div className="mt-4 grid gap-3 sm:grid-cols-3">
                            <MiniMetric label="Island" value={travelIslandLabel(selected.island)} />
                            <MiniMetric label="Date" value={formatDate(selected.date)} />
                            <MiniMetric label="Stops" value={String(selected.plan.length)} />
                          </div>
                        ) : null}
                      </div>

                      {request.proposalPublishedAt ? (
                        <div className="mt-4 rounded-[22px] border border-emerald-200 bg-emerald-50 p-5 text-sm font-semibold text-emerald-900">
                          <div className="flex items-start gap-3">
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                            <div>
                              <p className="font-black">{request.proposalTitle || "Traveler proposal"}</p>
                              <p className="mt-1 text-xs leading-5 text-emerald-800/80">
                                Published {formatDateTime(request.proposalPublishedAt)}
                                {request.proposalSentAt ? ` · Sent ${formatDateTime(request.proposalSentAt)}` : " · Not sent yet"}
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>

                    <aside className="rounded-[24px] border border-slate-200 bg-slate-50 p-4 sm:p-5">
                      <p className="text-[9px] font-black uppercase tracking-[.15em] text-teal-700">Proposal delivery</p>
                      <label className="mt-4 block text-xs font-black text-slate-600">
                        Subject
                        <input
                          value={draft.subject}
                          maxLength={180}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [request.id]: { ...draft, subject: event.target.value },
                            }))
                          }
                          className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-[#043331] outline-none focus:border-teal-600"
                        />
                      </label>
                      <label className="mt-4 block text-xs font-black text-slate-600">
                        Traveler message
                        <textarea
                          value={draft.message}
                          maxLength={1200}
                          rows={7}
                          onChange={(event) =>
                            setDrafts((current) => ({
                              ...current,
                              [request.id]: { ...draft, message: event.target.value },
                            }))
                          }
                          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm font-semibold leading-6 text-[#043331] outline-none focus:border-teal-600"
                        />
                      </label>

                      {result?.requestId === request.id ? (
                        <p className="mt-3 flex items-start gap-2 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> {result.text}
                        </p>
                      ) : null}

                      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => void publish(request, false)}
                          disabled={!selected || Boolean(busy)}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-center text-[9px] font-black uppercase tracking-[.13em] text-[#043331] disabled:opacity-50"
                        >
                          {isBusy && !busy?.send ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4 text-teal-700" />}
                          Publish
                        </button>
                        <button
                          type="button"
                          onClick={() => void publish(request, true)}
                          disabled={!selected || Boolean(busy) || !draft.subject.trim() || !draft.message.trim()}
                          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0f766e] px-4 text-center text-[9px] font-black uppercase tracking-[.13em] text-white disabled:opacity-50"
                        >
                          {isBusy && busy?.send ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Publish & send
                        </button>
                      </div>
                      <p className="mt-3 text-[10px] font-semibold leading-5 text-slate-400">
                        “Send” queues delivery through USVI Explorer&apos;s notification outbox. If email delivery is temporarily unavailable, the outbox keeps the message pending for retry.
                      </p>
                    </aside>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </AdminShell>
  );
}

function matchingPlans(request: ProposalRequest, plans: JourneyPlan[]) {
  const withStops = plans.filter((plan) => plan.plan.length > 0);
  if (request.island === "stt" || request.island === "stj" || request.island === "stx") {
    return withStops.filter((plan) => plan.island === request.island);
  }
  return withStops;
}

function preferredPlan(request: ProposalRequest, plans: JourneyPlan[]) {
  return (
    plans.find((plan) => plan.id === request.proposalPlanId) ??
    plans[0] ??
    null
  );
}

function defaultProposalDraft(request: ProposalRequest): ProposalDraft {
  return {
    subject: `Your USVI Explorer itinerary proposal · ${request.reference}`,
    message: [
      `Hello ${request.travelerName},`,
      "",
      `Your USVI Explorer itinerary proposal for request ${request.reference} is ready to review.`,
      "",
      "The proposal is a planning draft. Availability, operating schedules, reservations, terms, and pricing remain subject to confirmation before you commit or pay.",
      "",
      "Open the proposal in USVI Explorer to review the itinerary, map the trip, and save a copy into My Trip.",
    ].join("\n"),
  };
}

function Guardrail({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof ShieldCheck;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-4">
      <Icon className="h-5 w-5 text-teal-700" />
      <p className="mt-3 text-sm font-black text-[#043331]">{title}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{text}</p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3">
      <p className="text-[8px] font-black uppercase tracking-[.13em] text-slate-400">{label}</p>
      <p className="mt-1 text-xs font-black text-[#043331]">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

function formatDateTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function dateRange(arrival: string | null, departure: string | null) {
  if (arrival && departure) return `${formatDate(arrival)} – ${formatDate(departure)}`;
  if (arrival) return `From ${formatDate(arrival)}`;
  if (departure) return `Until ${formatDate(departure)}`;
  return "Flexible dates";
}
