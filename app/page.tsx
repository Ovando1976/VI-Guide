import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  ChevronRight,
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

const ISLANDS = [
  {
    code: "STT",
    name: "St. Thomas",
    line: "Vibrant & dynamic",
    href: "/map?island=STT",
    image: "/images/usvi-harbor-hero.jpg",
  },
  {
    code: "STJ",
    name: "St. John",
    line: "Natural & serene",
    href: "/map?island=STJ",
    image: "/images/beaches/st-john/trunk-bay.jpg",
  },
  {
    code: "STX",
    name: "St. Croix",
    line: "Rich & authentic",
    href: "/map?island=STX",
    image: "/images/beaches/st-croix/cane-bay.jpg",
  },
] as const;

const QUICK = [
  { label: "Beaches", href: "/beaches", icon: Waves },
  { label: "Stays", href: "/accommodations", icon: BedDouble },
  { label: "Concierge", href: "/map?concierge=open", icon: Sparkles },
  { label: "Ride", href: "/mobility", icon: Navigation },
  { label: "Dining", href: "/places?category=restaurant", icon: UtensilsCrossed },
  { label: "Heritage", href: "/heritage", icon: History },
] as const;

const EXPERIENCES = [
  {
    eyebrow: "Top pick",
    title: "A beach day that flows",
    detail: "Pair a beautiful shoreline with nearby food, timing, and a reliable ride home.",
    href: "/beaches",
    icon: Waves,
  },
  {
    eyebrow: "Island culture",
    title: "Walk into living history",
    detail: "Explore forts, estates, churches, archives, and stories rooted in the places around you.",
    href: "/heritage",
    icon: History,
  },
  {
    eyebrow: "Made for you",
    title: "Let Concierge plan the day",
    detail: "Tell VI Concierge your mood, timing, and island. Get a practical plan you can actually follow.",
    href: "/map?concierge=open",
    icon: Sparkles,
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ea] pb-32 text-[#073b39]">
      <section className="relative isolate overflow-hidden px-4 pb-24 pt-5 text-[#073b39] sm:px-8 lg:px-12 lg:pb-28">
        <div className="absolute inset-0 -z-30 bg-[url('/images/usvi-harbor-hero.jpg')] bg-cover bg-[center_42%]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,251,241,.93)_0%,rgba(255,251,241,.72)_42%,rgba(255,255,255,.18)_76%,rgba(255,255,255,.06)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,.16)_0%,rgba(255,255,255,0)_58%,rgba(247,243,234,.82)_100%)]" />

        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/72 px-4 py-3 text-[#073b39] shadow-[0_14px_40px_rgba(4,51,49,.10)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="VI Guide home">
            <ViBrandMark className="h-11 w-11" priority />
            <div>
              <div className="font-serif text-xl font-bold tracking-[.02em]">VI Guide</div>
              <div className="text-[8px] font-black uppercase tracking-[.25em] text-[#b16a18]">U.S. Virgin Islands</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/search" className="hidden rounded-full border border-[#0f766e]/20 bg-white/80 px-4 py-2.5 text-[10px] font-black uppercase tracking-[.16em] text-[#073b39] sm:inline-flex">Search</Link>
            <Link href="/map?concierge=open" className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.15em] text-[#073b39] shadow-lg shadow-black/10">
              <Sparkles size={14} /> Ask VI Concierge
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b16a18]/20 bg-white/74 px-4 py-2 text-[9px] font-black uppercase tracking-[.23em] text-[#9a5a17] shadow-sm backdrop-blur">
              <SunMedium size={14} /> Experience paradise with confidence
            </div>
            <h1 className="mt-6 max-w-4xl font-serif text-[clamp(3.7rem,8vw,7rem)] font-semibold leading-[.84] tracking-[-.055em] text-[#073b39] drop-shadow-[0_2px_12px_rgba(255,255,255,.55)]">
              Paradise is
              <br />
              <span className="italic text-[#159b91]">calling you.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-semibold leading-7 text-[#173f3c] sm:text-lg">
              Discover beaches, stays, culture, dining, and transportation across St. Thomas, St. John, and St. Croix — all in one trusted local guide.
            </p>
            <Link href="/search" className="mt-8 flex max-w-xl items-center gap-3 rounded-[22px] border border-white/80 bg-white/92 p-2 pl-5 text-[#073b39] shadow-[0_20px_55px_rgba(4,51,49,.16)] transition hover:bg-white">
              <Search size={19} className="text-[#0f766e]" />
              <span className="flex-1 text-sm font-semibold text-slate-500">Search beaches, stays, tours, food, history…</span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f766e] text-white"><ArrowRight size={18} /></span>
            </Link>
          </div>

          <aside className="overflow-hidden rounded-[34px] border border-white/80 bg-[#fffdf8]/94 text-[#073b39] shadow-[0_28px_70px_rgba(4,51,49,.16)] backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-[#dce8e4] p-6 sm:p-7">
              <div>
                <div className="text-[9px] font-black uppercase tracking-[.22em] text-[#b16a18]">Explore the islands</div>
                <h2 className="mt-2 font-serif text-3xl font-bold tracking-[-.035em]">Find your island rhythm.</h2>
              </div>
              <Compass className="text-[#0f766e]" />
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-3 sm:p-5">
              {ISLANDS.map((island) => (
                <Link key={island.code} href={island.href} className="group relative min-h-[190px] overflow-hidden rounded-[24px] border border-[#dbe7e3] bg-[#eaf6f3]">
                  <div className="absolute inset-0 bg-cover bg-center transition duration-500 group-hover:scale-105" style={{ backgroundImage: `url(${island.image})` }} />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,51,49,.02),rgba(4,51,49,.68))]" />
                  <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                    <span className="rounded-full bg-[#0f766e]/90 px-2.5 py-1 text-[8px] font-black uppercase tracking-[.14em]">{island.code}</span>
                    <div className="mt-3 text-xl font-black">{island.name}</div>
                    <div className="mt-1 text-xs font-semibold text-white/80">{island.line}</div>
                  </div>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-12 max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="rounded-[30px] border border-[#d9e5e2] bg-white/96 p-4 shadow-[0_28px_80px_rgba(4,51,49,.14)] backdrop-blur sm:p-5">
          <div className="mb-4 flex items-center justify-between px-1">
            <div>
              <div className="text-[9px] font-black uppercase tracking-[.22em] text-[#b16a18]">Quick access</div>
              <h2 className="mt-1 text-2xl font-black tracking-[-.035em]">Everything you need, one tap away.</h2>
            </div>
            <Star className="text-[#d7a22d]" size={20} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK.map(({ label, href, icon: Icon }) => (
              <Link key={label} href={href} className="group flex min-h-[116px] flex-col items-center justify-center rounded-[22px] border border-[#dde9e6] bg-[#fbfdfc] p-4 text-center transition hover:-translate-y-0.5 hover:border-[#94cfc5] hover:bg-[#eff9f6] hover:shadow-lg">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f4f0] text-[#0f766e] transition group-hover:bg-[#073b39] group-hover:text-white"><Icon size={21} /></span>
                <span className="mt-3 text-xs font-black">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:px-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[9px] font-black uppercase tracking-[.22em] text-[#b16a18]">Curated for real island days</div>
            <h2 className="mt-2 max-w-3xl font-serif text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-5xl">More than a directory. <span className="italic text-[#0f766e]">A better way to experience the USVI.</span></h2>
          </div>
          <Link href="/map?mode=discovery" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.16em]">Explore everything <ArrowRight size={15} /></Link>
        </div>

        <div className="mt-9 grid gap-5 lg:grid-cols-3">
          {EXPERIENCES.map(({ eyebrow, title, detail, href, icon: Icon }, index) => (
            <Link key={title} href={href} className={`group flex min-h-[320px] flex-col overflow-hidden rounded-[30px] border p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${index === 0 ? "border-[#92d2c7] bg-[linear-gradient(145deg,#e8f8f4,#d9f2ed)]" : index === 1 ? "border-[#ead19c] bg-[linear-gradient(145deg,#fff8e8,#f8edcf)]" : "border-[#dbe5e2] bg-white"}`}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#073b39] text-white shadow-lg"><Icon size={23} /></span>
              <div className="mt-9 text-[9px] font-black uppercase tracking-[.22em] text-[#a85b16]">{eyebrow}</div>
              <h3 className="mt-2 font-serif text-3xl font-bold tracking-[-.035em]">{title}</h3>
              <p className="mt-4 flex-1 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
              <span className="mt-7 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.15em]">Open experience <ChevronRight size={16} className="transition group-hover:translate-x-1" /></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[36px] bg-[#073b39] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)] lg:grid-cols-[1.15fr_.85fr]">
          <div className="p-8 sm:p-10 lg:p-12">
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-[#f5c451]"><Sparkles size={14} /> VI Concierge</div>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-5xl">Tell us what kind of day you want.</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/66">VI Concierge connects the places, timing, transportation, and local context — so your plan feels effortless, not overwhelming.</p>
            <div className="mt-7 flex flex-wrap gap-2">
              {["A romantic St. John day", "Beaches and dinner on St. Thomas", "History and food on St. Croix"].map((prompt) => (
                <Link key={prompt} href={`/map?concierge=open&prompt=${encodeURIComponent(prompt)}`} className="rounded-full border border-white/14 bg-white/[.07] px-4 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/[.12]">{prompt}</Link>
              ))}
            </div>
            <Link href="/map?concierge=open" className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-[#073b39]">Start planning <ArrowRight size={16} /></Link>
          </div>
          <div className="relative min-h-[360px] overflow-hidden bg-[linear-gradient(160deg,#0f766e,#063b39)] p-7 sm:p-9">
            <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:24px_24px]" />
            <div className="relative space-y-4">
              <div className="ml-auto max-w-[82%] rounded-[24px_24px_6px_24px] border border-white/10 bg-[#0d5a56] p-4 text-sm font-semibold shadow-xl">Plan a perfect anniversary day in St. John.</div>
              <div className="max-w-[88%] rounded-[24px_24px_24px_6px] bg-white p-5 text-[#073b39] shadow-xl">
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#b16a18]">Your island itinerary</div>
                <div className="mt-3 space-y-3 text-sm font-bold">
                  <div className="flex gap-3"><MapPin size={16} className="text-[#0f766e]" /> Sunrise at Trunk Bay</div>
                  <div className="flex gap-3"><Waves size={16} className="text-[#0f766e]" /> Snorkel and beach time</div>
                  <div className="flex gap-3"><UtensilsCrossed size={16} className="text-[#0f766e]" /> Lunch in Cruz Bay</div>
                  <div className="flex gap-3"><CalendarDays size={16} className="text-[#0f766e]" /> Sunset and dinner</div>
                </div>
              </div>
              <div className="rounded-full border border-white/14 bg-white/[.08] px-5 py-3 text-sm font-semibold text-white/58">Ask anything about the islands…</div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[#d9e5e2] bg-white/70 px-4 py-12 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-7 sm:grid-cols-2 lg:grid-cols-4">
          {[
            [Palmtree, "Island first", "Built for travelers and locals who love the U.S. Virgin Islands."],
            [Compass, "One connected guide", "Maps, stays, culture, dining, transportation, and concierge."],
            [Star, "Curated experience", "A calmer, more useful way to decide what to do next."],
            [MapPin, "Rooted in place", "Local geography, heritage, businesses, and real island context."],
          ].map(([Icon, title, detail]) => {
            const ItemIcon = Icon as typeof Palmtree;
            return (
              <div key={String(title)} className="flex gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e5f4f0] text-[#0f766e]"><ItemIcon size={20} /></span>
                <div><div className="font-serif text-xl font-bold">{String(title)}</div><p className="mt-1 text-sm font-semibold leading-5 text-slate-500">{String(detail)}</p></div>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
