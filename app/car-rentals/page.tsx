import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CalendarDays, CarFront, CheckCircle2, ExternalLink, Info, MapPin, ShieldCheck, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { OperatorVisual } from "@/components/car-rentals/operator-visual";
import { RentalDecisionLauncher } from "@/components/car-rentals/rental-decision-launcher";
import { CAR_RENTAL_ISLAND_NAMES, CAR_RENTAL_OPERATORS, type CarRentalIsland, type CarRentalOperator } from "@/lib/car-rentals";

export const metadata: Metadata = {
  title: "Car Rentals",
  description: "Compare verified car and Jeep rental operators across St. Thomas, St. John, and St. Croix, then connect the rental to your USVI Explorer trip.",
};

const ISLAND_VISUALS: Record<CarRentalIsland, { image: string; alt: string }> = {
  stt: { image: "/images/usvi-harbor-hero.jpg", alt: "The hills and harbor of St. Thomas" },
  stj: { image: "/images/places/st-john/trunk-bay-overlook-1.jpg", alt: "The green hills and bays of St. John" },
  stx: { image: "/images/places/st-croix/cane-bay-beach-1.jpg", alt: "The coastline of St. Croix" },
};

export default function CarRentalsPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-14 pt-5 text-white sm:px-7 lg:px-10 lg:pb-20">
        <Image src="/images/usvi-harbor-hero.jpg" alt="St. Thomas harbor and island roads" fill priority sizes="100vw" className="-z-30 object-cover object-center" />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98),rgba(3,47,45,.91)_48%,rgba(3,47,45,.4))]" />
        <ViPublicHeader actionHref="/concierge?open=true&prompt=Help%20me%20choose%20a%20car%20rental%20for%20my%20USVI%20trip" actionLabel="Ask Concierge" actionIcon={Sparkles} secondaryHref="/mobility" secondaryLabel="Taxi & transfers" />
        <div className="mx-auto grid max-w-7xl gap-10 pb-4 pt-16 lg:grid-cols-[1.1fr_.9fr] lg:items-end lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f9d875]"><CarFront size={15} /> Car rentals · island-aware planning</div>
            <h1 className="vi-display mt-7 max-w-4xl text-[clamp(4rem,8vw,7rem)] font-bold leading-[.84]">Drive with<span className="block italic text-[#73e3d9]">island confidence.</span></h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/76 sm:text-xl sm:leading-8">Compare verified operators, choose the right pickup point and vehicle type, and connect your rental to arrival, lodging, ferries, beaches, and the rest of your USVI Explorer trip.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="#rental-start-title" className="inline-flex min-h-13 items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d]">Start with my trip <ArrowRight size={15} /></Link>
              <Link href="#operators" className="vi-glass inline-flex min-h-13 items-center gap-2 rounded-full px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-white"><CarFront size={16} className="text-[#73e3d9]" /> Compare operators</Link>
            </div>
          </div>
          <aside className="vi-glass rounded-[32px] p-6 sm:p-7"><div className="flex gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#73e3d9]" /><div><div className="vi-eyebrow text-[#f5c451]">Know before you reserve</div><h2 className="vi-display mt-3 text-3xl font-bold">USVI driving is different.</h2><p className="mt-3 text-sm font-semibold leading-6 text-white/64">Drive on the left. Confirm the deposit, insurance, age rules, after-hours return, ferry permission, and exact pickup instructions directly with the operator before relying on a reservation.</p></div></div></aside>
        </div>
      </section>

      <RentalDecisionLauncher />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-7 lg:px-10 lg:py-14"><div className="grid gap-4 md:grid-cols-3"><PlanningCard icon={CarFront} title="Choose the right vehicle" text="Compact cars can work well on paved routes; larger groups, steep access roads, and St. John plans may call for an SUV or 4x4." /><PlanningCard icon={CalendarDays} title="Match the arrival" text="Coordinate pickup with the correct airport or ferry terminal and verify what happens when a flight or ferry arrives late." /><PlanningCard icon={Info} title="Compare the true total" text="Ask about taxes, deposits, insurance, additional drivers, fuel, mileage, cleaning, parking, and cancellation—not only the daily rate." /></div></section>

      <section id="operators" className="mx-auto max-w-7xl scroll-mt-6 px-4 pb-12 sm:px-7 lg:px-10"><div><div className="vi-eyebrow text-[#9b5d12]">Verified directory</div><h2 className="vi-display mt-3 text-4xl font-bold sm:text-6xl">Choose your pickup island.</h2><p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-slate-600">USVI Explorer verifies that these operator and location pages exist. Vehicle availability, live pricing, policies, and reservation confirmation remain the operator&apos;s responsibility.</p></div><div className="mt-10 space-y-12">{(["stt", "stj", "stx"] as const).map((island) => <IslandSection key={island} island={island} operators={CAR_RENTAL_OPERATORS.filter((operator) => operator.island === island)} />)}</div></section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-7 lg:px-10"><div className="rounded-[36px] bg-[#032f2d] p-7 text-white shadow-[0_24px_70px_rgba(3,47,45,.16)] sm:p-10"><div className="vi-eyebrow text-[#f5c451]">Rental or taxi?</div><h2 className="vi-display mt-3 max-w-3xl text-4xl font-bold leading-[.95] sm:text-5xl">Let the trip decide—not habit.</h2><p className="mt-4 max-w-3xl text-sm font-semibold leading-7 text-white/65">Concierge can compare total rental costs with taxi and transfer costs using your island, lodging, group, luggage, planned stops, parking, and ferry connections.</p><div className="mt-7 flex flex-wrap gap-3"><Link href="/concierge?open=true&prompt=Should%20I%20rent%20a%20car%20or%20use%20taxis%20for%20my%20USVI%20trip%3F%20Compare%20the%20full%20cost%2C%20convenience%2C%20parking%2C%20ferries%2C%20and%20my%20planned%20activities." className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#f5c451] px-6 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d]">Compare my options <Sparkles size={16} /></Link><Link href="/mobility" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-white/15 bg-white/[.08] px-6 text-[10px] font-black uppercase tracking-[.16em] text-white">Open taxi & transfers <ArrowRight size={15} /></Link></div></div></section>
    </main>
  );
}

