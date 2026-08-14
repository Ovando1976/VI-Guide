import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CarFront, Plane, Sailboat, Sparkles, UsersRound } from "lucide-react";

const STARTS = [
  {
    label: "Airport arrival",
    detail: "Match pickup to your flight",
    icon: Plane,
    image: "/images/usvi-harbor-hero.jpg",
    imageAlt: "St. Thomas arrival landscape",
    href: "/concierge?open=true&prompt=Help%20me%20choose%20a%20USVI%20car%20rental%20for%20an%20airport%20arrival.%20Ask%20which%20island%2C%20airport%2C%20flight%20time%2C%20lodging%2C%20group%20size%2C%20luggage%2C%20and%20vehicle%20needs.",
  },
  {
    label: "Ferry arrival",
    detail: "Plan pickup around the dock",
    icon: Sailboat,
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    imageAlt: "St. John turquoise water and green hills",
    href: "/concierge?open=true&prompt=Help%20me%20choose%20a%20USVI%20car%20rental%20for%20a%20ferry%20arrival.%20Ask%20which%20island%2C%20ferry%20terminal%2C%20arrival%20time%2C%20lodging%2C%20and%20whether%20the%20vehicle%20needs%20ferry%20permission.",
  },
  {
    label: "Jeep / 4x4",
    detail: "Steep roads & beach days",
    icon: CarFront,
    image: "/images/places/st-john/trunk-bay-overlook-1.jpg",
    imageAlt: "St. John island roads and coastal scenery",
    href: "/concierge?open=true&prompt=Find%20the%20best%20Jeep%20or%204x4%20rental%20for%20my%20USVI%20trip.%20Compare%20island%2C%20pickup%20location%2C%20road%20access%2C%20parking%2C%20full%20price%2C%20insurance%2C%20and%20policies.",
  },
  {
    label: "Family / group",
    detail: "Seats, luggage & true cost",
    icon: UsersRound,
    image: "/images/places/st-croix/cane-bay-beach-1.jpg",
    imageAlt: "St. Croix coastal scenery for an island road trip",
    href: "/concierge?open=true&prompt=Help%20me%20choose%20a%20USVI%20rental%20vehicle%20for%20a%20family%20or%20group.%20Ask%20about%20passengers%2C%20children%2C%20car%20seats%2C%20luggage%2C%20lodging%2C%20activities%2C%20and%20budget.",
  },
];

export function RentalDecisionLauncher() {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-10 sm:px-7 lg:px-10 lg:pt-14" aria-labelledby="rental-start-title">
      <div className="rounded-[32px] border border-[#d5e4df] bg-[#fffdf8] p-5 shadow-[0_16px_45px_rgba(3,47,45,.07)] sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="vi-eyebrow text-[#0f766e]">Start with your arrival</p>
            <h2 id="rental-start-title" className="vi-display mt-2 text-3xl font-bold sm:text-4xl">What does the rental need to solve?</h2>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-600">Choose the situation that matches your trip. Concierge will connect arrival, lodging, vehicle needs, ferry plans, parking, and the full cost before you pick an operator.</p>
          </div>
          <Link href="/concierge?open=true&prompt=Compare%20renting%20a%20car%20with%20using%20taxis%20for%20my%20USVI%20trip.%20Use%20my%20island%2C%20arrival%2C%20lodging%2C%20group%2C%20luggage%2C%20activities%2C%20parking%2C%20and%20ferry%20plans." className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#032f2d] px-5 text-[9px] font-black uppercase tracking-[.13em] text-white transition hover:bg-[#075e58]">
            <Sparkles className="h-4 w-4 text-[#73e3d9]" /> Rental or taxi? <ArrowRight className="h-4 w-4 text-[#f5c451]" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STARTS.map(({ label, detail, icon: Icon, href, image, imageAlt }) => (
            <Link key={label} href={href} className="group overflow-hidden rounded-[24px] border border-[#dce7e4] bg-white transition hover:-translate-y-0.5 hover:border-[#aad7d0] hover:shadow-[0_14px_30px_rgba(4,51,49,.12)]">
              <div className="relative aspect-[16/10] overflow-hidden bg-[#dfece8]">
                <Image src={image} alt={imageAlt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="object-cover transition duration-500 group-hover:scale-[1.04]" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#032f2d]/55 via-transparent to-transparent" />
                <span className="absolute bottom-3 left-3 grid h-10 w-10 place-items-center rounded-2xl border border-white/25 bg-[#032f2d]/85 text-[#73e3d9] backdrop-blur"><Icon className="h-5 w-5" /></span>
              </div>
              <div className="p-4">
                <strong className="block text-base font-black text-[#032f2d]">{label}</strong>
                <span className="mt-1 block text-xs font-semibold text-slate-500">{detail}</span>
                <span className="mt-4 inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-[.12em] text-[#0f766e]">Plan this <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" /></span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
