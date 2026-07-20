import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronRight,
  Clock3,
  Compass,
  History,
  Map,
  MapPin,
  Navigation,
  Palmtree,
  Search,
  Sparkles,
  Star,
  SunMedium,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

const QUICK_ACTIONS = [
  { title: "Ask Concierge", detail: "Build a complete island day", href: "/map?concierge=open", icon: Sparkles },
  { title: "Book a ride", detail: "Airport, ferry, beach, or dinner", href: "/mobility", icon: Navigation },
  { title: "Explore nearby", detail: "Open the intelligent territory map", href: "/map?mode=discovery", icon: Map },
  { title: "Find a stay", detail: "Compare island accommodations", href: "/accommodations", icon: BedDouble },
] as const;

const TODAY_PICKS = [
  {
    eyebrow: "Beach day",
    title: "Find your best shore",
    detail: "Compare beaches by island, setting, nearby places, and how the day fits together.",
    href: "/beaches",
    action: "Explore beaches",
    icon: Waves,
  },
  {
    eyebrow: "Eat local",
    title: "Plan around a great meal",
    detail: "Discover restaurants and pair food with beaches, history, shopping, and transportation.",
    href: "/places?category=restaurant",
    action: "Find food",
    icon: UtensilsCrossed,
  },
  {
    eyebrow: "Culture",
    title: "Step into island history",
    detail: "Explore reviewed heritage records, historic sites, and stories grounded in place.",
    href: "/heritage",
    action: "Open heritage",
    icon: History,
  },
] as const;

const ISLANDS = [
  { code: "STT", name: "St. Thomas", detail: "Harbor energy, beaches, dining, resorts, and east-end escapes", href: "/map?island=STT" },
  { code: "STJ", name: "St. John", detail: "Ferry-first adventures, national park, coves, and villas", href: "/map?island=STJ" },
  { code: "STX", name: "St. Croix", detail: "Historic towns, long coastlines, food, and cross-island days", href: "/map?island=STX" },
] as const;

const EXPLORE = [
  { title: "Beaches", detail: "Shorelines across the territory", href: "/beaches", icon: Waves },
  { title: "Places", detail: "Local places worth knowing", href: "/places", icon: Palmtree },
  { title: "Heritage", detail: "Stories rooted in place", href: "/heritage", icon: History },
  { title: "Saved trips", detail: "Return to your plans", href: "/trips", icon: CalendarDays },
] as const;

