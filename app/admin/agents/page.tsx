import type { Metadata } from "next";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock3,
  Database,
  ExternalLink,
  Gauge,
  Layers3,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TimerReset,
} from "lucide-react";

import {
  listRecentIntelligenceRuns,
  type IntelligenceRunRecord,
} from "@/lib/intelligence/telemetry";

export const metadata: Metadata = {
  title: "Agent Control Center | USVI Explorer Admin",
  description: "Monitor USVI Explorer intelligence workflows, traces, failures, and execution health.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgentControlCenterPage() {
  const runs = await listRecentIntelligenceRuns(60);
  const totals = summarizeRuns(runs);
  const latest = runs[0];

  return (
    <main className="min-h-screen bg-[#04151c] text-white">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.16),transparent_36%),linear-gradient(135deg,#08232d,#061820)] p-5 shadow-2xl shadow-black/25 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-cyan-100/55 hover:text-cyan-100"
              >
                <ArrowLeft size={14} /> Admin home
              </Link>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-[#06242b]">
                  <Bot size={23} />
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200/55">
                    USVI Explorer Intelligence
                  </p>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    Agent Control Center
                  </h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">
                Durable orchestration telemetry from the Concierge and every surface using the USVI Explorer intelligence API. Inspect workflow state, execution traces, missing information, and failures without exposing full traveler conversations.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <StatusPill
                icon={<Database size={13} />}
                label={`${runs.length} recent runs`}
              />
              <StatusPill
                icon={<ShieldCheck size={13} />}
                label="Bounded message previews"
              />
              <Link
                href="/admin/agents"
                className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-300/10 px-3 text-xs font-black text-cyan-100 hover:bg-cyan-300/15"
              >
                <RefreshCw size={14} /> Refresh
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            icon={<Activity size={18} />}
            label="Recorded runs"
            value={String(totals.total)}
            detail={latest ? `Latest ${formatRelative(latest.createdAt)}` : "No runs recorded yet"}
          />
          <MetricCard
            icon={<CheckCircle2 size={18} />}
            label="Ready"
            value={String(totals.ready)}
            detail={`${totals.successRate}% completion rate`}
          />
          <MetricCard
            icon={<Clock3 size={18} />}
            label="Waiting"
            value={String(totals.waiting)}
            detail="Needs traveler input"
          />
          <MetricCard
            icon={<AlertTriangle size={18} />}
            label="Failed"
            value={String(totals.failed)}
            detail={totals.failed ? "Review required" : "No failures in view"}
          />
          <MetricCard
            icon={<Gauge size={18} />}
            label="Median duration"
            value={formatDuration(totals.medianDurationMs)}
            detail={`${totals.modelRuns} model-assisted runs`}
          />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,.75fr)]">
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[.035]">
            <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">
                  Recent execution
                </p>
                <h2 className="mt-1 text-xl font-black">Workflow runs</h2>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-black text-white/40">
                Newest first
              </span>
            </div>

            {runs.length ? (
              <div className="divide-y divide-white/8">
                {runs.map((run) => (
                  <RunCard key={run.id} run={run} />
                ))}
              </div>
            ) : (
              <EmptyState />
            )}
          </section>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
              <div className="flex items-center gap-2 text-cyan-200">
                <Layers3 size={17} />
                <h2 className="font-black">Orchestration health</h2>
              </div>
              <div className="mt-4 space-y-3">
                {totals.nodeHealth.map((node) => (
                  <div key={node.name} className="rounded-2xl border border-white/8 bg-black/10 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-black capitalize text-white/70">
                        {node.name}
                      </span>
                      <span className="text-[10px] font-black text-white/35">
                        {node.completed}/{node.total}
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/8">
                      <div
                        className="h-full rounded-full bg-cyan-300"
                        style={{ width: `${node.rate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
              <div className="flex items-center gap-2 text-cyan-200">
                <Sparkles size={17} />
                <h2 className="font-black">What this captures</h2>
              </div>
              <ul className="mt-4 space-y-3 text-xs leading-5 text-white/50">
                <li>Intent routing and enabled capabilities.</li>
                <li>Grounding, planning, validation, and finalization traces.</li>
                <li>Missing information that paused a booking or mobility flow.</li>
                <li>Response confidence, recommendation and action counts.</li>
                <li>Execution duration, warnings, and bounded failure messages.</li>
              </ul>
              <Link
                href="/concierge"
                className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 text-xs font-black text-[#05242c] hover:bg-cyan-200"
              >
                Open Concierge <ExternalLink size={14} />
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function RunCard({ run }: { run: IntelligenceRunRecord }) {
  const status = statusPresentation(run.status);
  const completedSteps = run.trace.filter((step) => step.status === "completed").length;

  return (
    <details className="group px-4 py-4 open:bg-white/[.025] sm:px-5">
      <summary className="cursor-pointer list-none">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[.12em] ${status.className}`}>
                {status.label}
              </span>
              <span className="text-[10px] font-black uppercase tracking-[.12em] text-white/35">
                {run.intent.replaceAll("_", " ")} · {run.island.toUpperCase()}
              </span>
              {run.modelEnabled ? (
                <span className="rounded-full bg-violet-300/10 px-2 py-1 text-[9px] font-black text-violet-100/70">
                  model
                </span>
              ) : null}
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-white/72">
              {run.messagePreview || "No message preview available."}
            </p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-semibold text-white/32">
              <span>{formatDateTime(run.createdAt)}</span>
              <span>{formatDuration(run.durationMs)}</span>
              <span>{completedSteps}/{run.trace.length || 6} nodes</span>
              <span>{run.recommendationCount} recommendations</span>
            </div>
          </div>
          <span className="shrink-0 rounded-xl border border-white/10 px-3 py-2 font-mono text-[9px] text-white/30">
            {run.id.slice(0, 8)}
          </span>
        </div>
      </summary>

      <div className="mt-4 grid gap-4 border-t border-white/8 pt-4 lg:grid-cols-2">
        <div>
          <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-cyan-100/45">
            Execution trace
          </h3>
          <div className="mt-3 space-y-2">
            {run.trace.length ? run.trace.map((step, index) => (
              <div key={`${step.node}-${index}`} className="flex gap-3 rounded-2xl border border-white/8 bg-black/10 p-3">
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${step.status === "completed" ? "bg-emerald-300" : step.status === "waiting" ? "bg-amber-300" : "bg-rose-300"}`} />
                <div>
                  <p className="text-xs font-black capitalize text-white/70">{step.node}</p>
                  <p className="mt-1 text-[11px] leading-5 text-white/42">{step.detail}</p>
                </div>
              </div>
            )) : (
              <p className="rounded-2xl border border-white/8 p-3 text-xs text-white/40">
                The run ended before a trace was written.
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <DetailGroup label="Capabilities" values={run.requiredCapabilities} />
          <DetailGroup label="Missing information" values={run.missingInformation} warning />
          <DetailGroup label="Warnings" values={run.warnings} warning />
          {run.error ? (
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[.16em] text-rose-100/55">Failure</h3>
              <p className="mt-2 rounded-2xl border border-rose-300/15 bg-rose-300/[.06] p-3 text-xs leading-5 text-rose-50/70">
                {run.error}
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <MiniMetric label="Actions" value={run.actionCount} />
            <MiniMetric label="Confidence" value={run.confidence ?? "—"} />
          </div>
        </div>
      </div>
    </details>
  );
}

function DetailGroup({ label, values, warning = false }: { label: string; values: string[]; warning?: boolean }) {
  if (!values.length) return null;
  return (
    <div>
      <h3 className={`text-[10px] font-black uppercase tracking-[.16em] ${warning ? "text-amber-100/55" : "text-cyan-100/45"}`}>
        {label}
      </h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span key={value} className="rounded-full border border-white/10 bg-white/[.035] px-2.5 py-1.5 text-[10px] font-bold text-white/48">
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="grid min-h-80 place-items-center px-6 text-center">
      <div>
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200">
          <TimerReset size={22} />
        </span>
        <h2 className="mt-4 text-xl font-black">No runs recorded yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/45">
          Use the Concierge once after this release is deployed. The orchestration run will appear here automatically.
        </p>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[.035] p-4">
      <div className="flex items-center gap-2 text-cyan-200/75">{icon}<span className="text-[10px] font-black uppercase tracking-[.14em] text-white/35">{label}</span></div>
      <p className="mt-3 text-3xl font-black tracking-tight">{value}</p>
      <p className="mt-1 text-[10px] font-semibold text-white/32">{detail}</p>
    </article>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-2xl border border-white/8 bg-black/10 p-3"><p className="text-[9px] font-black uppercase tracking-[.14em] text-white/30">{label}</p><p className="mt-1 text-sm font-black capitalize text-white/65">{value}</p></div>;
}

function StatusPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-[10px] font-black text-white/45">{icon}{label}</span>;
}

function statusPresentation(status: IntelligenceRunRecord["status"]) {
  if (status === "ready") return { label: "Ready", className: "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" };
  if (status === "waiting_for_user") return { label: "Waiting", className: "border-amber-300/20 bg-amber-300/10 text-amber-100" };
  return { label: "Failed", className: "border-rose-300/20 bg-rose-300/10 text-rose-100" };
}

function summarizeRuns(runs: IntelligenceRunRecord[]) {
  const ready = runs.filter((run) => run.status === "ready").length;
  const waiting = runs.filter((run) => run.status === "waiting_for_user").length;
  const failed = runs.filter((run) => run.status === "failed").length;
  const durations = runs.map((run) => run.durationMs).filter((value) => value > 0).sort((a, b) => a - b);
  const medianDurationMs = durations.length ? durations[Math.floor(durations.length / 2)] : 0;
  const nodeNames = ["classify", "authorize", "ground", "plan", "validate", "finalize"];
  const nodeHealth = nodeNames.map((name) => {
    const total = runs.filter((run) => run.trace.some((step) => step.node === name)).length;
    const completed = runs.filter((run) => run.trace.some((step) => step.node === name && step.status === "completed")).length;
    return { name, total, completed, rate: total ? Math.round((completed / total) * 100) : 0 };
  });
  return {
    total: runs.length,
    ready,
    waiting,
    failed,
    medianDurationMs,
    modelRuns: runs.filter((run) => run.modelEnabled).length,
    successRate: runs.length ? Math.round((ready / runs.length) * 100) : 0,
    nodeHealth,
  };
}

function formatDuration(milliseconds: number) {
  if (!milliseconds) return "—";
  if (milliseconds < 1_000) return `${milliseconds}ms`;
  return `${(milliseconds / 1_000).toFixed(milliseconds < 10_000 ? 1 : 0)}s`;
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

function formatRelative(value: string) {
  const delta = Date.now() - new Date(value).getTime();
  if (delta < 60_000) return "just now";
  if (delta < 3_600_000) return `${Math.floor(delta / 60_000)}m ago`;
  if (delta < 86_400_000) return `${Math.floor(delta / 3_600_000)}h ago`;
  return `${Math.floor(delta / 86_400_000)}d ago`;
}
