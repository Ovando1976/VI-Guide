import type { Metadata } from "next";
import { Route } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { AiTripBriefScreen } from "@/components/intelligence/ai-trip-brief-screen";
import { ProactiveTripIntelligence } from "@/components/intelligence/proactive-trip-intelligence";

export const metadata: Metadata = {
  title: "My Day | VI Guide",
  description:
    "Build and protect a personalized, grounded U.S. Virgin Islands day plan from your traveler profile.",
};

export default function TodayPage() {
  return (
    <div className="today-customer-page min-h-screen overflow-hidden bg-[#f7f2e7] text-[#043331]">
      <div className="px-4 pb-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/trips"
          actionLabel="My Trip"
          actionIcon={Route}
          secondaryHref="/planner"
          secondaryLabel="Planner"
        />
      </div>

      <ProactiveTripIntelligence mode="banner" />

      <div className="today-brief-shell">
        <AiTripBriefScreen />
      </div>

      <style>{`
        .today-brief-shell > main {
          min-height: auto;
        }

        .today-brief-shell > main > section:first-child {
          padding-top: 1.5rem;
        }

        .today-brief-shell > main > section:first-child > div > div:first-child {
          display: none;
        }

        .today-brief-shell > main > section:first-child > div > div:nth-child(2) {
          margin-top: 0;
        }
      `}</style>
    </div>
  );
}
