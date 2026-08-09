"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  readSelectedTravelerTripPlanId,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
} from "@/lib/traveler-trip-selection";

const PLAN_STORAGE_KEY = "vi-guide.intelligence.saved-plans";
const SELECTION_STORAGE_KEY = "vi-guide.traveler-trip-selection.v1";

function islandLabel(island: JourneyPlan["island"]) {
  if (island === "stj") return "St. John";
  if (island === "stx") return "St. Croix";
  return "St. Thomas";
}

function conciergeHref(plan: JourneyPlan | null) {
  const params = new URLSearchParams();

  if (!plan) {
    params.set(
      "prompt",
      "Help me improve my Virgin Islands trip and identify the most important next step.",
    );
    return `/concierge?${params.toString()}`;
  }

  const stops = plan.plan
    .slice(0, 8)
    .map((stop) => stop.title)
    .filter(Boolean)
    .join(", ");
  const prompt = [
    `Help me review and improve my saved trip "${plan.title}" on ${islandLabel(plan.island)}.`,
    stops ? `Current stops: ${stops}.` : "The trip does not have any stops yet.",
    "Keep your recommendations connected to My Trip and the Living Map.",
  ].join(" ");

  params.set("island", plan.island);
  params.set("trip", plan.id);
  params.set("prompt", prompt.slice(0, 1200));
  return `/concierge?${params.toString()}`;
}

export function TripAwareConciergeLink({
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
        event.key === PLAN_STORAGE_KEY ||
        event.key === SELECTION_STORAGE_KEY
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

  return (
    <Link href={conciergeHref(selectedPlan)} className={className}>
      <Sparkles className="h-4 w-4 text-[#f5c451]" />
      Ask Concierge
    </Link>
  );
}
