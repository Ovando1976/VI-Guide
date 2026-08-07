import type { Metadata } from "next";
import { Route } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { SavedPlacesBoard } from "@/components/place/saved-places-board";

export const metadata: Metadata = {
  title: "Saved Places | VI Guide",
  description:
    "Keep a shortlist of U.S. Virgin Islands places before adding them to a VI Guide journey.",
};

export default function SavedPlacesPage() {
  return (
    <main className="min-h-screen bg-[#f8f4ea] px-4 py-5 pb-32 text-[#043331] sm:px-6 lg:py-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <ViPublicHeader
          actionHref="/planner"
          actionLabel="Open My Trip"
          actionIcon={Route}
          secondaryHref="/places"
          secondaryLabel="Explore"
        />
        <section className="rounded-[34px] bg-[radial-gradient(circle_at_top_right,rgba(245,196,81,.32),transparent_35%),linear-gradient(145deg,#032f2d,#0b6b64)] p-7 text-white shadow-[0_28px_80px_rgba(4,51,49,.2)] sm:p-10 lg:p-12">
          <p className="text-[10px] font-black uppercase tracking-[.2em] text-[#f5c451]">
            Saved places
          </p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-[-.055em] sm:text-6xl">
            Keep the shortlist separate from the itinerary.
          </h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/70 sm:text-base">
            Save interesting places while you explore. When one becomes part of the plan, add it to My Trip and VI Guide will carry it into the map, Concierge, and transportation context.
          </p>
        </section>
        <SavedPlacesBoard />
      </div>
    </main>
  );
}
