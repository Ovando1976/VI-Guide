import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Check,
  ChevronRight,
  Compass,
  Headphones,
  History,
  Map,
  MapPin,
  Navigation,
  Palmtree,
  ShieldCheck,
  Sparkles,
  Star,
  Waves,
} from "lucide-react";

const JOURNEYS = [
  { eyebrow: "Move", title: "Plan an island taxi", description: "Build an estate-to-estate trip using the official USVI taxi structure for airport arrivals, ferry transfers, beaches, resorts, and nights out.", href: "/mobility", action: "Plan a taxi", icon: Navigation, className: "home-journey--gold" },
  { eyebrow: "Discover", title: "Explore the territory", description: "See estates, local places, beaches, history, stays, and movement context together on one intelligent map.", href: "/map?mode=discovery", action: "Open the map", icon: Map, className: "home-journey--aqua" },
  { eyebrow: "Stay", title: "Find your island base", description: "Compare accommodations by island, area, and what you want within reach during your trip.", href: "/accommodations", action: "Browse stays", icon: BedDouble, className: "home-journey--cream" },
] as const;

const ISLANDS = [
  { code: "STT", name: "St. Thomas", detail: "Harbor energy, beaches, dining, and east-end escapes", href: "/map?island=STT" },
  { code: "STJ", name: "St. John", detail: "Ferry-first adventures, national park, coves, and villas", href: "/map?island=STJ" },
  { code: "STX", name: "St. Croix", detail: "Historic towns, long coastlines, food, and cross-island days", href: "/map?island=STX" },
] as const;

const DISCOVER = [
  { title: "Beaches", detail: "53 shores across the territory", href: "/beaches", icon: Waves },
  { title: "Places", detail: "150 local places to know", href: "/places", icon: Palmtree },
  { title: "History", detail: "Stories rooted in place", href: "/historic", icon: History },
  { title: "Saved trips", detail: "Return to your plans", href: "/trips", icon: Navigation },
] as const;