function IslandSection({ island, operators }: { island: CarRentalIsland; operators: CarRentalOperator[] }) {
  const visual = ISLAND_VISUALS[island];
  return <section><div className="relative min-h-[190px] overflow-hidden rounded-[30px] p-6 text-white sm:p-8"><Image src={visual.image} alt={visual.alt} fill sizes="100vw" className="-z-20 object-cover" /><div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(3,47,45,.94),rgba(3,47,45,.42))]" /><div className="vi-eyebrow text-[#f5c451]">{operators.length} verified options</div><h3 className="vi-display mt-2 text-4xl font-bold">{CAR_RENTAL_ISLAND_NAMES[island]}</h3><p className="mt-3 max-w-xl text-sm font-semibold text-white/68">Compare pickup location, fleet emphasis, and operator policies before reserving.</p></div><div className="mt-5 grid gap-5 lg:grid-cols-2">{operators.map((operator) => <OperatorCard key={operator.id} operator={operator} />)}</div></section>;
}

function OperatorCard({ operator }: { operator: CarRentalOperator }) {
  const prompt = encodeURIComponent(`Help me evaluate ${operator.name} on ${CAR_RENTAL_ISLAND_NAMES[operator.island]}. Ask for my dates, arrival point, lodging, group size, luggage, vehicle needs, budget, and ferry plans. Remind me to verify the full price and policies directly.`);
  return <article className="group flex h-full flex-col overflow-hidden rounded-[28px] border border-[#d5e4df] bg-[#fffdf8] p-6 shadow-[0_16px_45px_rgba(3,47,45,.07)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(3,47,45,.11)]"><OperatorVisual island={operator.island} name={operator.name} location={operator.location} /><div className="flex items-start justify-between gap-4"><div><span className="inline-flex items-center gap-1.5 rounded-full bg-[#e4f4f0] px-3 py-1.5 text-[8px] font-black uppercase tracking-[.13em] text-[#0f766e]"><BadgeCheck size={13} /> Verified directory</span><h4 className="vi-display mt-4 text-3xl font-bold">{operator.name}</h4><p className="mt-2 inline-flex items-center gap-2 text-xs font-black text-[#0f766e]"><MapPin size={15} /> {operator.location}</p></div><CarFront className="h-7 w-7 shrink-0 text-[#9b5d12]" /></div><div className="mt-5 flex flex-wrap gap-2">{operator.vehicleTypes.map((type) => <span key={type} className="rounded-full border border-[#dce7e4] bg-white px-3 py-1.5 text-[8px] font-black uppercase tracking-[.11em] text-[#49615e]">{type}</span>)}</div><div className="mt-5 space-y-2">{operator.features.map((feature) => <div key={feature} className="flex items-center gap-2 text-sm font-semibold text-slate-600"><CheckCircle2 size={15} className="text-[#0f766e]" /> {feature}</div>)}</div><p className="mt-5 text-[10px] font-semibold leading-5 text-slate-500">Source: {operator.sourceLabel}. Directory checked {operator.verifiedAt}. Live availability and policies must be confirmed with the operator.</p><div className="mt-auto grid grid-cols-2 gap-2 pt-6"><a href={operator.website} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[#032f2d] px-4 text-[8px] font-black uppercase tracking-[.12em] text-white">Operator site <ExternalLink size={14} /></a><Link href={`/concierge?island=${operator.island}&open=true&prompt=${prompt}`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#b8e2dc] bg-[#eaf8f5] px-4 text-[8px] font-black uppercase tracking-[.12em] text-[#0f766e]">Plan rental <Sparkles size={14} /></Link></div></article>;
}

function PlanningCard({ icon: Icon, title, text }: { icon: typeof CarFront; title: string; text: string }) {
  return <div className="rounded-[26px] border border-[#d5e4df] bg-[#fffdf8] p-6"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#e4f4f0] text-[#0f766e]"><Icon size={20} /></span><h3 className="mt-4 text-lg font-black">{title}</h3><p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{text}</p></div>;
}
