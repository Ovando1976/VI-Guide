import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BedDouble,
  CalendarDays,
  CarFront,
  Clock3,
  Compass,
  Heart,
  History,
  Home as HomeIcon,
  Map,
  MapPinned,
  Navigation,
  Plus,
  Route,
  Search,
  Ship,
  Sparkles,
  SunMedium,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";
import { ViPublicFooter } from "@/components/brand/vi-public-footer";
import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { HomeConciergeHub } from "@/components/home/home-concierge-hub";
import { HomeIslandDayPreview } from "@/components/home/home-island-day-preview";
import { HomeLiveStatus } from "@/components/home/home-live-status";
import { HomePrimaryActions } from "@/components/home/home-primary-actions";
import { HomeTravelerIntent } from "@/components/home/home-traveler-intent";

const homeTitle = "USVI Explorer — Discover, Plan & Move Through the USVI";
const homeDescription =
  "Discover beaches, stays, culture, dining and transportation, then turn local insight into one connected U.S. Virgin Islands trip.";
const homeSocialTitle = "USVI Explorer — Your Smart Virgin Islands Travel Companion";
const homeSocialDescription =
  "Discover, plan and move through St. Thomas, St. John and St. Croix with one connected local travel companion.";

export const metadata: Metadata = {
  title: { absolute: homeTitle },
  description: homeDescription,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "USVI Explorer",
    title: homeSocialTitle,
    description: homeSocialDescription,
    url: "/",
  },
  twitter: {
    card: "summary_large_image",
    title: homeSocialTitle,
    description: homeSocialDescription,
  },
};

const CONCIERGE_START_HREF =
  "/concierge?open=true&prompt=Plan%20a%20complete%20Virgin%20Islands%20day%20for%20me";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: HomeIcon },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Living Map", href: "/map", icon: Map },
  { label: "Beaches", href: "/beaches", icon: Waves },
  { label: "Activities", href: "/activities", icon: Activity },
  { label: "Stays", href: "/accommodations", icon: BedDouble },
  { label: "Food & Drink", href: "/dining", icon: UtensilsCrossed },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Rides · Taxi & Ferry", href: "/mobility", icon: CarFront },
  { label: "Car Rentals", href: "/car-rentals", icon: CarFront },
  { label: "History & Culture", href: "/history", icon: History },
  { label: "My Trip", href: "/trips", icon: Route },
  { label: "Saved Places", href: "/saved", icon: Heart },
] as const;

const QUICK = [
  {
    label: "Beaches",
    detail: "Calm water · St. Thomas",
    href: "/beaches",
    icon: Waves,
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    alt: "Magens Bay beach in St. Thomas",
  },
  {
    label: "Activities",
    detail: "Sailing · diving · tours",
    href: "/activities",
    icon: Activity,
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay overlook and turquoise water in St. John",
  },
  {
    label: "Dining",
    detail: "Local flavor · waterfront",
    href: "/places?category=restaurant",
    icon: UtensilsCrossed,
    image: "/images/places/st-thomas/hook-line-and-sinker-1.jpg",
    alt: "Waterfront dining in Frenchtown, St. Thomas",
  },
  {
    label: "Ride",
    detail: "Taxi · airport · ferry",
    href: "/mobility",
    icon: CarFront,
    image: "/images/mobility/usvi-taxi-van.png",
    alt: "White Ford passenger taxi van marked TAXI and ON DUTY on St. Thomas",
  },
  {
    label: "Stays",
    detail: "Hotels · resorts · villas",
    href: "/accommodations",
    icon: BedDouble,
    image: "/images/accommodations/king-christian-hotel.jpg",
    alt: "King Christian Hotel in Christiansted",
  },
  {
    label: "Car Rentals",
    detail: "Compare island vehicles",
    href: "/car-rentals",
    icon: CarFront,
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Scenic island destination along Cane Bay in St. Croix",
  },
  {
    label: "Living Map",
    detail: "Estates · places · routes",
    href: "/map",
    icon: MapPinned,
    image: "/images/usvi-harbor-hero.jpg",
    alt: "Charlotte Amalie harbor and the hills of St. Thomas",
  },
  {
    label: "My Trip",
    detail: "Run the whole journey",
    href: "/trips",
    icon: Route,
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coast in St. Croix",
  },
] as const;

