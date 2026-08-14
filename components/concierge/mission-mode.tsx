"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Anchor,
  ArrowRight,
  Baby,
  Fish,
  Heart,
  Landmark,
  MapPinned,
  MoonStar,
  Sparkles,
  Sun,
  Umbrella,
  UtensilsCrossed,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";

const MISSIONS = [
  {
    id: "beach-day",
    title: "Beach day",
    description: "Choose the best beach, timing, food, transportation, and a backup option.",
    icon: Umbrella,
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    imageAlt: "Magens Bay beach in St. Thomas",
    tag: "Water",
    prompt:
      "Build me a complete beach day using current USVI Explorer context. Include the best-fit beach, arrival timing, transportation, food nearby, facilities, water considerations, estimated costs, and a weather-safe backup.",
  },
  {
    id: "cruise-stop",
    title: "Cruise stop",
    description: "Create a realistic port-day plan that gets back to the ship on time.",
    icon: Anchor,
    image: "/images/places/st-thomas/red-hook-ferry-terminal-1.jpg",
    imageAlt: "Red Hook waterfront and ferry terminal in St. Thomas",
    tag: "Ship day",
    prompt:
      "Plan a safe cruise-port day with realistic travel time, local highlights, food, shopping or beach options, transportation, budget guidance, and a firm return-to-ship buffer.",
  },
  {
    id: "food-tour",
    title: "Food tour",
    description: "Connect local flavors, neighborhoods, timing, and transportation.",
    icon: UtensilsCrossed,
    image: "/images/usvi-harbor-hero.jpg",
    imageAlt: "Charlotte Amalie harbor and hillside neighborhoods",
    tag: "Taste",
    prompt:
      "Build a local USVI food experience with a practical sequence of breakfast, lunch, dinner, drinks or desserts as appropriate. Include transportation, timing, price range, and nearby attractions.",
  },
  {
    id: "fishing-trip",
    title: "Fishing trip",
    description: "Match access, target species, regulations, charters, and conditions.",
    icon: Fish,
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    imageAlt: "Cane Bay coastline in St. Croix",
    tag: "Water",
    prompt:
      "Plan a USVI fishing mission using USVI Explorer knowledge. Include suitable access or charter options, likely species, timing, regulations, transportation, equipment considerations, and a bad-weather alternative.",
  },
  {
    id: "history-walk",
    title: "History walk",
    description: "Turn heritage sites into a connected, walkable island story.",
    icon: Landmark,
    image: "/images/accommodations/king-christian-hotel.jpg",
    imageAlt: "Historic waterfront architecture in Christiansted, St. Croix",
    tag: "Heritage",
    prompt:
      "Create a grounded USVI history and heritage route with a logical stop order, historical context, walking or ride segments, visit duration, accessibility considerations, food nearby, and a backup indoor stop.",
  },
  {
    id: "family-adventure",
    title: "Family adventure",
    description: "Build a lower-stress day with children, breaks, food, and easy logistics.",
    icon: Baby,
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    imageAlt: "Trunk Bay and the North Shore of St. John",
    tag: "Family",
    prompt:
      "Plan a family-friendly island day with age-appropriate activities, manageable travel time, meals, rest breaks, bathrooms and facilities, transportation, estimated costs, and a rain alternative.",
  },
  {
    id: "romantic-day",
    title: "Romantic day",
    description: "Create a relaxed experience from daytime discovery through dinner.",
    icon: Heart,
    image: "/images/places/st-john/trunk-bay-beach-1.jpg",
    imageAlt: "Clear water and tropical shoreline on St. John",
    tag: "Couples",
    prompt:
      "Build a romantic USVI day with a relaxed pace, scenic stops, transportation, a sunset moment, dinner, estimated costs, and thoughtful backup options.",
  },
  {
    id: "sunset-evening",
    title: "Sunset evening",
    description: "Coordinate viewpoint, dinner, live experiences, and the ride home.",
    icon: Sun,
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    imageAlt: "St. Croix coastline at Cane Bay",
    tag: "Golden hour",
    prompt:
      "Plan a complete sunset evening with the best-fit viewpoint, arrival time, dinner or drinks, nearby live experiences, transportation, safety considerations, and a rain alternative.",
  },
  {
    id: "nightlife",
    title: "Nightlife",
    description: "Connect dinner, music, venues, transportation, and a safe return.",
    icon: MoonStar,
    image: "/images/usvi-harbor-hero.jpg",
    imageAlt: "Charlotte Amalie harbor and waterfront in St. Thomas",
    tag: "After dark",
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
      `Treat this as a complete travel mission: ${value}. Build a realistic, actionable plan using current USVI Explorer map context, transportation, timing, costs, booking opportunities, and at least one backup option.`,
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#031f1e] pb-32 text-white">
      <section className="relative isolate overflow-hidden px-4 pb-12 pt-5 sm:px-7 lg:px-10 lg:pb-16">
        <Image
          src="/images/usvi-harbor-hero.jpg"
          alt="Charlotte Amalie harbor and the hills of St. Thomas"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[68%_center]"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.99)_0%,rgba(3,47,45,.95)_46%,rgba(3,47,45,.6)_78%,rgba(3,47,45,.3)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(115,227,217,.18),transparent_28%),linear-gradient(180deg,rgba(2,31,29,.04),rgba(2,31,29,.55))]" />

        <ViPublicHeader
          actionHref="/concierge"
          actionLabel="Open Concierge"
          actionIcon={Sparkles}
          secondaryHref="/map"
          secondaryLabel="Living Map"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-4 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f8d77c] backdrop-blur-xl">
              <Sparkles size={14} /> VI Concierge · Mission Mode
            </div>
            <h1 className="vi-display mt-7 max-w-5xl text-[clamp(3.8rem,8vw,7rem)] font-bold leading-[.84] text-white">
              Tell USVI Explorer
              <span className="block italic text-[#73e3d9]">what the day needs to do.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/74 sm:text-xl sm:leading-8">
              Pick a mission and USVI Explorer opens the Living Map with a practical brief already attached—timing, transportation, cost, booking opportunities, and a backup included.
            </p>
          </div>

          <aside className="vi-glass rounded-[32px] p-6 sm:p-7">
            <div className="vi-eyebrow text-[#f5c451]">What Mission Mode changes</div>
            <h2 className="vi-display mt-3 text-3xl font-bold text-white sm:text-4xl">
              Start from an outcome, not a list of places.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
              Each mission becomes a structured Concierge prompt inside the map, carrying the active island context with it instead of sending you into a disconnected chat.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-2">
              <MissionStat value="9" label="ready missions" />
              <MissionStat value="1" label="living map" />
              <MissionStat value="1" label="backup plan" />
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <div className="max-w-3xl">
          <div className="vi-eyebrow text-[#73e3d9]">Choose the outcome</div>
          <h2 className="vi-display mt-3 text-4xl font-bold leading-[.95] text-white sm:text-5xl">
            Nine fast ways into a complete island plan.
          </h2>
          <p className="mt-4 text-sm font-semibold leading-7 text-white/54 sm:text-base">
            Tap a mission to move directly into the Living Map with the planning brief loaded. Your current island and other map context stay with you.
          </p>
        </div>

        <section className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {MISSIONS.map((mission) => {
            const Icon = mission.icon;
            return (
              <button
                key={mission.id}
                type="button"
                onClick={() => launch(mission.prompt)}
                className="group relative min-h-[24rem] overflow-hidden rounded-[30px] border border-white/10 bg-[#073b39] text-left shadow-[0_18px_50px_rgba(0,0,0,.18)] transition duration-300 hover:-translate-y-1.5 hover:border-[#73e3d9]/35 hover:shadow-[0_30px_70px_rgba(0,0,0,.28)]"
              >
                <Image
                  src={mission.image}
                  alt={mission.imageAlt}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.08)_12%,rgba(3,47,45,.42)_48%,rgba(2,31,29,.97)_100%)]" />
                <span className="relative flex min-h-[24rem] flex-col justify-between p-5 sm:p-6">
                  <span className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl border border-white/20 bg-white/12 text-[#8ef0e7] shadow-lg backdrop-blur-md transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]">
                      <Icon size={20} />
                    </span>
                    <span className="rounded-full border border-white/15 bg-[#032f2d]/52 px-3 py-1.5 text-[8px] font-black uppercase tracking-[.16em] text-white/80 backdrop-blur-md">
                      {mission.tag}
                    </span>
                  </span>

                  <span>
                    <span className="vi-display block text-3xl font-bold leading-[.98] text-white">
                      {mission.title}
                    </span>
                    <span className="mt-3 block text-sm font-semibold leading-6 text-white/64">
                      {mission.description}
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#f8d77c] transition group-hover:text-[#8ef0e7]">
                      Start mission <ArrowRight size={14} />
                    </span>
                  </span>
                </span>
              </button>
            );
          })}
        </section>

        <section className="mt-10 rounded-[34px] border border-white/10 bg-white/[.055] p-5 shadow-[0_20px_60px_rgba(0,0,0,.16)] sm:p-7 lg:p-8">
          <div className="grid gap-7 lg:grid-cols-[.78fr_1.22fr] lg:items-end">
            <div>
              <div className="vi-eyebrow text-[#f5c451]">Build your own mission</div>
              <h2 className="vi-display mt-3 text-3xl font-bold text-white sm:text-4xl">
                Give us the constraint. We’ll build the day around it.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-white/52">
                Time before a flight, a fixed budget, accessibility needs, a celebration, a child’s nap schedule—describe the real constraint instead of searching category by category.
              </p>
            </div>

            <div>
              <label>
                <span className="sr-only">Describe your travel mission</span>
                <textarea
                  value={brief}
                  onChange={(event) => setBrief(event.target.value)}
                  rows={4}
                  maxLength={1200}
                  placeholder="Example: I have five hours before my flight, $250, and want local food, history, and one quiet beach."
                  className="w-full resize-none rounded-[24px] border border-white/10 bg-[#061b1a] px-5 py-4 text-sm font-semibold leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#73e3d9]/45 focus:ring-4 focus:ring-[#73e3d9]/10"
                />
              </label>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-white/42">
                  <MapPinned size={15} className="text-[#73e3d9]" /> Opens in the Living Map with Concierge active
                </span>
                <button
                  type="button"
                  disabled={!brief.trim()}
                  onClick={launchCustom}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 text-[9px] font-black uppercase tracking-[.16em] text-[#043331] transition hover:-translate-y-0.5 hover:bg-[#ffdc76] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  Build my mission <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

function MissionStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl bg-white/[.08] px-3 py-4 text-center">
      <strong className="vi-display block text-2xl font-bold text-white">{value}</strong>
      <span className="mt-1 block text-[8px] font-black uppercase tracking-[.14em] text-white/48">
        {label}
      </span>
    </div>
  );
}
