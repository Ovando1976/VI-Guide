"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  Check,
  CloudSun,
  Compass,
  LoaderCircle,
  Map,
  RefreshCcw,
  Route,
  Sparkles,
  UserRound,
} from "lucide-react";

import { StructuredPlanRenderer } from "@/components/intelligence/structured-plan-renderer";
import { askViIntelligence, getIntelligenceMemory } from "@/lib/intelligence/client";
import { createJourneyPlan, readJourneyPlans, upsertJourneyPlan } from "@/lib/journey-planner";
import type { IntelligenceIsland, IntelligenceMemory, IntelligenceResponse } from "@/types/intelligence";

const ISLAND_LABELS: Record<IntelligenceIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const BRIEFS = [
  { label: "Best day for me", prompt: "Build the best practical full-day itinerary for me today." },
  { label: "Cruise-safe day", prompt: "Build a cruise-safe day with realistic timing and a comfortable return buffer." },
  { label: "Rain-ready day", prompt: "Build a rain-resilient island day with strong indoor alternatives." },
] as const;

export function AiTripBriefScreen() {
  const [memory, setMemory] = useState<IntelligenceMemory>({});
  const [response, setResponse] = useState<IntelligenceResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [journeyCount, setJourneyCount] = useState(0);

  useEffect(() => {
    setMemory(getIntelligenceMemory());
    setJourneyCount(readJourneyPlans().length);
  }, []);

  const island = memory.preferredIsland ?? "stt";
  const profileSignals = [
    memory.preferredIsland,
    memory.party,
    memory.preferences,
    memory.cruise,
    memory.stay,
  ].filter(Boolean).length;

  async function buildBrief(prompt: string) {
    setLoading(true);
    setError(null);
    setResponse(null);
    setSaved(false);
    try {
      const result = await askViIntelligence(prompt, {
        page: "concierge",
        island,
      }, ["recommend", "plan", "map", "mobility", "booking", "knowledge"]);
      setResponse(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "VI Guide could not build your trip brief.");
    } finally {
      setLoading(false);
    }
  }

  function saveBrief() {
    if (!response?.plan.length) return;
    const journey = createJourneyPlan(island, `${ISLAND_LABELS[island]} · AI day plan`);
    upsertJourneyPlan({
      ...journey,
      status: "ready",
      plan: response.plan,
      notes: `Personalized by VI Guide Intelligence. ${response.answer}`.slice(0, 2000),
    });
    setJourneyCount(readJourneyPlans().length);
    setSaved(true);
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,.18),transparent_30%),linear-gradient(180deg,#f8f4ea_0%,#fff_52%,#edf6f2_100%)] px-4 py-6 text-[#043331] sm:px-6 lg:py-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[38px] bg-[linear-gradient(135deg,#032d2b_0%,#075b57_54%,#16a69c_100%)] p-6 text-white shadow-[0_28px_90px_rgba(4,51,49,.24)] sm:p-9 lg:p-11">
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.1fr_.9fr] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.2em] text-[#f7d778]">
                <Sparkles size={14} /> Personalized trip intelligence
              </div>
              <h1 className="mt-5 max-w-3xl text-4xl font-black tracking-[-.055em] sm:text-5xl lg:text-6xl">
                Your island day, planned around you.
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-semibold leading-6 text-white/70 sm:text-base">
                VI Guide combines your traveler profile with grounded island places, timing, transportation, and booking actions.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {BRIEFS.map((brief) => (
                  <button key={brief.label} type="button" disabled={loading} onClick={() => buildBrief(brief.prompt)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#4c3500] shadow-lg disabled:opacity-60">
                    {loading ? <LoaderCircle className="animate-spin" size={15} /> : <Sparkles size={15} />}{brief.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-[28px] border border-white/12 bg-white/[.08] p-3 backdrop-blur">
              <Metric value={ISLAND_LABELS[island]} label="Island" />
              <Metric value={profileSignals} label="Profile signals" />
              <Metric value={journeyCount} label="Saved journeys" />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_20rem]">
          <div className="min-h-[28rem] overflow-hidden rounded-[32px] bg-[#062f32] p-5 text-white shadow-xl sm:p-7">
            {loading ? (
              <div className="grid min-h-[24rem] place-items-center text-center"><div><LoaderCircle className="mx-auto animate-spin text-cyan-200" size={34} /><h2 className="mt-5 text-2xl font-black">Building your grounded day…</h2><p className="mt-2 text-sm font-semibold text-white/55">Matching your profile to places, timing, and movement.</p></div></div>
            ) : response ? (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-5">
                  <div><div className="text-[9px] font-black uppercase tracking-[.18em] text-cyan-200/60">Your AI trip brief</div><p className="mt-3 max-w-3xl text-sm font-semibold leading-6 text-white/72">{response.answer}</p></div>
                  <button type="button" onClick={() => buildBrief("Improve this plan with a different mix of places while preserving my preferences and practical timing.")} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-[9px] font-black uppercase tracking-[.14em] text-white/70"><RefreshCcw size={13} /> Regenerate</button>
                </div>
                <div className="mt-5"><StructuredPlanRenderer response={response} /></div>
                {response.plan.length ? <div className="mt-6 flex flex-wrap gap-3 border-t border-white/10 pt-5"><button type="button" onClick={saveBrief} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.14em] text-[#4c3500]">{saved ? <Check size={16} /> : <CalendarCheck size={16} />}{saved ? "Saved to My Trip" : "Save complete plan"}</button><Link href="/planner" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 px-5 text-[10px] font-black uppercase tracking-[.14em] text-white"><Route size={15} /> Open planner</Link></div> : null}
              </div>
            ) : (
              <div className="grid min-h-[24rem] place-items-center text-center"><div className="max-w-lg"><CloudSun className="mx-auto text-cyan-200" size={38} /><h2 className="mt-5 text-3xl font-black tracking-[-.04em]">Ready when your day is.</h2><p className="mt-3 text-sm font-semibold leading-6 text-white/55">Choose a brief above. VI Guide will return a practical sequence of places with map, ride, and booking actions.</p>{error ? <p className="mt-4 rounded-2xl border border-rose-300/20 bg-rose-300/10 p-3 text-sm font-bold text-rose-100">{error}</p> : null}</div></div>
            )}
          </div>

          <aside className="space-y-4">
            <SideCard icon={UserRound} title="Traveler profile" copy={profileSignals ? `${profileSignals} memory areas will shape this plan.` : "Add preferences so the AI can plan around you."} href="/profile" label="Review profile" />
            <SideCard icon={Map} title="Territory map" copy="Inspect every suggested stop and understand the route across the island." href={`/map?island=${island}`} label="Open map" />
            <SideCard icon={Compass} title="Full Concierge" copy="Ask follow-up questions, change constraints, or plan a more complex trip." href="/concierge?open=true" label="Open Concierge" />
          </aside>
        </section>
      </div>
    </main>
  );
}

function Metric({ value, label }: { value: string | number; label: string }) {
  return <div className="rounded-[20px] bg-black/10 px-3 py-4 text-center"><div className="text-lg font-black sm:text-xl">{value}</div><div className="mt-1 text-[8px] font-black uppercase tracking-[.13em] text-white/45">{label}</div></div>;
}

function SideCard({ icon: Icon, title, copy, href, label }: { icon: typeof Compass; title: string; copy: string; href: string; label: string }) {
  return <article className="rounded-[26px] border border-slate-200 bg-white p-5 shadow-sm"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e5f4ef] text-[#0f766e]"><Icon size={20} /></span><h2 className="mt-4 text-xl font-black tracking-[-.03em]">{title}</h2><p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{copy}</p><Link href={href} className="mt-4 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.14em] text-teal-800">{label}<ArrowRight size={13} /></Link></article>;
}