export default function Home() {
  return (
    <main className="home-page min-h-screen overflow-hidden pb-32 text-[#043331]">
      <section className="home-hero relative isolate min-h-[760px] overflow-hidden px-5 pb-28 pt-8 text-white sm:px-8 lg:px-12 lg:pb-36 lg:pt-12">
        <div className="home-hero__photo absolute inset-0 -z-30" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,34,33,.96)_0%,rgba(3,48,46,.86)_42%,rgba(3,44,43,.34)_76%,rgba(3,35,34,.62)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_20%,rgba(20,184,166,.35),transparent_30%),linear-gradient(180deg,transparent_65%,rgba(4,51,49,.78))]" />

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6">
          <Link href="/" className="inline-flex items-center gap-3" aria-label="VI Guide home">
            <ViBrandMark className="h-11 w-11" priority />
            <span><strong className="block text-sm font-black tracking-[.02em]">VI Guide</strong><span className="block text-[9px] font-bold uppercase tracking-[.23em] text-white/55">The territory, connected</span></span>
          </Link>
          <Link href="/map?concierge=open" className="hidden items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-[10px] font-black uppercase tracking-[.18em] backdrop-blur transition hover:bg-white/15 sm:inline-flex"><Sparkles size={15} /> Ask the concierge</Link>
        </div>

        <div className="mx-auto grid max-w-7xl items-end gap-12 pt-24 lg:grid-cols-[1.15fr_.85fr] lg:pt-32">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[.23em] text-[#f8ca62] backdrop-blur"><MapPin size={14} /> U.S. Virgin Islands · local intelligence</div>
            <h1 className="max-w-4xl text-[clamp(3.5rem,7vw,6.7rem)] font-black leading-[.88] tracking-[-.065em]">The islands,<br /><span className="font-serif font-medium italic text-[#8ce7db]">within reach.</span></h1>
            <p className="mt-8 max-w-2xl text-lg font-medium leading-8 text-white/75 sm:text-xl">A smarter guide to St. Thomas, St. John, and St. Croix—built to help you discover well, decide confidently, and move naturally.</p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/map" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-[#f5b942] px-7 text-[11px] font-black uppercase tracking-[.18em] text-[#043331] shadow-[0_20px_48px_rgba(0,0,0,.28)] transition hover:-translate-y-0.5 hover:bg-[#ffca55]">Explore the islands <ArrowRight size={17} /></Link>
              <Link href="/mobility" className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border border-white/25 bg-white/10 px-7 text-[11px] font-black uppercase tracking-[.18em] text-white backdrop-blur transition hover:bg-white/16"><Navigation size={17} /> Plan a ride</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-[10px] font-bold uppercase tracking-[.16em] text-white/55">
              <span className="inline-flex items-center gap-2"><Check size={14} className="text-[#6ee7d6]" /> Three islands</span>
              <span className="inline-flex items-center gap-2"><Check size={14} className="text-[#6ee7d6]" /> 200+ local records</span>
              <span className="inline-flex items-center gap-2"><Check size={14} className="text-[#6ee7d6]" /> Official taxi-rate logic</span>
            </div>
          </div>

          <aside className="home-concierge-card overflow-hidden rounded-[34px] border border-white/15 bg-[#062f2e]/80 shadow-[0_36px_90px_rgba(0,0,0,.38)] backdrop-blur-xl">
            <div className="border-b border-white/10 p-6 sm:p-7">
              <div className="flex items-center justify-between"><span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f8ca62]"><span className="h-2 w-2 rounded-full bg-[#66e5d5] shadow-[0_0_18px_#66e5d5]" /> VI Guide Concierge</span><Headphones size={18} className="text-white/45" /></div>
              <h2 className="mt-4 text-3xl font-black tracking-[-.04em]">Start with what you want your day to feel like.</h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/65">Tell me your island, pace, people, and priorities. I’ll turn them into a grounded plan you can explore and act on.</p>
            </div>
            <div className="space-y-2 p-4 sm:p-5">
              {["A quiet St. John beach day without a car", "Dinner in Charlotte Amalie, then a ride home", "Three days on St. Croix with history and food"].map((prompt) => <Link key={prompt} href={`/map?concierge=open&prompt=${encodeURIComponent(prompt)}`} className="group flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.055] p-4 text-sm font-bold text-white/82 transition hover:border-[#67dfd1]/35 hover:bg-white/[.09]"><span>{prompt}</span><ChevronRight size={17} className="shrink-0 text-[#79dfd4] transition group-hover:translate-x-1" /></Link>)}
            </div>
            <Link href="/map?concierge=open" className="m-5 mt-0 flex items-center justify-between rounded-2xl bg-white px-5 py-4 text-sm font-black text-[#043331] transition hover:bg-[#fff7df]">Ask anything about the islands <ArrowRight size={18} /></Link>
          </aside>
        </div>
      </section>

      <section className="relative z-10 mx-auto -mt-16 max-w-7xl px-5 sm:px-8 lg:px-12" aria-labelledby="journey-heading">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><div className="home-kicker">Begin your journey</div><h2 id="journey-heading" className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">What would make today better?</h2></div><p className="max-w-sm text-sm font-medium leading-6 text-slate-500">Every path stays connected—from first idea to final ride.</p></div>
        <div className="grid gap-4 lg:grid-cols-3">{JOURNEYS.map(({ eyebrow, title, description, href, action, icon: Icon, className }) => <Link key={title} href={href} className={`home-journey group ${className}`}><span className="home-journey__icon"><Icon size={23} /></span><div className="mt-8 text-[10px] font-black uppercase tracking-[.22em] text-[#a85b16]">{eyebrow}</div><h3 className="mt-2 text-2xl font-black tracking-[-.03em]">{title}</h3><p className="mt-3 flex-1 text-[15px] font-medium leading-6 text-slate-600">{description}</p><span className="mt-7 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em]">{action} <ArrowRight size={16} className="transition group-hover:translate-x-1" /></span></Link>)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[.72fr_1.28fr] lg:items-start">
          <div className="lg:sticky lg:top-10"><div className="home-kicker">Choose your island</div><h2 className="mt-3 text-4xl font-black leading-[.98] tracking-[-.05em] sm:text-5xl">Three islands.<br /><span className="font-serif font-medium italic text-[#0f766e]">Three distinct rhythms.</span></h2><p className="mt-5 max-w-md font-medium leading-7 text-slate-600">VI Guide respects the differences that matter: ferry access, driving time, geography, atmosphere, and how a day actually unfolds.</p></div>
          <div className="space-y-3">{ISLANDS.map((island, index) => <Link key={island.code} href={island.href} className="group grid gap-4 rounded-[26px] border border-[#dce6e3] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#90cfc4] hover:shadow-xl sm:grid-cols-[70px_1fr_auto] sm:items-center"><span className="text-3xl font-black text-[#d6e5e1]">0{index + 1}</span><span><span className="block text-[10px] font-black uppercase tracking-[.22em] text-[#b05b13]">{island.code}</span><strong className="mt-1 block text-2xl font-black tracking-tight">{island.name}</strong><span className="mt-1 block text-sm font-medium leading-6 text-slate-500">{island.detail}</span></span><span className="grid h-11 w-11 place-items-center rounded-full bg-[#edf7f4] text-[#0f766e] transition group-hover:bg-[#043331] group-hover:text-white"><ArrowRight size={17} /></span></Link>)}</div>
        </div>
      </section>

      <section className="border-y border-[#dce6e3] bg-white/75 px-5 py-20 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl"><div className="flex flex-wrap items-end justify-between gap-4"><div><div className="home-kicker">Explore with context</div><h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">The useful parts of the islands, connected.</h2></div><Link href="/map" className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[.16em]">See everything on the map <ArrowRight size={16} /></Link></div><div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{DISCOVER.map(({ title, detail, href, icon: Icon }) => <Link key={title} href={href} className="group rounded-[24px] border border-[#dce6e3] bg-white p-5 transition hover:border-[#8fc8bf] hover:shadow-xl"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e8f5f2] text-[#0f766e]"><Icon size={21} /></span><strong className="mt-6 block text-lg font-black">{title}</strong><span className="mt-1 block text-sm font-medium text-slate-500">{detail}</span><ArrowRight size={16} className="mt-5 transition group-hover:translate-x-1" /></Link>)}</div></div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-12"><div className="overflow-hidden rounded-[38px] bg-[#043331] p-8 text-white shadow-[0_30px_80px_rgba(4,51,49,.24)] sm:p-12 lg:flex lg:items-center lg:justify-between lg:gap-12"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.22em] text-[#f8ca62]"><Star size={14} /> Your trip, intelligently connected</div><h2 className="mt-4 text-4xl font-black tracking-[-.05em] sm:text-5xl">Come with a question.<br /><span className="font-serif font-medium italic text-[#7ce0d4]">Leave with a plan.</span></h2><p className="mt-5 max-w-2xl font-medium leading-7 text-white/65">The concierge understands the live map, your route, and the local directory—then gives you clear options without pretending to book or spend on your behalf.</p><div className="mt-6 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-[.15em] text-white/55"><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#70dfd2]" /> Grounded recommendations</span><span className="inline-flex items-center gap-2"><Compass size={15} className="text-[#70dfd2]" /> Live territory context</span></div></div><Link href="/map?concierge=open" className="mt-8 inline-flex min-h-14 shrink-0 items-center justify-center gap-3 rounded-full bg-[#f5b942] px-7 text-[11px] font-black uppercase tracking-[.18em] text-[#043331] transition hover:bg-[#ffca55] lg:mt-0">Meet your concierge <ArrowRight size={17} /></Link></div></section>
    </main>
  );
}
