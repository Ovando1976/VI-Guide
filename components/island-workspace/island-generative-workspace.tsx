"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity, AlertTriangle, ArrowRight, BedDouble, Bot, CheckCircle2, Compass,
  History, Home, Layers3, Loader2, MapPinned, Navigation, Route, Search, Send,
  ShieldCheck, Sparkles, UtensilsCrossed, Users, Waves,
} from "lucide-react";
import { type FormEvent, type ReactNode, useMemo, useState } from "react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import { useUnifiedWorkspace } from "@/components/workspace/unified-workspace-controller";
import { askViIntelligence } from "@/lib/intelligence/client";
import { blocksForIslandZone } from "@/lib/intelligence/island-component-registry";
import { projectIntelligenceToIslandWorkspace } from "@/lib/intelligence/island-workspace-projector";
import {
  createJourneyPlan,
  normalizeJourneyPlan,
  readJourneyPlans,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  readSelectedTravelerTripPlanId,
  writeSelectedTravelerTripPlanId,
} from "@/lib/traveler-trip-selection";
import type {
  IntelligenceAction, IntelligenceIsland, IntelligenceResponse,
} from "@/types/intelligence";
import type {
  IslandAgentActivity, IslandEvidenceItem, IslandMissionStep, IslandUIPresentationBlock,
  IslandWorkspaceProjection, IslandWorkspaceRecommendation,
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
const ALL_CAPABILITIES = ["recommend", "plan", "map", "mobility", "booking", "knowledge"] as const;

function islandLabel(island: IntelligenceIsland) {
  return ISLANDS.find((candidate) => candidate.value === island)?.label ?? "Virgin Islands";
}

export function IslandGenerativeWorkspace() {
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
    setLoading(true); setError(null); setConfirming(null);
    try {
      const result = await askViIntelligence(
        message,
        {
          page: "concierge", island,
          party: { adults: 1, children: 0, accessibilityNeeds: [] },
          preferences: { interests: [], pace: "balanced", budget: "moderate", food: [], avoid: [] },
        },
        [...ALL_CAPABILITIES],
      );
      setResponse(result); workspace.setActivePanel("concierge"); setDraft("");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Island could not complete this mission safely.");
    } finally { setLoading(false); }
  }

  function saveServerIssuedPlan(action: IntelligenceAction) {
    const rawPlan = action.payload?.plan;
    if (!Array.isArray(rawPlan)) return false;
    const selectedId = readSelectedTravelerTripPlanId();
    const selected = readJourneyPlans().find((plan) => plan.id === selectedId);
    const base = selected?.island === island
      ? selected
      : createJourneyPlan(island, `${islandLabel(island)} · Island mission`);
    const normalized = normalizeJourneyPlan({
      ...base,
      title: base.title || `${islandLabel(island)} · Island mission`,
      status: "ready",
      notes: response?.answer.slice(0, 2000) ?? base.notes,
      plan: rawPlan,
      updatedAt: new Date().toISOString(),
    });
    if (!normalized) return false;
    upsertJourneyPlan(normalized);
    writeSelectedTravelerTripPlanId(normalized.id);
    return true;
  }

  function execute(action: IntelligenceAction) {
    if (action.requiresConfirmation && confirming !== action.id) {
      setConfirming(action.id); return;
    }
    if (action.type === "save_plan") {
      if (!saveServerIssuedPlan(action)) {
        setError("Island could not validate the server-issued plan payload."); return;
      }
      setConfirming(null); router.push("/trips"); return;
    }
    if (!action.href) {
      setError("This governed action needs its full workflow surface before it can continue."); return;
    }
    router.push(action.href);
  }

  const canvasBlocks = projection ? blocksForIslandZone(projection.presentation, "canvas") : [];
  const supportBlocks = projection ? blocksForIslandZone(projection.presentation, "support") : [];
  const railBlocks = projection ? blocksForIslandZone(projection.presentation, "rail") : [];
  const context: Omit<RegistryContext, "block"> | null = projection ? {
    projection, island, onIslandChange: workspace.setIsland,
    tripItemCount: workspace.state.tripItemCount, confirming, onAction: execute,
  } : null;

  return (
    <main className="min-h-screen bg-[#03141b] text-white">
      <div className="min-h-screen lg:grid lg:grid-cols-[92px_minmax(0,1fr)]">
        <LensRail />
        <div className="min-w-0 pb-6">
          <WorkspaceHeader island={island} tripItemCount={workspace.state.tripItemCount} projection={projection} />
          <div className="mx-auto max-w-[1780px] px-3 pb-4 sm:px-5 lg:px-6">
            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_390px] xl:items-start">
              <section className="min-w-0 space-y-3">
                {!context ? <WorldCanvas island={island} projection={null} onIslandChange={workspace.setIsland} /> : canvasBlocks.map((block) => <RegistryBlock key={block.id} block={block} {...context} />)}
                {context && supportBlocks.length ? <section className="grid gap-3 lg:grid-cols-2">{supportBlocks.map((block) => <RegistryBlock key={block.id} block={block} {...context} />)}</section> : null}
              </section>
              <aside className="space-y-3 xl:sticky xl:top-[76px]">
                {context && railBlocks.length ? railBlocks.map((block) => <RegistryBlock key={block.id} block={block} {...context} />) : <MissionTimeline mission={[]} tripItemCount={workspace.state.tripItemCount} />}
              </aside>
            </div>
            <CommandDock
              draft={draft} loading={loading} error={error} island={island}
              onDraftChange={setDraft}
              onSubmit={(event) => { event.preventDefault(); void run(draft); }}
              onStarter={(prompt) => void run(prompt)}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

type RegistryContext = {
  block: IslandUIPresentationBlock;
  projection: IslandWorkspaceProjection;
  island: IntelligenceIsland;
  onIslandChange: (island: IntelligenceIsland) => void;
  tripItemCount: number;
  confirming: string | null;
  onAction: (action: IntelligenceAction) => void;
};

const REGISTRY: Readonly<Record<IslandUIPresentationBlock["component"], (ctx: RegistryContext) => ReactNode>> = {
  WorldCanvas: ({ projection, island, onIslandChange }) => <WorldCanvas island={island} projection={projection} onIslandChange={onIslandChange} />,
  RecommendationDeck: ({ projection, block }) => <RecommendationDeck recommendations={selectRecommendations(projection, block)} variant={block.variant} />,
  EvidenceStrip: ({ projection }) => <EvidencePanel evidence={projection.evidence} />,
  AgentActivity: ({ projection }) => <AgentPanel agents={projection.agentActivity} />,
  MissionTimeline: ({ projection, tripItemCount }) => <MissionTimeline mission={projection.mission} tripItemCount={tripItemCount} />,
  WarningPanel: ({ projection }) => <WarningPanel warnings={projection.warnings} />,
  ConfirmationCard: ({ projection, confirming, onAction }) => <ConfirmationPanel actions={projection.actions.filter((action) => action.requiresConfirmation)} confirming={confirming} onAction={onAction} />,
  ActionDock: ({ projection, confirming, onAction }) => <ActionDock actions={projection.actions} confirming={confirming} onAction={onAction} />,
};
function RegistryBlock(ctx: RegistryContext) { return <>{REGISTRY[ctx.block.component](ctx)}</>; }
function selectRecommendations(projection: IslandWorkspaceProjection, block: IslandUIPresentationBlock) {
  if (!block.bindingIds.length) return projection.recommendations;
  const wanted = new Set(block.bindingIds);
  return projection.recommendations.filter((item) => wanted.has(item.id));
}

function LensRail() {
  return <aside className="sticky top-0 z-50 hidden h-screen flex-col items-center border-r border-white/8 bg-[#041d27]/95 px-2 py-4 backdrop-blur-xl lg:flex">
    <Link href="/" aria-label="USVI Explorer home" className="grid h-14 w-14 place-items-center rounded-2xl bg-white/[.04]"><ViBrandMark className="h-11 w-11" priority /></Link>
    <nav className="mt-6 flex flex-1 flex-col gap-1.5" aria-label="Island lenses">{LENSES.map(({ id, label, href, icon: Icon }) => <Link key={id} href={href} className={`flex h-[58px] w-[68px] flex-col items-center justify-center gap-1 rounded-2xl text-[9px] font-black transition ${id === "island" ? "bg-cyan-300 text-[#04242d]" : "text-white/42 hover:bg-white/[.06] hover:text-white/80"}`}><Icon size={17} /><span>{label}</span></Link>)}</nav>
    <Link href="/profile" className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[.04] text-white/45" aria-label="Profile"><Users size={17} /></Link>
  </aside>;
}

function WorkspaceHeader({ island, tripItemCount, projection }: { island: IntelligenceIsland; tripItemCount: number; projection: IslandWorkspaceProjection | null }) {
  return <header className="sticky top-0 z-40 border-b border-white/8 bg-[#03141b]/88 px-3 py-3 backdrop-blur-2xl sm:px-5 lg:px-6"><div className="mx-auto flex max-w-[1780px] items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Link href="/" className="lg:hidden" aria-label="USVI Explorer home"><ViBrandMark className="h-10 w-10" priority /></Link><div className="min-w-0"><div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/55"><Sparkles size={12} /> Generative Island workspace</div><h1 className="truncate text-lg font-black tracking-tight sm:text-xl">{islandLabel(island)} · {projection?.presentation.mode ?? "live mission"}</h1></div></div><div className="flex items-center gap-2">{projection ? <span className="hidden rounded-full border border-emerald-200/15 bg-emerald-200/[.06] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-emerald-100/70 sm:inline-flex">{projection.presentation.blocks.length} trusted UI blocks</span> : null}<Link href="/trips" className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 text-[10px] font-black text-white/60"><Route size={14} className="text-amber-200" /><span className="hidden sm:inline">Mission</span><span>{tripItemCount}</span></Link></div></div></header>;
}

function WorldCanvas({ island, projection, onIslandChange }: { island: IntelligenceIsland; projection: IslandWorkspaceProjection | null; onIslandChange: (island: IntelligenceIsland) => void }) {
  const image = projection?.recommendations[0]?.image ?? { src: "/images/usvi-harbor-hero.jpg", alt: "Charlotte Amalie harbor and the hills of St. Thomas", status: "context" as const };
  return <section className="relative isolate min-h-[560px] overflow-hidden rounded-[30px] border border-white/10 bg-[#062a35] shadow-[0_30px_90px_rgba(0,0,0,.28)] sm:min-h-[620px]"><Image src={image.src} alt={image.alt} fill priority sizes="(min-width:1280px) 70vw, 100vw" className="-z-30 object-cover object-center opacity-65 saturate-[1.08]" /><div className="absolute inset-0 -z-20 bg-[linear-gradient(180deg,rgba(1,18,25,.62)_0%,rgba(2,28,37,.38)_40%,rgba(2,21,29,.94)_100%)]" /><div className="flex min-h-[560px] flex-col p-4 sm:min-h-[620px] sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#03141b]/55 px-3 py-2 text-[9px] font-black uppercase tracking-[.15em] text-white/65 backdrop-blur-xl"><Layers3 size={13} className="text-cyan-200" /> World Canvas · trusted bindings</div><div className="flex rounded-full border border-white/12 bg-[#03141b]/60 p-1 backdrop-blur-xl">{ISLANDS.map((option) => <button key={option.value} type="button" onClick={() => onIslandChange(option.value)} className={`min-h-8 rounded-full px-3 text-[9px] font-black ${island === option.value ? "bg-cyan-200 text-[#04252e]" : "text-white/48"}`}>{option.short}</button>)}</div></div><div className="mt-auto max-w-4xl"><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-200/75">{projection ? `${projection.intent.replaceAll("_", " ")} · ${projection.confidence} confidence · ${projection.presentation.focus} focus` : "Intent-first island computing"}</p><h2 className="mt-2 text-[clamp(2.25rem,5vw,4.7rem)] font-black leading-[.92] tracking-[-.055em]">{projection?.headline ?? "Tell Island what needs to happen. The interface assembles itself around the mission."}</h2><p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-white/68">{projection?.summary ?? "Map, local knowledge, trip state, mobility, experiences, and governed actions now operate on one synchronized mission."}</p><div className="mt-5 flex flex-wrap gap-2"><Link href={`/map?island=${island}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-cyan-200 px-4 text-[10px] font-black uppercase tracking-[.11em] text-[#04242d]"><MapPinned size={15} /> Live spatial layer</Link><Link href="/trips" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[.07] px-4 text-[10px] font-black uppercase tracking-[.11em] text-white/75 backdrop-blur"><Route size={15} /> Mission timeline</Link></div></div></div></section>;
}

function RecommendationDeck({ recommendations, variant }: { recommendations: readonly IslandWorkspaceRecommendation[]; variant: IslandUIPresentationBlock["variant"] }) {
  if (!recommendations.length) return null;
  return <section className="rounded-[28px] border border-white/9 bg-white/[.035] p-4 sm:p-5"><div className="flex items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-200/50">Trusted recommendation deck</p><h2 className="mt-1 text-xl font-black">Grounded places with image provenance</h2></div><span className="text-[9px] font-black text-white/28">{recommendations.length} bound records</span></div><div className={`mt-4 grid gap-3 ${variant === "compact" ? "sm:grid-cols-3" : "sm:grid-cols-2 xl:grid-cols-3"}`}>{recommendations.map((item) => <RecommendationCard key={item.id} item={item} />)}</div></section>;
}
function RecommendationCard({ item }: { item: IslandWorkspaceRecommendation }) {
  return <Link href={item.mapHref ?? item.href ?? `/map?island=${item.island}`} className="group overflow-hidden rounded-[22px] border border-white/9 bg-[#071f29] transition hover:-translate-y-0.5 hover:border-cyan-200/25"><div className="relative aspect-[16/10] overflow-hidden bg-black/20"><Image src={item.image.src} alt={item.image.alt} fill sizes="(min-width:1280px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover transition duration-500 group-hover:scale-[1.025]" /><span className="absolute left-2 top-2 rounded-full bg-[#03141b]/78 px-2 py-1 text-[8px] font-black uppercase tracking-[.11em] text-white/70 backdrop-blur">{item.image.status === "context" ? "Island context" : `${item.image.status} image`}</span></div><div className="p-3.5"><div className="flex items-start justify-between gap-3"><div><p className="text-[8px] font-black uppercase tracking-[.14em] text-cyan-200/45">{item.kind}</p><h3 className="mt-1 text-sm font-black text-white/85">{item.title}</h3></div><ArrowRight size={14} className="mt-1 text-white/25 group-hover:text-cyan-200" /></div><p className="mt-2 line-clamp-2 text-[10px] leading-4 text-white/40">{item.summary}</p><div className="mt-3 flex items-center justify-between gap-2 border-t border-white/7 pt-2 text-[8px] font-bold text-white/25"><span>{item.provenance.sourceSystem}</span><span>{item.provenance.reviewStatus}</span></div></div></Link>;
}

function MissionTimeline({ mission, tripItemCount }: { mission: readonly IslandMissionStep[]; tripItemCount: number }) {
  return <section className="rounded-[28px] border border-white/10 bg-[#071f29] p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.17em] text-amber-200/55">Mission timeline</p><h2 className="mt-1 text-xl font-black">What happens next</h2></div><Route size={19} className="text-amber-200/70" /></div>{mission.length ? <div className="mt-5 space-y-2">{mission.map((step, index) => <MissionStepCard key={step.id} step={step} index={index} />)}</div> : <div className="mt-5 rounded-[22px] border border-dashed border-white/12 bg-white/[.025] p-4"><p className="text-sm font-black text-white/70">No active mission yet.</p><p className="mt-1 text-xs leading-5 text-white/38">Ask Island for an outcome and the mission graph will assemble here.</p>{tripItemCount ? <p className="mt-3 text-[10px] font-black text-cyan-200/65">{tripItemCount} saved trip item(s) are already available as context.</p> : null}</div>}</section>;
}
function MissionStepCard({ step, index }: { step: IslandMissionStep; index: number }) {
  const body = <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 rounded-2xl border border-white/7 bg-black/10 p-2.5"><div className="relative h-12 w-12 overflow-hidden rounded-xl"><Image src={step.image.src} alt={step.image.alt} fill sizes="48px" className="object-cover" /><span className="absolute bottom-0 right-0 grid h-5 w-5 place-items-center rounded-tl-lg bg-[#03141b] text-[8px] font-black text-white">{index + 1}</span></div><div className="min-w-0"><div className="flex items-center justify-between gap-2"><p className="truncate text-xs font-black text-white/72">{step.title}</p>{step.href ? <ArrowRight size={12} className="text-white/25" /> : null}</div><p className="mt-0.5 text-[9px] font-bold uppercase tracking-[.1em] text-white/28">{step.meta}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{step.detail}</p></div></div>;
  return step.href ? <Link href={step.href}>{body}</Link> : body;
}

function EvidencePanel({ evidence }: { evidence: readonly IslandEvidenceItem[] }) { return <Panel icon={<ShieldCheck size={16} className="text-cyan-200" />} title="Evidence lens" subtitle="Safe operational trace only">{evidence.length ? <div className="mt-3 grid gap-2">{evidence.slice(0, 4).map((item) => <div key={item.id} className="rounded-2xl border border-white/8 bg-black/10 p-3"><p className="text-[8px] font-black uppercase tracking-[.13em] text-cyan-200/70">{item.status}</p><p className="mt-1 text-xs font-black capitalize text-white/68">{item.label}</p><p className="mt-1 line-clamp-2 text-[10px] leading-4 text-white/35">{item.detail}</p></div>)}</div> : <EmptyText>Evidence appears after Island runs a mission.</EmptyText>}</Panel>; }
function AgentPanel({ agents }: { agents: readonly IslandAgentActivity[] }) { return <Panel icon={<Bot size={16} className="text-violet-200" />} title="Agent work lens" subtitle="Bounded specialists">{agents.length ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{agents.slice(0, 6).map((agent) => <div key={agent.id} className="rounded-2xl border border-white/8 bg-black/10 p-3"><div className="flex items-center gap-2"><span className={`h-2 w-2 rounded-full ${agent.status === "completed" ? "bg-emerald-300" : agent.status === "failed" ? "bg-amber-300" : agent.status === "working" ? "bg-cyan-300" : "bg-white/25"}`} /><p className="text-xs font-black text-white/68">{agent.name}</p></div><p className="mt-1 text-[9px] text-white/32">{agent.role}</p></div>)}</div> : <EmptyText>Specialists are recruited only when the mission needs their authorized capabilities.</EmptyText>}</Panel>; }
function WarningPanel({ warnings }: { warnings: readonly string[] }) { if (!warnings.length) return null; return <section className="rounded-[24px] border border-amber-200/15 bg-amber-200/[.055] p-4"><div className="flex items-center gap-2 text-amber-100"><AlertTriangle size={15} /><h2 className="text-xs font-black">Needs attention</h2></div><div className="mt-2 space-y-2">{warnings.slice(0, 3).map((warning) => <p key={warning} className="text-[10px] leading-4 text-amber-50/60">{warning}</p>)}</div></section>; }
function ConfirmationPanel({ actions, confirming, onAction }: { actions: readonly IntelligenceAction[]; confirming: string | null; onAction: (action: IntelligenceAction) => void }) { if (!actions.length) return null; return <section className="rounded-[24px] border border-amber-200/18 bg-amber-200/[.065] p-4"><div className="flex items-center gap-2 text-amber-100"><ShieldCheck size={15} /><h2 className="text-xs font-black">Your confirmation is required</h2></div><p className="mt-1 text-[10px] leading-4 text-amber-50/45">Island cannot promote these actions to execution by itself.</p><div className="mt-3 space-y-2">{actions.map((action) => <button key={action.id} type="button" onClick={() => onAction(action)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-amber-100 px-3 text-left text-[10px] font-black text-[#3a2a05]"><span>{confirming === action.id ? `Confirm: ${action.label}` : action.label}</span><CheckCircle2 size={14} /></button>)}</div></section>; }
function ActionDock({ actions, confirming, onAction }: { actions: readonly IntelligenceAction[]; confirming: string | null; onAction: (action: IntelligenceAction) => void }) { return <section className="rounded-[28px] border border-white/10 bg-[#071f29] p-4 sm:p-5"><div className="flex items-center gap-2"><ShieldCheck size={16} className="text-emerald-200" /><h2 className="text-sm font-black">Governed action dock</h2></div><p className="mt-1 text-[10px] leading-4 text-white/35">Only exact server-issued actions can appear here.</p><div className="mt-4 space-y-2">{actions.length ? actions.slice(0, 6).map((action) => <button key={action.id} type="button" onClick={() => onAction(action)} className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl px-3.5 text-left text-xs font-black ${action.requiresConfirmation ? "border border-amber-200/18 bg-amber-200/[.07] text-amber-50" : "border border-white/9 bg-white/[.04] text-white/68"}`}><span>{confirming === action.id ? `Confirm: ${action.label}` : action.label}</span>{action.requiresConfirmation ? <ShieldCheck size={14} /> : <ArrowRight size={14} />}</button>) : <div className="grid grid-cols-2 gap-2"><BoundaryTile icon={<Navigation size={14} />} label="Mobility" detail="Deterministic" /><BoundaryTile icon={<BedDouble size={14} />} label="Booking" detail="Governed" /><BoundaryTile icon={<MapPinned size={14} />} label="Map" detail="Read context" /><BoundaryTile icon={<ShieldCheck size={14} />} label="Money" detail="Server truth" /></div>}</div></section>; }
function Panel({ icon, title, subtitle, children }: { icon: ReactNode; title: string; subtitle: string; children: ReactNode }) { return <section className="rounded-[24px] border border-white/9 bg-white/[.035] p-4"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2">{icon}<h2 className="text-sm font-black">{title}</h2></div><span className="text-[8px] font-black uppercase tracking-[.12em] text-white/28">{subtitle}</span></div>{children}</section>; }
function EmptyText({ children }: { children: ReactNode }) { return <p className="mt-3 text-xs leading-5 text-white/38">{children}</p>; }
function BoundaryTile({ icon, label, detail }: { icon: ReactNode; label: string; detail: string }) { return <div className="rounded-2xl border border-white/8 bg-black/10 p-3"><div className="flex items-center gap-2 text-cyan-100/60">{icon}<span className="text-[10px] font-black">{label}</span></div><p className="mt-1 text-[9px] font-semibold text-white/28">{detail}</p></div>; }
function CommandDock({ draft, loading, error, island, onDraftChange, onSubmit, onStarter }: { draft: string; loading: boolean; error: string | null; island: IntelligenceIsland; onDraftChange: (value: string) => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void; onStarter: (prompt: string) => void }) { return <section className="sticky bottom-2 z-40 mt-3 rounded-[26px] border border-white/12 bg-[#071f29]/94 p-2.5 shadow-[0_28px_90px_rgba(0,0,0,.48)] backdrop-blur-2xl sm:p-3"><div className="mb-2 flex gap-1.5 overflow-x-auto px-1 pb-0.5">{STARTERS.map((prompt) => <button key={prompt} type="button" onClick={() => onStarter(prompt)} disabled={loading} className="shrink-0 rounded-full border border-white/9 bg-white/[.035] px-3 py-1.5 text-[9px] font-bold text-white/42 disabled:opacity-40">{prompt}</button>)}</div><form onSubmit={onSubmit} className="flex items-center gap-2 rounded-[20px] border border-white/10 bg-[#03141b] p-1.5 pl-3"><Sparkles size={17} className="shrink-0 text-cyan-200" /><input value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder={`Ask Island to do something across ${islandLabel(island)}…`} className="h-11 min-w-0 flex-1 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-white/25" /><button type="submit" disabled={!draft.trim() || loading} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cyan-200 text-[#04242d] disabled:opacity-35" aria-label="Run Island mission">{loading ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}</button></form><div className="mt-2 flex items-center justify-between gap-3 px-1"><p className={`text-[9px] font-semibold ${error ? "text-amber-200/75" : "text-white/25"}`}>{error ?? "The model composes trusted UI blocks; data, images, fares, bookings and actions remain application-owned."}</p><Link href="/search" className="hidden shrink-0 items-center gap-1.5 text-[9px] font-black text-white/30 sm:inline-flex"><Search size={12} /> Search</Link></div></section>; }
