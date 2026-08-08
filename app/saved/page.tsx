import Image from "next/image";
import type { Metadata } from "next";
import { Bookmark, Route, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { SavedPlacesBoard } from "@/components/place/saved-places-board";

export const metadata: Metadata = {
  title: "Saved Places | VI Guide",
  description:
    "Keep a shortlist of U.S. Virgin Islands places before adding them to a VI Guide journey.",
};

export default function SavedPlacesPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f0e6] pb-32 text-[#032f2d]">
      <section className="relative isolate overflow-hidden bg-[#032f2d] px-4 pb-12 pt-5 text-white sm:px-7 lg:px-10 lg:pb-16">
        <Image
          src="/images/places/st-john/trunk-bay-overlook-1.jpg"
          alt="Trunk Bay and the North Shore of St. John"
          fill
          priority
          sizes="100vw"
          className="-z-30 object-cover object-center"
        />
        <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,31,29,.98)_0%,rgba(3,47,45,.94)_44%,rgba(3,47,45,.56)_78%,rgba(3,47,45,.26)_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_16%,rgba(115,227,217,.18),transparent_28%),linear-gradient(180deg,rgba(2,31,29,.06),rgba(2,31,29,.5))]" />

        <ViPublicHeader
          actionHref="/trips"
          actionLabel="Open My Trip"
          actionIcon={Route}
          secondaryHref="/places"
          secondaryLabel="Explore"
        />

        <div className="mx-auto grid max-w-7xl gap-10 pb-4 pt-14 lg:grid-cols-[1.08fr_.92fr] lg:items-end lg:gap-14 lg:pt-24">
          <div>
            <div className="vi-eyebrow inline-flex items-center gap-2 rounded-full border border-[#f5c451]/30 bg-[#f5c451]/10 px-4 py-2 text-[#f8d77c] backdrop-blur-xl">
              <Bookmark size={14} /> Saved places · your shortlist
            </div>
            <h1 className="vi-display mt-7 max-w-5xl text-[clamp(3.8rem,8vw,7rem)] font-bold leading-[.84] text-white">
              Keep the maybe list
              <span className="block italic text-[#73e3d9]">separate from the itinerary.</span>
            </h1>
            <p className="mt-7 max-w-2xl text-base font-semibold leading-7 text-white/74 sm:text-xl sm:leading-8">
              Save interesting places while you explore. When one becomes part of the plan, add it to My Trip and VI Guide carries it into the map, Concierge, and transportation context.
            </p>
          </div>

          <aside className="vi-glass rounded-[32px] p-6 sm:p-7">
            <div className="vi-eyebrow text-[#f5c451]">How the shortlist works</div>
            <h2 className="vi-display mt-3 text-3xl font-bold text-white sm:text-4xl">
              Save first. Commit to the day later.
            </h2>
            <p className="mt-4 text-sm font-semibold leading-6 text-white/62">
              Saved Places is deliberately lighter than My Trip. Keep options here while you compare them, then promote only the winners into the itinerary.
            </p>
            <div className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.06] p-4 text-xs font-semibold leading-5 text-white/55">
              <Sparkles className="h-5 w-5 shrink-0 text-[#73e3d9]" />
              New saves from Explore now carry their image into this shortlist; older saves remain compatible and use island context when needed.
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-7 lg:px-10 lg:py-14">
        <SavedPlacesBoard />
      </section>
    </main>
  );
}
