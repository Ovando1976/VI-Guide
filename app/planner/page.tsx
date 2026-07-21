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
      <JourneyPlanner />
      <JourneyRouteDashboard />
    </>
  );
}
