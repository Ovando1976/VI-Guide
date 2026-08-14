import { Ship, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { DoorToDoorJourneyPlanner } from "@/components/door-to-door-journey-planner";
import { FerryPlanner } from "@/components/ferry-planner";

export default function FerryPlannerPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.13),transparent_28%),linear-gradient(180deg,#f8f4ea_0%,#fff_55%,#f3f7f5_100%)] px-3 py-4 text-[#043331] sm:px-4 md:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ViPublicHeader actionHref="/concierge?prompt=Help%20me%20plan%20my%20USVI%20ferry%20connections" actionLabel="Ask VI Concierge" actionIcon={Sparkles} secondaryHref="/mobility" secondaryLabel="Ride + Mobility" />
        <section className="overflow-hidden rounded-[30px] bg-[#043f3b] px-5 py-8 text-white shadow-[0_28px_90px_rgba(4,51,49,.2)] md:rounded-[36px] md:px-10 md:py-10">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.22em] text-[#f3c44e]"><Ship className="h-4 w-4"/>Ferry command center</div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Next boat. True fare. Full island journey.</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-white/75 md:text-lg">One mobile page for USVI and BVI passenger ferries, car barges, published departures, official fare math, passport guidance, terminal rides and an AI concierge that coordinates the whole trip.</p>
          <div className="mt-6 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[.14em]">
            <a href="#ferry-intelligence" className="rounded-full bg-[#f3c44e] px-4 py-2.5 text-[#043331]">Find next ferry</a>
            <a href="#door-to-door" className="rounded-full border border-white/30 px-4 py-2.5 text-white">Plan door to door</a>
          </div>
        </section>
        <div id="ferry-intelligence" className="scroll-mt-4"><FerryPlanner /></div>
        <div id="door-to-door" className="scroll-mt-4"><DoorToDoorJourneyPlanner /></div>
      </div>
    </main>
  );
}
