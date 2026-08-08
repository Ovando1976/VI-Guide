import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, MapPinned } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { SavedIslandJourneyLivingMap } from "@/components/map/saved-island-journey-living-map";

export const metadata = {
  title: "Island Journey Map | VI Guide",
  description:
    "See a saved VI Guide Island Journey as one connected taxi, ferry, and arrival route on the Living Map.",
};

export default function IslandJourneyMapPage() {
  return (
    <main className="min-h-screen bg-[#f4f1e8] pb-32 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/journey"
          actionLabel="Island Journey"
          actionIcon={MapPinned}
          secondaryHref="/trips"
          secondaryLabel="My Trip"
        />
      </div>

      <section className="mx-auto mt-5 max-w-[1680px] px-4 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
            href="/map"
            className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[10px] font-black uppercase tracking-[.14em] shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Living Map
          </Link>
          <div className="text-right text-[9px] font-black uppercase tracking-[.18em] text-slate-400">
            Taxi · Ferry · Taxi
          </div>
        </div>

        <Suspense
          fallback={
            <div className="h-[720px] animate-pulse rounded-[30px] border border-slate-200 bg-white/70" />
          }
        >
          <SavedIslandJourneyLivingMap />
        </Suspense>
      </section>
    </main>
  );
}
