import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Binoculars,
  CalendarDays,
  CarFront,
  Fish,
  Landmark,
  Map,
  Sailboat,
  ShieldCheck,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

import { ViPublicFooter } from "@/components/brand/vi-public-footer";
import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { ACCOMMODATIONS } from "@/lib/accommodations";
import { BOOKABLE_EXPERIENCES } from "@/lib/bookable-experiences";
import { CAR_RENTAL_OPERATORS } from "@/lib/car-rentals";
import { OFFICIAL_USVI_CRUISE_PORT_CALLS } from "@/lib/cruise-port-calls";
import { USVI_EVENTS } from "@/lib/events";
import { CAR_BARGE_ROUTES, FERRY_ROUTES } from "@/lib/ferry-planner";
import { FISHING_SPECIES } from "@/lib/fishing-handbook";
import { getTravelKnowledge } from "@/lib/travel-knowledge";

export const metadata: Metadata = {
  title: "Explore St. Thomas, St. John & St. Croix",
  description:
    "Explore verified stays, activities, events, transportation, beaches, history, dining, and practical island guidance across the U.S. Virgin Islands.",
  alternates: { canonical: "/explore" },
};

const places = getTravelKnowledge("places");
const beaches = getTravelKnowledge("beaches");
const historic = getTravelKnowledge("historic");

const MODULES = [
  {
    title: "Places & dining",
    eyebrow: "Local directory",
    description: "Island towns, restaurants, waterfront districts, shopping, viewpoints, and practical stops.",
    href: "/places",
    image: "/images/usvi-harbor-hero.jpg",
    count: `${places.length} places`,
    standard: "Curated catalog",
    icon: UtensilsCrossed,
  },
  {
    title: "Beaches",
    eyebrow: "Shoreline guide",
    description: "Compare beaches by island, open live conditions, map the stop, and connect a ride or itinerary.",
    href: "/beaches",
    image: "/images/places/st-john/trunk-bay-beach-1.jpg",
    count: `${beaches.length} beaches`,
    standard: "Conditions-aware",
    icon: Waves,
  },
  {
    title: "Stays",
    eyebrow: "Where to stay",
    description: "Hotels, resorts, villas, apartments, and guesthouses with source and contact details.",
    href: "/accommodations",
    image: "/images/accommodations/king-christian-hotel.jpg",
    count: `${ACCOMMODATIONS.length} stays`,
    standard: "Source checked",
    icon: BedDouble,
  },
  {
    title: "Tours & experiences",
    eyebrow: "Things to do",
    description: "Operator-linked snorkeling, diving, sailing, culture, fishing, paddling, and island adventures.",
    href: "/activities",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    count: `${BOOKABLE_EXPERIENCES.length} experiences`,
    standard: "Operator sourced",
    icon: Binoculars,
  },
  {
    title: "Events",
    eyebrow: "What is happening",
    description: "Dated festivals, sports, food, and cultural events with published sources and review dates.",
    href: "/events",
    image: "/images/usvi-harbor-hero.jpg",
    count: `${USVI_EVENTS.length} published events`,
    standard: "Date verified",
    icon: CalendarDays,
  },
  {
    title: "History & heritage",
    eyebrow: "Know the islands",
    description: "Historic districts, forts, estates, landmarks, and cultural landscapes grounded in public records.",
    href: "/historic",
    image: "/images/places/st-thomas/99-steps-1.jpg",
    count: `${historic.length} sites`,
    standard: "Evidence linked",
    icon: Landmark,
  },
  {
    title: "Ferries & barges",
    eyebrow: "Move between islands",
    description: "Passenger ferries, car barges, practical connections, fares, and schedule-aware planning.",
    href: "/ferry",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    count: `${FERRY_ROUTES.length + CAR_BARGE_ROUTES.length} routes`,
    standard: "Schedule sourced",
    icon: Sailboat,
  },
  {
    title: "Cruise days",
    eyebrow: "Port-day planning",
    description: "Official port calls, all-aboard timing, shore excursions, transportation, and day-plan protection.",
    href: "/cruises",
    image: "/images/usvi-harbor-hero.jpg",
    count: `${OFFICIAL_USVI_CRUISE_PORT_CALLS.length} port calls`,
    standard: "Official schedules",
    icon: Map,
  },
  {
    title: "Car rentals",
    eyebrow: "Island mobility",
    description: "Compare airport, ferry, and local pickup operators across all three main islands.",
    href: "/car-rentals",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    count: `${CAR_RENTAL_OPERATORS.length} operators`,
    standard: "Operator checked",
    icon: CarFront,
  },
  {
    title: "Fishing handbook",
    eyebrow: "Responsible recreation",
    description: "Protected and restricted species guidance connected to current-rule confirmation and trip planning.",
    href: "/fishing",
    image: "/images/places/st-john/trunk-bay-beach-1.jpg",
    count: `${FISHING_SPECIES.length} species notes`,
    standard: "Rules first",
    icon: Fish,
  },
] as const;

