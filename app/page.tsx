import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CarFront,
  Compass,
  History,
  Map,
  MapPinned,
  Route,
  Search,
  Sparkles,
  Star,
  SunMedium,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { HomeConciergeHub } from "@/components/home/home-concierge-hub";
import { HomeLiveStatus } from "@/components/home/home-live-status";
import { HomePrimaryActions } from "@/components/home/home-primary-actions";

const ISLANDS = [
  { code: "STT", name: "St. Thomas", line: "Harbor energy, beaches, dining & nightlife", href: "/map?island=stt", image: "/images/usvi-harbor-hero.jpg" },
  { code: "STJ", name: "St. John", line: "National park, trails, coves & quiet water", href: "/map?island=stj", image: "/images/places/st-john/trunk-bay-beach-1.jpg" },
  { code: "STX", name: "St. Croix", line: "History, food, diving & a deeper island pace", href: "/map?island=stx", image: "/images/places/st-croix/cane-bay-beach-1.jpg" },
] as const;

const QUICK = [
  { label: "Live map", detail: "See the islands", href: "/map", icon: Map, image: "/images/places/st-john/trunk-bay-overlook-1.jpg", alt: "Trunk Bay overlook in St. John" },
  { label: "Beaches", detail: "Find your water", href: "/beaches", icon: Waves, image: "/images/places/st-thomas/magens-bay-beach-1.jpg", alt: "Magens Bay beach in St. Thomas" },
  { label: "Stays", detail: "Sleep island-side", href: "/accommodations", icon: BedDouble, image: "/images/accommodations/king-christian-hotel.jpg", alt: "King Christian Hotel in Christiansted" },
  { label: "Ride", detail: "Taxi · airport · ferry", href: "/mobility", icon: CarFront, image: "/images/mobility/usvi-taxi-van.png", alt: "White Ford passenger taxi van marked TAXI and ON DUTY on St. Thomas" },
  { label: "Dining", detail: "Eat local", href: "/places?category=restaurant", icon: UtensilsCrossed, image: "/images/places/st-thomas/hook-line-and-sinker-1.jpg", alt: "Waterfront dining in Frenchtown, St. Thomas" },
  { label: "My Trip", detail: "Run the whole trip", href: "/trips", icon: Route, image: "/images/places/st-croix/cane-bay-beach-1.jpg", alt: "Cane Bay coast in St. Croix" },
] as const;

const CONCIERGE_START_HREF = "/concierge?open=true&prompt=Plan%20a%20complete%20Virgin%20Islands%20day%20for%20me";

