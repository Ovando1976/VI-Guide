import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BedDouble,
  CalendarDays,
  CarFront,
  Clock3,
  Compass,
  Heart,
  History,
  House,
  Map,
  MapPinned,
  Route,
  Search,
  Ship,
  Sparkles,
  Star,
  UtensilsCrossed,
  Waves,
} from "lucide-react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

const CONCIERGE_DAY =
  "/concierge?open=true&prompt=Plan%20my%20perfect%20USVI%20day%20with%20transportation%20and%20realistic%20timing";

const PRIMARY_NAV: ReadonlyArray<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Home", href: "/", icon: House },
  { label: "Explore", href: "/explore", icon: Compass },
  { label: "Living Map", href: "/map", icon: Map },
  { label: "Beaches", href: "/beaches", icon: Waves },
  { label: "Activities", href: "/activities", icon: Star },
  { label: "Stays", href: "/accommodations", icon: BedDouble },
  { label: "Food & Drink", href: "/places?category=restaurant", icon: UtensilsCrossed },
  { label: "Events", href: "/events", icon: CalendarDays },
];

const TRIP_NAV: ReadonlyArray<{ label: string; href: string; icon: LucideIcon }> = [
  { label: "Rides", href: "/mobility", icon: CarFront },
  { label: "Car Rentals", href: "/car-rentals", icon: CarFront },
  { label: "History & Culture", href: "/history", icon: History },
  { label: "My Trips", href: "/trips", icon: Route },
  { label: "Saved Places", href: "/saved", icon: Heart },
];

const CATEGORY_PILLS = [
  { label: "Beaches", href: "/beaches", icon: Waves },
  { label: "Activities", href: "/activities", icon: Compass },
  { label: "Restaurants", href: "/places?category=restaurant", icon: UtensilsCrossed },
  { label: "Rides", href: "/mobility", icon: CarFront },
  { label: "Events", href: "/events", icon: CalendarDays },
  { label: "Stays", href: "/accommodations", icon: BedDouble },
] as const;

const RECOMMENDED = [
  {
    name: "Magens Bay",
    island: "St. Thomas",
    detail: "Iconic water · easy beach-day anchor",
    image: "/images/places/st-thomas/magens-bay-beach-1.jpg",
    alt: "Turquoise water and green hills at Magens Bay in St. Thomas",
    href: "/beaches",
    tag: "Beach pick",
  },
  {
    name: "Trunk Bay",
    island: "St. John",
    detail: "National park coast · ferry-smart day",
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    alt: "Scenic overlook above Trunk Bay in St. John",
    href: "/map?island=stj",
    tag: "Island favorite",
  },
  {
    name: "Cane Bay",
    island: "St. Croix",
    detail: "North-shore water · diving territory",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    alt: "Cane Bay coastline and green hills on St. Croix",
    href: "/map?island=stx",
    tag: "Explore deeper",
  },
] as const;

const ISLANDS = [
  {
    code: "STT",
    name: "St. Thomas",
    detail: "Harbor · beaches · dining · nightlife",
    href: "/map?island=stt",
    image: "/images/usvi-harbor-hero.jpg",
  },
  {
    code: "STJ",
    name: "St. John",
    detail: "National park · coves · trails",
    href: "/map?island=stj",
    image: "/images/places/st-john/trunk-bay-beach-1.jpg",
  },
  {
    code: "STX",
    name: "St. Croix",
    detail: "History · food · diving · culture",
    href: "/map?island=stx",
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
  },
] as const;

const PLAN_STOPS = [
  { time: "9:00", title: "Beach window", detail: "Start with your chosen coast", icon: Waves },
  { time: "12:30", title: "Local lunch", detail: "Keep food close to the route", icon: UtensilsCrossed },
  { time: "3:00", title: "Island experience", detail: "History, water or a viewpoint", icon: Compass },
  { time: "6:30", title: "Dinner + sunset", detail: "Finish near your ride home", icon: Star },
] as const;

const QUICK_ACTIONS = [
  { label: "Get a ride", href: "/mobility", icon: CarFront },
  { label: "Ferry routes", href: "/mobility", icon: Ship },
  { label: "Rent a car", href: "/car-rentals", icon: CarFront },
  { label: "Saved places", href: "/saved", icon: Heart },
] as const;

