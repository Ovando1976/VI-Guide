import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { ArrowRight, MapPinned, Route, ShieldCheck, Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { OrchestratedConciergeScreen } from "@/components/concierge/orchestrated-concierge-screen";

const conciergeDescription =
  "Plan, review, and safely execute USVI Explorer travel workflows with visible orchestration state and grounded recommendations.";

export const metadata: Metadata = {
  title: "VI Concierge",
  description: conciergeDescription,
  alternates: { canonical: "/concierge" },
  openGraph: {
    type: "website",
    siteName: "USVI Explorer",
    title: "VI Concierge | USVI Explorer",
    description: conciergeDescription,
    url: "/concierge",
  },
  twitter: {
    card: "summary",
    title: "VI Concierge | USVI Explorer",
    description: conciergeDescription,
  },
};

export default function ConciergePage() {
  return (
    <div className="concierge-product-page min-h-screen bg-[#f4f1e8] pb-28 text-[#043331]">
      <div className="px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/trips"
          actionLabel="Open My Trip"
          actionIcon={Route}
          secondaryHref="/map"
          secondaryLabel="Living Map"
        />
      </div>

      <section className="mx-auto mt-5 max-w-7xl px-4 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-[36px] border border-white/50 bg-[#043331] text-white shadow-[0_30px_90px_rgba(4,51,49,.2)]">
          <Image
            src="/images/places/st-thomas/magens-bay-beach-1.jpg"
            alt="Magens Bay in St. Thomas"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 1280px"
            className="-z-30 object-cover object-center"
          />
          <div className="absolute inset-0 -z-20 bg-[linear-gradient(90deg,rgba(2,34,33,.99)_0%,rgba(3,51,49,.93)_48%,rgba(3,51,49,.45)_78%,rgba(3,51,49,.22)_100%)]" />
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_78%_24%,rgba(124,224,212,.24),transparent_22rem)]" />

          <div className="grid min-h-[390px] gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10">
            <div className="max-w-4xl self-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#f5c451]/25 bg-[#f5c451]/10 px-3 py-2 text-[9px] font-black uppercase tracking-[.22em] text-[#f8d77c] backdrop-blur">
                <Sparkles className="h-4 w-4" /> VI Concierge intelligence
              </div>
              <h1 className="vi-display mt-4 max-w-4xl text-4xl font-black leading-[.9] tracking-[-.06em] sm:text-6xl lg:text-7xl">
                Ask once. <span className="text-[#7ce0d4]">Move through the islands.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-sm font-semibold leading-6 text-white/72 sm:text-base sm:leading-7">
                Concierge is the intelligence layer across USVI Explorer. It can connect discovery, timing, the Living Map, transportation, trip planning, and booking actions into one grounded workflow.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/75 backdrop-blur">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#7ce0d4]" /> Confirmation-aware
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/75 backdrop-blur">
                  <MapPinned className="h-3.5 w-3.5 text-[#7ce0d4]" /> Map context
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.08] px-3 py-2 text-[8px] font-black uppercase tracking-[.14em] text-white/75 backdrop-blur">
                  <Route className="h-3.5 w-3.5 text-[#f5c451]" /> Trip connected
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 lg:max-w-[330px] lg:justify-end">
              <Link
                href="#concierge-workspace"
                className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#f5c451] px-5 text-[9px] font-black uppercase tracking-[.14em] text-[#043331] transition hover:-translate-y-0.5 hover:bg-[#ffdc76]"
              >
                Start a conversation <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/map"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/14 bg-white/[.08] px-5 text-[9px] font-black uppercase tracking-[.14em] text-white backdrop-blur transition hover:bg-white/[.13]"
              >
                <MapPinned className="h-4 w-4 text-[#7ce0d4]" /> Open Living Map
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div id="concierge-workspace" className="scroll-mt-6">
        <Suspense fallback={<ConciergeLoading />}>
          <OrchestratedConciergeScreen />
        </Suspense>
      </div>
    </div>
  );
}

function ConciergeLoading() {
  return (
    <main className="mx-auto mt-6 grid min-h-[420px] max-w-7xl place-items-center rounded-[34px] bg-[#043331] px-6 text-center text-white shadow-[0_24px_70px_rgba(4,51,49,.18)]">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-[#7ce0d4]">
          VI Concierge
        </div>
        <h2 className="mt-3 text-3xl font-black">Connecting island context…</h2>
      </div>
    </main>
  );
}