export default function ExplorePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-14 pt-5 text-white sm:px-7 lg:px-10 lg:pb-20">
        <Image
          src="/images/usvi-harbor-hero.jpg"
          alt="Charlotte Amalie harbor and the hills of St. Thomas"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-[66%_center]"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,24,24,.98)_0%,rgba(3,47,45,.92)_48%,rgba(3,47,45,.44)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_12%,rgba(115,227,217,.2),transparent_30%)]" />

        <ViPublicHeader actionHref="/concierge?open=true" actionLabel="Ask Concierge" actionIcon={Sparkles} secondaryHref="/trips" secondaryLabel="My Trip" />

        <div className="mx-auto grid max-w-7xl gap-10 pb-5 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:gap-16 lg:pt-28">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f9d875] backdrop-blur-xl">
              <ShieldCheck size={14} /> The complete island guide
            </div>
            <h1 className="vi-display mt-7 max-w-5xl text-[clamp(4rem,8vw,7.5rem)] font-bold leading-[.82] text-white">
              Know more.
              <span className="block italic text-[#73e3d9]">Plan with confidence.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-8 text-white/76 sm:text-xl">
              Go beyond a list of attractions. Compare island choices, see where the information comes from, and move every discovery into maps, transportation, Concierge, and one connected trip.
            </p>
          </div>

          <aside className="vi-glass rounded-[32px] p-6 sm:p-7">
            <div className="vi-eyebrow text-[#f5c451]">USVI Explorer standard</div>
            <h2 className="vi-display mt-3 text-3xl font-bold text-white">Useful beats encyclopedic.</h2>
            <div className="mt-6 grid gap-3">
              {[
                ["Evidence", "Official and operator sources are shown when available."],
                ["Freshness", "Changing details are dated or clearly marked for confirmation."],
                ["Action", "Every discovery can become a map stop, ride, or trip decision."],
              ].map(([label, copy]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-black/10 p-4">
                  <div className="text-[9px] font-black uppercase tracking-[.17em] text-[#73e3d9]">{label}</div>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/66">{copy}</p>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-7 lg:px-10 lg:py-16" aria-labelledby="guide-modules-title">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="vi-eyebrow text-[#0f766e]">Explore every module</div>
            <h2 id="guide-modules-title" className="vi-display mt-3 max-w-3xl text-4xl font-bold sm:text-6xl">One guide, built around the whole trip.</h2>
          </div>
          <Link href="/map" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-[#b8dcd6] bg-white px-5 text-[10px] font-black uppercase tracking-[.15em] text-[#0f766e] transition hover:-translate-y-0.5 hover:border-[#0f766e]">
            Open Living Map <ArrowRight size={15} />
          </Link>
        </div>

        <div className="mt-9 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((module, index) => {
            const Icon = module.icon;
            return (
              <article key={module.href} className={`group overflow-hidden rounded-[30px] border border-[#d7e4e0] bg-[#fffdf8] shadow-[0_16px_45px_rgba(4,51,49,.08)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_65px_rgba(4,51,49,.14)] ${index === 0 || index === 3 ? "xl:col-span-2" : ""}`}>
                <Link href={module.href} className="grid h-full sm:grid-cols-[.92fr_1.08fr] xl:min-h-[23rem]">
                  <div className="relative min-h-56 overflow-hidden">
                    <Image src={module.image} alt="" fill sizes="(max-width: 768px) 100vw, 40vw" className="object-cover transition duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(2,38,37,.66),rgba(2,38,37,.04)_70%)]" />
                    <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/25 bg-[#043331]/78 px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white backdrop-blur">
                      <ShieldCheck size={12} className="text-[#73e3d9]" /> {module.standard}
                    </span>
                  </div>
                  <div className="flex flex-col p-6 sm:p-7">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#043331] text-[#f5c451]"><Icon size={22} /></span>
                    <div className="vi-eyebrow mt-6 text-[#0f766e]">{module.eyebrow}</div>
                    <h3 className="vi-display mt-2 text-3xl font-bold leading-none">{module.title}</h3>
                    <p className="mt-4 flex-1 text-sm font-semibold leading-6 text-[#607370]">{module.description}</p>
                    <div className="mt-6 flex items-center justify-between border-t border-[#e1ebe8] pt-5">
                      <span className="text-[9px] font-black uppercase tracking-[.15em] text-[#8a5d13]">{module.count}</span>
                      <span className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.15em] text-[#043331]">Open guide <ArrowRight size={14} className="text-[#0f766e]" /></span>
                    </div>
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-7 lg:px-10">
        <div className="grid gap-6 rounded-[34px] bg-[#f5c451] p-7 shadow-[0_24px_70px_rgba(4,51,49,.16)] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="vi-eyebrow text-[#735018]">From research to a real island day</div>
            <h2 className="vi-display mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">Let Concierge connect the modules for you.</h2>
            <p className="mt-4 max-w-2xl text-sm font-semibold leading-7 text-[#514b36]">Bring your island, dates, interests, mobility needs, and must-do stops. USVI Explorer turns the guide into one practical plan.</p>
          </div>
          <Link href="/concierge?open=true&prompt=Help%20me%20build%20a%20complete%20USVI%20trip%20using%20the%20best%20places%2C%20beaches%2C%20activities%2C%20transportation%2C%20and%20events" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#032f2d] px-7 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-[#064844]">
            Build my island plan <Sparkles size={16} className="text-[#73e3d9]" />
          </Link>
        </div>
      </section>

      <ViPublicFooter />
    </main>
  );
}
