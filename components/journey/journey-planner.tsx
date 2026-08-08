"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  CalendarDays,
  CheckCircle2,
  Clock3,
  LoaderCircle,
  Map,
  MapPin,
  Plus,
  Save,
  Share2,
  Sparkles,
  Trash2,
} from "lucide-react";

import { useAuth } from "@/components/auth-provider";
import { SharedJourneyManager, SHARED_JOURNEYS_UPDATED_EVENT } from "@/components/journey/shared-journey-manager";
import { askViIntelligence } from "@/lib/intelligence/client";

import {
  buildJourneyMapHref,
  createJourneyPlan,
  deleteJourneyPlan,
  importLegacyTripPlans,
  readJourneyPlans,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import type {
  IntelligenceIsland,
  IntelligencePlanStop,
} from "@/types/intelligence";

const ISLANDS: Record<IntelligenceIsland, string> = {
  stt: "St. Thomas",
  stj: "St. John",
  stx: "St. Croix",
};

const JOURNEY_VISUALS: Record<
  IntelligenceIsland,
  { image: string; alt: string; label: string }
> = {
  stt: {
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor and the hills of St. Thomas",
    label: "Harbor energy · beaches · dining",
  },
  stj: {
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay and the North Shore of St. John",
    label: "National park · coves · trails",
  },
  stx: {
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coastline in St. Croix",
    label: "History · diving · island pace",
  },
};

export function JourneyPlanner() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newStopTitle, setNewStopTitle] = useState("");
  const [newStopTime, setNewStopTime] = useState("");
  const [reviewMode, setReviewMode] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [sharing, setSharing] = useState(false);
  const [personalizing, setPersonalizing] = useState(false);

  useEffect(() => {
    const stored = readJourneyPlans();
    const loaded = stored.length ? stored : importLegacyTripPlans();
    if (loaded.length) {
      setPlans(loaded);
      setActiveId(loaded[0].id);
    } else {
      const first = createJourneyPlan();
      setPlans([first]);
      setActiveId(first.id);
      upsertJourneyPlan(first);
    }
  }, []);

  const active = useMemo(
    () => plans.find((plan) => plan.id === activeId) ?? plans[0] ?? null,
    [activeId, plans],
  );

  function updateActive(patch: Partial<JourneyPlan>) {
    if (!active) return;
    const next = { ...active, ...patch, updatedAt: new Date().toISOString() };
    setPlans((current) =>
      current.map((plan) => (plan.id === active.id ? next : plan)),
    );
    setSavedMessage(null);
  }

  function saveActive() {
    if (!active) return;
    upsertJourneyPlan(active);
    setPlans(readJourneyPlans());
    setSavedMessage("Journey saved");
    window.setTimeout(() => setSavedMessage(null), 1800);
  }

  async function personalizeActive() {
    if (!active || personalizing) return;
    setPersonalizing(true);
    setSavedMessage("Personalizing with your traveler profile…");

    try {
      const itinerary = active.plan
        .slice(0, 20)
        .map(
          (stop, index) =>
            `${index + 1}. ${stop.title}${stop.startTime ? ` at ${stop.startTime}` : ""}: ${stop.summary.slice(0, 140)}`,
        )
        .join("\n");
      const message = [
        "Create a personalized AI remix of this existing Virgin Islands journey.",
        "Preserve strong choices, but improve the sequence, timing, transportation, variety, and fit with my saved traveler profile.",
        "Return a complete practical itinerary. Do not merely describe suggested changes.",
        `Journey date: ${active.date}`,
        `Existing itinerary:\n${itinerary || "No stops yet—build the complete day."}`,
        `Journey notes: ${active.notes || "None"}`,
      ]
        .join("\n\n")
        .slice(0, 3900);

      const result = await askViIntelligence(
        message,
        { page: "concierge", island: active.island },
        ["recommend", "plan", "map", "mobility", "booking", "knowledge"],
      );
      if (!result.plan.length) {
        throw new Error("VI Guide could not produce a complete itinerary.");
      }

      const remix = createJourneyPlan(
        active.island,
        `AI remix · ${active.title}`.slice(0, 120),
      );
      upsertJourneyPlan({
        ...remix,
        date: active.date,
        status: "ready",
        plan: result.plan,
        notes: [
          "Personalized by VI Guide Intelligence. The original journey remains saved separately.",
          result.answer,
        ]
          .join("\n\n")
          .slice(0, 2000),
      });
      const next = readJourneyPlans();
      setPlans(next);
      setActiveId(remix.id);
      setReviewMode(true);
      setSavedMessage("AI remix saved as a new journey");
    } catch (error) {
      setSavedMessage(
        error instanceof Error ? error.message : "Could not personalize this journey.",
      );
    } finally {
      setPersonalizing(false);
    }
  }

  async function shareActive() {
    if (!active || sharing) return;
    if (!user) {
      setSavedMessage("Sign in to create a private share link");
      return;
    }
    setSharing(true);
    setSavedMessage("Creating read-only link…");
    try {
      upsertJourneyPlan(active);
      const token = await user.getIdToken();
      const response = await fetch("/api/shared-journeys", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ plan: active }),
      });
      const payload = (await response.json().catch(() => null)) as { href?: string; error?: string } | null;
      if (!response.ok || !payload?.href) throw new Error(payload?.error || "Could not share journey.");
      const url = new URL(payload.href, window.location.origin).toString();
      const canUseNativeShare = typeof navigator.share === "function";
      if (canUseNativeShare) {
        await navigator.share({ title: active.title, text: `Follow my ${ISLANDS[active.island]} itinerary in VI Guide.`, url }).catch((error: unknown) => {
          if (!(error instanceof DOMException && error.name === "AbortError")) throw error;
        });
      } else {
        await navigator.clipboard.writeText(url);
      }
      setSavedMessage(canUseNativeShare ? "Share link ready" : "Share link copied");
      window.dispatchEvent(new Event(SHARED_JOURNEYS_UPDATED_EVENT));
    } catch (error) {
      setSavedMessage(error instanceof Error ? error.message : "Could not share journey.");
    } finally {
      setSharing(false);
    }
  }

  function createPlan() {
    const next = createJourneyPlan(active?.island ?? "stt", "New island day");
    setPlans((current) => [next, ...current]);
    setActiveId(next.id);
    setReviewMode(false);
    upsertJourneyPlan(next);
  }

  function removePlan() {
    if (!active) return;
    deleteJourneyPlan(active.id);
    const next = readJourneyPlans();
    setPlans(next);
    setActiveId(next[0]?.id ?? null);
    if (!next.length) {
      const replacement = createJourneyPlan();
      setPlans([replacement]);
      setActiveId(replacement.id);
      upsertJourneyPlan(replacement);
    }
  }

  function addStop() {
    if (!active || !newStopTitle.trim()) return;
    const stop: IntelligencePlanStop = {
      id: createId("stop"),
      title: newStopTitle.trim().slice(0, 160),
      island: active.island,
      kind: "custom",
      summary: "Added manually to this VI Guide journey.",
      ...(newStopTime ? { startTime: newStopTime } : {}),
    };
    updateActive({ plan: [...active.plan, stop] });
    setNewStopTitle("");
    setNewStopTime("");
  }

  function updateStop(stopId: string, patch: Partial<IntelligencePlanStop>) {
    if (!active) return;
    updateActive({
      plan: active.plan.map((stop) =>
        stop.id === stopId ? { ...stop, ...patch } : stop,
      ),
    });
  }

  function moveStop(index: number, direction: -1 | 1) {
    if (!active) return;
    const target = index + direction;
    if (target < 0 || target >= active.plan.length) return;
    const next = [...active.plan];
    [next[index], next[target]] = [next[target], next[index]];
    updateActive({ plan: next });
  }

  function removeStop(stopId: string) {
    if (!active) return;
    updateActive({ plan: active.plan.filter((stop) => stop.id !== stopId) });
  }

  if (!active) return null;

  const totalMinutes = active.plan.reduce(
    (sum, stop) => sum + (stop.durationMinutes ?? 0),
    0,
  );
  const journeyVisual = JOURNEY_VISUALS[active.island];
  const plannedHours = totalMinutes
    ? `${Math.round((totalMinutes / 60) * 10) / 10}h`
    : "Flexible";

  return (
    <main className="min-h-screen bg-[#f4efe5] pb-32 text-[#043331]">
      <section className="relative isolate overflow-hidden px-4 py-10 text-white sm:px-6 lg:py-16">
        <Image
          src={journeyVisual.image}
          alt={journeyVisual.alt}
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98)_0%,rgba(3,47,45,.91)_45%,rgba(3,47,45,.52)_76%,rgba(3,47,45,.28)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_18%,rgba(115,227,217,.19),transparent_30%),linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.48))]" />

        <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14">
          <div>
            <p className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f8d77c] backdrop-blur-xl">
              <CalendarDays size={14} /> VI Guide · Journey Planner
            </p>
            <h1 className="vi-display mt-6 max-w-4xl text-[clamp(3.5rem,7vw,6.7rem)] font-bold leading-[.86] tracking-[-.045em] text-white">
              Build the day.
              <span className="block italic text-[#73e3d9]">Keep the whole trip connected.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base font-semibold leading-7 text-white/74 sm:text-lg">
              Create, edit, save, review, map, share, and personalize every itinerary without breaking the thread between discovery, Concierge, and the Living Map.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={createPlan}
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] shadow-[0_16px_36px_rgba(245,196,81,.22)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
              >
                <Plus className="h-4 w-4" /> New journey
              </button>
              <Link
                href="/concierge?prompt=Build%20a%20complete%20Virgin%20Islands%20day%20for%20me"
                className="vi-glass inline-flex min-h-12 items-center gap-2 rounded-full px-6 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/[.15]"
              >
                <Sparkles className="h-4 w-4 text-[#73e3d9]" /> Ask VI Concierge
              </Link>
            </div>
          </div>

          <aside className="vi-glass rounded-[32px] p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="vi-eyebrow text-[#f5c451]">Active journey</div>
                <h2 className="vi-display mt-2 text-3xl font-bold leading-tight text-white">
                  {active.title}
                </h2>
                <p className="mt-2 text-sm font-semibold text-white/58">
                  {ISLANDS[active.island]} · {journeyVisual.label}
                </p>
              </div>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/16 bg-white/[.09] text-[#8ef0e7]">
                <MapPin className="h-5 w-5" />
              </span>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <JourneyMetric value={String(active.plan.length)} label="Stops" />
              <JourneyMetric value={active.date || "Open"} label="Date" compact />
              <JourneyMetric value={plannedHours} label="Planned" compact />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Link
                href={buildJourneyMapHref(active)}
                className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-white px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:-translate-y-0.5"
              >
                <Map className="h-4 w-4" /> Open Living Map
              </Link>
              <button
                type="button"
                onClick={() => setReviewMode((value) => !value)}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/16 bg-white/[.08] px-4 text-[9px] font-black uppercase tracking-[.14em] text-white"
              >
                <CheckCircle2 className="h-4 w-4" /> {reviewMode ? "Edit" : "Review"}
              </button>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[300px_1fr] lg:py-10">
        <aside className="space-y-3 lg:sticky lg:top-5 lg:self-start">
          <div className="overflow-hidden rounded-[28px] border border-[#d6e3df] bg-[#fffdf8] shadow-[0_16px_44px_rgba(4,51,49,.08)]">
            <div className="border-b border-[#e2ebe8] bg-[#073b39] px-5 py-4 text-white">
              <div className="vi-eyebrow text-[#f5c451]">Saved journeys</div>
              <div className="mt-1 text-sm font-bold text-white/66">
                {plans.length} island {plans.length === 1 ? "plan" : "plans"}
              </div>
            </div>
            <div className="space-y-2 p-3">
              {plans.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => {
                    setActiveId(plan.id);
                    setReviewMode(false);
                  }}
                  className={`w-full rounded-[20px] border p-4 text-left transition ${
                    plan.id === active.id
                      ? "border-[#0f766e]/20 bg-[#073b39] text-white shadow-[0_12px_28px_rgba(4,51,49,.14)]"
                      : "border-transparent bg-[#f8f4ea] hover:border-[#cfe0dc] hover:bg-[#edf6f2]"
                  }`}
                >
                  <div className="text-sm font-black">{plan.title}</div>
                  <div
                    className={`mt-2 text-[9px] font-bold uppercase tracking-[.12em] ${
                      plan.id === active.id ? "text-[#8ef0e7]" : "text-slate-400"
                    }`}
                  >
                    {ISLANDS[plan.island]} · {plan.plan.length} stops
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <section className="rounded-[32px] border border-[#d6e3df] bg-[#fffdf8] p-5 shadow-[0_18px_52px_rgba(4,51,49,.08)] sm:p-7">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="vi-eyebrow text-[#9b5d12]">Trip command</div>
                <h2 className="vi-display mt-2 text-3xl font-bold tracking-[-.035em]">
                  Shape the active journey.
                </h2>
              </div>
              <span className="rounded-full border border-[#d6e3df] bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[.14em] text-[#0f766e]">
                {ISLANDS[active.island]} context active
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 xl:col-span-2">
                <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
                  Journey title
                </span>
                <input
                  value={active.title}
                  onChange={(event) => updateActive({ title: event.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-teal-500"
                />
              </label>
              <label className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
                  Island
                </span>
                <select
                  value={active.island}
                  onChange={(event) =>
                    updateActive({
                      island: event.target.value as IntelligenceIsland,
                      plan: active.plan.map((stop) => ({
                        ...stop,
                        island: event.target.value as IntelligenceIsland,
                      })),
                    })
                  }
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-teal-500"
                >
                  {Object.entries(ISLANDS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-[9px] font-black uppercase tracking-[.16em] text-slate-400">
                  Date
                </span>
                <input
                  type="date"
                  value={active.date}
                  onChange={(event) => updateActive({ date: event.target.value })}
                  className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none focus:border-teal-500"
                />
              </label>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={saveActive}
                className="rounded-full bg-[#043331] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-white"
              >
                <Save className="mr-2 inline h-4 w-4" /> Save
              </button>
              <button
                type="button"
                onClick={personalizeActive}
                disabled={personalizing}
                className="rounded-full bg-[#f5c451] px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-[#043331] disabled:opacity-60"
              >
                {personalizing ? (
                  <LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 inline h-4 w-4" />
                )}
                {personalizing ? "Personalizing…" : "Personalize with AI"}
              </button>
              <button
                type="button"
                onClick={() => setReviewMode((value) => !value)}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]"
              >
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                {reviewMode ? "Edit journey" : "Review journey"}
              </button>
              <Link
                href={buildJourneyMapHref(active)}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em]"
              >
                <Map className="mr-2 inline h-4 w-4" /> Open map
              </Link>
              <button
                type="button"
                onClick={shareActive}
                disabled={sharing}
                className="rounded-full border border-slate-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] disabled:opacity-50"
              >
                <Share2 className="mr-2 inline h-4 w-4" /> {sharing ? "Sharing…" : "Share"}
              </button>
              <button
                type="button"
                onClick={removePlan}
                className="rounded-full border border-rose-200 bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.16em] text-rose-700"
              >
                <Trash2 className="mr-2 inline h-4 w-4" /> Delete
              </button>
              {savedMessage ? (
                <span className="self-center text-xs font-black text-emerald-700">
                  {savedMessage}
                </span>
              ) : null}
            </div>
          </section>

          {!reviewMode ? (
            <section className="rounded-[32px] border border-[#d6e3df] bg-[#fffdf8] p-5 shadow-[0_16px_44px_rgba(4,51,49,.06)] sm:p-7">
              <div className="mb-4">
                <div className="vi-eyebrow text-[#0f766e]">Add the next stop</div>
                <h2 className="vi-display mt-2 text-2xl font-bold">Keep the day moving.</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-[1fr_150px_auto]">
                <input
                  value={newStopTitle}
                  onChange={(event) => setNewStopTitle(event.target.value)}
                  aria-label="New stop name"
                  placeholder="Add a beach, restaurant, landmark, ferry, or activity"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-teal-500"
                />
                <input
                  type="time"
                  value={newStopTime}
                  onChange={(event) => setNewStopTime(event.target.value)}
                  aria-label="New stop start time"
                  className="h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={addStop}
                  disabled={!newStopTitle.trim()}
                  className="h-12 rounded-2xl bg-[#f5c451] px-5 text-[10px] font-black uppercase tracking-[.16em] disabled:opacity-40"
                >
                  <Plus className="mr-2 inline h-4 w-4" /> Add stop
                </button>
              </div>
            </section>
          ) : null}

          <section className="rounded-[32px] border border-[#d6e3df] bg-[#fffdf8] p-5 shadow-[0_18px_52px_rgba(4,51,49,.07)] sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="vi-eyebrow text-[#9b5d12]">
                  {reviewMode ? "Review" : "Your island day"}
                </p>
                <h2 className="vi-display mt-2 text-3xl font-bold tracking-[-.04em]">
                  {active.plan.length} planned {active.plan.length === 1 ? "stop" : "stops"}
                </h2>
              </div>
              <div className="rounded-full border border-[#d6e3df] bg-white px-4 py-2 text-xs font-bold text-slate-500">
                {totalMinutes
                  ? `${Math.round((totalMinutes / 60) * 10) / 10} planned hours`
                  : "Add durations as the day takes shape"}
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {active.plan.map((stop, index) => (
                <article
                  key={stop.id}
                  className="rounded-[24px] border border-[#dce7e3] bg-white p-4 shadow-[0_8px_24px_rgba(4,51,49,.04)] sm:p-5"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[#043331] text-sm font-black text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      {reviewMode ? (
                        <>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black">{stop.title}</h3>
                            {stop.startTime ? (
                              <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-700">
                                <Clock3 className="h-3.5 w-3.5" />
                                {stop.startTime}
                              </span>
                            ) : null}
                          </div>
                          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                            {stop.summary}
                          </p>
                        </>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-[1fr_130px_130px]">
                          <input
                            value={stop.title}
                            aria-label={`Stop ${index + 1} name`}
                            onChange={(event) =>
                              updateStop(stop.id, { title: event.target.value })
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-teal-500"
                          />
                          <input
                            type="time"
                            value={stop.startTime ?? ""}
                            aria-label={`Stop ${index + 1} start time`}
                            onChange={(event) =>
                              updateStop(stop.id, {
                                startTime: event.target.value || undefined,
                              })
                            }
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-teal-500"
                          />
                          <input
                            type="number"
                            min="0"
                            step="15"
                            value={stop.durationMinutes ?? ""}
                            aria-label={`Stop ${index + 1} duration in minutes`}
                            onChange={(event) =>
                              updateStop(stop.id, {
                                durationMinutes: event.target.value
                                  ? Number(event.target.value)
                                  : undefined,
                              })
                            }
                            placeholder="Minutes"
                            className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-teal-500"
                          />
                        </div>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        {stop.href ? (
                          <Link
                            href={stop.href}
                            className="inline-flex items-center gap-1 rounded-full border border-[#dce7e3] bg-[#f8f4ea] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"
                          >
                            <MapPin className="h-3.5 w-3.5" /> Details
                          </Link>
                        ) : null}
                        {stop.mapHref ? (
                          <Link
                            href={stop.mapHref}
                            className="inline-flex items-center gap-1 rounded-full border border-[#dce7e3] bg-[#f8f4ea] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em]"
                          >
                            <Map className="h-3.5 w-3.5" /> Map
                          </Link>
                        ) : null}
                        {!reviewMode ? (
                          <>
                            <button
                              type="button"
                              onClick={() => moveStop(index, -1)}
                              disabled={index === 0}
                              className="grid h-8 w-8 place-items-center rounded-full bg-[#f8f4ea] disabled:opacity-30"
                              aria-label="Move stop up"
                            >
                              <ArrowUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => moveStop(index, 1)}
                              disabled={index === active.plan.length - 1}
                              className="grid h-8 w-8 place-items-center rounded-full bg-[#f8f4ea] disabled:opacity-30"
                              aria-label="Move stop down"
                            >
                              <ArrowDown className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeStop(stop.id)}
                              className="grid h-8 w-8 place-items-center rounded-full bg-rose-50 text-rose-700"
                              aria-label="Remove stop"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </article>
              ))}

              {!active.plan.length ? (
                <div className="rounded-[24px] border border-dashed border-[#c9dbd6] bg-white p-10 text-center">
                  <CalendarDays className="mx-auto h-8 w-8 text-[#8fb4ae]" />
                  <h3 className="vi-display mt-4 text-2xl font-bold">Your day is ready to build</h3>
                  <p className="mt-2 text-sm font-semibold text-slate-500">
                    Add a stop manually or ask VI Guide Intelligence to create the first complete version.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[32px] border border-[#d6e3df] bg-[#fffdf8] p-5 shadow-[0_16px_44px_rgba(4,51,49,.06)] sm:p-7">
            <label className="space-y-2">
              <span className="vi-eyebrow text-[#0f766e]">Journey notes</span>
              <textarea
                value={active.notes}
                onChange={(event) => updateActive({ notes: event.target.value })}
                rows={4}
                placeholder="Pickup details, accessibility needs, reservation notes, family preferences…"
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-teal-500"
              />
            </label>
          </section>
          <SharedJourneyManager />
        </div>
      </section>
    </main>
  );
}

function JourneyMetric({
  value,
  label,
  compact = false,
}: {
  value: string;
  label: string;
  compact?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[.075] px-3 py-4 text-center">
      <strong className={`vi-display block font-bold text-white ${compact ? "text-base" : "text-2xl"}`}>
        {value}
      </strong>
      <span className="mt-1 block text-[8px] font-black uppercase tracking-[.14em] text-white/46">
        {label}
      </span>
    </div>
  );
}

function createId(prefix: string) {
  const random =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID().replace(/-/g, "")
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${random}`;
}
