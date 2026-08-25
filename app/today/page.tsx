import type { Metadata } from "next";
import { Route } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { AiTripBriefScreen } from "@/components/intelligence/ai-trip-brief-screen";
import { ProactiveTripIntelligence } from "@/components/intelligence/proactive-trip-intelligence";
import { normalizeActiveIsland } from "@/lib/active-island";

export const metadata: Metadata = {
  title: "My Day",
  description:
    "Build and protect a personalized, grounded U.S. Virgin Islands day plan from your traveler profile.",
};

export default function TodayPage({
  searchParams,
}: {
  searchParams?: { island?: string | string[] };
}) {
  const requestedIsland = Array.isArray(searchParams?.island)
    ? searchParams?.island[0]
    : searchParams?.island;
  const island = normalizeActiveIsland(requestedIsland) ?? "stt";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f7f2e7] text-[#043331]">
      <div className="px-4 pb-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/trips"
          actionLabel="My Trip"
          actionIcon={Route}
          secondaryHref="/planner"
          secondaryLabel="Planner"
        />
      </div>

      <ProactiveTripIntelligence mode="banner" islandOverride={island} />
      <AiTripBriefScreen initialIsland={island} />
    </main>
  );
}
