import { Suspense, type ReactNode } from "react";

import { MobilitySearchGate } from "@/components/mobility-search-gate";

export default function MobilityLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={<div className="mx-auto mt-3 h-28 max-w-7xl animate-pulse rounded-[24px] bg-white/80" aria-hidden="true" />}>
        <MobilitySearchGate />
      </Suspense>
      {children}
    </>
  );
}
