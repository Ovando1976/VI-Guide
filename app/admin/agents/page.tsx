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
  Network,
  RefreshCw,
  Route,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";

import { loadOperationsConsoleData } from "@/lib/intelligence/operations-console";

export const metadata: Metadata = {
  title: "Intelligence Operations | VI Guide Admin",
  description: "Monitor VI Guide workflows, agents, events, tools, and orchestration health.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AgentControlCenterPage() {
  const data = await loadOperationsConsoleData();

  return (
    <main className="min-h-screen bg-[#04151c] text-white">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <header className="rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,.16),transparent_34%),linear-gradient(135deg,#08232d,#061820)] p-5 shadow-2xl shadow-black/25 sm:p-7">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <Link href="/admin" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[.16em] text-cyan-100/55 hover:text-cyan-100">
                <ArrowLeft size={14} /> Admin home
              </Link>
              <div className="mt-5 flex items-center gap-3">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-[#06242b]"><Network size={23} /></span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200/55">VI Guide Intelligence</p>
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Operations Console</h1>
                </div>
              </div>
              <p className="mt-4 max-w-3xl text-sm leading-6 text-white/55">
                One operational view of workflows, event traffic, agent health, tool demand, and orchestration failures. Traveler content remains limited to bounded telemetry previews.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Pill icon={<ShieldCheck size={13} />} label="Admin-only telemetry" />
              <Pill icon={<Database size={13} />} label="Firestore-backed" />
              <Link href="/admin/agents" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-cyan-200/20 bg-cyan-300/10 px-3 text-xs font-black text-cyan-100 hover:bg-cyan-300/15">
                <RefreshCw size={14} /> Refresh
              </Link>
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <Metric icon={<Activity size={18} />} label="Recent runs" value={data.metrics.runs} detail={`${data.metrics.failedRuns} failed`} />
          <Metric icon={<Route size={18} />} label="Active workflows" value={data.metrics.activeWorkflows} detail={`${data.metrics.waitingWorkflows} waiting`} />
          <Metric icon={<Network size={18} />} label="Recent events" value={data.metrics.events} detail={`${data.metrics.failedEvents} partial or failed`} />
          <Metric icon={<Bot size={18} />} label="Healthy agents" value={data.metrics.healthyAgents} detail={`${data.agents.length} registered`} />
          <Metric icon={<Wrench size={18} />} label="Tools observed" value={data.tools.length} detail="Across recent workflows" />
          <Metric icon={<Gauge size={18} />} label="Median run" value={formatDuration(data.metrics.medianDurationMs)} detail="End-to-end orchestration" />
        </section>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.15fr_.85fr]">
          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <SectionTitle icon={<Route size={17} />} eyebrow="Durable state" title="Workflow board" />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {data.workflows.length ? data.workflows.slice(0, 12).map((workflow) => (
                <article key={workflow.id} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Status status={workflow.status} />
                      <h3 className="mt-2 text-sm font-black capitalize text-white/78">{workflow.intent.replaceAll("_", " ")}</h3>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[.12em] text-white/30">{workflow.island.toUpperCase()} · {workflow.currentStep}</p>
                    </div>
                    <span className="font-mono text-[9px] text-white/25">{workflow.id.slice(0, 8)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {workflow.toolStates.slice(0, 5).map((tool) => (
                      <span key={`${workflow.id}-${tool.toolId}`} className="rounded-full border border-white/10 px-2 py-1 text-[9px] font-bold text-white/48">{tool.toolId} · {tool.status}</span>
                    ))}
                  </div>
                  {workflow.missingInformation.length ? (
                    <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/[.06] px-3 py-2 text-[10px] leading-4 text-amber-100/70">Needs {workflow.missingInformation.join(", ")}</p>
                  ) : null}
                  <p className="mt-3 text-[9px] text-white/25">Updated {formatRelative(workflow.updatedAt)}</p>
                </article>
              )) : <Empty label="No persisted workflows yet." />}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <SectionTitle icon={<Bot size={17} />} eyebrow="Subscribers" title="Agent health" />
            <div className="mt-4 space-y-3">
              {data.agents.map((agent) => (
                <article key={agent.agentId} className="rounded-2xl border border-white/8 bg-black/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-black text-white/75">{humanize(agent.agentId)}</h3>
                      <p className="mt-1 text-[10px] text-white/30">{agent.subscriptions.length} event subscriptions</p>
                    </div>
                    <Status status={agent.health} />
                  </div>
                  <div className="mt-3 grid grid-cols-4 gap-2">
                    <Mini label="Handled" value={agent.handled} />
                    <Mini label="Done" value={agent.completed} />
                    <Mini label="Failed" value={agent.failed} />
                    <Mini label="Avg" value={formatDuration(agent.averageDurationMs)} />
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-5 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <section className="overflow-hidden rounded-[28px] border border-white/10 bg-white/[.035]">
            <div className="p-5"><SectionTitle icon={<Network size={17} />} eyebrow="Event bus" title="Recent event stream" /></div>
            <div className="divide-y divide-white/8">
              {data.events.length ? data.events.slice(0, 20).map((event) => (
                <article key={event.id} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Status status={event.status} />
                      <span className="text-xs font-black text-white/72">{event.type}</span>
                      <span className="text-[9px] font-bold uppercase tracking-[.12em] text-white/28">{event.island.toUpperCase()} · {event.intent}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {(event.agentResults as Array<{ agentId: string; status: string }>).map((result) => (
                        <span key={`${event.id}-${result.agentId}`} className="rounded-full border border-white/8 px-2 py-1 text-[9px] text-white/42">{humanize(result.agentId)} · {result.status}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <p className="text-[9px] text-white/25">{formatRelative(event.createdAt)}</p>
                    <p className="mt-1 font-mono text-[9px] text-white/20">{event.id.slice(0, 8)}</p>
                  </div>
                </article>
              )) : <Empty label="No intelligence events recorded yet." />}
            </div>
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/[.035] p-5">
            <SectionTitle icon={<Wrench size={17} />} eyebrow="Registry demand" title="Tool usage" />
            <div className="mt-4 space-y-3">
              {data.tools.length ? data.tools.slice(0, 12).map((tool) => (
                <div key={tool.toolId} className="rounded-2xl border border-white/8 bg-black/10 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-black text-white/70">{tool.toolId}</span>
                    <span className="text-[10px] font-black text-cyan-100/55">{tool.uses} uses</span>
                  </div>
                  <div className="mt-2 flex gap-3 text-[9px] font-semibold text-white/30"><span>{tool.waiting} waiting</span><span>{tool.failed} failed</span></div>
                </div>
              )) : <Empty label="Tool state will appear after workflows run." />}
            </div>
          </section>
        </div>

        <section className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-white/[.035]">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 p-5">
            <SectionTitle icon={<Sparkles size={17} />} eyebrow="Orchestration" title="Recent runs" />
            <Link href="/concierge" className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-[10px] font-black text-[#05242c]">Open Concierge <ExternalLink size={13} /></Link>
          </div>
          <div className="divide-y divide-white/8">
            {data.runs.length ? data.runs.slice(0, 15).map((run) => (
              <details key={run.id} className="group px-5 py-4 open:bg-white/[.025]">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2"><Status status={run.status} /><span className="text-xs font-black capitalize text-white/70">{run.intent.replaceAll("_", " ")}</span></div>
                      <p className="mt-2 line-clamp-2 text-sm text-white/58">{run.messagePreview || "No bounded preview available."}</p>
                    </div>
                    <div className="text-[9px] text-white/25 md:text-right"><p>{formatDuration(run.durationMs)}</p><p className="mt-1">{formatRelative(run.createdAt)}</p></div>
                  </div>
                </summary>
                <div className="mt-4 grid gap-2 border-t border-white/8 pt-4 md:grid-cols-3">
                  {run.trace.map((step, index) => (
                    <div key={`${run.id}-${step.node}-${index}`} className="rounded-xl border border-white/8 bg-black/10 p-3"><p className="text-[10px] font-black capitalize text-white/65">{step.node} · {step.status}</p><p className="mt-1 text-[10px] leading-4 text-white/35">{step.detail}</p></div>
                  ))}
                </div>
              </details>
            )) : <Empty label="No orchestration runs recorded yet." />}
          </div>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ icon, eyebrow, title }: { icon: React.ReactNode; eyebrow: string; title: string }) {
  return <div className="flex items-center gap-3"><span className="text-cyan-200">{icon}</span><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-white/30">{eyebrow}</p><h2 className="mt-1 text-lg font-black">{title}</h2></div></div>;
}
function Metric({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string | number; detail: string }) {
  return <article className="rounded-[24px] border border-white/10 bg-white/[.035] p-4"><div className="flex items-center gap-2 text-cyan-200/75">{icon}<span className="text-[9px] font-black uppercase tracking-[.14em] text-white/35">{label}</span></div><p className="mt-3 text-3xl font-black">{value}</p><p className="mt-1 text-[9px] text-white/28">{detail}</p></article>;
}
function Mini({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border border-white/8 p-2"><p className="text-[8px] font-black uppercase tracking-[.12em] text-white/25">{label}</p><p className="mt-1 text-xs font-black text-white/65">{value}</p></div>; }
function Pill({ icon, label }: { icon: React.ReactNode; label: string }) { return <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-[10px] font-black text-white/45">{icon}{label}</span>; }
function Empty({ label }: { label: string }) { return <div className="p-6 text-center text-xs text-white/35">{label}</div>; }
function Status({ status }: { status: string }) {
  const tone = status === "ready" || status === "active" || status === "completed" || status === "healthy" ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100" : status.includes("wait") || status === "processing" || status === "idle" ? "border-amber-300/20 bg-amber-300/10 text-amber-100" : "border-rose-300/20 bg-rose-300/10 text-rose-100";
  return <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[.12em] ${tone}`}>{status.replaceAll("_", " ")}</span>;
}
function humanize(value: string) { return value.replaceAll("-", " ").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()); }
function formatDuration(ms: number) { return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(ms < 10000 ? 1 : 0)}s`; }
function formatRelative(value: string) { const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return `${seconds}s ago`; if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`; return `${Math.floor(seconds / 86400)}d ago`; }
