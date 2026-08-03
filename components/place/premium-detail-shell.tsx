import type { ReactNode } from "react";

import { PlaceActionBar } from "@/components/place/place-action-bar";
import type { JourneyStopInput } from "@/lib/journey-planner";

type HeroCallout = {
  eyebrow: string;
  description: string;
};

type Props = {
  name: string;
  eyebrow: string;
  description: string;
  hero: ReactNode;
  meta?: ReactNode;
  heroCallout?: HeroCallout;
  actions: {
    island: string;
    mapHref?: string;
    rideHref?: string;
    website?: string | null;
    journeyStop?: JourneyStopInput;
  };
  primary: ReactNode;
  aside?: ReactNode;
  below?: ReactNode;
  back?: ReactNode;
  share?: ReactNode;
  className?: string;
};

const DEFAULT_HERO_CALLOUT: HeroCallout = {
  eyebrow: "Make this stop part of the day",
  description:
    "Connect this destination with transportation, nearby recommendations, timing, and a backup plan.",
};

export function PremiumDetailShell({
  name,
  eyebrow,
  description,
  hero,
  meta,
  heroCallout = DEFAULT_HERO_CALLOUT,
  actions,
  primary,
  aside,
  below,
  back,
  share,
  className = "",
}: Props) {
  return (
    <main
      className={`min-h-screen bg-[#f8f4ea] px-4 py-6 pb-32 text-[#043331] sm:px-6 lg:py-10 ${className}`}
    >
      <div className="mx-auto max-w-7xl space-y-8">
        {back || share ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>{back}</div>
            <div>{share}</div>
          </div>
        ) : null}

        <section className="group overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm lg:rounded-[40px]">
          <div className="grid lg:grid-cols-[1.25fr_.75fr]">
            <div className="min-h-[340px] sm:min-h-[440px] lg:min-h-[540px]">
              {hero}
            </div>
            <div className="flex flex-col justify-between bg-[linear-gradient(145deg,#043331_0%,#0b5d5b_62%,#14b8a6_100%)] p-7 text-white sm:p-10">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[.3em] text-[#fde68a]">
                  {eyebrow}
                </div>
                <h1 className="mt-4 text-4xl font-black italic leading-[.95] tracking-[-.045em] sm:text-5xl lg:text-6xl">
                  {name}
                </h1>
                <p className="mt-5 text-base font-semibold leading-7 text-white/80">
                  {description}
                </p>
                {meta ? <div className="mt-6">{meta}</div> : null}
              </div>

              <div className="mt-10 rounded-[24px] border border-white/15 bg-black/10 p-5 backdrop-blur-sm">
                <div className="text-[10px] font-black uppercase tracking-[.2em] text-[#fde68a]">
                  {heroCallout.eyebrow}
                </div>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                  {heroCallout.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        <PlaceActionBar
          name={name}
          island={actions.island}
          mapHref={actions.mapHref}
          rideHref={actions.rideHref}
          website={actions.website}
          journeyStop={actions.journeyStop}
        />

        <section
          className={aside ? "grid gap-7 lg:grid-cols-[1fr_380px]" : undefined}
        >
          <div className="space-y-7">{primary}</div>
          {aside ? (
            <aside className="space-y-5 lg:sticky lg:top-6 lg:self-start">
              {aside}
            </aside>
          ) : null}
        </section>

        {below}
      </div>
    </main>
  );
}