const RECOMMENDED = [
  {
    eyebrow: "St. Thomas beach",
    title: "Magens Bay",
    meta: "Calm water · family favorite",
    href: "/beaches",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    alt: "Magens Bay beach in St. Thomas",
    tag: "Beach",
  },
  {
    eyebrow: "Island view",
    title: "Trunk Bay",
    meta: "Snorkeling · St. John",
    href: "/map?island=stj",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Trunk Bay overlook in St. John",
    tag: "National park",
  },
  {
    eyebrow: "Dining area",
    title: "Frenchtown waterfront",
    meta: "Local dining · St. Thomas",
    href: "/places?category=restaurant",
    image: "/images/places/st-thomas/hook-line-and-sinker-1.jpg",
    alt: "Waterfront dining in Frenchtown, St. Thomas",
    tag: "Food & drink",
  },
  {
    eyebrow: "Explore deeper",
    title: "Cane Bay",
    meta: "Diving · north shore St. Croix",
    href: "/map?island=stx",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coastline on St. Croix",
    tag: "Dive coast",
  },
] as const;

const DAY_STOPS = [
  { time: "9:00", period: "AM", title: "Magens Bay", detail: "Beach time · calm-water start", href: "/beaches" },
  { time: "11:30", period: "AM", title: "Mountain Top", detail: "Panoramic island views", href: "/map" },
  { time: "1:00", period: "PM", title: "Charlotte Amalie", detail: "Lunch · history · shopping", href: "/places?category=restaurant" },
  { time: "3:30", period: "PM", title: "Paradise Point", detail: "Harbor views · easy finish", href: "/map" },
] as const;

const GETTING_AROUND = [
  { label: "Taxi rates", detail: "Official-rate quote flow", href: "/mobility", icon: CarFront },
  { label: "Ferry schedules", detail: "Connect the islands", href: "/mobility", icon: Ship },
  { label: "Plan a ride", detail: "Taxi or private ride", href: "/mobility", icon: Navigation },
  { label: "Car rentals", detail: "Compare local vehicles", href: "/car-rentals", icon: CarFront },
] as const;

