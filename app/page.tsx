import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BedDouble,
  Compass,
  History,
  MapPin,
  Navigation,
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
    href: "/map?island=stt",
    image: "/images/usvi-harbor-hero.jpg",
  },
  {
    code: "STJ",
    name: "St. John",
    line: "Natural & serene",
    href: "/map?island=stj",
    image: "/images/places/st-john/trunk-bay-beach-1.jpg",
  },
  {
    code: "STX",
    name: "St. Croix",
    line: "Rich & authentic",
    href: "/map?island=stx",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
  },
] as const;

const QUICK = [
  {
    label: "Beaches",
    href: "/beaches",
    icon: Waves,
    image: "/images/beaches/st-thomas/magens-bay-1.jpg",
    alt: "Magens Bay beach in St. Thomas",
  },
  {
    label: "Stays",
    href: "/accommodations",
    icon: BedDouble,
    image: "/images/accommodations/king-christian-hotel.jpg",
    alt: "King Christian Hotel in Christiansted",
  },
  {
    label: "Concierge",
    href: "/concierge",
    icon: Sparkles,
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay overlook in St. John",
  },
  {
    label: "Ride",
    href: "/mobility",
    icon: Navigation,
    image: "/images/places/st-thomas/red-hook-ferry-terminal-1.jpg",
    alt: "Red Hook ferry terminal in St. Thomas",
  },
  {
    label: "Dining",
    href: "/places?category=restaurant",
    icon: UtensilsCrossed,
    image: "/images/places/st-thomas/hook-line-and-sinker-1.jpg",
    alt: "Waterfront dining in Frenchtown, St. Thomas",
  },
  {
    label: "Heritage",
    href: "/heritage",
    icon: History,
    image: "/images/sourced/historic/stt/frederick-lutheran-church.jpg",
    alt: "Frederick Lutheran Church in Charlotte Amalie",
  },
] as const;

const CONCIERGE_START_HREF =
  "/concierge?open=true&prompt=Plan%20a%20complete%20Virgin%20Islands%20day%20for%20me";