export function HomeExplorerDashboard() {
  return (
    <section className="bg-[#f4f1ea] px-3 pb-24 pt-3 text-[#0b2430] sm:px-5 lg:px-0 lg:pb-8 lg:pt-0">
      <div className="mx-auto min-h-screen max-w-[1720px] overflow-hidden rounded-[30px] border border-[#dfe8e3] bg-[#fbfaf6] shadow-[0_28px_90px_rgba(9,36,48,.12)] lg:grid lg:grid-cols-[228px_minmax(0,1fr)_340px] lg:rounded-none lg:border-x-0 lg:border-t-0">
        <aside className="hidden bg-[linear-gradient(180deg,#072d36_0%,#063e43_48%,#052b35_100%)] px-4 py-5 text-white lg:flex lg:min-h-screen lg:flex-col">
          <Link href="/" className="flex items-center gap-3 rounded-2xl px-2 py-2" aria-label="USVI Explorer home">
            <ViBrandMark className="h-11 w-11" priority />
            <span>
              <span className="block text-lg font-black tracking-[-.04em]">USVI Explorer</span>
              <span className="mt-0.5 block text-[8px] font-black uppercase tracking-[.2em] text-[#8ce9df]">Paradise, connected.</span>
            </span>
          </Link>

          <nav aria-label="USVI Explorer" className="mt-7 space-y-1">
            {PRIMARY_NAV.map(({ label, href, icon: Icon }, index) => (
              <SidebarLink key={label} label={label} href={href} icon={Icon} active={index === 0} />
            ))}
          </nav>

          <div className="my-4 h-px bg-white/10" />
          <nav aria-label="Trip tools" className="space-y-1">
            {TRIP_NAV.map(({ label, href, icon: Icon }) => (
              <SidebarLink key={label} label={label} href={href} icon={Icon} />
            ))}
          </nav>

          <div className="mt-auto pt-6">
            <Link
              href={CONCIERGE_DAY}
              className="group block rounded-[22px] border border-[#62dfd2]/25 bg-[#1b766f]/35 p-3.5 shadow-[0_18px_45px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:bg-[#23847b]/45"
            >
              <span className="flex items-center gap-2 text-xs font-black"><Sparkles size={15} className="text-[#f5c451]" /> AI Concierge</span>
              <span className="mt-2 block text-[10px] font-semibold leading-4 text-white/62">Build a beach day, ferry plan, transfer or complete itinerary.</span>
              <span className="mt-3 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[.14em] text-[#91eee4]">Ask anything <ArrowRight size={12} /></span>
            </Link>
          </div>
        </aside>

        <main className="min-w-0 px-3 py-3 sm:px-5 sm:py-5 lg:px-6 xl:px-8">
          <header className="flex items-center justify-between gap-3 px-1 py-2 lg:py-1">
            <Link href="/" className="flex min-w-0 items-center gap-2.5 lg:hidden">
              <ViBrandMark className="h-10 w-10" priority />
              <span className="min-w-0">
                <span className="block truncate text-base font-black tracking-[-.04em] text-[#082f38]">USVI Explorer</span>
                <span className="block text-[7px] font-black uppercase tracking-[.18em] text-[#0f766e]">Paradise, connected.</span>
              </span>
            </Link>
            <div className="hidden lg:block">
              <p className="text-[10px] font-black uppercase tracking-[.16em] text-[#0f766e]">Virgin Islands Travel OS</p>
              <p className="mt-1 text-sm font-semibold text-slate-500">Discover, plan and move without losing your trip context.</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/saved" className="grid h-10 w-10 place-items-center rounded-full border border-[#dbe6e1] bg-white text-[#264853] shadow-sm transition hover:-translate-y-0.5" aria-label="Saved places"><Heart size={17} /></Link>
              <Link href="/profile" className="inline-flex h-10 items-center rounded-full bg-[#082f38] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white shadow-sm transition hover:bg-[#0d4b51]">My trip</Link>
            </div>
          </header>

          <section className="relative mt-3 min-h-[430px] overflow-hidden rounded-[32px] bg-[#08363e] shadow-[0_24px_60px_rgba(8,47,56,.22)] sm:min-h-[470px] lg:min-h-[500px]">
            <Image
              src="/images/places/st-john/trunk-bay-overlook-1.jpg"
              alt="Trunk Bay and the green hills of St. John"
              fill
              priority
              sizes="(min-width: 1024px) 62vw, 100vw"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,35,43,.88)_0%,rgba(5,35,43,.60)_46%,rgba(5,35,43,.18)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_48%,rgba(4,33,40,.48)_100%)]" />

            <div className="relative flex min-h-[430px] max-w-3xl flex-col justify-end p-5 sm:min-h-[470px] sm:p-8 lg:min-h-[500px] lg:p-10">
              <div className="mb-auto inline-flex w-fit items-center gap-2 rounded-full border border-white/18 bg-white/10 px-3 py-2 text-[8px] font-black uppercase tracking-[.17em] text-white backdrop-blur-xl">
                <MapPinned size={13} className="text-[#8ce9df]" /> St. Thomas · St. John · St. Croix
              </div>
              <p className="text-[9px] font-black uppercase tracking-[.2em] text-[#f7d36d]">Your Virgin Islands, intelligently connected</p>
              <h1 className="mt-3 max-w-2xl text-[clamp(2.7rem,6.5vw,5.2rem)] font-black leading-[.9] tracking-[-.055em] text-white">
                Where do you want to go or what do you want to do?
              </h1>
              <p className="mt-4 max-w-xl text-sm font-semibold leading-6 text-white/72 sm:text-base">Search beaches, activities, restaurants, stays, transportation and local stories—then turn the answer into a trip.</p>

              <form action="/search" method="get" className="mt-6 flex max-w-2xl items-center gap-2 rounded-[22px] border border-white/20 bg-white p-2 shadow-[0_18px_45px_rgba(4,33,40,.28)]">
                <Search size={18} className="ml-2 shrink-0 text-[#0f766e]" aria-hidden="true" />
                <input
                  name="q"
                  type="search"
                  placeholder="Search beaches, activities, restaurants, places..."
                  aria-label="Search USVI Explorer"
                  className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm font-semibold text-[#082f38] outline-none placeholder:text-slate-400"
                />
                <button type="submit" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[16px] bg-[#f5a623] px-4 text-[9px] font-black uppercase tracking-[.14em] text-[#082f38] shadow-sm transition hover:bg-[#ffbb42] sm:px-5">
                  Search <ArrowRight size={14} />
                </button>
              </form>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {CATEGORY_PILLS.map(({ label, href, icon: Icon }) => (
                  <Link key={label} href={href} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/18 bg-[#062f38]/55 px-3 py-2 text-[8px] font-black uppercase tracking-[.12em] text-white backdrop-blur-xl transition hover:bg-white/15">
                    <Icon size={12} className="text-[#8ce9df]" /> {label}
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">Start with a strong island anchor</p>
                <h2 className="mt-1 text-2xl font-black tracking-[-.04em] text-[#0b2f39] sm:text-3xl">Recommended for you</h2>
              </div>
              <Link href="/explore" className="inline-flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-[.12em] text-[#0f766e]">View all <ArrowRight size={13} /></Link>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {RECOMMENDED.map((item) => (
                <Link key={item.name} href={item.href} className="group overflow-hidden rounded-[24px] border border-[#dfe8e3] bg-white shadow-[0_14px_36px_rgba(8,47,56,.07)] transition hover:-translate-y-1 hover:shadow-[0_22px_48px_rgba(8,47,56,.12)]">
                  <div className="relative aspect-[1.42/1] overflow-hidden">
                    <Image src={item.image} alt={item.alt} fill sizes="(min-width: 768px) 24vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-[#082f38]/85 px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[.13em] text-white backdrop-blur">{item.tag}</span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-base font-black tracking-[-.025em] text-[#0b2f39]">{item.name}</h3>
                        <p className="mt-1 text-[9px] font-black uppercase tracking-[.12em] text-[#0f766e]">{item.island}</p>
                      </div>
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#eef8f5] text-[#0f766e]"><ArrowRight size={14} /></span>
                    </div>
                    <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">{item.detail}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-[#dfe8e3] bg-white p-4 shadow-[0_14px_36px_rgba(8,47,56,.06)] sm:p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">Three islands · one connected journey</p>
                <h2 className="mt-1 text-xl font-black tracking-[-.035em] text-[#0b2f39]">Choose your island</h2>
              </div>
              <Link href="/map" className="grid h-10 w-10 place-items-center rounded-full bg-[#082f38] text-white" aria-label="Open Living Map"><Map size={16} /></Link>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {ISLANDS.map((island) => (
                <Link key={island.code} href={island.href} className="group relative min-h-[155px] overflow-hidden rounded-[20px] bg-[#082f38] p-4 text-white">
                  <Image src={island.image} alt={`${island.name} in the U.S. Virgin Islands`} fill sizes="(min-width: 640px) 25vw, 100vw" className="object-cover transition duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,35,43,.08),rgba(5,35,43,.88))]" />
                  <span className="relative flex h-full min-h-[123px] flex-col justify-end">
                    <span className="text-[8px] font-black uppercase tracking-[.16em] text-[#f5d36d]">{island.code}</span>
                    <span className="mt-1 text-lg font-black">{island.name}</span>
                    <span className="mt-1 text-[9px] font-semibold text-white/68">{island.detail}</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-8 rounded-[28px] bg-[linear-gradient(110deg,#062f38_0%,#075a58_62%,#0f766e_100%)] p-4 text-white shadow-[0_22px_55px_rgba(8,47,56,.18)] sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#f5c451] text-[#082f38] shadow-sm"><Sparkles size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black uppercase tracking-[.17em] text-[#a8f0e8]">AI Concierge · trip-aware planning</p>
                <h2 className="mt-1 text-base font-black tracking-[-.02em] sm:text-lg">Ask once. Keep the answer connected to your trip.</h2>
              </div>
              <Link href={CONCIERGE_DAY} className="hidden shrink-0 items-center gap-2 rounded-full bg-white px-4 py-2.5 text-[9px] font-black uppercase tracking-[.12em] text-[#082f38] sm:inline-flex">Open Concierge <ArrowRight size={13} /></Link>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ConciergePrompt label="Plan my perfect day" prompt="Plan my perfect USVI day" />
              <ConciergePrompt label="Best beaches today" prompt="Help me choose the best beach for my trip today" />
              <ConciergePrompt label="How do I get to STJ?" prompt="How do I get to St. John and what transport timing should I plan for?" />
              <ConciergePrompt label="Dinner near me" prompt="Help me choose dinner that fits my USVI itinerary" />
            </div>
          </section>
        </main>

        <aside className="border-l border-[#e1e9e5] bg-[#f7f5ef] px-4 py-5 lg:block xl:px-5">
          <div className="lg:sticky lg:top-5">
            <section className="rounded-[28px] border border-[#dfe8e3] bg-white p-5 shadow-[0_18px_46px_rgba(8,47,56,.07)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[.16em] text-[#0f766e]">Trip command</p>
                  <h2 className="mt-1 text-2xl font-black tracking-[-.045em] text-[#0b2f39]">Today’s Plan</h2>
                </div>
                <span className="rounded-full bg-[#fff3cf] px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[.12em] text-[#9a6500]">Preview</span>
              </div>
              <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">A clean day shape to start from. Your saved places, bookings and transport can replace these preview stops.</p>

              <div className="mt-5 space-y-1">
                {PLAN_STOPS.map(({ time, title, detail, icon: Icon }, index) => (
                  <div key={title} className="relative grid grid-cols-[44px_1fr] gap-3 pb-4 last:pb-1">
                    {index < PLAN_STOPS.length - 1 ? <span className="absolute left-[21px] top-9 h-[calc(100%-18px)] w-px bg-[#dbe8e3]" /> : null}
                    <span className="relative grid h-11 w-11 place-items-center rounded-[15px] bg-[#eef8f5] text-[#0f766e]"><Icon size={16} /></span>
                    <span className="pt-0.5">
                      <span className="flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.12em] text-[#9a6500]"><Clock3 size={10} /> {time}</span>
                      <span className="mt-1 block text-sm font-black text-[#0b2f39]">{title}</span>
                      <span className="mt-0.5 block text-[10px] font-semibold leading-4 text-slate-500">{detail}</span>
                    </span>
                  </div>
                ))}
              </div>

              <Link href="/trips" className="mt-5 flex min-h-12 items-center justify-between rounded-[17px] bg-[#082f38] px-4 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-[#0d4b51]">
                View full itinerary <ArrowRight size={14} />
              </Link>
              <Link href={CONCIERGE_DAY} className="mt-2 flex min-h-12 items-center justify-between rounded-[17px] bg-[#f5a623] px-4 text-[9px] font-black uppercase tracking-[.13em] text-[#082f38] transition hover:bg-[#ffbb42]">
                Build my day <Sparkles size={14} />
              </Link>
            </section>

            <section className="mt-4 rounded-[24px] border border-[#dfe8e3] bg-white p-4 shadow-[0_14px_34px_rgba(8,47,56,.05)]">
              <p className="text-[8px] font-black uppercase tracking-[.15em] text-[#0f766e]">Quick actions</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {QUICK_ACTIONS.map(({ label, href, icon: Icon }) => (
                  <Link key={label} href={href} className="rounded-[17px] border border-[#e1e9e5] bg-[#fbfaf6] p-3 transition hover:-translate-y-0.5 hover:bg-[#f1f8f5]">
                    <Icon size={16} className="text-[#0f766e]" />
                    <span className="mt-2 block text-[9px] font-black text-[#0b2f39]">{label}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="mt-4 overflow-hidden rounded-[24px] border border-[#dfe8e3] bg-[#082f38] text-white shadow-[0_16px_38px_rgba(8,47,56,.11)]">
              <div className="relative h-28">
                <Image src="/images/mobility/usvi-taxi-van.png" alt="White Ford passenger taxi van marked TAXI and ON DUTY on St. Thomas" fill sizes="340px" className="object-cover" />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,47,56,.05),rgba(8,47,56,.82))]" />
                <span className="absolute bottom-3 left-3 rounded-full bg-[#f5c451] px-2.5 py-1.5 text-[7px] font-black uppercase tracking-[.12em] text-[#082f38]">USVI taxi</span>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-black">Need to move next?</h3>
                <p className="mt-1 text-[10px] font-semibold leading-4 text-white/62">Open the mobility flow for taxi, airport and ferry-connected trip planning.</p>
                <Link href="/mobility" className="mt-3 inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.13em] text-[#8ce9df]">Plan transportation <ArrowRight size={12} /></Link>
              </div>
            </section>

            <p className="mt-4 px-1 text-[8px] font-semibold leading-4 text-slate-400">Ferry schedules, taxi availability, road conditions and operating hours can change. Confirm time-sensitive details before departure.</p>
          </div>
        </aside>
      </div>

      <nav aria-label="Mobile trip navigation" className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-5 rounded-[22px] border border-white/12 bg-[#062f38]/95 p-1.5 text-white shadow-[0_18px_55px_rgba(4,33,40,.34)] backdrop-blur-xl lg:hidden">
        <MobileNavLink label="Explore" href="/explore" icon={Compass} />
        <MobileNavLink label="Map" href="/map" icon={Map} />
        <MobileNavLink label="Ask AI" href={CONCIERGE_DAY} icon={Sparkles} accent />
        <MobileNavLink label="Plan" href="/trips" icon={Route} />
        <MobileNavLink label="Rides" href="/mobility" icon={CarFront} />
      </nav>
    </section>
  );
}

function SidebarLink({ label, href, icon: Icon, active = false }: { label: string; href: string; icon: LucideIcon; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`flex min-h-9 items-center gap-2.5 rounded-[13px] px-3 py-2 text-[9px] font-black tracking-[.02em] transition ${active ? "bg-white text-[#082f38] shadow-sm" : "text-white/64 hover:bg-white/8 hover:text-white"}`}
    >
      <Icon size={14} className={active ? "text-[#0f766e]" : "text-[#85ded5]"} />
      {label}
    </Link>
  );
}

function ConciergePrompt({ label, prompt }: { label: string; prompt: string }) {
  return (
    <Link
      href={`/concierge?open=true&prompt=${encodeURIComponent(prompt)}`}
      className="shrink-0 rounded-full border border-white/16 bg-white/10 px-3 py-2 text-[8px] font-black text-white/82 transition hover:bg-white/16"
    >
      {label}
    </Link>
  );
}

function MobileNavLink({ label, href, icon: Icon, accent = false }: { label: string; href: string; icon: LucideIcon; accent?: boolean }) {
  return (
    <Link href={href} className="flex min-w-0 flex-col items-center justify-center gap-1 rounded-[16px] px-1 py-1.5 text-[7px] font-black uppercase tracking-[.06em] text-white/66">
      <span className={`grid h-8 w-8 place-items-center rounded-full ${accent ? "bg-[#f5c451] text-[#082f38] shadow-[0_8px_20px_rgba(245,196,81,.28)]" : "text-[#8ce9df]"}`}>
        <Icon size={15} />
      </span>
      <span className="truncate">{label}</span>
    </Link>
  );
}
