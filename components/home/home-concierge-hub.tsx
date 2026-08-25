import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BedDouble, Car, CarFront, Compass, Route, Sparkles } from "lucide-react";

const CONVERSION_ACTIONS = [
  { label: "Experiences", detail: "Tours, charters, diving & island days", cta: "Find experiences", href: "/activities", icon: Compass, image: "/images/places/st-john/trunk-bay-overlook-1.jpg", alt: "Trunk Bay overlook and North Shore scenery in St. John" },
  { label: "Stays", detail: "Hotels, resorts, villas & island bases", cta: "Find a stay", href: "/accommodations", icon: BedDouble, image: "/images/accommodations/king-christian-hotel.jpg", alt: "King Christian Hotel in Christiansted" },
  { label: "Transportation", detail: "Taxi, airport and ferry handoffs", cta: "Plan transportation", href: "/mobility", icon: Car, image: "/images/mobility/usvi-taxi-van.png", alt: "USVI passenger taxi van on St. Thomas" },
  { label: "Car rentals", detail: "Compare island vehicles and pickup options", cta: "Compare cars", href: "/car-rentals", icon: CarFront, image: "/images/places/st-croix/cane-bay-beach-1.jpg", alt: "Cane Bay coast in St. Croix" },
] as const;

export function HomeConciergeHub() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-8 lg:px-12">
      <div className="overflow-hidden rounded-[36px] bg-[#073b39] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)]">
        <div className="grid lg:grid-cols-[.82fr_1.18fr]">
          <div className="border-b border-white/10 p-8 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
            <div className="inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.24em] text-[#f5c451]"><Route size={14} /> Book & move</div>
            <h2 className="mt-4 max-w-xl font-serif text-4xl font-bold leading-[.98] tracking-[-.045em] sm:text-5xl">Turn the plan into the next real move.</h2>
            <p className="mt-5 max-w-xl text-base font-semibold leading-7 text-white/68">Once you know what kind of trip you are taking, move directly into the high-intent parts of USVI Explorer: experiences, stays, transportation, vehicles, and the trip that holds them together.</p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#73e3d9]/20 bg-[#73e3d9]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.16em] text-[#9ff1e8]"><BadgeCheck size={14} /> One journey · fewer dead ends</div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/trips" className="inline-flex items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-[#073b39]">Open My Trip <ArrowRight size={16} /></Link>
              <Link href="/concierge?open=true&prompt=Help%20me%20turn%20my%20USVI%20trip%20ideas%20into%20bookings%2C%20transportation%2C%20and%20a%20practical%20day-by-day%20plan" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.07] px-6 py-3.5 text-xs font-black uppercase tracking-[.15em] text-white transition hover:bg-white/[.12]"><Sparkles size={15} /> Ask Concierge</Link>
            </div>
          </div>
          <div className="p-6 sm:p-8 lg:p-10">
            <div className="mb-5">
              <div className="text-[9px] font-black uppercase tracking-[.2em] text-white/50">High-intent actions</div>
              <h3 className="mt-2 text-2xl font-black tracking-[-.035em]">Ready to act? Go straight there.</h3>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {CONVERSION_ACTIONS.map(({ label, detail, cta, href, image, alt, icon: Icon }) => (
                <Link key={label} href={href} className="group relative flex min-h-[190px] items-end overflow-hidden rounded-[24px] border border-white/12 bg-[#032f2d] p-4 transition hover:-translate-y-0.5 hover:border-[#f5c451]/60">
                  <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 28vw, (min-width: 640px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.32)_38%,rgba(2,31,29,.94)_100%)]" />
                  <span className="relative flex w-full items-end gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/92 text-[#0f766e] shadow-lg backdrop-blur transition group-hover:bg-[#f5c451] group-hover:text-[#073b39]"><Icon size={19} aria-hidden="true" /></span>
                    <span className="min-w-0 pb-0.5">
                      <span className="block text-sm font-black text-white">{label}</span>
                      <span className="mt-1 block text-[10px] font-semibold leading-4 text-white/60">{detail}</span>
                      <span className="mt-2 inline-flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.14em] text-[#f5c451]">{cta} <ArrowRight size={12} /></span>
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
