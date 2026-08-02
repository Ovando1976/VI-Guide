import type { Metadata } from "next";
import { Suspense } from "react";

import { SmartConciergeScreen } from "@/components/concierge/smart-concierge-screen";

export const metadata: Metadata = {
  title: "Smart Concierge | VI Guide",
  description:
    "Ask questions using VI Guide’s own beaches, places, stays, heritage, map, and mobility data, then navigate directly to the result.",
};

export default function ConciergePage() {
  return (
    <Suspense fallback={<ConciergeLoading />}>
      <SmartConciergeScreen />
    </Suspense>
  );
}

function ConciergeLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#062b35] px-6 text-center text-white">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200/60">
          VI Guide Intelligence
        </div>
        <h1 className="mt-3 text-3xl font-black">Loading Smart Concierge…</h1>
      </div>
    </main>
  );
}
