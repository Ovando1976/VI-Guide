import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  Car,
  Fish,
  Footprints,
  MoonStar,
  ShipWheel,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

function conciergeHref(prompt: string) {
  return `/concierge?open=true&prompt=${encodeURIComponent(prompt)}`;
}

const PROMPTS = [
  {
    label: "Beach day",
    href: conciergeHref(
      "Plan a relaxed beach day with food and transportation nearby",
    ),
    icon: Waves,
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    alt: "Magens Bay beach in St. Thomas",
  },
  {
    label: "Find food",
    href: conciergeHref("Help me find a great local meal near me today"),
    icon: UtensilsCrossed,
    image: "/images/places/st-thomas/hook-line-and-sinker-1.jpg",
    alt: "Waterfront dining in Frenchtown, St. Thomas",
  },
  {
    label: "Book a ride",
    href: conciergeHref("Help me plan transportation for my next stop"),
    icon: Car,
    image: "/images/places/st-thomas/red-hook-ferry-terminal-1.jpg",
    alt: "Red Hook ferry terminal in St. Thomas",
  },
  {
    label: "Plan a cruise",
    href: "/cruises",
    icon: ShipWheel,
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor in St. Thomas",
  },
  {
    label: "Go fishing",
    href: conciergeHref(
      "Plan a responsible fishing experience in the U.S. Virgin Islands",
    ),
    icon: Fish,
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coast in St. Croix",
  },
  {
    label: "Take a hike",
    href: conciergeHref("Plan a scenic hike with timing and transportation"),
    icon: Footprints,
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay overlook in St. John",
  },
  {
    label: "Tonight",
    href: conciergeHref(
      "Plan something memorable for tonight in the Virgin Islands",
    ),
    icon: MoonStar,
    image: "/images/sourced/historic/stt/frederick-lutheran-church.jpg",
    alt: "Historic Frederick Lutheran Church in Charlotte Amalie",
  },
  {
    label: "Find a stay",
    href: conciergeHref("Help me choose a place to stay based on my trip"),
    icon: BedDouble,
    image: "/images/accommodations/king-christian-hotel.jpg",
    alt: "King Christian Hotel in Christiansted",
  },
] as const;

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
              Tell us the kind of trip you want.
            </h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/68">
              VI Concierge connects places, timing, transportation, local context,
              and cruise planning into one practical travel relationship.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-[#f5c451]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-[#f8d77c]">
              <BadgeCheck size={14} /> Guided by a USVI Travel Specialist
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/trip-planning"
                className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-[#073b39]"
              >
                Plan my USVI trip <ArrowRight size={16} />
              </Link>
              <Link
                href={conciergeHref("Plan a complete Virgin Islands day for me")}
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-white transition hover:bg-white/[.12]"
              >
                Ask Concierge
              </Link>
            </div>
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
              {PROMPTS.map(({ label, href, image, alt, icon: Icon }) => (
                <Link
                  key={label}
                  href={href}
                  className="group relative flex min-h-[148px] items-end overflow-hidden rounded-[24px] border border-white/12 bg-[#032f2d] p-4 transition hover:-translate-y-0.5 hover:border-[#f5c451]/60"
                >
                  <Image
                    src={image}
                    alt={alt}
                    fill
                    sizes="(min-width: 1280px) 18vw, (min-width: 640px) 40vw, 100vw"
                    className="object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,31,29,.08),rgba(2,31,29,.28)_38%,rgba(2,31,29,.92)_100%)]" />
                  <span className="relative flex w-full items-end gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/92 text-[#0f766e] shadow-lg backdrop-blur transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]">
                      <Icon size={19} aria-hidden="true" />
                    </span>
                    <span className="min-w-0 pb-0.5">
                      <span className="block text-[8px] font-black uppercase tracking-[.16em] text-[#73e3d9]">
                        One-tap idea
                      </span>
                      <span className="mt-1 block text-sm font-black text-white">{label}</span>
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
