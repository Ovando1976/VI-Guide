"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Bot,
  CheckCircle2,
  Compass,
  History,
  Home,
  Layers3,
  Loader2,
  MapPinned,
  Navigation,
  Route,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Users,
  Waves,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import { useUnifiedWorkspace } from "@/components/workspace/unified-workspace-controller";
import { askViIntelligence } from "@/lib/intelligence/client";
import { projectIntelligenceToIslandWorkspace } from "@/lib/intelligence/island-workspace-projector";
import type {
  IntelligenceAction,
  IntelligenceIsland,
  IntelligenceResponse,
} from "@/types/intelligence";
import type {
  IslandAgentActivity,
  IslandEvidenceItem,
  IslandMissionStep,
} from "@/types/island-workspace";

const LENSES = [
  { id: "island", label: "Island", href: "/island", icon: Home },
  { id: "discover", label: "Discover", href: "/explore", icon: Compass },
  { id: "move", label: "Move", href: "/mobility", icon: Navigation },
  { id: "stay", label: "Stay", href: "/accommodations", icon: BedDouble },
  { id: "eat", label: "Eat", href: "/dining", icon: UtensilsCrossed },
  { id: "experience", label: "Experience", href: "/activities", icon: Activity },
  { id: "history", label: "History", href: "/history", icon: History },
  { id: "community", label: "Community", href: "/community", icon: Users },
] as const;

const ISLANDS: Array<{ value: IntelligenceIsland; label: string; short: string }> = [
  { value: "stt", label: "St. Thomas", short: "STT" },
  { value: "stj", label: "St. John", short: "STJ" },
  { value: "stx", label: "St. Croix", short: "STX" },
];

const STARTERS = [
  "I land at STT at 2 PM and need to reach Cruz Bay, then dinner at 7",
  "Build me a relaxed St. Thomas beach, lunch, and sunset day",
  "Show me a history-first St. Croix day with transportation between stops",
] as const;

const ALL_CAPABILITIES = [
  "recommend",
  "plan",
  "map",
  "mobility",
  "booking",
  "knowledge",
] as const;

function islandLabel(island: IntelligenceIsland) {
  return ISLANDS.find((candidate) => candidate.value === island)?.label ?? "Virgin Islands";
}

