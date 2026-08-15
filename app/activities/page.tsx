import type { Metadata } from "next";

import ExperiencesPage from "../experiences/page";
import { ActivityQuickLaunch } from "@/components/activities/activity-quick-launch";
import { ActivityTripIntelligence } from "@/components/activities/activity-trip-intelligence";

export const metadata: Metadata = {
  title: "Activities, Tours & Experiences | USVI Explorer",
  description:
    "Find and request memorable activities, tours, and local experiences across St. Thomas, St. John, and St. Croix.",
  alternates: { canonical: "/activities" },
};

type ActivitySearchParams = {
  q?: string;
  island?: string;
  category?: string;
};

export default function ActivitiesPage({
  searchParams,
}: {
  searchParams?: ActivitySearchParams;
}) {
  return (
    <>
      <ActivityQuickLaunch />
      <ActivityTripIntelligence />
      <ExperiencesPage searchParams={searchParams} />
    </>
  );
}
