import { Ship, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { DoorToDoorJourneyPlanner } from "@/components/door-to-door-journey-planner";
import { FerryPlanner } from "@/components/ferry-planner";

export default function FerryPlannerPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.13),transparent_28%),linear-gradient(180deg,#f8f4ea_0%,#fff_55%,#f3f7f5_100%)] px-4 py-5 text-[#043331] md:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ViPublicHeader actionHref="/concierge?prompt=Help%20me%20plan%20my%20USVI%20ferry%20connections" actionLabel="Ask VI Concierge" actionIcon={Sparkles} secondaryHref="/mobility" secondaryLabel="Ride + Mobility" />
        <section className="overflow-hidden rounded-[36px] bg-[#043f3b] px-6 py-10 text-white shadow-[0_28px_90px_rgba(4,51,49,.2)] md:px-10">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.22em] text-[#f3c44e]"><Ship className="h-4 w-4"/>Inter-island mobility</div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Ferry + Island Journey Planner</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-white/75 md:text-lg">Plan the complete movement line—not just the boat. VI Guide connects pickup, terminal arrival, ferry check-in, the crossing and your arrival transfer into one understandable island journey.</p>
        </section>
        <DoorToDoorJourneyPlanner />
        <FerryPlanner />
      </div>
    </main>
  );
}
