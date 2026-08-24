"use client";

import Link from "next/link";
import { ArrowRight, Map, Sparkles } from "lucide-react";
import { trackAcquisitionEvent } from "@/lib/acquisition-client";

export function HomePrimaryActions({ conciergeHref }: { conciergeHref: string }) {
  return (
    <div className="mt-8 grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
      <Link
        href="#traveler-intent"
        onClick={() => trackAcquisitionEvent("intent_selected", { intent: "choose-intent" })}
        className="col-span-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-[#f5c451] px-6 py-3.5 text-[10px] font-black uppercase tracking-[.16em] text-[#032f2d] shadow-[0_16px_40px_rgba(245,196,81,.24)] transition hover:-translate-y-0.5 hover:bg-[#ffdc76] sm:col-auto"
      >
        Start my visit <ArrowRight size={15} />
      </Link>
      <Link
        href={conciergeHref}
        onClick={() => trackAcquisitionEvent("concierge_started", { entry: "home-hero" })}
        className="vi-glass inline-flex min-h-13 items-center justify-center gap-2 rounded-full px-4 py-3.5 text-center text-[9px] font-black uppercase tracking-[.14em] text-white transition hover:-translate-y-0.5 hover:bg-white/[.16] sm:px-6 sm:text-[10px] sm:tracking-[.16em]"
      >
        <Sparkles size={16} className="text-[#73e3d9]" /> Ask Concierge
      </Link>
      <Link
        href="/map"
        className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border border-white/14 bg-white/[.06] px-4 py-3.5 text-center text-[9px] font-black uppercase tracking-[.14em] text-white/75 transition hover:-translate-y-0.5 hover:bg-white/[.12] hover:text-white sm:border-transparent sm:bg-transparent sm:px-2 sm:tracking-[.15em]"
      >
        <Map size={15} /> Explore map
      </Link>
    </div>
  );
}
