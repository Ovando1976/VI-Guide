import { Route, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { DoorToDoorJourneyPlanner } from "@/components/door-to-door-journey-planner";
import { SmartIslandJourneyBuilder } from "@/components/smart-island-journey-builder";
import { getJourneyCatalogPlaces } from "@/lib/journey-place-catalog";

export default function IslandJourneyPage() {
  const catalogPlaces = getJourneyCatalogPlaces();

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,.13),transparent_28%),linear-gradient(180deg,#f8f4ea_0%,#fff_55%,#f3f7f5_100%)] px-4 py-5 text-[#043331] md:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <ViPublicHeader actionHref="/concierge?prompt=Plan%20my%20complete%20door-to-door%20USVI%20journey" actionLabel="Ask VI Concierge" actionIcon={Sparkles} secondaryHref="/trips" secondaryLabel="My Trip" />
        <section className="overflow-hidden rounded-[36px] bg-[#043f3b] px-6 py-10 text-white shadow-[0_28px_90px_rgba(4,51,49,.2)] md:px-10">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[.22em] text-[#f3c44e]"><Route className="h-4 w-4"/>Connected travel</div>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight md:text-6xl">Island Journey</h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-7 text-white/75 md:text-lg">Choose a mapped VI Guide place and VI Guide calculates the road connection to the ferry, terminal buffer, published sailing, and arrival transfer.</p>
        </section>
        <SmartIslandJourneyBuilder catalogPlaces={catalogPlaces} />
        <div className="pt-2">
          <div className="mb-2 text-xs font-black uppercase tracking-[.18em] text-[#b7861f]">Quick journey templates</div>
          <DoorToDoorJourneyPlanner />
        </div>
      </div>
    </main>
  );
}
