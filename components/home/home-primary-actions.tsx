"use client";

import Link from "next/link";
import { ArrowRight, Map, Sparkles } from "lucide-react";

import { trackAcquisitionEvent } from "@/lib/acquisition-client";

export function HomePrimaryActions({ conciergeHref }: { conciergeHref: string }) {
  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href="#traveler-intent-title"
        onClick={() => trackAcquisitionEvent("intent_selected", { intent: "choose-intent" })}
        className="inline-flex min-h-13 items-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d] shadow-[0_16px_40px_rgba(245,196,81,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
      >
        Start my visit <ArrowRight size={15} />
      </Link>
      <Link
        href={conciergeHref}
        onClick={() => trackAcquisitionEvent("concierge_started", { entry: "home-hero" })}
        className="vi-glass inline-flex min-h-13 items-center gap-2 rounded-full px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-white transition hover:-translate-y-0.5 hover:bg-white/[.16]"
      >
        <Sparkles size={17} className="text-[#73e3d9]" /> Ask Concierge
      </Link>
      <Link
        href="/map"
        className="inline-flex min-h-13 items-center gap-2 px-2 py-3.5 text-[9px] font-black uppercase tracking-[.15em] text-white/65 transition hover:text-white"
      >
        <Map size={15} /> Explore map
      </Link>
    </div>
  );
}