export default function Home() {
  return (
    <main className="home-page min-h-screen overflow-hidden pb-32 text-[#043331]">
      <section className="home-hero relative isolate overflow-hidden px-5 pb-28 pt-8 text-white sm:px-8 lg:px-12 lg:pb-32 lg:pt-12">
        <div className="home-hero__photo absolute inset-0 -z-30" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,34,33,.97)_0%,rgba(3,48,46,.9)_45%,rgba(3,44,43,.42)_78%,rgba(3,35,34,.7)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,rgba(20,184,166,.33),transparent_30%),linear-gradient(180deg,transparent_58%,rgba(4,51,49,.88))]" />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="VI Guide home">
            <ViBrandMark className="h-11 w-11" priority />
            <span>
              <strong className="block text-sm font-black tracking-[.02em]">VI Guide</strong>
              <span className="block text-[9px] font-bold uppercase tracking-[.23em] text-white/55">The territory, connected</span>
            </span>
          </Link>
          <Link href="/map?concierge=open" className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[.16em] backdrop-blur transition hover:bg-white/15 sm:px-5">
            <Sparkles size={15} /> Ask Concierge
          </Link>
        </div>

        <div className="mx-auto grid max-w-7xl gap-10 pt-16 lg:grid-cols-[1.06fr_.94fr] lg:items-end lg:pt-24">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f8ca62] backdrop-blur">
              <SunMedium size={14} /> Today in the U.S. Virgin Islands
            </div>
            <h1 className="max-w-4xl text-[clamp(3.25rem,7vw,6.4rem)] font-black leading-[.89] tracking-[-.065em]">
              Your island day,
              <br />
              <span className="font-serif font-medium italic text-[#8ce7db]">already connected.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-lg font-medium leading-8 text-white/76 sm:text-xl">
              Discover what fits, plan how to get there, and keep every part of your trip in one trusted local guide.
            </p>

            <Link href="/search" className="mt-8 flex max-w-2xl items-center gap-3 rounded-2xl border border-white/18 bg-white/12 p-2 pl-5 backdrop-blur-xl transition hover:bg-white/16">
              <Search size={19} className="text-[#8ce7db]" />
              <span className="flex-1 text-sm font-semibold text-white/72">Search beaches, stays, food, history, and places</span>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-white text-[#043331]"><ArrowRight size={18} /></span>
            </Link>

            <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-[10px] font-bold uppercase tracking-[.15em] text-white/56">
              <span className="inline-flex items-center gap-2"><MapPin size={14} className="text-[#70dfd2]" /> St. Thomas · St. John · St. Croix</span>
              <span className="inline-flex items-center gap-2"><Clock3 size={14} className="text-[#70dfd2]" /> Plan from arrival to ride home</span>
            </div>
          </div>

          <aside className="overflow-hidden rounded-[34px] border border-white/15 bg-[#062f2e]/84 shadow-[0_36px_90px_rgba(0,0,0,.38)] backdrop-blur-xl">
            <div className="border-b border-white/10 p-6 sm:p-7">
              <div className="flex items-center justify-between gap-4">
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f8ca62]"><span className="h-2 w-2 rounded-full bg-[#66e5d5] shadow-[0_0_18px_#66e5d5]" /> Daily planner</span>
                <Compass size={19} className="text-white/45" />
              </div>
              <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">What would make today memorable?</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/65">Start with a feeling or a practical need. The Concierge will connect places, timing, context, and transportation.</p>
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              {["Build a relaxed St. Thomas beach and dinner day", "Plan a car-free day trip to St. John", "Create a St. Croix history and food itinerary"].map((prompt) => (
                <Link key={prompt} href={`/map?concierge=open&prompt=${encodeURIComponent(prompt)}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.055] p-4 text-sm font-bold text-white/82 transition hover:border-[#67dfd1]/35 hover:bg-white/[.09]">
                  <span>{prompt}</span><ChevronRight size={17} className="shrink-0 text-[#79dfd4] transition group-hover:translate-x-1" />
                </Link>
              ))}
            </div>
            <Link href="/map?concierge=open" className="m-5 mt-0 flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#043331] transition hover:bg-[#fff7df]">
              Plan my day <ArrowRight size={18} />
            </Link>
          </aside>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-5 sm:px-8 lg:px-12" aria-labelledby="quick-actions-heading">
        <div className="rounded-[32px] border border-[#d7e7e3] bg-[#f8fbfa]/95 p-4 shadow-[0_28px_80px_rgba(4,51,49,.15)] backdrop-blur sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-4 px-2">
            <div>
              <div className="home-kicker">Start here</div>
              <h2 id="quick-actions-heading" className="mt-1 text-2xl font-black tracking-[-.035em]">One tap to what matters now</h2>
            </div>
            <Star size={20} className="text-[#d69118]" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_ACTIONS.map(({ title, detail, href, icon: Icon }) => (
              <Link key={title} href={href} className="group rounded-[22px] border border-[#dce8e5] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#89c8be] hover:shadow-lg">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]"><Icon size={21} /></span>
                <strong className="mt-5 block text-lg font-black">{title}</strong>
                <span className="mt-1 block text-sm font-medium leading-5 text-slate-500">{detail}</span>
                <ArrowRight size={16} className="mt-5 transition group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="home-kicker">Build today</div>
            <h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Turn an idea into an island experience.</h2>
          </div>
          <Link href="/map?concierge=open" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em]">Let Concierge combine them <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {TODAY_PICKS.map(({ eyebrow, title, detail, href, action, icon: Icon }) => (
            <Link key={title} href={href} className="group flex min-h-[310px] flex-col rounded-[28px] border border-[#dce6e3] bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:border-[#90cfc4] hover:shadow-xl">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]"><Icon size={23} /></span>
              <div className="mt-8 text-[10px] font-black uppercase tracking-[.22em] text-[#a85b16]">{eyebrow}</div>
              <h3 className="mt-2 text-2xl font-black tracking-[-.03em]">{title}</h3>
              <p className="mt-3 flex-1 text-[15px] font-medium leading-6 text-slate-600">{detail}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em]">{action} <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-[#dce6e3] bg-white/75 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-10">
            <div className="home-kicker">Choose your island</div>
            <h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Three islands.<br /><span className="font-serif font-medium italic text-[#0f766e]">Three distinct rhythms.</span></h2>
            <p className="mt-5 max-w-md font-medium leading-7 text-slate-600">Plan around the differences that matter: ferry access, driving time, geography, atmosphere, and how a day actually unfolds.</p>
          </div>
          <div className="space-y-3">
            {ISLANDS.map((island, index) => (
              <Link key={island.code} href={island.href} className="group grid gap-4 rounded-[26px] border border-[#dce6e3] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#90cfc4] hover:shadow-xl sm:grid-cols-[70px_1fr_auto] sm:items-center">
                <span className="text-3xl font-black text-[#d6e5e1]">0{index + 1}</span>
                <span><span className="block text-[10px] font-black uppercase tracking-[.22em] text-[#b05b13]">{island.code}</span><strong className="mt-1 block text-2xl font-black tracking-tight">{island.name}</strong><span className="mt-1 block text-sm font-medium leading-6 text-slate-500">{island.detail}</span></span>
                <span className="grid h-11 w-11 place-items-center rounded-full bg-[#edf7f4] text-[#0f766e] transition group-hover:bg-[#043331] group-hover:text-white"><ArrowRight size={17} /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><div className="home-kicker">Everything connected</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Keep exploring without losing your plan.</h2></div>
          <Link href="/map" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em]">See everything on the map <ArrowRight size={16} /></Link>
        </div>
        <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {EXPLORE.map(({ title, detail, href, icon: Icon }) => (
            <Link key={title} href={href} className="group rounded-[24px] border border-[#dce6e3] bg-white p-5 transition hover:border-[#8fc8bf] hover:shadow-xl">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]"><Icon size={21} /></span>
              <strong className="mt-6 block text-lg font-black">{title}</strong>
              <span className="mt-1 block text-sm font-medium text-slate-500">{detail}</span>
              <ArrowRight size={16} className="mt-5 transition group-hover:translate-x-1" />
            </Link>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="overflow-hidden rounded-[38px] bg-[#043331] p-8 text-white shadow-[0_30px_80px_rgba(4,51,49,.24)] sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f8ca62]"><Sparkles size={14} /> Your trip, intelligently connected</div>
            <h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">Come with a question.<br /><span className="font-serif font-medium italic text-[#7ce0d4]">Leave with a day you can use.</span></h2>
            <p className="mt-5 max-w-2xl font-medium leading-7 text-white/65">Bring the Concierge your island, pace, priorities, and practical constraints. It will connect discovery, local context, mapping, and mobility into one clear plan.</p>
          </div>
          <Link href="/map?concierge=open" className="mt-8 inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-[#f5b942] px-7 text-[11px] font-black uppercase tracking-[.18em] text-[#043331] transition hover:bg-[#ffca55] lg:mt-0">Start planning <ArrowRight size={17} /></Link>
        </div>
      </section>
    </main>
  );
}
