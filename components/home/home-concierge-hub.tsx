import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Car,
  Fish,
  Footprints,
  MoonStar,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

const PROMPTS = [
  {
    label: "Beach day",
    prompt: "Plan a relaxed beach day with food and transportation nearby",
    icon: Waves,
  },
  {
    label: "Find food",
    prompt: "Help me find a great local meal near me today",
    icon: UtensilsCrossed,
  },
  {
    label: "Book a ride",
    prompt: "Help me plan transportation for my next stop",
    icon: Car,
  },
  {
    label: "Go fishing",
    prompt: "Plan a responsible fishing experience in the U.S. Virgin Islands",
    icon: Fish,
  },
  {
    label: "Take a hike",
    prompt: "Plan a scenic hike with timing and transportation",
    icon: Footprints,
  },
  {
    label: "Tonight",
    prompt: "Plan something memorable for tonight in the Virgin Islands",
    icon: MoonStar,
  },
  {
    label: "Find a stay",
    prompt: "Help me choose a place to stay based on my trip",
    icon: BedDouble,
  },
] as const;

function conciergeHref(prompt: string) {
  return `/concierge?open=true&prompt=${encodeURIComponent(prompt)}`;
}

export function HomeConciergeHub() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:px-12">
      <div className="overflow-hidden rounded-[36px] bg-[#073b39] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)]">
        <div className="grid lg:grid-cols-[.9fr_1.1fr]">
          <div className="border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-[#f5c451]">
              <Sparkles size={14} /> VI Concierge
            </div>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-5xl">
              Tell us the kind of day you want.
            </h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/68">
              VI Concierge connects places, timing, transportation, and local context into one practical plan.
            </p>
            <Link
              href={conciergeHref("Plan a complete Virgin Islands day for me")}
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-[#073b39]"
            >
              Start a custom plan <ArrowRight size={16} />
            </Link>
          </div>

          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-5">
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-white/50">
                One-tap planning
              </div>
              <h3 className="mt-2 text-2xl font-black tracking-[-.035em]">
                What would you like to do?
              </h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {PROMPTS.map(({ label, prompt, icon: Icon }) => (
                <Link
                  key={label}
                  href={conciergeHref(prompt)}
                  className="group flex min-h-[116px] items-center gap-4 rounded-[24px] border border-white/12 bg-white/[.07] p-4 transition hover:-translate-y-0.5 hover:border-[#f5c451]/60 hover:bg-white/[.12]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-[#0f766e] transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className="text-sm font-black">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
