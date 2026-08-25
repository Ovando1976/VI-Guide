import { Suspense, type ReactNode } from "react";

import { MobilitySearchGate } from "@/components/mobility-search-gate";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageMetadata({
  title: "Taxi, Transfers & Island Mobility",
  description:
    "Plan USVI taxi rides, airport transfers, ferry connections, and island transportation with trip-aware routing and governed fare guidance.",
  path: "/mobility",
});

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