const HOME_FEATURES = [
  {
    title: "A beach day that flows",
    description:
      "Pair a verified shoreline with nearby food, timing, and a reliable ride home.",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    alt: "Turquoise water and green hills at Magens Bay in St. Thomas",
    icon: Waves,
    iconClassName: "bg-[#dff4ef] text-[#0f766e]",
  },
  {
    title: "Walk into living history",
    description:
      "Explore forts, estates, churches, archives, and stories rooted in place.",
    image: "/images/sourced/historic/stt/frederick-lutheran-church.jpg",
    alt: "Historic Frederick Lutheran Church in Charlotte Amalie",
    icon: History,
    iconClassName: "bg-[#fff1d4] text-[#a85b16]",
  },
  {
    title: "Let Concierge plan the day",
    description:
      "Tell VI Concierge your mood, timing, and island. Get a practical plan you can actually follow.",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Scenic overlook above Trunk Bay in St. John",
    icon: Sparkles,
    iconClassName: "bg-[#dff4ef] text-[#0f766e]",
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f3ea] pb-32 text-[#073b39]">
      <section className="relative isolate overflow-hidden px-4 pb-24 pt-5 sm:px-8 lg:px-12 lg:pb-28">
        <div className="absolute inset-0 -z-30 bg-[url('/images/usvi-harbor-hero.jpg')] bg-cover bg-[center_42%]" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(255,251,241,.93)_0%,rgba(255,251,241,.72)_42%,rgba(255,255,255,.18)_76%,rgba(255,255,255,.06)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(255,255,255,.16)_0%,rgba(255,255,255,0)_58%,rgba(247,243,234,.82)_100%)]" />

        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/72 px-4 py-3 shadow-[0_14px_40px_rgba(4,51,49,.10)] backdrop-blur-xl sm:px-5">
          <Link href="/" className="flex items-center gap-3" aria-label="VI Guide home">
            <ViBrandMark className="h-11 w-11" priority />
            <div>
              <div className="font-serif text-xl font-bold tracking-[.02em]">VI Guide</div>
              <div className="text-[8px] font-black uppercase tracking-[.25em] text-[#b16a18]">U.S. Virgin Islands</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/search" className="hidden rounded-full border border-[#0f766e]/20 bg-white/80 px-4 py-2.5 text-[10px] font-black uppercase tracking-[.16em] sm:inline-flex">Search</Link>
            <Link href={CONCIERGE_START_HREF} className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-4 py-2.5 text-[10px] font-black uppercase tracking-[.15em] shadow-lg shadow-black/10">
              <Sparkles size={14} /> Ask VI Concierge
            </Link>
          </div>
        </header>

        <div className="mx-auto grid max-w-7xl gap-10 pt-14 lg:grid-cols-[1.05fr_.95fr] lg:items-end lg:pt-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b16a18]/20 bg-white/74 px-4 py-2 text-[9px] font-black uppercase tracking-[.23em] text-[#9a5a17] shadow-sm backdrop-blur">
              <SunMedium size={14} /> Experience paradise with confidence
            </div>
            <h1 className="mt-6 max-w-4xl font-serif text-[clamp(3.7rem,8vw,7rem)] font-semibold leading-[.84] tracking-[-.055em] drop-shadow-[0_2px_12px_rgba(255,255,255,.55)]">
              Paradise is<br /><span className="italic text-[#159b91]">calling you.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base font-semibold leading-7 text-[#173f3c] sm:text-lg">
              Discover beaches, stays, culture, dining, and transportation across St. Thomas, St. John, and St. Croix — all in one trusted local guide.
            </p>
            <Link href="/search" className="mt-8 flex max-w-xl items-center gap-3 rounded-[22px] border border-white/80 bg-white/92 p-2 pl-5 shadow-[0_20px_55px_rgba(4,51,49,.16)] transition hover:bg-white">
              <Search size={19} className="text-[#0f766e]" />
              <span className="flex-1 text-sm font-semibold text-slate-500">Search beaches, stays, tours, food, history…</span>
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0f766e] text-white"><ArrowRight size={18} /></span>
            </Link>
          </div>

          <aside className="overflow-hidden rounded-[34px] border border-white/80 bg-[#fffdf8]/94 shadow-[0_28px_70px_rgba(4,51,49,.16)] backdrop-blur-xl">
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
            {QUICK.map(({ label, href, icon: Icon, image, alt }) => (
              <Link key={label} href={href} className="group relative flex min-h-[150px] flex-col items-center justify-end overflow-hidden rounded-[22px] border border-white/70 p-4 text-center text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg">
                <Image
                  src={image}
                  alt={alt}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 33vw, 50vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.03)_15%,rgba(3,47,45,.78)_100%)]" />
                <span className="relative grid h-10 w-10 place-items-center rounded-2xl border border-white/45 bg-white/88 text-[#0f766e] shadow-lg backdrop-blur transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]"><Icon size={19} aria-hidden="true" /></span>
                <span className="relative mt-2 text-xs font-black drop-shadow-sm">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:px-12">
        <div className="grid gap-6 lg:grid-cols-3">
          {HOME_FEATURES.map((feature) => {
            const Icon = feature.icon;

            return (
              <article
                key={feature.title}
                className="group overflow-hidden rounded-[30px] border border-[#dbe5e2] bg-white shadow-[0_18px_50px_rgba(4,51,49,.08)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-[#dce9e5]">
                  <Image
                    src={feature.image}
                    alt={feature.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_45%,rgba(4,51,49,.3))]" />
                </div>
                <div className="relative p-7 pt-8">
                  <span
                    className={`absolute -top-7 grid h-14 w-14 place-items-center rounded-2xl border-4 border-white shadow-lg ${feature.iconClassName}`}
                  >
                    <Icon size={23} aria-hidden="true" />
                  </span>
                  <h2 className="font-serif text-3xl font-bold">{feature.title}</h2>
                  <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
                    {feature.description}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="px-4 pb-20 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl overflow-hidden rounded-[36px] bg-[#073b39] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)] lg:grid-cols-[1.15fr_.85fr]">
          <div className="p-8 sm:p-10 lg:p-12">
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-[#f5c451]"><Sparkles size={14} /> VI Concierge</div>
            <h2 className="mt-4 max-w-2xl font-serif text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-5xl">Tell us what kind of day you want.</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/66">VI Concierge connects places, timing, transportation, and local context so your plan feels effortless.</p>
            <Link href={CONCIERGE_START_HREF} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-[#073b39]">Start planning <ArrowRight size={16} /></Link>
          </div>
          <div className="relative min-h-[360px] overflow-hidden bg-[url('/images/places/st-john/trunk-bay-beach-1.jpg')] bg-cover bg-center">
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(15,118,110,.35),rgba(6,59,57,.78))]" />
            <div className="relative flex h-full items-end p-8">
              <div className="rounded-[24px] bg-white p-5 text-[#073b39] shadow-xl">
                <div className="text-[9px] font-black uppercase tracking-[.18em] text-[#b16a18]">One connected guide</div>
                <div className="mt-3 flex items-center gap-3 text-sm font-bold"><MapPin size={16} className="text-[#0f766e]" /> Beaches, dining, heritage, stays, and rides in one synchronized experience.</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
