import ExperiencesPage from "../experiences/page";
import { ActivityBookingIntelligence } from "@/components/activities/activity-booking-intelligence";
import { ActivityDiscoveryDeck } from "@/components/activities/activity-discovery-deck";
import { ActivityFitGuide } from "@/components/activities/activity-fit-guide";
import { ActivityJourneyPicker } from "@/components/activities/activity-journey-picker";
import { ActivityQuickLaunch } from "@/components/activities/activity-quick-launch";
import { ActivityTripIntelligence } from "@/components/activities/activity-trip-intelligence";
import { ActivityVisualStandard } from "@/components/activities/activity-visual-standard";
import { buildPublicPageMetadata } from "@/lib/public-page-metadata";

export const metadata = buildPublicPageMetadata({
  title: "Activities, Tours & Experiences",
  description:
    "Find and request memorable activities, tours, and local experiences across St. Thomas, St. John, and St. Croix.",
  path: "/activities",
});

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
      <ActivityDiscoveryDeck />
      <ActivityTripIntelligence />
      <ActivityJourneyPicker
        query={searchParams?.q}
        island={searchParams?.island}
        category={searchParams?.category}
      />
      <ActivityFitGuide />
      <ActivityBookingIntelligence />
      <ActivityVisualStandard />
      <ExperiencesPage searchParams={searchParams} />
    </>
  );
}
