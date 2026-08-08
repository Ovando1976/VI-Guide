"use client";

import Link from "next/link";
import { MapPinned } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import { mapHrefForJourneyPlan } from "@/lib/island-journey-map";
import {
  readSelectedTravelerTripPlanId,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
} from "@/lib/traveler-trip-selection";

export function TripAwareLivingMapLink({
  className,
}: {
  className: string;
}) {
  const [plans, setPlans] = useState<JourneyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");

  useEffect(() => {
    function refresh() {
      setPlans(readJourneyPlans());
      setSelectedPlanId(readSelectedTravelerTripPlanId());
    }

    function handleStorage(event: StorageEvent) {
      if (
        !event.key ||
        event.key === "vi-guide.intelligence.saved-plans" ||
        event.key === "vi-guide.traveler-trip-selection.v1"
      ) {
        refresh();
      }
    }

    refresh();
    window.addEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
    window.addEventListener(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, refresh);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(JOURNEY_PLAN_UPDATED_EVENT, refresh);
      window.removeEventListener(TRAVELER_TRIP_SELECTION_UPDATED_EVENT, refresh);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const selectedPlan = useMemo(
    () =>
      plans.find((plan) => plan.id === selectedPlanId) ??
      plans[0] ??
      null,
    [plans, selectedPlanId],
  );
  const href = mapHrefForJourneyPlan(selectedPlan);
  const isIslandJourney = href.startsWith("/map/journey");

  return (
    <Link href={href} className={className}>
      <MapPinned className="h-4 w-4 text-[#7ce0d4]" />
      {isIslandJourney ? "Open journey map" : "Open Living Map"}
    </Link>
  );
}
