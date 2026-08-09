"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

import { readJourneyPlans } from "@/lib/journey-planner";

function hasCoordinatePair(lat: string | null, lng: string | null) {
  return Boolean(lat?.trim() && lng?.trim());
}

/**
 * Keeps Mobility attached to the canonical JourneyPlan.
 *
 * A trip-aware handoff may arrive with only `?trip=<journey-id>` or with
 * human-readable endpoint names. When the saved plan has coordinates, enrich
 * the URL once so the existing Mobility resolver can select the intended
 * pickup and destination much more precisely.
 */
export function TripAwareMobilityHandoff() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tripId = searchParams.get("trip")?.trim();
    if (!tripId) return;

    const plan = readJourneyPlans().find((candidate) => candidate.id === tripId);
    if (!plan?.plan.length) return;

    const first = plan.plan[0];
    const last = plan.plan[plan.plan.length - 1];
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (!params.get("island") && plan.island) {
      params.set("island", plan.island);
      changed = true;
    }

    if (first?.title && !params.get("pickupName")) {
      params.set("pickupName", first.title);
      changed = true;
    }

    if (
      typeof first?.lat === "number" &&
      typeof first?.lng === "number" &&
      !hasCoordinatePair(params.get("fromLat"), params.get("fromLng"))
    ) {
      params.set("fromLat", String(first.lat));
      params.set("fromLng", String(first.lng));
      changed = true;
    }

    if (last && last.id !== first?.id) {
      if (last.title && !params.get("destinationName")) {
        params.set("destinationName", last.title);
        changed = true;
      }

      if (
        typeof last.lat === "number" &&
        typeof last.lng === "number" &&
        !hasCoordinatePair(params.get("toLat"), params.get("toLng"))
      ) {
        params.set("toLat", String(last.lat));
        params.set("toLng", String(last.lng));
        changed = true;
      }
    }

    if (!changed) return;
    router.replace(`/mobility?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  return null;
}
