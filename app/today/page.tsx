import type { Metadata } from "next";

import { AiTripBriefScreen } from "@/components/intelligence/ai-trip-brief-screen";
import { ProactiveTripIntelligence } from "@/components/intelligence/proactive-trip-intelligence";

export const metadata: Metadata = {
  title: "My Day | VI Guide",
  description:
    "Build and protect a personalized, grounded U.S. Virgin Islands day plan from your traveler profile.",
};

export default function TodayPage() {
  return (
    <>
      <ProactiveTripIntelligence mode="banner" />
      <AiTripBriefScreen />
    </>
  );
}
