"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Loader2,
  MapPin,
  Navigation,
  Route,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";

import { askViIntelligence } from "@/lib/intelligence/client";
import { dispatchIntelligenceResponseMapFocus } from "@/lib/intelligence/map-focus-events";
import {
  buildJourneyMapHref,
  createJourneyPlan,
  readJourneyPlans,
  type JourneyPlan,
  upsertJourneyPlan,
} from "@/lib/journey-planner";
import {
  readSelectedTravelerTripPlanId,
  writeSelectedTravelerTripPlanId,
} from "@/lib/traveler-trip-selection";
import type {
  IntelligenceAction,
  IntelligenceIsland,
  IntelligenceResponse,
} from "@/types/intelligence";

const STARTERS = [
  "Plan a relaxed beach and lunch day on St. Thomas",
  "Book me a hotel near Sapphire Beach",
  "Arrange a taxi from the airport to Red Hook",
  "Build a cruise day with history, food, and shopping",
];

const ISLANDS: Array<{ value: IntelligenceIsland; label: string }> = [
  { value: "stt", label: "St. Thomas" },
  { value: "stj", label: "St. John" },
  { value: "stx", label: "St. Croix" },
];

function islandLabel(island: IntelligenceIsland) {
  return ISLANDS.find((option) => option.value === island)?.label ?? "Virgin Islands";
}

