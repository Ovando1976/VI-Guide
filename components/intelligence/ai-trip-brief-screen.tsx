"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BedDouble,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  FileText,
  LoaderCircle,
  Map,
  MapPin,
  Navigation,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  SunMedium,
} from "lucide-react";

import {
  askViIntelligence,
  getIntelligenceMemory,
  getIntelligenceSessionId,
} from "@/lib/intelligence/client";
import { readJourneyPlans } from "@/lib/journey-planner";
import type {
  IntelligenceAction,
  IntelligenceIsland,
  IntelligenceMemory,
  IntelligenceResponse,
} from "@/types/intelligence";

const ISLAND_LABELS: Record<IntelligenceIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const ACTION_IDS: Partial<Record<IntelligenceAction["type"], string>> = {
  open_map: "map.open",
  save_plan: "trip.save",
  plan_ride: "mobility.prepare",
  start_booking: "booking.prepare",
};

type ActionState = {
  status: "idle" | "confirm" | "running" | "completed" | "failed";
  message?: string;
};

export function AiTripBriefScreen() {
  const [memory, setMemory] = useState<IntelligenceMemory>({});
  const [response, setResponse] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionState, setActionState] = useState<Record<string, ActionState>>({});
  const [journeyCount, setJourneyCount] = useState(0);

  const island = response?.context.island ?? memory.preferredIsland ?? "stt";
  const workflow = response?.orchestration;
  const pendingActions = response?.actions ?? [];
  const plan = response?.plan ?? [];
  const recommendations = response?.recommendations ?? [];

  useEffect(() => {
    const currentMemory = getIntelligenceMemory();
    setMemory(currentMemory);
    setJourneyCount(readJourneyPlans().length);
    void loadWorkspace(currentMemory.preferredIsland ?? "stt");
    // The initial request is intentionally made once. It hydrates the entire workspace.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const progress = useMemo(() => {
    if (!workflow?.trace.length) return plan.length ? 70 : 15;
    const completed = workflow.trace.filter((step) => step.status === "completed").length;
    return Math.max(10, Math.round((completed / workflow.trace.length) * 100));
  }, [plan.length, workflow]);

  async function loadWorkspace(selectedIsland: IntelligenceIsland) {
    setLoading(true);
    setError(null);
    try {
      const result = await askViIntelligence(
        "Resume my active trip and give me a practical briefing for today. Include my timeline, the best next places, transportation needs, and any actions waiting for my approval.",
        { page: "concierge", island: selectedIsland },
        ["recommend", "plan", "map", "mobility", "booking", "knowledge"],
      );
      setResponse(result);
      setMemory(getIntelligenceMemory());
      setJourneyCount(readJourneyPlans().length);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "VI Guide could not load your traveler workspace.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function executeAction(action: IntelligenceAction) {
    const actionId = ACTION_IDS[action.type];
    if (!actionId) {
      if (action.href) window.location.assign(action.href);
      return;
    }

    const current = actionState[action.id]?.status ?? "idle";
    if (action.requiresConfirmation && current !== "confirm") {
      setActionState((state) => ({
        ...state,
        [action.id]: {
          status: "confirm",
          message: "Tap again to confirm this protected action.",
        },
      }));
      return;
    }

    setActionState((state) => ({
      ...state,
      [action.id]: { status: "running", message: "Executing securely…" },
    }));

    try {
      const result = await fetch("/api/intelligence/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId,
          confirmed: !action.requiresConfirmation || current === "confirm",
          context: {
            sessionId: getIntelligenceSessionId(),
            island,
            runId: response?.runId,
            workflowId: response?.orchestration?.context?.workflow?.id,
          },
          payload: {
            ...action.payload,
            href: action.href,
            label: action.label,
            plan,
          },
        }),
      });
      const payload = (await result.json().catch(() => null)) as
        | { status?: string; message?: string; output?: { href?: string } }
        | null;

      if (!result.ok || !payload || payload.status === "failed") {
        throw new Error(payload?.message ?? "The action could not be completed.");
      }

      setActionState((state) => ({
        ...state,
        [action.id]: {
          status: "completed",
          message: payload.message ?? "Action completed.",
        },
      }));

      const href = payload.output?.href ?? action.href;
      if (href && action.type !== "save_plan") window.location.assign(href);
    } catch (cause) {
      setActionState((state) => ({
        ...state,
        [action.id]: {
          status: "failed",
          message: cause instanceof Error ? cause.message : "Action failed.",
        },
      }));
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eef8f4_0%,#f8f4ea_38%,#ffffff_100%)] pb-24 text-[#073b39]">
      <section className="bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.28),transparent_28%),linear-gradient(135deg,#032d2b_0%,#075b57_62%,#139b91_100%)] px-4 pb-16 pt-6 text-white sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link href="/" className="text-sm font-black tracking-tight">VI Guide</Link>
            <div className="flex gap-2">
              <Link href="/map" className="rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.14em]">Map</Link>
              <Link href="/concierge" className="rounded-full bg-[#f5c451] px-4 py-2 text-[10px] font-black uppercase tracking-[.14em] text-[#493300]">Ask Concierge</Link>
            </div>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1.15fr_.85fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778]">
                <Sparkles size={14} /> Traveler Workspace
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-6xl">
                Your island day, in one place.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/72 sm:text-base">
                One live workspace for your plan, map, transportation, reservations, itinerary, and approvals.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-[28px] border border-white/12 bg-white/[.08] p-3 backdrop-blur">
              <Metric value={ISLAND_LABELS[island]} label="Current island" />
              <Metric value={`${progress}%`} label="Trip progress" />
              <Metric value={pendingActions.length} label="Needs attention" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto -mt-9 max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
        {loading ? <WorkspaceLoading /> : null}
        {error ? (
          <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <div className="flex items-center gap-2 font-black"><AlertCircle size={18} /> Workspace unavailable</div>
            <p className="mt-2 text-sm font-semibold">{error}</p>
            <button type="button" onClick={() => void loadWorkspace(island)} className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-700 px-4 py-2 text-xs font-black text-white"><RefreshCcw size={14} /> Try again</button>
          </div>
        ) : null}

        {response && !loading ? (
          <>
            <section className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
              <article className="overflow-hidden rounded-[30px] border border-[#d8e7e2] bg-white shadow-[0_18px_60px_rgba(4,51,49,.10)]">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#e2ebe8] p-5 sm:p-6">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-[.18em] text-[#a65d13]">Today’s briefing</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-.035em]">Good to go on {ISLAND_LABELS[island]}</h2>
                  </div>
                  <button type="button" onClick={() => void loadWorkspace(island)} className="inline-flex items-center gap-2 rounded-full border border-[#cfe0dc] px-4 py-2 text-[9px] font-black uppercase tracking-[.13em] text-[#0f766e]"><RefreshCcw size={13} /> Refresh</button>
                </div>
                <div className="p-5 sm:p-6">
                  <p className="text-sm font-semibold leading-7 text-slate-600">{response.answer}</p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    <StatusBadge icon={ShieldCheck} label={`${response.confidence} confidence`} />
                    <StatusBadge icon={Clock3} label={`${plan.length} timeline stops`} />
                    <StatusBadge icon={Compass} label={`${recommendations.length} grounded picks`} />
                  </div>
                </div>
              </article>

              <article className="rounded-[30px] bg-[#073b39] p-5 text-white shadow-[0_18px_60px_rgba(4,51,49,.16)] sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div><p className="text-[9px] font-black uppercase tracking-[.18em] text-[#f5c451]">Trip status</p><h2 className="mt-2 text-2xl font-black">{workflow?.status === "waiting_for_user" ? "Waiting on you" : "Ready for today"}</h2></div>
                  <SunMedium className="text-[#f5c451]" />
                </div>
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-[#f5c451] transition-all" style={{ width: `${progress}%` }} /></div>
                <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                  <MiniMetric value={journeyCount} label="Saved journeys" />
                  <MiniMetric value={workflow?.missingInformation.length ?? 0} label="Missing details" />
                </div>
              </article>
            </section>

            <section className="grid gap-5 xl:grid-cols-[1.05fr_.95fr]">
              <article className="overflow-hidden rounded-[30px] border border-[#d8e7e2] bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-[#e2ebe8] p-5">
                  <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e6f4ef] text-[#0f766e]"><Map size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Context map</p><h2 className="font-black">Places shaping your day</h2></div></div>
                  <Link href={`/map?island=${island}`} className="text-[9px] font-black uppercase tracking-[.13em] text-[#0f766e]">Open live map →</Link>
                </div>
                <div className="grid gap-3 p-5 sm:grid-cols-2">
                  {recommendations.slice(0, 6).map((item) => (
                    <Link key={item.id} href={item.mapHref ?? item.href ?? `/map?island=${island}`} className="group rounded-[22px] border border-[#dbe7e3] bg-[#f6faf8] p-4 transition hover:-translate-y-0.5 hover:border-[#8fc8bd] hover:shadow-md">
                      <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.13em] text-[#a65d13]">{item.kind}</p><h3 className="mt-1 font-black">{item.title}</h3></div><MapPin size={16} className="text-[#0f766e]" /></div>
                      <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{item.summary}</p>
                    </Link>
                  ))}
                  {!recommendations.length ? <EmptyInline message="No mapped recommendations are available yet. Ask Concierge to build a plan." /> : null}
                </div>
              </article>

              <article className="rounded-[30px] border border-[#d8e7e2] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#fff1d4] text-[#a65d13]"><CalendarDays size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Today</p><h2 className="font-black">Your timeline</h2></div></div>
                <div className="mt-5 space-y-3">
                  {plan.slice(0, 8).map((stop, index) => (
                    <div key={stop.id} className="flex gap-3 rounded-[20px] border border-[#e1e9e6] p-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#073b39] text-xs font-black text-white">{index + 1}</span>
                      <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-black">{stop.title}</h3><span className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">{stop.startTime ?? stop.durationMinutes ? `${stop.startTime ?? "Flexible"}${stop.durationMinutes ? ` · ${stop.durationMinutes} min` : ""}` : "Flexible"}</span></div><p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">{stop.summary}</p></div>
                    </div>
                  ))}
                  {!plan.length ? <EmptyInline message="Your timeline will appear after Concierge builds or resumes a plan." /> : null}
                </div>
              </article>
            </section>

            <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
              <article className="rounded-[30px] border border-[#d8e7e2] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e6f4ef] text-[#0f766e]"><ShieldCheck size={19} /></span><div><p className="text-[9px] font-black uppercase tracking-[.15em] text-slate-400">Action center</p><h2 className="font-black">What needs your attention</h2></div></div>
                <div className="mt-5 space-y-3">
                  {pendingActions.map((action) => {
                    const state = actionState[action.id] ?? { status: "idle" as const };
                    return (
                      <div key={action.id} className="rounded-[22px] border border-[#dfe9e6] bg-[#f8fbfa] p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div><div className="flex items-center gap-2"><h3 className="font-black">{action.label}</h3>{action.requiresConfirmation ? <span className="rounded-full bg-amber-100 px-2 py-1 text-[8px] font-black uppercase tracking-[.12em] text-amber-800">Confirm</span> : null}</div>{state.message ? <p className={`mt-1 text-xs font-semibold ${state.status === "failed" ? "text-rose-600" : state.status === "completed" ? "text-emerald-700" : "text-slate-500"}`}>{state.message}</p> : null}</div>
                          <button type="button" disabled={state.status === "running" || state.status === "completed"} onClick={() => void executeAction(action)} className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-full px-4 text-[9px] font-black uppercase tracking-[.13em] disabled:opacity-50 ${state.status === "confirm" ? "bg-amber-500 text-white" : state.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-[#073b39] text-white"}`}>
                            {state.status === "running" ? <LoaderCircle className="animate-spin" size={13} /> : state.status === "completed" ? <Check size={13} /> : <ArrowRight size={13} />}
                            {state.status === "confirm" ? "Confirm now" : state.status === "completed" ? "Completed" : "Continue"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!pendingActions.length ? <EmptyInline message="No actions require attention right now." /> : null}
                </div>
              </article>

              <div className="grid gap-5 sm:grid-cols-2">
                <WorkspaceLink icon={Navigation} title="Transportation" copy={plan.some((stop) => stop.mobility) ? "Movement is included in today’s plan." : "Review fares and prepare your next ride."} href="/mobility" label="Open mobility" />
                <WorkspaceLink icon={BedDouble} title="Reservations" copy={pendingActions.some((action) => action.type === "start_booking") ? "A booking is waiting for review." : "Browse stays and saved booking options."} href="/accommodations" label="Review stays" />
                <WorkspaceLink icon={FileText} title="Live itinerary" copy={`${plan.length} current stops and ${journeyCount} saved journeys.`} href="/planner" label="Open itinerary" />
                <WorkspaceLink icon={Sparkles} title="Concierge" copy="Change the plan, ask a follow-up, or add another island experience." href="/concierge" label="Continue planning" />
              </div>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

function WorkspaceLoading() {
  return <div className="grid min-h-[28rem] place-items-center rounded-[30px] border border-[#d8e7e2] bg-white text-center shadow-sm"><div><LoaderCircle className="mx-auto animate-spin text-[#0f766e]" size={34} /><h2 className="mt-5 text-2xl font-black">Loading your traveler workspace…</h2><p className="mt-2 text-sm font-semibold text-slate-500">Resuming your trip, timeline, map context, and pending actions.</p></div></div>;
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-[20px] bg-black/10 px-3 py-4 text-center"><div className="text-base font-black sm:text-xl">{value}</div><div className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/45">{label}</div></div>;
}

function MiniMetric({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-[18px] bg-white/8 p-3"><div className="text-xl font-black">{value}</div><div className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/45">{label}</div></div>;
}

function StatusBadge({ icon: Icon, label }: { icon: typeof Compass; label: string }) {
  return <span className="inline-flex items-center gap-2 rounded-full border border-[#dce8e4] bg-[#f7faf9] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-[#37645f]"><Icon size={13} />{label}</span>;
}

function EmptyInline({ message }: { message: string }) {
  return <div className="rounded-[20px] border border-dashed border-[#cfded9] p-5 text-center text-xs font-semibold leading-5 text-slate-500">{message}</div>;
}

function WorkspaceLink({ icon: Icon, title, copy, href, label }: { icon: typeof Compass; title: string; copy: string; href: string; label: string }) {
  return <article className="rounded-[28px] border border-[#d8e7e2] bg-white p-5 shadow-sm"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e6f4ef] text-[#0f766e]"><Icon size={19} /></span><h2 className="mt-4 text-xl font-black tracking-[-.03em]">{title}</h2><p className="mt-2 text-xs font-semibold leading-5 text-slate-500">{copy}</p><Link href={href} className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-[#0f766e]">{label}<ArrowRight size={13} /></Link></article>;
}