export default function Home() {
  return (
    <main className="min-h-screen bg-[#eef7f6] text-[#062b3a]">
      <div className="lg:grid lg:grid-cols-[252px_minmax(0,1fr)] xl:grid-cols-[270px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-screen flex-col overflow-y-auto bg-[linear-gradient(180deg,#052d42_0%,#062b3a_48%,#032431_100%)] px-4 py-5 text-white lg:flex">
          <Link href="/" className="flex items-center gap-3 rounded-2xl px-2 py-2" aria-label="USVI Explorer home">
            <ViBrandMark className="h-12 w-12" priority />
            <span>
              <span className="block text-xl font-black tracking-[-0.03em]">USVI</span>
              <span className="block text-[10px] font-black uppercase tracking-[.24em] text-[#7de7de]">Explorer</span>
            </span>
          </Link>
          <p className="mt-2 px-2 text-xs font-semibold italic text-white/48">Explore. Experience. Belong.</p>

          <nav className="mt-7 space-y-1" aria-label="Primary navigation">
            {NAV_ITEMS.map(({ label, href, icon: Icon }, index) => (
              <Link
                key={label}
                href={href}
                className={`group flex min-h-11 items-center gap-3 rounded-2xl px-3 text-[13px] font-bold transition ${
                  index === 0
                    ? "bg-[#0f7890] text-white shadow-[0_12px_35px_rgba(5,16,31,.22)]"
                    : "text-white/72 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={17} className={index === 0 ? "text-[#9cf2e8]" : "text-white/55 group-hover:text-[#9cf2e8]"} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-5">
            <Link href={CONCIERGE_START_HREF} className="flex items-center gap-3 rounded-2xl bg-[#0b586e] px-3 py-3 text-sm font-black text-white transition hover:bg-[#0f7188]">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#4fe0d2] text-[#063243]"><Sparkles size={18} /></span>
              AI Concierge
            </Link>
          </div>

          <div className="mt-auto pt-5">
            <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-white/[.07] p-4">
              <Image src="/images/usvi-harbor-hero.jpg" alt="Charlotte Amalie harbor in St. Thomas" fill sizes="220px" className="object-cover opacity-25" />
              <div className="relative">
                <div className="text-[10px] font-black uppercase tracking-[.16em] text-[#7de7de]">Island gateway</div>
                <div className="mt-2 text-lg font-black">St. Thomas · STT</div>
                <p className="mt-1 text-xs font-semibold leading-5 text-white/65">Start with the island, then let the trip stay connected.</p>
                <Link href="/map?island=stt" className="mt-3 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-[#ffd36e]">Open island <ArrowRight size={13} /></Link>
              </div>
            </div>
          </div>
        </aside>

        <div className="min-w-0 pb-24 lg:pb-0">
          <div className="sticky top-0 z-40 bg-[#062b3a] p-3 lg:hidden">
            <ViPublicHeader actionHref={CONCIERGE_START_HREF} actionLabel="Ask AI" actionIcon={Sparkles} secondaryHref="/trips" secondaryLabel="My Trip" />
          </div>

          <div className="mx-auto max-w-[1540px] px-3 py-4 sm:px-5 sm:py-6 xl:px-7">
            <div className="mb-4 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[.15em] text-[#0f8792]">Your island command center</p>
                <h1 className="mt-1 text-2xl font-black tracking-[-0.035em] text-[#062b3a] sm:text-3xl">What kind of island day do you want?</h1>
                <p className="mt-1 text-sm font-semibold text-slate-500">St. Thomas · switch islands anytime</p>
              </div>
              <Link href="/search" className="hidden h-11 items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 shadow-sm sm:flex">
                <Search size={16} /> Search everything
              </Link>
            </div>

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_356px] xl:items-start">
              <div className="min-w-0 space-y-4">
                <section className="relative min-h-[410px] overflow-hidden rounded-[30px] bg-[#073b4c] shadow-[0_24px_60px_rgba(6,43,58,.15)] sm:min-h-[465px] sm:rounded-[34px]">
                  <Image src="/images/usvi-harbor-hero.jpg" alt="Charlotte Amalie harbor and the hills of St. Thomas" fill priority sizes="(min-width: 1280px) 70vw, 100vw" className="object-cover object-center saturate-[1.08]" />
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,35,48,.90)_0%,rgba(3,43,54,.60)_45%,rgba(3,43,54,.12)_80%)]" />
                  <div className="relative flex min-h-[410px] max-w-3xl flex-col justify-center p-5 text-white sm:min-h-[465px] sm:p-9 lg:p-11">
                    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.13em] backdrop-blur-xl"><SunMedium size={14} className="text-[#ffd36e]" /> St. Thomas · your starting island</div>
                    <h2 className="mt-5 max-w-2xl text-[clamp(2.4rem,6vw,4.7rem)] font-black leading-[.92] tracking-[-.055em]">Where do you want to go or what do you want to do?</h2>
                    <Link href="/search" className="mt-6 flex max-w-2xl items-center gap-3 rounded-[22px] bg-white p-2 pl-4 text-[#062b3a] shadow-[0_20px_55px_rgba(1,21,28,.24)] transition hover:-translate-y-0.5">
                      <Search size={19} className="text-[#0b8793]" />
                      <span className="flex-1 text-sm font-semibold text-slate-500">Search beaches, stays, food, events, history, local stories…</span>
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#0b8793] text-white"><ArrowRight size={18} /></span>
                    </Link>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {[["Beaches", "/beaches"], ["Activities", "/activities"], ["Restaurants", "/places?category=restaurant"], ["Rides", "/mobility"], ["Events", "/events"], ["Stays", "/accommodations"]].map(([label, href]) => (
                        <Link key={label} href={href} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] text-white backdrop-blur-lg transition hover:bg-white/20">{label}</Link>
                      ))}
                    </div>
                    <div className="mt-5 max-w-xl"><HomePrimaryActions conciergeHref={CONCIERGE_START_HREF} /></div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#07394b]/10 bg-white p-4 shadow-[0_18px_50px_rgba(6,43,58,.08)] sm:p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#0b8793]">Recommended for you</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">Start with something worth doing</h2></div>
                    <Link href="/explore" className="shrink-0 text-xs font-black text-[#0b8793]">View all</Link>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
                    {RECOMMENDED.map((item) => (
                      <Link key={item.title} href={item.href} className="group overflow-hidden rounded-[22px] border border-slate-200/80 bg-[#f8fbfb] transition hover:-translate-y-1 hover:shadow-xl">
                        <div className="relative aspect-[16/10] overflow-hidden">
                          <Image src={item.image} alt={item.alt} fill sizes="(min-width: 1536px) 20vw, (min-width: 640px) 40vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[9px] font-black uppercase tracking-[.08em] text-[#062b3a] shadow-sm"><BadgeCheck size={11} className="text-[#0b8793]" /> {item.tag}</span>
                        </div>
                        <div className="p-3.5"><div className="text-[9px] font-black uppercase tracking-[.13em] text-[#0b8793]">{item.eyebrow}</div><div className="mt-1 text-base font-black tracking-[-.02em]">{item.title}</div><div className="mt-1 text-xs font-semibold text-slate-500">{item.meta}</div><div className="mt-3 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-[.1em] text-[#0b8793]">View details <ArrowRight size={12} /></div></div>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#07394b]/10 bg-white p-4 shadow-[0_18px_50px_rgba(6,43,58,.08)] sm:p-5">
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#0b8793]">Everything connected</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">Explore USVI by what you need next</h2></div>
                    <Link href="/explore" className="text-xs font-black text-[#0b8793]">All modules</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-8">
                    {QUICK.map(({ label, detail, href, image, alt, icon: Icon }) => (
                      <Link key={label} href={href} className="group relative flex min-h-[138px] items-end overflow-hidden rounded-[20px] bg-[#062b3a] p-3 text-white">
                        <Image src={image} alt={alt} fill sizes="(min-width: 1280px) 10vw, (min-width: 640px) 22vw, 50vw" className="object-cover transition duration-700 group-hover:scale-110" />
                        <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,43,57,.05)_10%,rgba(4,43,57,.88)_100%)]" />
                        <span className="relative block min-w-0"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white/90 text-[#0b8793] shadow-md"><Icon size={15} /></span><span className="mt-2 block truncate text-xs font-black">{label}</span><span className="mt-0.5 block truncate text-[9px] font-bold text-white/65">{detail}</span></span>
                      </Link>
                    ))}
                  </div>
                </section>

                <section className="grid gap-4 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
                  <HomeIslandDayPreview />
                  <div className="flex flex-col rounded-[28px] border border-[#07394b]/10 bg-white p-5 shadow-[0_18px_50px_rgba(6,43,58,.08)]">
                    <div className="flex items-center justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#0b8793]">Living map</p><h2 className="mt-1 text-2xl font-black tracking-[-.035em]">See the island. Build the route.</h2></div><MapPinned size={28} className="text-[#0b8793]" /></div>
                    <Link href="/map" className="group relative mt-4 min-h-[245px] flex-1 overflow-hidden rounded-[24px] bg-[#062b3a]">
                      <Image src="/images/places/st-john/trunk-bay-overlook-1.jpg" alt="Trunk Bay and the green hills of St. John" fill sizes="(min-width: 1024px) 38vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                      <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(4,43,57,.08),rgba(4,43,57,.82))]" />
                      <span className="absolute inset-x-0 bottom-0 p-5 text-white"><span className="text-lg font-black">Estates, places and movement in one workspace.</span><span className="mt-2 block text-xs font-semibold leading-5 text-white/70">Open the full map to turn a location into a saved stop, route decision or transportation handoff.</span><span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-[#ffd36e]">Open Living Map <ArrowRight size={13} /></span></span>
                    </Link>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <Link href="/today" className="rounded-2xl bg-[#eef7f6] p-3 text-xs font-black text-[#0b8793]">Today view</Link>
                      <Link href="/trips" className="rounded-2xl bg-[#062b3a] p-3 text-center text-xs font-black text-white">My Trip</Link>
                    </div>
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#07394b]/10 bg-white p-4 shadow-[0_18px_50px_rgba(6,43,58,.08)] sm:p-5">
                  <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.14em] text-[#0b8793]">Getting around USVI</p><h2 className="mt-1 text-xl font-black tracking-[-.03em]">Transportation belongs inside the trip</h2></div>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {GETTING_AROUND.map(({ label, detail, href, icon: Icon }) => (
                      <Link key={label} href={href} className="group flex items-center gap-3 rounded-[20px] border border-slate-200 bg-[#f8fbfb] p-4 transition hover:border-[#42c9c2] hover:bg-white hover:shadow-lg">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#e6f7f5] text-[#0b8793]"><Icon size={19} /></span>
                        <span className="min-w-0 flex-1"><span className="block text-sm font-black">{label}</span><span className="mt-0.5 block text-[10px] font-semibold text-slate-500">{detail}</span></span><ArrowRight size={14} className="text-slate-300 transition group-hover:text-[#0b8793]" />
                      </Link>
                    ))}
                  </div>
                </section>
              </div>

              <aside className="space-y-4 xl:sticky xl:top-6">
                <section className="rounded-[28px] border border-[#07394b]/10 bg-white p-5 shadow-[0_18px_50px_rgba(6,43,58,.08)]">
                  <div className="flex items-start justify-between gap-3">
                    <div><div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-[#0b8793]"><CalendarDays size={14} /> Today’s plan</div><h2 className="mt-2 text-2xl font-black tracking-[-.035em]">A great St. Thomas day</h2></div>
                    <Link href="/trips" className="rounded-full bg-[#eef7f6] px-3 py-2 text-[9px] font-black uppercase tracking-[.12em] text-[#0b8793]">My Trip</Link>
                  </div>
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">Illustrative day plan. Open My Trip for your saved itinerary and trip-specific timing.</p>
                  <div className="mt-5">
                    {DAY_STOPS.map((stop, index) => (
                      <Link key={stop.title} href={stop.href} className="group grid grid-cols-[44px_24px_1fr] gap-2">
                        <div className="pt-0.5 text-right"><span className="block text-xs font-black text-[#062b3a]">{stop.time}</span><span className="block text-[8px] font-black uppercase tracking-[.08em] text-slate-400">{stop.period}</span></div>
                        <div className="relative flex justify-center">{index < DAY_STOPS.length - 1 ? <span className="absolute bottom-0 top-6 w-px bg-[#90d9d3]" /> : null}<span className="relative grid h-6 w-6 place-items-center rounded-full bg-[#0b8793] text-[9px] font-black text-white shadow-sm">{index + 1}</span></div>
                        <div className="min-h-[78px] pb-5"><div className="text-sm font-black transition group-hover:text-[#0b8793]">{stop.title}</div><div className="mt-1 text-[10px] font-semibold leading-4 text-slate-500">{stop.detail}</div></div>
                      </Link>
                    ))}
                  </div>
                  <Link href="/trips" className="flex items-center justify-center gap-2 rounded-2xl bg-[#0b8793] px-4 py-3.5 text-xs font-black text-white shadow-[0_10px_28px_rgba(11,135,147,.22)]">View full itinerary <ArrowRight size={14} /></Link>
                </section>

                <section className="rounded-[28px] border border-[#07394b]/10 bg-white p-5 shadow-[0_18px_50px_rgba(6,43,58,.08)]">
                  <div className="text-[10px] font-black uppercase tracking-[.14em] text-[#0b8793]">Quick actions</div>
                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <QuickAction href="/explore" label="Add stop" icon={Plus} />
                    <QuickAction href="/places?category=restaurant" label="Find food" icon={UtensilsCrossed} />
                    <QuickAction href="/mobility" label="Plan ride" icon={CarFront} />
                    <QuickAction href="/trips" label="Share plan" icon={Route} />
                  </div>
                </section>

                <section className="rounded-[28px] border border-[#07394b]/10 bg-white p-5 shadow-[0_18px_50px_rgba(6,43,58,.08)]">
                  <div className="flex items-center justify-between"><div className="text-[10px] font-black uppercase tracking-[.14em] text-[#0b8793]">Need to know</div><Clock3 size={16} className="text-slate-400" /></div>
                  <div className="mt-4 space-y-3">
                    <Notice icon={CarFront} title="Taxi & transfer" detail="Use governed fare tools before depending on an estimate." />
                    <Notice icon={Ship} title="Ferry connection" detail="Check route details before an inter-island move." />
                    <Notice icon={SunMedium} title="Island conditions" detail="Confirm weather, water and operating status before departure." />
                  </div>
                </section>

                <Link href={CONCIERGE_START_HREF} className="group relative block min-h-[190px] overflow-hidden rounded-[28px] bg-[#062b3a] p-5 text-white shadow-[0_20px_55px_rgba(6,43,58,.16)]">
                  <Image src="/images/usvi-harbor-hero.jpg" alt="Charlotte Amalie harbor in St. Thomas" fill sizes="356px" className="object-cover opacity-25 transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-[linear-gradient(90deg,#062b3a_12%,rgba(6,43,58,.62))]" />
                  <div className="relative"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#4fe0d2] text-[#062b3a]"><Sparkles size={19} /></span><h2 className="mt-4 text-xl font-black tracking-[-.03em]">Want the perfect island day?</h2><p className="mt-2 text-xs font-semibold leading-5 text-white/70">Let the AI Concierge turn the island into a plan you can actually use.</p><span className="mt-4 inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[.12em] text-[#ffd36e]">Ask Concierge now <ArrowRight size={13} /></span></div>
                </Link>

                <div className="rounded-[28px] border border-[#07394b]/10 bg-white p-5 shadow-[0_18px_50px_rgba(6,43,58,.08)]">
                  <div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#e6f7f5] text-[#0b8793]"><BadgeCheck size={18} /></span><div><div className="text-xs font-black">Trip continuity</div><div className="text-[10px] font-semibold text-slate-500">Map · plan · mobility · Concierge</div></div></div>
                  <Link href="/trips" className="mt-4 flex items-center justify-between rounded-2xl bg-[#f4f9f8] px-4 py-3 text-xs font-black text-[#062b3a]">Open connected trip <ArrowRight size={13} /></Link>
                </div>
              </aside>
            </div>
          </div>

          <section className="border-y border-[#07394b]/10 bg-white px-3 py-3 sm:px-5 xl:px-7"><div className="mx-auto max-w-[1540px]"><HomeConciergeHub /></div></section>
          <HomeTravelerIntent />
          <HomeLiveStatus />
          <div className="bg-[#f7fbfa]"><ViPublicFooter /></div>
        </div>
      </div>

      <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[24px] border border-white/70 bg-white/[.94] p-2 shadow-[0_18px_60px_rgba(6,43,58,.22)] backdrop-blur-xl lg:hidden" aria-label="Mobile navigation">
        <MobileNavItem href="/explore" label="Explore" icon={Compass} />
        <MobileNavItem href="/map" label="Map" icon={Map} />
        <Link href={CONCIERGE_START_HREF} className="relative -mt-6 flex flex-col items-center gap-1 text-[9px] font-black text-[#062b3a]"><span className="grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-[#21c8b9] text-white shadow-[0_12px_30px_rgba(33,200,185,.35)]"><Sparkles size={22} /></span><span>Ask AI</span></Link>
        <MobileNavItem href="/trips" label="Plan" icon={Route} />
        <MobileNavItem href="/mobility" label="Rides" icon={CarFront} />
      </nav>
    </main>
  );
}

function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Plus }) {
  return <Link href={href} className="rounded-2xl bg-[#f4f9f8] p-3 text-center transition hover:bg-[#e7f6f4]"><Icon size={18} className="mx-auto text-[#0b8793]" /><span className="mt-2 block text-[10px] font-black">{label}</span></Link>;
}

function Notice({ icon: Icon, title, detail }: { icon: typeof CarFront; title: string; detail: string }) {
  return <div className="flex gap-3 rounded-2xl border border-slate-100 p-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#eef7f6] text-[#0b8793]"><Icon size={16} /></span><span><span className="block text-xs font-black">{title}</span><span className="mt-1 block text-[10px] font-semibold leading-4 text-slate-500">{detail}</span></span></div>;
}

function MobileNavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Compass }) {
  return <Link href={href} className="flex flex-col items-center justify-center gap-1 rounded-2xl py-1 text-[9px] font-black text-slate-500 transition hover:bg-[#eef7f6] hover:text-[#0b8793]"><Icon size={18} /><span>{label}</span></Link>;
}
