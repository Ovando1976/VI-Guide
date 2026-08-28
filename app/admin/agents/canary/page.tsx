import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Ban,
  Bot,
  CheckCircle2,
  Database,
  Gauge,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import {
  summarizeAgentControlEvents,
  type AgentControlEventLike,
  type AgentControlSummary,
} from "@/lib/intelligence/agent-control-telemetry";
import { listRecentAgentControlEvents } from "@/lib/intelligence/agent-control-store";

export const metadata: Metadata = {
  title: "Agent Shadow Canary | USVI Explorer Admin",
  description:
    "Review privacy-minimized preview canary evidence for USVI Explorer bounded agents.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgentShadowCanaryPage() {
  const events = await listRecentAgentControlEvents(100);
  const summary = summarizeAgentControlEvents(events);
  const recent = uniqueCanaryEvents(events).slice(0, 12);
  const state = statePresentation(summary);

  return (
    <main className="min-h-screen bg-[#04151c] text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(167,139,250,.17),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,.12),transparent_32%),linear-gradient(135deg,#0a202d,#071820)] p-5 shadow-2xl shadow-black/25 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href="/admin/agents"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-cyan-100/55 hover:text-cyan-100"
              >
                <ArrowLeft size={14} /> Agent control center
              </Link>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-300 text-[#17102b]">
                  <Bot size={23} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.22em] text-violet-100/55">
                    Bounded agent operations
                  </p>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    Shadow Canary Control
                  </h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">
                Review preview-only worker and read-only broker evidence without exposing traveler messages, session identifiers, prompts, model responses, query hashes, or evidence bodies. This surface cannot promote agents or change runtime authority.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill icon={<LockKeyhole size={13} />} label="Production hard-denied" />
              <StatusPill icon={<ShieldCheck size={13} />} label="Manual promotion only" />
              <Link
                href="/admin/agents/canary"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-violet-200/20 bg-violet-300/10 px-3 text-xs font-black text-violet-100 hover:bg-violet-300/15"
              >
                <RefreshCw size={14} /> Refresh
              </Link>
            </div>
          </div>
        </header>

        <section className={`mt-5 rounded-[26px] border p-5 ${state.className}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/15">
                {state.icon}
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] opacity-60">
                  Promotion state
                </p>
                <h2 className="mt-1 text-xl font-black">{state.title}</h2>
                <p className="mt-1 max-w-3xl text-xs leading-5 opacity-65">
                  {state.detail}
                </p>
              </div>
            </div>
            <span className="rounded-full border border-current/15 bg-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[.12em]">
              no automatic promotion
            </span>
          </div>
        </section>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <MetricCard
            icon={<Activity size={17} />}
            label="Preview selected"
            value={summary.selectedRuns}
            detail={`${summary.uniqueRuns} unique runs observed`}
          />
          <MetricCard
            icon={<CheckCircle2 size={17} />}
            label="Worker complete"
            value={summary.workerCompletedRuns}
            detail={`${summary.workerFailedRuns} need review`}
          />
          <MetricCard
            icon={<Sparkles size={17} />}
            label="Model calls"
            value={summary.modelCalls}
            detail="Shadow calls only"
          />
          <MetricCard
            icon={<Database size={17} />}
            label="Broker complete"
            value={summary.brokerCompleted}
            detail={`${summary.brokerCalls} lookup attempts`}
          />
          <MetricCard
            icon={<AlertTriangle size={17} />}
            label="Broker denied/failed"
            value={summary.brokerRejected + summary.brokerFailed}
            detail={`${summary.brokerRejected} denied · ${summary.brokerFailed} failed`}
          />
          <MetricCard
            icon={<Ban size={17} />}
            label="Prod denied"
            value={summary.productionDeniedRuns}
            detail="Expected safety behavior"
          />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(380px,.65fr)]">
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[.035]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">
                  Privacy-minimized evidence
                </p>
                <h2 className="mt-1 text-xl font-black">Recent canary decisions</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black text-white/40">
                deduplicated by run
              </span>
            </div>

            {recent.length ? (
              <div className="divide-y divide-white/8">
                {recent.map((event) => (
                  <CanaryEventCard key={event.runId} event={event} />
                ))}
              </div>
            ) : (
              <div className="grid min-h-72 place-items-center px-6 text-center">
                <div>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-violet-300/10 text-violet-200">
                    <Gauge size={22} />
                  </span>
                  <h3 className="mt-4 text-xl font-black">Awaiting preview evidence</h3>
                  <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-white/45">
                    No selected shadow canary run has been recorded yet. Production remains hard-denied and the default preview sample rate remains zero.
                  </p>
                </div>
              </div>
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
              <div className="flex items-center gap-2 text-violet-200">
                <ShieldCheck size={17} />
                <h2 className="font-black">Promotion guardrails</h2>
              </div>
              <div className="mt-4 space-y-3">
                <Guardrail
                  ok
                  title="Production authority"
                  detail="Hard-denied in code. Environment flags cannot bypass the production block."
                />
                <Guardrail
                  ok={summary.workerFailedRuns === 0}
                  title="Worker reliability"
                  detail={summary.workerFailedRuns ? `${summary.workerFailedRuns} selected run(s) require review.` : "No selected worker failures are visible in this window."}
                />
                <Guardrail
                  ok={summary.brokerFailed === 0 && summary.brokerRejected === 0}
                  title="Broker policy"
                  detail={summary.brokerFailed || summary.brokerRejected ? `${summary.brokerRejected} denied and ${summary.brokerFailed} failed broker lookup(s) require review.` : "No broker rejection or failure is visible in this window."}
                />
                <Guardrail
                  ok={summary.rejectedDelegations === 0}
                  title="Capability escalation"
                  detail={summary.rejectedDelegations ? `${summary.rejectedDelegations} delegation request(s) were rejected.` : "No rejected delegation is visible in this window."}
                />
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
              <div className="flex items-center gap-2 text-cyan-200">
                <Database size={17} />
                <h2 className="font-black">Bounded counters</h2>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <MiniMetric label="Broker calls" value={summary.brokerCalls} />
                <MiniMetric label="Broker complete" value={summary.brokerCompleted} />
                <MiniMetric label="Delegations accepted" value={summary.acceptedDelegations} />
                <MiniMetric label="Delegations rejected" value={summary.rejectedDelegations} />
              </div>
              <p className="mt-4 text-[11px] leading-5 text-white/38">
                These are operational counters only. Raw prompts, responses, traveler messages, session IDs, query text, query hashes, broker evidence, credentials, and root-intent identifiers are excluded from this read model.
              </p>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function uniqueCanaryEvents(events: readonly AgentControlEventLike[]) {
  const unique = new Map<string, AgentControlEventLike>();
  for (const event of events) {
    if (!event.control.shadowCanary) continue;
    const existing = unique.get(event.runId);
    if (
      !existing ||
      new Date(event.createdAt).getTime() > new Date(existing.createdAt).getTime()
    ) {
      unique.set(event.runId, event);
    }
  }
  return Array.from(unique.values()).sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

function CanaryEventCard({ event }: { event: AgentControlEventLike }) {
  const canary = event.control.shadowCanary;
  const worker = event.control.collective?.workerShadow;
  if (!canary) return null;

  return (
    <article className="px-5 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${canary.selected ? "border-violet-300/20 bg-violet-300/10 text-violet-100" : "border-white/10 bg-white/[.04] text-white/45"}`}>
              {canary.selected ? "selected" : canary.reason.replaceAll("_", " ")}
            </span>
            <span className="text-[10px] font-black uppercase tracking-[.12em] text-white/35">
              {canary.environment}
            </span>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-white/35">
            <span>{formatDateTime(event.createdAt)}</span>
            <span>sample {canary.sampleRateBps} bps</span>
            <span>{canary.explicitCohort ? "explicit cohort" : "sampled cohort"}</span>
          </div>
        </div>
        <span className="rounded-xl border border-white/10 px-3 py-2 font-mono text-[9px] text-white/30">
          {event.runId.slice(0, 8)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniMetric label="Worker" value={worker?.status ?? "disabled"} />
        <MiniMetric label="Model calls" value={worker?.modelCalls ?? 0} />
        <MiniMetric label="Broker calls" value={worker?.brokerCalls ?? 0} />
        <MiniMetric label="Broker complete" value={worker?.brokerCompleted ?? 0} />
      </div>
    </article>
  );
}

function Guardrail({ ok, title, detail }: { ok: boolean; title: string; detail: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-white/8 bg-black/10 p-3">
      <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-xl ${ok ? "bg-emerald-300/10 text-emerald-200" : "bg-amber-300/10 text-amber-200"}`}>
        {ok ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      </span>
      <div>
        <p className="text-xs font-black text-white/70">{title}</p>
        <p className="mt-1 text-[11px] leading-5 text-white/42">{detail}</p>
      </div>
    </div>
  );
}

function statePresentation(summary: AgentControlSummary) {
  if (summary.state === "review_required") {
    return {
      title: "Hold — review required",
      detail:
        "At least one bounded worker, broker, or delegation signal needs human review before any wider preview sampling is considered.",
      className: "border-amber-300/20 bg-amber-300/[.07] text-amber-50",
      icon: <AlertTriangle size={18} />,
    };
  }
  if (summary.state === "clean_preview_evidence") {
    return {
      title: "Clean preview evidence",
      detail:
        "Selected preview runs in this window show no worker failure, broker rejection/failure, or rejected delegation. Production still remains hard-denied pending a separate review.",
      className: "border-emerald-300/20 bg-emerald-300/[.07] text-emerald-50",
      icon: <CheckCircle2 size={18} />,
    };
  }
  return {
    title: "Awaiting preview samples",
    detail:
      "The control plane is installed, but no selected preview canary run is visible in the current telemetry window. Keep production denied and broad sampling at zero.",
    className: "border-violet-300/20 bg-violet-300/[.07] text-violet-50",
    icon: <Gauge size={18} />,
  };
}

function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[.035] p-4">
      <div className="flex items-center gap-2 text-violet-200/75">
        {icon}
        <span className="text-[10px] font-black uppercase tracking-[.14em] text-white/35">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-white/32">{detail}</p>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
      <p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">{label}</p>
      <p className="mt-1 text-sm font-black capitalize text-white/65">{value}</p>
    </div>
  );
}

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-[10px] font-black text-white/45">
      {icon}
      {label}
    </span>
  );
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/St_Thomas",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}
