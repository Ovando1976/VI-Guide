"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Clock3, MapPinned, Ship } from "lucide-react";
import { trackAcquisitionEvent } from "@/lib/acquisition-client";

const INTENTS = [
  { id: "here-now", label: "Here now", detail: "Make the most of the next few hours.", href: "/concierge?open=true&prompt=I%27m%20in%20the%20Virgin%20Islands%20right%20now.%20Help%20me%20decide%20what%20to%20do%20next%2C%20including%20timing%2C%20transportation%2C%20food%2C%20and%20nearby%20options.", icon: MapPinned, image: "/images/places/st-john/trunk-bay-overlook-1.jpg", alt: "Turquoise bays and green hills seen from a St. John overlook" },
  { id: "arriving-soon", label: "Arriving soon", detail: "Turn arrival into a smooth first day.", href: "/concierge?open=true&prompt=I%27m%20arriving%20in%20the%20Virgin%20Islands%20soon.%20Help%20me%20plan%20my%20arrival%2C%20airport%20or%20ferry%20transfer%2C%20check-in%2C%20and%20first%20day.", icon: Clock3, image: "/images/places/st-thomas/red-hook-ferry-terminal-1.jpg", alt: "Red Hook ferry terminal arrival area on St. Thomas" },
  { id: "cruise-passenger", label: "Cruise passenger", detail: "Build a port-day plan that gets you back on time.", href: "/concierge?open=true&prompt=I%27m%20visiting%20the%20Virgin%20Islands%20on%20a%20cruise.%20Build%20me%20a%20shore-day%20plan%20with%20transportation%2C%20things%20to%20do%2C%20food%2C%20and%20a%20safe%20return-to-ship%20timeline.", icon: Ship, image: "/images/usvi-harbor-hero.jpg", alt: "Charlotte Amalie harbor and cruise port on St. Thomas" },
  { id: "planning-trip", label: "Planning a trip", detail: "Shape the stay before you land.", href: "/concierge?open=true&prompt=Help%20me%20plan%20a%20complete%20Virgin%20Islands%20trip.%20Start%20with%20the%20right%20island%2C%20where%20to%20stay%2C%20what%20to%20do%2C%20transportation%2C%20and%20a%20day-by-day%20plan.", icon: CalendarDays, image: "/images/places/st-thomas/magens-bay-beach-1.jpg", alt: "Magens Bay beach and green hills on St. Thomas" },
] as const;

export function HomeTravelerIntent() {
  return (
    <section id="traveler-intent" className="scroll-mt-6 border-y border-[#d5e4df] bg-[#fffdf8]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-7 lg:px-10 lg:py-16">
        <div className="grid gap-7 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
          <div>
            <div className="vi-eyebrow text-[#9b5d12]">Start here</div>
            <h2 className="vi-display mt-3 text-4xl font-bold leading-[.94] sm:text-5xl">Tell us where you are in the journey.</h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-slate-600">Choose one situation and we’ll pass that context straight into Concierge, so you start with a useful plan instead of another menu.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {INTENTS.map(({ id, label, detail, href, icon: Icon, image, alt }) => (
              <Link key={id} href={href} onClick={() => trackAcquisitionEvent("intent_selected", { intent: id, entry: "home-intent" })} className="group grid min-h-[168px] grid-cols-[116px_1fr] overflow-hidden rounded-[26px] border border-[#d5e4df] bg-white shadow-[0_14px_36px_rgba(2,31,29,.06)] transition hover:-translate-y-0.5 hover:border-[#0f766e]/40 hover:shadow-[0_18px_44px_rgba(2,31,29,.1)] sm:grid-cols-[132px_1fr]">
                <span className="relative min-h-full overflow-hidden">
                  <Image src={image} alt={alt} fill sizes="(min-width: 1024px) 132px, 116px" className="object-cover transition duration-700 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.04),rgba(3,47,45,.22))]" />
                  <span className="absolute left-3 top-3 grid h-10 w-10 place-items-center rounded-xl border border-white/70 bg-white/90 text-[#0f766e] shadow-md backdrop-blur transition group-hover:bg-[#032f2d] group-hover:text-[#73e3d9]"><Icon size={18} /></span>
                </span>
                <span className="flex min-w-0 flex-col justify-center p-4 sm:p-5"><span className="block text-base font-black text-[#032f2d]">{label}</span><span className="mt-1.5 block text-xs font-semibold leading-5 text-slate-500">{detail}</span><span className="mt-3 inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.14em] text-[#9b5d12]">Start here <ArrowRight size={13} /></span></span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
