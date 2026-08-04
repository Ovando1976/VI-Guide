"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Anchor,
  Baby,
  Fish,
  Heart,
  Landmark,
  MoonStar,
  Sparkles,
  Sun,
  Umbrella,
  UtensilsCrossed,
} from "lucide-react";

const MISSIONS = [
  {
    id: "beach-day",
    title: "Beach day",
    description: "Choose the best beach, timing, food, transportation, and a backup option.",
    icon: Umbrella,
    prompt:
      "Build me a complete beach day using current VI Guide context. Include the best-fit beach, arrival timing, transportation, food nearby, facilities, water considerations, estimated costs, and a weather-safe backup.",
  },
  {
    id: "cruise-stop",
    title: "Cruise stop",
    description: "Create a realistic port-day plan that gets back to the ship on time.",
    icon: Anchor,
    prompt:
      "Plan a safe cruise-port day with realistic travel time, local highlights, food, shopping or beach options, transportation, budget guidance, and a firm return-to-ship buffer.",
  },
  {
    id: "food-tour",
    title: "Food tour",
    description: "Connect local flavors, neighborhoods, timing, and transportation.",
    icon: UtensilsCrossed,
    prompt:
      "Build a local USVI food experience with a practical sequence of breakfast, lunch, dinner, drinks or desserts as appropriate. Include transportation, timing, price range, and nearby attractions.",
  },
  {
    id: "fishing-trip",
    title: "Fishing trip",
    description: "Match access, target species, regulations, charters, and conditions.",
    icon: Fish,
    prompt:
      "Plan a USVI fishing mission using VI Guide knowledge. Include suitable access or charter options, likely species, timing, regulations, transportation, equipment considerations, and a bad-weather alternative.",
  },
  {
    id: "history-walk",
    title: "History walk",
    description: "Turn heritage sites into a connected, walkable island story.",
    icon: Landmark,
    prompt:
      "Create a grounded USVI history and heritage route with a logical stop order, historical context, walking or ride segments, visit duration, accessibility considerations, food nearby, and a backup indoor stop.",
  },
  {
    id: "family-adventure",
    title: "Family adventure",
    description: "Build a lower-stress day with children, breaks, food, and easy logistics.",
    icon: Baby,
    prompt:
      "Plan a family-friendly island day with age-appropriate activities, manageable travel time, meals, rest breaks, bathrooms and facilities, transportation, estimated costs, and a rain alternative.",
  },
  {
    id: "romantic-day",
    title: "Romantic day",
    description: "Create a relaxed experience from daytime discovery through dinner.",
    icon: Heart,
    prompt:
      "Build a romantic USVI day with a relaxed pace, scenic stops, transportation, a sunset moment, dinner, estimated costs, and thoughtful backup options.",
  },
  {
    id: "sunset-evening",
    title: "Sunset evening",
    description: "Coordinate viewpoint, dinner, live experiences, and the ride home.",
    icon: Sun,
    prompt:
      "Plan a complete sunset evening with the best-fit viewpoint, arrival time, dinner or drinks, nearby live experiences, transportation, safety considerations, and a rain alternative.",
  },
  {
    id: "nightlife",
    title: "Nightlife",
    description: "Connect dinner, music, venues, transportation, and a safe return.",
    icon: MoonStar,
    prompt:
      "Plan a USVI nightlife mission with dinner, live music or entertainment, realistic venue timing, transportation between stops, expected costs, and a safe return plan.",
  },
] as const;

export function MissionMode() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [brief, setBrief] = useState("");

  const contextParams = useMemo(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("prompt");
    return next;
  }, [searchParams]);

  function launch(prompt: string) {
    const params = new URLSearchParams(contextParams.toString());
    params.set("concierge", "open");
    params.set("prompt", prompt);
    router.push(`/map?${params.toString()}`);
  }

  function launchCustom() {
    const value = brief.trim();
    if (!value) return;
    launch(
      `Treat this as a complete travel mission: ${value}. Build a realistic, actionable plan using current VI Guide map context, transportation, timing, costs, booking opportunities, and at least one backup option.`,
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,.16),transparent_28%),linear-gradient(180deg,#041018_0%,#071923_58%,#0a2028_100%)] px-4 py-8 text-white sm:px-6 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/15 bg-cyan-200/[.06] px-4 py-2 text-[10px] font-black uppercase tracking-[.22em] text-cyan-100/70">
            <Sparkles size={14} /> VI Concierge Mission Mode
          </div>
          <h1 className="mt-6 text-4xl font-black italic tracking-[-.05em] sm:text-6xl">
            What do you want to accomplish today?
          </h1>
          <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-white/60">
            Choose a mission and VI Guide will open the Living Map, use the active destination context, and build a practical plan with timing, transportation, costs, actions, and a backup.
          </p>
        </header>

        <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MISSIONS.map((mission) => {
            const Icon = mission.icon;
            return (
              <button
                key={mission.id}
                type="button"
                onClick={() => launch(mission.prompt)}
                className="group rounded-[24px] border border-white/10 bg-white/[.045] p-5 text-left transition hover:-translate-y-1 hover:border-cyan-300/30 hover:bg-white/[.075]"
              >
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300/10 text-cyan-200 transition group-hover:bg-cyan-300 group-hover:text-[#06242a]">
                  <Icon size={20} />
                </span>
                <h2 className="mt-5 text-xl font-black">{mission.title}</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/50">
                  {mission.description}
                </p>
                <div className="mt-5 text-[10px] font-black uppercase tracking-[.18em] text-cyan-200/70">
                  Start mission →
                </div>
              </button>
            );
          })}
        </section>

        <section className="mt-8 rounded-[28px] border border-white/10 bg-black/15 p-5 sm:p-7">
          <div className="text-[10px] font-black uppercase tracking-[.2em] text-amber-200/75">
            Build your own mission
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
            <label>
              <span className="sr-only">Describe your travel mission</span>
              <textarea
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                rows={3}
                maxLength={1200}
                placeholder="Example: I have five hours before my flight, $250, and want local food, history, and one quiet beach."
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#06131b] px-4 py-4 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/25 focus:border-cyan-300/40 focus:ring-4 focus:ring-cyan-300/10"
              />
            </label>
            <button
              type="button"
              disabled={!brief.trim()}
              onClick={launchCustom}
              className="min-h-12 rounded-full bg-[#f5b942] px-6 text-[10px] font-black uppercase tracking-[.17em] text-[#043331] transition hover:bg-[#ffca55] disabled:cursor-not-allowed disabled:opacity-35"
            >
              Build my mission
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
