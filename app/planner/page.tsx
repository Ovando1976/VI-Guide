import { JourneyCloudSync } from "@/components/journey/journey-cloud-sync";
import { JourneyPlanner } from "@/components/journey/journey-planner";
import { JourneyRouteDashboard } from "@/components/journey/journey-route-dashboard";

export const metadata = {
  title: "Journey Planner | VI Guide",
  description:
    "Build, edit, save, map, route, and review a complete U.S. Virgin Islands itinerary.",
};

export default function PlannerPage() {
  return (
    <>
      <div className="fixed right-4 top-4 z-[9997] sm:right-6 sm:top-6">
        <JourneyCloudSync />
      </div>
      <JourneyPlanner />
      <JourneyRouteDashboard />
    </>
  );
}
