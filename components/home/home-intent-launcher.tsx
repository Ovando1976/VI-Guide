"use client";

import Image from "next/image";
import Link from "next/link";
import { Anchor, ArrowRight, CalendarDays, MapPin, Plane, type LucideIcon } from "lucide-react";

import { trackAcquisitionEvent } from "@/lib/acquisition-client";

type Intent = { id: string; eyebrow: string; title: string; detail: string; href: string; cta: string; icon: LucideIcon; image: string; alt: string };

const INTENTS: Intent[] = [
  { id: "here-now", eyebrow: "I’m already here", title: "Here now", detail: "Find what is nearby, get a ride, choose a beach, eat well, and make today work.", href: "/concierge?open=true&prompt=I%20am%20in%20the%20USVI%20right%20now.%20Help%20me%20plan%20what%20to%20do%20today.", cta: "Run today", icon: MapPin, image: "/images/places/st-john/trunk-bay-overlook-1.jpg", alt: "Turquoise bays and green hills seen from a St. John overlook" },
  { id: "arriving-soon", eyebrow: "My trip is booked", title: "Arriving soon", detail: "Coordinate airport or ferry arrival, stays, transfers, timing, and your first island day.", href: "/concierge?open=true&prompt=I%20am%20arriving%20in%20the%20USVI%20soon.%20Help%20me%20prepare%20my%20arrival%20and%20first%20day.", cta: "Prepare arrival", icon: Plane, image: "/images/places/st-thomas/red-hook-ferry-terminal-1.jpg", alt: "Red Hook ferry terminal arrival area on St. Thomas" },
  { id: "cruise-passenger", eyebrow: "I have limited port time", title: "Cruise passenger", detail: "Build a port-day plan around your ship, dock, must-see stops, transport, and return time.", href: "/concierge?open=true&prompt=I%20am%20visiting%20the%20USVI%20on%20a%20cruise.%20Build%20a%20safe%20port-day%20plan%20that%20gets%20me%20back%20to%20the%20ship%20on%20time.", cta: "Build port day", icon: Anchor, image: "/images/usvi-harbor-hero.jpg", alt: "Charlotte Amalie harbor and cruise port on St. Thomas" },
  { id: "planning-trip", eyebrow: "I’m deciding what to book", title: "Planning a trip", detail: "Compare islands, stays, beaches, experiences, transportation, and turn ideas into one itinerary.", href: "/concierge?open=true&prompt=Help%20me%20plan%20a%20complete%20USVI%20trip%20from%20scratch.", cta: "Plan my trip", icon: CalendarDays, image: "/images/places/st-thomas/magens-bay-beach-1.jpg", alt: "Magens Bay beach and green hills on St. Thomas" },
];

export function HomeIntentLauncher() {
  return (
    <section id="traveler-intent" className="mx-auto max-w-7xl px-4 py-12 sm:px-7 lg:px-10 lg:py-16" aria-labelledby="traveler-intent-title">
      <div className="rounded-[36px] border border-[#d5e4df] bg-[#fffdf8] p-5 shadow-[0_24px_70px_rgba(2,31,29,.09)] sm:p-8 lg:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div><div className="vi-eyebrow text-[#9b5d12]">Start with what you need</div><h2 id="traveler-intent-title" className="vi-display mt-3 max-w-3xl text-4xl font-bold leading-[.95] text-[#032f2d] sm:text-5xl">Where are you in your Virgin Islands journey?</h2></div>
          <p className="max-w-lg text-sm font-semibold leading-6 text-slate-600">Pick the situation that fits. VI Guide will take you into the right workflow instead of making you figure out which feature to open first.</p>
        </div>
        <div className="mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {INTENTS.map(({ id, eyebrow, title, detail, href, cta, icon: Icon, image, alt }) => (
            <Link key={id} href={href} onClick={() => trackAcquisitionEvent("intent_selected", { intent: id })} className="group flex min-h-[330px] flex-col overflow-hidden rounded-[28px] border border-[#d5e4df] bg-white transition hover:-translate-y-1 hover:border-[#72cfc5] hover:shadow-[0_20px_50px_rgba(2,31,29,.10)]">
              <span className="relative block h-36 shrink-0 overflow-hidden">
                <Image src={image} alt={alt} fill sizes="(min-width: 1280px) 25vw, (min-width: 768px) 50vw, 100vw" className="object-cover transition duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-[linear-gradient(180deg,rgba(3,47,45,.02),rgba(3,47,45,.18))]" />
                <span className="absolute left-4 top-4 grid h-12 w-12 place-items-center rounded-2xl border border-white/70 bg-white/90 text-[#0f766e] shadow-lg backdrop-blur transition group-hover:bg-[#032f2d] group-hover:text-[#73e3d9]"><Icon size={21} /></span>
              </span>
              <span className="flex flex-1 flex-col p-5"><span className="vi-eyebrow text-[#9b5d12]">{eyebrow}</span><span className="vi-display mt-2 text-3xl font-bold text-[#032f2d]">{title}</span><span className="mt-3 flex-1 text-sm font-semibold leading-6 text-slate-600">{detail}</span><span className="mt-5 inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[.16em] text-[#0f766e]">{cta} <ArrowRight size={14} /></span></span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}