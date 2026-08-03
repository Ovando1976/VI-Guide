import type { Metadata } from "next";
import { Suspense } from "react";

import { OrchestratedConciergeScreen } from "@/components/concierge/orchestrated-concierge-screen";

export const metadata: Metadata = {
  title: "Agent Concierge | VI Guide",
  description:
    "Plan, review, and safely execute VI Guide travel workflows with visible orchestration state and grounded recommendations.",
};

export default function ConciergePage() {
  return (
    <Suspense fallback={<ConciergeLoading />}>
      <OrchestratedConciergeScreen />
    </Suspense>
  );
}

function ConciergeLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#041a22] px-6 text-center text-white">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-cyan-200/60">
          VI Guide Agent Workflow
        </div>
        <h1 className="mt-3 text-3xl font-black">Loading Concierge…</h1>
      </div>
    </main>
  );
}
