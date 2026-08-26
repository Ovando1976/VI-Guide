"use client";

import Link from "next/link";
import { ArrowRight, Map, ShipWheel, Sparkles } from "lucide-react";
import { trackAcquisitionEvent } from "@/lib/acquisition-client";

export function HomePrimaryActions({ conciergeHref }: { conciergeHref: string }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      <Link
        href="#traveler-intent"
        onClick={() => trackAcquisitionEvent("intent_selected", { intent: "choose-intent" })}
        className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-7 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d] shadow-[0_16px_40px_rgba(245,196,81,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
      >
        Start my visit <ArrowRight size={15} />
      </Link>
      <Link
        href="/cruises"
        onClick={() => trackAcquisitionEvent("intent_selected", { intent: "cruise" })}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[#f5c451]/35 bg-[#f5c451]/10 px-5 py-3 text-[9px] font-black uppercase tracking-[.14em] text-[#f9d875] transition hover:-translate-y-0.5 hover:bg-[#f5c451]/18 sm:text-[10px] sm:tracking-[.16em]"
      >
        <ShipWheel size={15} /> Cruise Hub
      </Link>
      <Link
        href={conciergeHref}
        onClick={() => trackAcquisitionEvent("concierge_started", { entry: "home-hero" })}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/16 bg-white/[.06] px-5 py-3 text-[9px] font-black uppercase tracking-[.14em] text-white/82 transition hover:-translate-y-0.5 hover:bg-white/[.12] hover:text-white sm:text-[10px] sm:tracking-[.16em]"
      >
        <Sparkles size={15} className="text-[#73e3d9]" /> Ask Concierge
      </Link>
      <Link
        href="/map"
        className="inline-flex min-h-11 items-center justify-center gap-2 px-2 py-3 text-[9px] font-black uppercase tracking-[.14em] text-white/64 transition hover:-translate-y-0.5 hover:text-white sm:text-[10px] sm:tracking-[.15em]"
      >
        <Map size={15} /> Explore map
      </Link>
    </div>
  );
}