export function IslandWorkspaceShell() {
  const router = useRouter();
  const workspace = useUnifiedWorkspace();
  const island = workspace.state.island as IntelligenceIsland;
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<IntelligenceResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const projection = useMemo(
    () => (response ? projectIntelligenceToIslandWorkspace(response) : null),
    [response],
  );

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
          preferences: {
            interests: [],
            pace: "balanced",
            budget: "moderate",
            food: [],
            avoid: [],
          },
        },
        [...ALL_CAPABILITIES],
      );
      setResponse(result);
      workspace.setActivePanel("concierge");
      setDraft("");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Island could not complete this mission safely.",
      );
    } finally {
      setLoading(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(draft);
  }

  function execute(action: IntelligenceAction) {
    if (action.requiresConfirmation && confirming !== action.id) {
      setConfirming(action.id);
      return;
    }
    if (!action.href) {
      setError(
        "This governed action needs its full workflow surface before it can continue.",
      );
      return;
    }
    router.push(action.href);
  }

  return (
    <main className="min-h-screen bg-[#03141b] text-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[92px_minmax(0,1fr)]">
        <LensRail />

        <div className="min-w-0 pb-6">
          <WorkspaceHeader
            island={island}
            tripItemCount={workspace.state.tripItemCount}
          />

          <div className="mx-auto max-w-[1780px] px-3 pb-4 sm:px-5 lg:px-6">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
              <section className="min-w-0 space-y-3">
                <WorldCanvas
                  island={island}
                  projection={projection}
                  onIslandChange={(nextIsland) => workspace.setIsland(nextIsland)}
                />

                <AgentEvidenceStrip
                  evidence={projection?.evidence ?? []}
                  agents={projection?.agentActivity ?? []}
                />
              </section>

              <MissionRail
                mission={projection?.mission ?? []}
                actions={projection?.actions ?? []}
                warnings={projection?.warnings ?? []}
                tripItemCount={workspace.state.tripItemCount}
                confirming={confirming}
                onAction={execute}
              />
            </div>

            <CommandDock
              draft={draft}
              loading={loading}
              error={error}
              island={island}
              onDraftChange={setDraft}
              onSubmit={submit}
              onStarter={(prompt) => void run(prompt)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

function LensRail() {
  return (
    <aside className="sticky top-0 z-50 hidden h-screen flex-col items-center border-r border-white/8 bg-[#041d27]/95 px-2 py-4 backdrop-blur-xl lg:flex">
      <Link href="/" aria-label="USVI Explorer home" className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[.04]">
        <ViBrandMark className="h-11 w-11" priority />
      </Link>
      <nav className="mt-6 flex flex-1 flex-col gap-1.5" aria-label="Island lenses">
        {LENSES.map(({ id, label, href, icon: Icon }) => (
          <Link
            key={id}
            href={href}
            className={`group flex h-[58px] w-[68px] flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-black transition ${
              id === "island"
                ? "bg-cyan-300 text-[#04242d] shadow-[0_14px_35px_rgba(103,232,249,.18)]"
                : "text-white/42 hover:bg-white/[.06] hover:text-white/80"
            }`}
          >
            <Icon size={17} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <Link
        href="/profile"
        className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-white/45 hover:text-white"
        aria-label="Profile"
      >
        <Users size={17} />
      </Link>
    </aside>
  );
}

function WorkspaceHeader({
  island,
  tripItemCount,
}: {
  island: IntelligenceIsland;
  tripItemCount: number;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#03141b]/88 px-3 py-3 backdrop-blur-2xl sm:px-5 lg:px-6">
      <div className="mx-auto flex max-w-[1780px] items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="lg:hidden" aria-label="USVI Explorer home">
            <ViBrandMark className="h-10 w-10" priority />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/55">
              <Sparkles size={12} /> Island workspace
            </div>
            <h1 className="truncate text-lg font-black tracking-tight sm:text-xl">
              {islandLabel(island)} · live mission
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/map?island=${island}`}
            className="hidden min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-[10px] font-black text-white/60 hover:bg-white/[.08] sm:inline-flex"
          >
            <MapPinned size={14} className="text-cyan-200" /> Live map
          </Link>
          <Link
            href="/trips"
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-[10px] font-black text-white/60 hover:bg-white/[.08]"
          >
            <Route size={14} className="text-amber-200" />
            <span className="hidden sm:inline">Mission</span>
            <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[9px]">{tripItemCount}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

function WorldCanvas({
  island,
  projection,
  onIslandChange,
}: {
  island: IntelligenceIsland;
  projection: ReturnType<typeof projectIntelligenceToIslandWorkspace> | null;
  onIslandChange: (island: IntelligenceIsland) => void;
}) {
  return (
    <section className="relative isolate min-h-[560px] overflow-hidden rounded-[28px] border border-white/10 bg-[#062a35] shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:min-h-[620px] sm:rounded-[34px]">
      <Image
        src="/images/usvi-harbor-hero.jpg"
        alt="Charlotte Amalie harbor and the islands beyond"
        fill
        priority
        sizes="(min-width:1280px) 70vw, 100vw"
        className="-z-30 object-cover object-center opacity-65 saturate-[1.08]"
      />
      <div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(1,18,25,.58)_0%,rgba(2,28,37,.35)_36%,rgba(2,21,29,.91)_100%)]" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(103,232,249,.2),transparent_24rem),radial-gradient(circle_at_24%_70%,rgba(245,196,81,.15),transparent_20rem)]" />

      <div className="flex min-h-[560px] flex-col p-4 sm:min-h-[620px] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#03141b]/48 px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] text-white/65 backdrop-blur-xl">
            <Layers3 size={13} className="text-cyan-200" /> World Canvas · context stays alive
          </div>
          <div className="flex rounded-full border border-white/12 bg-[#03141b]/55 p-1 backdrop-blur-xl">
            {ISLANDS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onIslandChange(option.value)}
                className={`min-h-8 rounded-full px-3 text-[9px] font-black transition ${
                  island === option.value
                    ? "bg-cyan-200 text-[#04252e]"
                    : "text-white/48 hover:text-white"
                }`}
              >
                {option.short}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-auto grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(280px,.7fr)] lg:items-end">
          <div className="max-w-3xl">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200/75">
              {projection ? `${projection.intent.replaceAll("_", " ")} · ${projection.confidence} confidence` : "Intent-first island computing"}
            </p>
            <h2 className="mt-2 text-[clamp(2.25rem,5vw,4.7rem)] font-black leading-[.92] tracking-[-.055em]">
              {projection?.headline ?? "Tell Island what you need. The interface assembles around the mission."}
            </h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/68 sm:text-base sm:leading-7">
              {projection?.summary ?? "Map, local knowledge, trip state, transportation, stays, experiences, and governed actions now share one operating surface instead of making you hop between disconnected pages."}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={`/map?island=${island}`}
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-200 px-4 text-[10px] font-black uppercase tracking-[.11em] text-[#04242d] transition hover:bg-cyan-100"
              >
                <MapPinned size={15} /> Open live spatial layer
              </Link>
              <Link
                href="/trips"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[.07] px-4 text-[10px] font-black uppercase tracking-[.11em] text-white/75 backdrop-blur transition hover:bg-white/[.12]"
              >
                <Route size={15} /> Mission timeline
              </Link>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
            {projection?.recommendations.length ? (
              projection.recommendations.slice(0, 3).map((item) => (
                <Link
                  key={item.id}
                  href={item.mapHref ?? item.href ?? `/map?island=${item.island}`}
                  className="group rounded-[20px] border border-white/12 bg-[#03141b]/62 p-3.5 backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-[#03141b]/78"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[8px] font-black uppercase tracking-[.15em] text-cyan-100/50">{item.kind}</p>
                      <h3 className="mt-1 text-sm font-black text-white/88">{item.title}</h3>
                    </div>
                    <ArrowRight size={14} className="mt-1 text-white/30 transition group-hover:text-cyan-200" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-white/45">{item.summary}</p>
                </Link>
              ))
            ) : (
              <>
                <CanvasCapability icon={<MapPinned size={15} />} title="Spatial context" detail="Places, routes, estates and trip focus stay synchronized." />
                <CanvasCapability icon={<Navigation size={15} />} title="Governed movement" detail="Taxi, ferry and transfer decisions stay inside deterministic policy." />
                <CanvasCapability icon={<ShieldCheck size={15} />} title="Safe actions" detail="Booking and confirmation authority remains server-governed." />
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function CanvasCapability({
  icon,
  title,
  detail,
}: {
  icon: React.ReactNode;
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/12 bg-[#03141b]/60 p-3.5 backdrop-blur-xl">
      <div className="flex items-center gap-2 text-cyan-100/70">{icon}<span className="text-xs font-black">{title}</span></div>
      <p className="mt-1.5 text-[10px] leading-4 text-white/42">{detail}</p>
    </div>
  );
}

function AgentEvidenceStrip({
  evidence,
  agents,
}: {
  evidence: readonly IslandEvidenceItem[];
  agents: readonly IslandAgentActivity[];
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,.85fr)]">
      <div className="rounded-[24px] border border-white/9 bg-white/[.035] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} className="text-cyan-200" />
            <h2 className="text-sm font-black">Evidence lens</h2>
          </div>
          <span className="text-[8px] font-black uppercase tracking-[.14em] text-white/28">No hidden chain of thought</span>
        </div>
        {evidence.length ? (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {evidence.slice(0, 4).map((item) => <EvidenceCard key={item.id} item={item} />)}
          </div>
        ) : (
          <p className="mt-3 text-xs leading-5 text-white/38">Ask Island a question and this surface will show the safe operational trace: what was grounded, what stayed bounded, and what needs review.</p>
        )}
      </div>

      <div className="rounded-[24px] border border-white/9 bg-white/[.035] p-4">
        <div className="flex items-center gap-2">
          <Bot size={16} className="text-violet-200" />
          <h2 className="text-sm font-black">Agent work lens</h2>
        </div>
        {agents.length ? (
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 lg:grid lg:grid-cols-2">
            {agents.slice(0, 4).map((agent) => <AgentCard key={agent.id} agent={agent} />)}
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-white/8 bg-black/10 p-3">
            <p className="text-xs font-black text-white/65">Collective standing by</p>
            <p className="mt-1 text-[10px] leading-4 text-white/35">Specialists are recruited only after a mission requires their authorized capabilities.</p>
          </div>
        )}
      </div>
    </section>
  );
}

function EvidenceCard({ item }: { item: IslandEvidenceItem }) {
  const tone = item.status === "grounded" ? "text-emerald-200" : item.status === "review" ? "text-amber-200" : "text-cyan-200";
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
      <div className={`text-[8px] font-black uppercase tracking-[.13em] ${tone}`}>{item.status}</div>
      <p className="mt-1 text-xs font-black capitalize text-white/68">{item.label}</p>
      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{item.detail}</p>
    </div>
  );
}

function AgentCard({ agent }: { agent: IslandAgentActivity }) {
  const dot = agent.status === "completed" ? "bg-emerald-300" : agent.status === "failed" ? "bg-amber-300" : agent.status === "working" ? "bg-cyan-300" : "bg-white/25";
  return (
    <div className="min-w-[180px] rounded-2xl border border-white/8 bg-black/10 p-3">
      <div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${dot}`} /><p className="text-xs font-black text-white/68">{agent.name}</p></div>
      <p className="mt-1 text-[9px] font-semibold capitalize text-white/32">{agent.role}</p>
    </div>
  );
}

function MissionRail({
  mission,
  actions,
  warnings,
  tripItemCount,
  confirming,
  onAction,
}: {
  mission: readonly IslandMissionStep[];
  actions: readonly IntelligenceAction[];
  warnings: readonly string[];
  tripItemCount: number;
  confirming: string | null;
  onAction: (action: IntelligenceAction) => void;
}) {
  return (
    <aside className="space-y-3 xl:sticky xl:top-[76px]">
      <section className="rounded-[28px] border border-white/10 bg-[#071f29] p-4 shadow-2xl shadow-black/15 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[.17em] text-amber-200/55">Mission graph</p>
            <h2 className="mt-1 text-xl font-black">What happens next</h2>
          </div>
          <Route size={19} className="text-amber-200/70" />
        </div>

        {mission.length ? (
          <div className="mt-5 space-y-1">
            {mission.map((step, index) => <MissionStepCard key={step.id} step={step} index={index} />)}
          </div>
        ) : (
          <div className="mt-5 rounded-[22px] border border-dashed border-white/12 bg-white/[.025] p-4">
            <p className="text-sm font-black text-white/70">No active mission yet.</p>
            <p className="mt-1 text-xs leading-5 text-white/38">Ask Island for an outcome. It will turn the request into connected stops, dependencies, evidence and governed actions.</p>
            {tripItemCount ? <p className="mt-3 text-[10px] font-black text-cyan-200/65">{tripItemCount} saved trip item(s) are already available as context.</p> : null}
          </div>
        )}
      </section>

      <section className="rounded-[28px] border border-white/10 bg-[#071f29] p-4 sm:p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-emerald-200" />
          <h2 className="text-sm font-black">Governed action dock</h2>
        </div>
        <p className="mt-1 text-[10px] leading-4 text-white/35">The interface can arrange server-issued actions. It cannot invent payment, booking, fare, or execution authority.</p>

        <div className="mt-4 space-y-2">
          {actions.length ? actions.slice(0, 5).map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={() => onAction(action)}
              className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-3.5 text-left text-xs font-black transition ${
                action.requiresConfirmation
                  ? "border border-amber-200/18 bg-amber-200/[.07] text-amber-50 hover:bg-amber-200/[.11]"
                  : "border border-white/9 bg-white/[.04] text-white/68 hover:bg-white/[.08]"
              }`}
            >
              <span>{confirming === action.id ? `Confirm: ${action.label}` : action.label}</span>
              {action.requiresConfirmation ? <ShieldCheck size={14} /> : <ArrowRight size={14} />}
            </button>
          )) : (
            <div className="grid grid-cols-2 gap-2">
              <BoundaryTile icon={<Navigation size={14} />} label="Mobility" detail="Deterministic" />
              <BoundaryTile icon={<BedDouble size={14} />} label="Booking" detail="Confirm first" />
              <BoundaryTile icon={<MapPinned size={14} />} label="Map" detail="Read context" />
              <BoundaryTile icon={<ShieldCheck size={14} />} label="Money" detail="Server truth" />
            </div>
          )}
        </div>
      </section>

      {warnings.length ? (
        <section className="rounded-[24px] border border-amber-200/15 bg-amber-200/[.055] p-4">
          <div className="flex items-center gap-2 text-amber-100"><AlertTriangle size={15} /><h2 className="text-xs font-black">Needs attention</h2></div>
          <p className="mt-2 line-clamp-3 text-[10px] leading-4 text-amber-50/55">{warnings[0]}</p>
        </section>
      ) : null}
    </aside>
  );
}

function MissionStepCard({ step, index }: { step: IslandMissionStep; index: number }) {
  const statusTone = step.status === "ready" ? "bg-emerald-300 text-[#062b2a]" : step.status === "requires_confirmation" ? "bg-amber-200 text-[#382b06]" : "bg-cyan-200 text-[#052a32]";
  const body = (
    <div className="group grid grid-cols-[34px_minmax(0,1fr)] gap-3 rounded-2xl p-2.5 transition hover:bg-white/[.035]">
      <span className={`grid h-8 w-8 place-items-center rounded-xl text-[10px] font-black ${statusTone}`}>{index + 1}</span>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-black text-white/72">{step.title}</p>{step.href ? <ArrowRight size={12} className="shrink-0 text-white/25 group-hover:text-cyan-200" /> : null}</div>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-white/28">{step.meta}</p>
        <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{step.detail}</p>
      </div>
    </div>
  );
  return step.href ? <Link href={step.href}>{body}</Link> : body;
}

function BoundaryTile({ icon, label, detail }: { icon: React.ReactNode; label: string; detail: string }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-black/10 p-3">
      <div className="flex items-center gap-2 text-cyan-100/60">{icon}<span className="text-[10px] font-black">{label}</span></div>
      <p className="mt-1 text-[9px] font-semibold text-white/28">{detail}</p>
    </div>
  );
}

function CommandDock({
  draft,
  loading,
  error,
  island,
  onDraftChange,
  onSubmit,
  onStarter,
}: {
  draft: string;
  loading: boolean;
  error: string | null;
  island: IntelligenceIsland;
  onDraftChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onStarter: (prompt: string) => void;
}) {
  return (
    <section className="sticky bottom-2 z-40 mt-3 rounded-[26px] border border-white/12 bg-[#071f29]/94 p-2.5 shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:p-3">
      <div className="mb-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5">
        {STARTERS.map((prompt) => (
          <button key={prompt} type="button" onClick={() => onStarter(prompt)} disabled={loading} className="shrink-0 rounded-full border border-white/9 bg-white/[.035] px-3 py-1.5 text-[9px] font-bold text-white/42 transition hover:border-cyan-200/20 hover:text-white/70 disabled:opacity-40">{prompt}</button>
        ))}
      </div>
      <form onSubmit={onSubmit} className="flex items-center gap-2 rounded-[20px] border border-white/10 bg-[#03141b] p-1.5 pl-3">
        <Sparkles size={17} className="shrink-0 text-cyan-200" />
        <input
          value={draft}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder={`Ask Island to do something across ${islandLabel(island)}…`}
          className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25"
        />
        <button type="submit" disabled={!draft.trim() || loading} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-200 text-[#04242d] transition hover:bg-cyan-100 disabled:opacity-35" aria-label="Run Island mission">
          {loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
        </button>
      </form>
      <div className="mt-2 flex items-center justify-between gap-3 px-1">
        <p className={`text-[9px] font-semibold ${error ? "text-amber-200/75" : "text-white/25"}`}>{error ?? "One request can coordinate discovery, map context, trip planning, mobility and governed actions."}</p>
        <Link href="/search" className="hidden shrink-0 items-center gap-1.5 text-[9px] font-black text-white/30 hover:text-white/60 sm:inline-flex"><Search size={12} /> Search</Link>
      </div>
    </section>
  );
}
