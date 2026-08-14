import { Suspense } from "react";
import { Sparkles } from "lucide-react";

import { ViPublicHeader } from "@/components/brand/vi-public-header";
import { BookingAwareJourneyPlanner } from "@/components/journey/booking-aware-journey-planner";

export const metadata = {
  title: "Journey Planner | USVI Explorer",
  description:
    "Build, edit, save, map, route, and review a complete U.S. Virgin Islands itinerary.",
};

export default function PlannerPage() {
  return (
    <>
      <div className="bg-[#f7f2e7] px-4 pt-5 sm:px-6 lg:pt-8">
        <ViPublicHeader
          actionHref="/concierge?prompt=Help%20me%20improve%20my%20Virgin%20Islands%20itinerary"
          actionLabel="Ask VI Concierge"
          actionIcon={Sparkles}
          secondaryHref="/"
          secondaryLabel="Home"
        />
      </div>
      <Suspense fallback={<PlannerLoading />}>
        <BookingAwareJourneyPlanner />
      </Suspense>
    </>
  );
}

function PlannerLoading() {
  return (
    <main className="grid min-h-[70vh] place-items-center bg-[#f7f2e7] px-6 text-center text-[#043331]">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">
          USVI Explorer Planner
        </div>
        <h1 className="mt-3 text-3xl font-black">Loading your journey…</h1>
      </div>
    </main>
  );
}
