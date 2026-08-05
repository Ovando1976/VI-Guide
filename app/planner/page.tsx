import { Suspense } from "react";

import { BookingAwareJourneyPlanner } from "@/components/journey/booking-aware-journey-planner";

export const metadata = {
  title: "Journey Planner | VI Guide",
  description:
    "Build, edit, save, map, route, and review a complete U.S. Virgin Islands itinerary.",
};

export default function PlannerPage() {
  return (
    <Suspense fallback={<PlannerLoading />}>
      <BookingAwareJourneyPlanner />
    </Suspense>
  );
}

function PlannerLoading() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f7f2e7] px-6 text-center text-[#043331]">
      <div>
        <div className="text-[10px] font-black uppercase tracking-[.22em] text-teal-700">
          VI Guide Planner
        </div>
        <h1 className="mt-3 text-3xl font-black">Preparing your journey…</h1>
      </div>
    </main>
  );
}