const HOME_FEATURES = [
  { eyebrow: "Discover", title: "See the islands as one connected place.", description: "Move from beach to restaurant to ferry to historic site without losing the context of where you are or what comes next.", href: "/map", image: "/images/places/st-john/trunk-bay-overlook-1.jpg", alt: "Scenic overlook above Trunk Bay in St. John", icon: MapPinned },
  { eyebrow: "Plan", title: "Turn inspiration into a trip you can actually run.", description: "Save places, build days, track bookings, watch timing, and keep the active trip synchronized across VI Guide.", href: "/trips", image: "/images/places/st-thomas/magens-bay-beach-1.jpg", alt: "Turquoise water and green hills at Magens Bay in St. Thomas", icon: Route },
  { eyebrow: "Ask", title: "A local-minded Concierge that knows your trip.", description: "Ask for a beach day, dinner, transfer, cruise plan, or complete itinerary and keep the answer connected to the rest of your journey.", href: CONCIERGE_START_HREF, image: "/images/sourced/historic/stt/frederick-lutheran-church.jpg", alt: "Historic Frederick Lutheran Church in Charlotte Amalie", icon: Sparkles },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-[calc(12rem+env(safe-area-inset-bottom))] text-[#032f2d] sm:pb-32">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-10 pt-5 text-white sm:px-7 lg:min-h-[850px] lg:px-10 lg:pb-14">
        <Image src="/images/usvi-harbor-hero.jpg" alt="Charlotte Amalie harbor and the hills of St. Thomas" fill priority sizes="100vw" className="-z-30 object-cover object-[66%_center] saturate-[1.08]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.97)_0%,rgba(3,47,45,.92)_39%,rgba(3,47,45,.46)_70%,rgba(3,47,45,.18)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_76%_18%,rgba(40,200,189,.22),transparent_28%),linear-gradient(180deg,rgba(2,31,29,.08),rgba(2,31,29,.42))]" />

        <ViPublicHeader
          actionHref={CONCIERGE_START_HREF}
          actionLabel="Ask Concierge"
          actionIcon={Sparkles}
          secondaryActions={<><Link href="/trips" className="hidden rounded-full border border-white/12 bg-white/[.07] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.15em] text-white/82 transition hover:-translate-y-0.5 hover:bg-white/[.12] md:inline-flex">My Trip</Link><Link href="/search" className="hidden rounded-full border border-white/12 bg-white/[.07] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.15em] text-white/82 transition hover:-translate-y-0.5 hover:bg-white/[.12] sm:inline-flex">Search</Link></>}
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-7 pt-14 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:gap-14 lg:pb-12 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f9d875] backdrop-blur-xl"><SunMedium size={14} /> VI Guide 2.0 · island travel OS</div>
            <h1 className="vi-display mt-7 max-w-4xl text-[clamp(4.1rem,9vw,7.7rem)] font-bold leading-[.82] text-white">Paradise,<span className="block italic text-[#73e3d9]">connected.</span></h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/76 sm:text-xl sm:leading-8">One intelligent travel layer for the U.S. Virgin Islands — discover where to go, understand what is around you, build the trip, move between stops, and get help without jumping between five different apps.</p>

            <HomePrimaryActions conciergeHref={CONCIERGE_START_HREF} />

            <Link href="/search" className="mt-8 flex max-w-2xl items-center gap-3 rounded-[24px] border border-white/16 bg-white/[.10] p-2.5 pl-5 shadow-[0_24px_65px_rgba(2,31,29,.28)] backdrop-blur-2xl transition hover:bg-white/[.14]">
              <Search size={19} className="text-[#73e3d9]" />
              <span className="flex-1 text-sm font-semibold text-white/58">Search beaches, stays, food, events, history, local stories…</span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#032f2d]"><ArrowRight size={18} /></span>
            </Link>

            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[9px] font-black uppercase tracking-[.16em] text-white/48">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#73e3d9]" /> Local context</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#73e3d9]" /> Trip continuity</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#73e3d9]" /> Map + mobility</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#73e3d9]" /> Human + AI planning</span>
            </div>
          </div>

          <aside className="vi-glass overflow-hidden rounded-[34px] p-4 sm:p-5 lg:p-6">
            <div className="flex items-start justify-between gap-4 px-2 pb-5">
              <div><div className="vi-eyebrow text-[#f5c451]">Choose your island</div><h2 className="vi-display mt-2 text-3xl font-bold text-white sm:text-4xl">Start where you are.</h2><p className="mt-2 text-sm font-semibold leading-6 text-white/55">VI Guide keeps the island context with you across Explore, Map, Concierge, and My Trip.</p></div>
              <Compass className="mt-1 shrink-0 text-[#73e3d9]" />
            </div>
            <div className="space-y-3">
              {ISLANDS.map((island, index) => (
                <Link key={island.code} href={island.href} className="group relative flex min-h-[134px] items-end overflow-hidden rounded-[25px] border border-white/12 p-5 shadow-lg">
                  <Image src={island.image} alt={`${island.name} in the U.S. Virgin Islands`} fill sizes="(min-width: 1024px) 40vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,31,29,.86),rgba(2,31,29,.32)_72%,rgba(2,31,29,.1))]" />
                  <span className="relative flex w-full items-end justify-between gap-4"><span><span className="inline-flex rounded-full bg-[#f5c451] px-2.5 py-1 text-[8px] font-black uppercase tracking-[.14em] text-[#032f2d]">{index === 0 ? "Gateway · " : ""}{island.code}</span><span className="mt-2 block text-xl font-black text-white">{island.name}</span><span className="mt-1 block text-xs font-semibold text-white/68">{island.line}</span></span><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/16 bg-white/[.10] text-white backdrop-blur transition group-hover:bg-[#f5c451] group-hover:text-[#032f2d]"><ArrowRight size={17} /></span></span>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="vi-glass grid grid-cols-2 gap-2 rounded-[30px] p-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {QUICK.map(({ label, detail, href, image, alt, icon: Icon }) => (
              <Link key={label} href={href} className="group relative flex min-h-[112px] items-end overflow-hidden rounded-[21px] border border-white/10 bg-[#032f2d] p-3 shadow-[0_12px_32px_rgba(2,31,29,.16)] transition hover:-translate-y-0.5 hover:border-[#f5c451]/55">
                <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,31,29,.08),rgba(2,31,29,.36)_48%,rgba(2,31,29,.93)_100%)]" />
                <span className="relative flex w-full items-end gap-2.5"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/92 text-[#0f766e] shadow-lg backdrop-blur transition group-hover:bg-[#f5c451] group-hover:text-[#032f2d]"><Icon size={17} /></span><span className="min-w-0 pb-0.5"><span className="block truncate text-xs font-black text-white">{label}</span><span className="mt-0.5 block truncate text-[9px] font-bold text-white/62">{detail}</span></span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeLiveStatus />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-7 lg:px-10 lg:py-24">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="vi-eyebrow text-[#9b5d12]">One connected experience</div><h2 className="vi-display mt-3 max-w-4xl text-4xl font-bold leading-[.95] sm:text-6xl">Stop using the islands like a pile of disconnected searches.</h2></div><p className="max-w-xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">VI Guide is being built as a travel operating system: discovery, intelligence, mapping, planning, mobility, bookings, and Concierge all sharing the same trip context.</p></div>
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {HOME_FEATURES.map(({ eyebrow, title, description, href, image, alt, icon: Icon }) => (
            <Link key={title} href={href} className="group relative min-h-[510px] overflow-hidden rounded-[34px] bg-[#032f2d] shadow-[0_24px_70px_rgba(2,31,29,.14)]">
              <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 33vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
              <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,31,29,.02)_18%,rgba(2,31,29,.28)_45%,rgba(2,31,29,.94)_100%)]" />
              <span className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-7"><span className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-[#f5c451] text-[#032f2d] shadow-lg transition group-hover:-rotate-3 group-hover:scale-105"><Icon size={21} /></span><span className="vi-eyebrow text-[#73e3d9]">{eyebrow}</span><span className="vi-display mt-2 block text-3xl font-bold leading-[1.02]">{title}</span><span className="mt-4 block text-sm font-semibold leading-6 text-white/66">{description}</span><span className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#f5c451]">Open in VI Guide <ArrowRight size={14} /></span></span>
            </Link>
          ))}
        </div>
      </section>

      <HomeConciergeHub />

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-7 lg:px-10">
        <div className="overflow-hidden rounded-[36px] border border-[#d5e4df] bg-[#fffdf8] shadow-[0_24px_70px_rgba(2,31,29,.09)]">
          <div className="grid lg:grid-cols-[.9fr_1.1fr]">
            <div className="p-7 sm:p-10 lg:p-12"><div className="vi-eyebrow text-[#9b5d12]">Your island rhythm</div><h2 className="vi-display mt-3 text-4xl font-bold leading-[.96] sm:text-5xl">Explore deeper. Plan smarter. Move easier.</h2><p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-slate-600">The product should feel unmistakably Virgin Islands from the first screen — while still behaving like a serious modern travel platform underneath.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/places" className="inline-flex items-center gap-2 rounded-full bg-[#032f2d] px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-white">Explore places <ArrowRight size={14} /></Link><Link href="/heritage" className="inline-flex items-center gap-2 rounded-full border border-[#d5e4df] bg-white px-5 py-3 text-[10px] font-black uppercase tracking-[.15em] text-[#032f2d]"><History size={14} /> Heritage</Link></div></div>
            <div className="relative min-h-[360px] lg:min-h-[420px]"><Image src="/images/places/st-croix/cane-bay-beach-1.jpg" alt="Caribbean coastline at Cane Bay in St. Croix" fill sizes="(min-width: 1024px) 55vw, 100vw" className="object-cover" /><div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,253,248,.42),transparent_45%)] lg:bg-[linear-gradient(90deg,rgba(255,253,248,.28),transparent_35%)]" /><div className="absolute bottom-5 right-5 rounded-[22px] border border-white/30 bg-[#032f2d]/88 px-5 py-4 text-white shadow-xl backdrop-blur-xl"><div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-[.16em] text-[#73e3d9]"><Star size={12} /> Built for the VI</div><div className="mt-1 text-sm font-black">St. Thomas · St. John · St. Croix</div></div></div>
          </div>
        </div>
      </section>
    </main>
  );
}
