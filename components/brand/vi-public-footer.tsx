import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Compass,
  Handshake,
  MapPinned,
  Sparkles,
} from "lucide-react";

import { ViBrandMark } from "@/components/brand/vi-brand-mark";

const FOOTER_GROUPS = [
  {
    label: "Explore",
    links: [
      ["Complete guide", "/explore"],
      ["Live map", "/map"],
      ["Beaches", "/beaches"],
      ["Activities", "/activities"],
      ["History", "/historic"],
    ],
  },
  {
    label: "Plan",
    links: [
      ["My trip", "/trips"],
      ["Ride", "/mobility"],
      ["Concierge", "/concierge"],
      ["Cruise day", "/cruises"],
    ],
  },
  {
    label: "USVI Explorer",
    links: [
      ["Our mission", "/mission"],
      ["Partner network", "/partners"],
      ["Partner status", "/partners/status"],
      ["Privacy", "/privacy"],
    ],
  },
] as const;

export function ViPublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#021f1d] px-4 pb-8 pt-12 text-white sm:px-7 sm:pb-10 lg:px-10 lg:pt-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-9 lg:grid-cols-[1.05fr_.95fr] lg:items-stretch">
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(115,227,217,.16),transparent_36%),linear-gradient(145deg,#073b39,#032f2d)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.22)] sm:p-8">
            <div className="flex items-center gap-3">
              <ViBrandMark className="h-14 w-14" />
              <div>
                <div className="vi-wordmark text-xl font-black tracking-[-.035em]">USVI Explorer</div>
                <div className="mt-1 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-[.2em] text-[#9fe7df]">
                  <MapPinned size={11} aria-hidden="true" /> Discover · plan · move
                </div>
              </div>
            </div>
            <h2 className="vi-display mt-7 max-w-2xl text-4xl font-bold leading-[.94] sm:text-5xl">
              One connected journey across the Virgin Islands.
            </h2>
            <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/62">
              Discover the territory, shape a practical trip, move between islands, and keep local context with you from arrival to the last beach day.
            </p>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[8px] font-black uppercase tracking-[.16em] text-white/52">
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#73e3d9]" /> St. Thomas</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#73e3d9]" /> St. John</span>
              <span className="inline-flex items-center gap-1.5"><BadgeCheck size={13} className="text-[#73e3d9]" /> St. Croix</span>
            </div>
          </section>

          <section className="rounded-[34px] border border-[#f5c451]/20 bg-[#f5c451] p-6 text-[#032f2d] shadow-[0_24px_70px_rgba(0,0,0,.18)] sm:p-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#032f2d] px-3 py-2 text-[8px] font-black uppercase tracking-[.17em] text-[#f9d875]">
              <Handshake size={14} aria-hidden="true" /> Local business growth
            </span>
            <h2 className="vi-display mt-6 text-4xl font-bold leading-[.94] sm:text-5xl">
              Put your business inside the traveler journey.
            </h2>
            <p className="mt-4 max-w-xl text-sm font-semibold leading-7 text-[#4f4a37]">
              Apply to join the partner network and connect your offer to discovery, trip planning, Concierge, and booking demand.
            </p>
            <Link href="/partners/apply" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#032f2d] px-6 text-[9px] font-black uppercase tracking-[.16em] text-white shadow-[0_14px_30px_rgba(3,47,45,.2)] transition hover:-translate-y-0.5 hover:bg-[#064844]">
              Become a partner <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </section>
        </div>

        <div className="mt-10 grid gap-10 border-t border-white/10 pt-9 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto]">
          {FOOTER_GROUPS.map((group) => (
            <nav key={group.label} aria-label={`${group.label} links`}>
              <div className="text-[8px] font-black uppercase tracking-[.2em] text-[#f5c451]">{group.label}</div>
              <div className="mt-4 grid gap-3">
                {group.links.map(([label, href]) => (
                  <Link key={href} href={href} className="w-fit text-sm font-bold text-white/58 transition hover:text-[#8ef0e7]">
                    {label}
                  </Link>
                ))}
              </div>
            </nav>
          ))}
          <div className="sm:col-span-3 lg:col-span-1 lg:text-right">
            <Link href="/concierge?open=true" className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.07] px-5 py-3 text-[9px] font-black uppercase tracking-[.15em] text-white transition hover:bg-white/[.12]">
              <Sparkles size={14} className="text-[#73e3d9]" aria-hidden="true" /> Ask Concierge
            </Link>
            <Link href="/terms" className="mt-4 block text-[9px] font-bold uppercase tracking-[.14em] text-white/38 transition hover:text-white/70">Terms of service</Link>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-[8px] font-black uppercase tracking-[.16em] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2"><Compass size={13} aria-hidden="true" /> Built for the U.S. Virgin Islands</span>
          <span>usvi-explorer.com · Local insight for every island day</span>
        </div>
      </div>
    </footer>
  );
}
