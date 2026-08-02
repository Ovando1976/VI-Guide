import type { Metadata } from "next";

import { AiTripBriefScreen } from "@/components/intelligence/ai-trip-brief-screen";

export const metadata: Metadata = {
  title: "My Day | VI Guide",
  description:
    "Build a personalized, grounded U.S. Virgin Islands day plan from your traveler profile.",
};

export default function TodayPage() {
  return <AiTripBriefScreen />;
}