export function OrchestratedConciergeScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [island, setIsland] = useState<IntelligenceIsland>("stt");
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<IntelligenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState<string | null>(null);
  const [savedPlan, setSavedPlan] = useState<JourneyPlan | null>(null);

  useEffect(() => {
    const requestedIsland = searchParams.get("island");
    if (
      requestedIsland === "stt" ||
      requestedIsland === "stj" ||
      requestedIsland === "stx"
    ) {
      setIsland(requestedIsland);
    }

    const prompt = searchParams.get("prompt")?.trim();
    if (prompt) setDraft(prompt);
  }, [searchParams]);

  const workflow = response?.orchestration;
  const missing = workflow?.missingInformation ?? [];
  const ready = workflow?.status === "ready";

  const completion = useMemo(() => {
    if (!workflow?.trace.length) return 0;
    const completed = workflow.trace.filter((step) => step.status === "completed").length;
    return Math.round((completed / workflow.trace.length) * 100);
  }, [workflow]);

  async function run(prompt: string) {
    const message = prompt.trim();
    if (!message || loading) return;
    setLoading(true);
    setError(null);
    setConfirming(null);

    try {
      const result = await askViIntelligence(
        message,
        {
          page: "concierge",
          island,
          party: { adults: 1, children: 0, accessibilityNeeds: [] },
          preferences: { interests: [], pace: "balanced", budget: "moderate" },
        },
        ["recommend", "plan", "map", "mobility", "booking", "knowledge"],
      );
      setResponse(result);
      dispatchIntelligenceResponseMapFocus(result);
      setSavedPlan(null);
      setDraft("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "VI Guide Concierge could not complete this request.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(draft);
  }

  function continueWorkflow() {
    const supplied = missing
      .map((field) => `${field}: ${details[field] ?? ""}`)
      .filter((entry) => !entry.endsWith(": "));
    if (!supplied.length) return;
    void run(`Continue the previous request with ${supplied.join("; ")}.`);
  }

  function execute(action: IntelligenceAction) {
    if (action.requiresConfirmation && confirming !== action.id) {
      setConfirming(action.id);
      return;
    }
    if (action.href) router.push(action.href);
  }

  function saveConciergePlan() {
    if (!response?.plan.length) return null;
    const plans = readJourneyPlans();
    const selectedId = readSelectedTravelerTripPlanId();
    const selected = plans.find((plan) => plan.id === selectedId);
    const base =
      selected?.island === island
        ? selected
        : createJourneyPlan(island, `${islandLabel(island)} · Concierge plan`);
    const incomingIds = new Set(response.plan.map((stop) => stop.id));
    const updated: JourneyPlan = {
      ...base,
      title: base.title || `${islandLabel(island)} · Concierge plan`,
      status: ready ? "ready" : base.status,
      notes: response.answer.slice(0, 2000),
      plan: [...base.plan.filter((stop) => !incomingIds.has(stop.id)), ...response.plan],
      updatedAt: new Date().toISOString(),
    };
    upsertJourneyPlan(updated);
    writeSelectedTravelerTripPlanId(updated.id);
    setSavedPlan(updated);
    return updated;
  }

  function openSavedPlan(destination: "planner" | "map" | "mobility") {
    const plan = savedPlan ?? saveConciergePlan();
    if (!plan) return;
    if (destination === "map") {
      router.push(buildJourneyMapHref(plan));
      return;
    }
    if (destination === "mobility") {
      const params = new URLSearchParams({ island: plan.island, trip: plan.id });
      const first = plan.plan[0];
      const last = plan.plan[plan.plan.length - 1];
      if (first?.title) params.set("from", first.title);
      if (last?.title && last.id !== first?.id) params.set("to", last.title);
      router.push(`/mobility?${params.toString()}`);
      return;
    }
    router.push("/trips");
  }

  return (
    <main className="min-h-screen bg-[#041a22] text-white">
      <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.18),transparent_42%),linear-gradient(180deg,#082d38_0%,#061f28_100%)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-200/65">
                <Sparkles size={14} /> VI Guide Agent Workflow
              </div>
              <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-5xl">
                Plan, review, and execute from one conversation.
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                The Concierge now exposes its workflow state, pauses for missing information, and requires confirmation before booking actions.
              </p>
            </div>
            <Link href="/trips" className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[.06] px-4 py-3 text-sm font-black text-white/80 hover:bg-white/10">
              Open My Trip <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.65fr)] lg:px-8">
        <section className="space-y-5">
          <div className="rounded-[28px] border border-white/10 bg-white/[.035] p-4 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-[#05242c]"><Bot size={21} /></span>
              <div><h2 className="font-black">Smart Concierge</h2><p className="text-xs text-white/45">Grounded in VI Guide data</p></div>
            </div>

            <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
              {ISLANDS.map((option) => (
                <button key={option.value} type="button" onClick={() => setIsland(option.value)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition ${island === option.value ? "bg-cyan-300 text-[#05242c]" : "border border-white/10 bg-white/[.04] text-white/60"}`}>
                  {option.label}
                </button>
              ))}
            </div>

            {!response ? (
              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                {STARTERS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => void run(prompt)} className="rounded-2xl border border-white/10 bg-white/[.035] p-4 text-left text-sm font-bold leading-6 text-white/70 transition hover:border-cyan-300/30 hover:bg-cyan-300/[.06] hover:text-white">{prompt}</button>
                ))}
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                <div className="rounded-[24px] border border-cyan-200/15 bg-cyan-200/[.055] p-5">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-cyan-100/55"><span>{response.intent.replaceAll("_", " ")}</span><span>•</span><span>{response.confidence} confidence</span></div>
                  <p className="mt-3 text-sm leading-7 text-white/78">{response.answer}</p>
                </div>

                {response.plan.length ? (
                  <div className="rounded-[24px] border border-emerald-300/20 bg-emerald-300/[.055] p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-black text-emerald-100"><Route size={17} /> Your trip is ready to connect</div>
                        <p className="mt-1 text-xs leading-5 text-white/45">{response.plan.length} planned {response.plan.length === 1 ? "stop" : "stops"} can become the same trip used by My Trip, Living Map, and transportation.</p>
                      </div>
                      {savedPlan ? <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-300/15 px-3 py-2 text-[10px] font-black uppercase tracking-[.12em] text-emerald-200"><CheckCircle2 size={13} /> Saved</span> : null}
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      <button type="button" onClick={() => openSavedPlan("planner")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-emerald-200 px-4 text-xs font-black text-[#07352f] transition hover:bg-emerald-100"><Save size={15} /> {savedPlan ? "Open My Trip" : "Save to My Trip"}</button>
                      <button type="button" onClick={() => openSavedPlan("map")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 text-xs font-black text-white/75 transition hover:bg-white/10"><MapPin size={15} /> Living Map</button>
                      <button type="button" onClick={() => openSavedPlan("mobility")} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[.05] px-4 text-xs font-black text-white/75 transition hover:bg-white/10"><Navigation size={15} /> Transportation</button>
                    </div>
                  </div>
                ) : null}

                {missing.length ? (
                  <div className="rounded-[24px] border border-amber-300/20 bg-amber-300/[.06] p-5">
                    <div className="flex items-center gap-2 text-sm font-black text-amber-100"><CalendarDays size={17} /> Information needed</div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {missing.map((field) => (
                        <label key={field} className="text-xs font-bold text-white/55"><span className="mb-1.5 block capitalize">{field}</span><input type={field.includes("date") ? "date" : "text"} value={details[field] ?? ""} onChange={(event) => setDetails((current) => ({ ...current, [field]: event.target.value }))} placeholder={`Enter ${field}`} className="h-11 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none focus:border-amber-200/40" /></label>
                      ))}
                    </div>
                    <button type="button" onClick={continueWorkflow} disabled={missing.some((field) => !details[field]?.trim()) || loading} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-200 px-4 py-3 text-xs font-black text-[#3d2b03] disabled:opacity-35">Continue workflow <ArrowRight size={15} /></button>
                  </div>
                ) : null}

                {response.recommendations.length ? (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-white/40">Best matches</h3>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      {response.recommendations.slice(0, 6).map((item) => (
                        <article key={item.id} className="rounded-2xl border border-white/10 bg-white/[.035] p-4">
                          <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.14em] text-cyan-200/50">{item.kind}</p><h4 className="mt-1 font-black">{item.title}</h4></div><MapPin size={16} className="shrink-0 text-cyan-200/60" /></div>
                          <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/50">{item.summary}</p>
                          <button type="button" onClick={() => router.push(item.href ?? item.mapHref ?? "/map")} className="mt-3 text-xs font-black text-cyan-200">View details →</button>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}

                {response.actions.length ? (
                  <div>
                    <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-white/40">Available actions</h3>
                    <div className="mt-3 grid gap-2">
                      {response.actions.filter((action) => action.type !== "ask_follow_up").map((action) => {
                        const awaitingConfirmation = confirming === action.id;
                        return (
                          <button key={action.id} type="button" onClick={() => execute(action)} className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${awaitingConfirmation ? "border-amber-300/30 bg-amber-300/[.08]" : "border-white/10 bg-white/[.035] hover:border-cyan-300/25"}`}>
                            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-200">{action.type === "plan_ride" || action.type === "start_booking" ? <Navigation size={16} /> : <CheckCircle2 size={16} />}</span>
                            <span className="min-w-0 flex-1 text-sm font-black text-white/75">{awaitingConfirmation ? `Confirm: ${action.label}` : action.label}</span><ArrowRight size={15} className="text-white/25" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {error ? <div className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/[.06] p-4 text-sm text-rose-100">{error}</div> : null}

            <form onSubmit={submit} className="mt-6 flex items-end gap-2 border-t border-white/10 pt-5">
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} maxLength={3000} placeholder="Ask VI Guide to plan, search, arrange a ride, or prepare a booking…" className="min-h-14 flex-1 resize-none rounded-2xl border border-white/10 bg-white/[.045] px-4 py-3 text-sm text-white outline-none placeholder:text-white/28 focus:border-cyan-300/35" />
              <button type="submit" disabled={!draft.trim() || loading} className="grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300 text-[#05242c] disabled:opacity-35" aria-label="Send request">{loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}</button>
            </form>
          </div>
        </section>

        <aside className="space-y-5">
          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-[.16em] text-white/35">Workflow state</p><h2 className="mt-1 text-lg font-black">{loading ? "Working" : workflow?.status === "waiting_for_user" ? "Waiting for you" : ready ? "Ready" : "Not started"}</h2></div>
              <span className={`grid h-10 w-10 place-items-center rounded-2xl ${ready ? "bg-emerald-300/15 text-emerald-200" : "bg-cyan-300/10 text-cyan-200"}`}>{loading ? <Loader2 size={18} className="animate-spin" /> : ready ? <ShieldCheck size={18} /> : <CircleDot size={18} />}</span>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-300 transition-all" style={{ width: `${completion}%` }} /></div>
            <p className="mt-2 text-xs text-white/40">{completion}% of workflow nodes completed</p>
            <div className="mt-5 space-y-2">
              {workflow?.trace.map((step) => (
                <div key={`${step.node}-${step.completedAt}`} className="flex gap-3 rounded-2xl border border-white/8 bg-black/10 p-3"><span className={`mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full ${step.status === "completed" ? "bg-emerald-300" : step.status === "waiting" ? "bg-amber-300" : "bg-cyan-300"}`} /><div className="min-w-0"><p className="text-xs font-black capitalize text-white/70">{step.node}</p><p className="mt-1 text-[11px] leading-5 text-white/38">{step.detail}</p></div></div>
              )) ?? <p className="rounded-2xl border border-dashed border-white/10 p-4 text-xs leading-5 text-white/35">Submit a request to see classification, capability checks, grounding, planning, validation, and finalization.</p>}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <p className="text-[10px] font-black uppercase tracking-[.16em] text-white/35">Safety boundary</p>
            <div className="mt-3 flex gap-3"><ShieldCheck size={19} className="shrink-0 text-emerald-200" /><p className="text-xs leading-6 text-white/48">The agent can prepare plans and handoffs, but bookings and consequential actions require your explicit confirmation.</p></div>
          </section>
        </aside>
      </div>
    </main>
  );
}
