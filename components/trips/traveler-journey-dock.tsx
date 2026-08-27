"use client";

import Link from "next/link";
import { CarFront, MapPinned, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import {
  JOURNEY_PLAN_UPDATED_EVENT,
  readJourneyPlans,
  type JourneyPlan,
} from "@/lib/journey-planner";
import { mapHrefForJourneyPlan } from "@/lib/island-journey-map";
import { buildJourneyMobilityHref } from "@/lib/mobility/ride-links";
import {
  readSelectedTravelerTripPlanId,
  TRAVELER_TRIP_SELECTION_UPDATED_EVENT,
} from "@/lib/traveler-trip-selection";

const PLAN_STORAGE_KEY = "vi-guide.intelligence.saved-plans";
const SELECTION_STORAGE_KEY = "vi-guide.traveler-trip-selection.v1";

export function TravelerJourneyDock() {
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

  if (!selectedPlan) return null;

  const mapHref = mapHrefForJourneyPlan(selectedPlan);
  const conciergeHref = buildConciergeHref(selectedPlan);
  const mobilityHref = buildJourneyMobilityHref(selectedPlan);

  return (
    <aside
      aria-label="Connected trip actions"
      className="pointer-events-none fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+5.25rem)] z-[70] px-3 sm:bottom-5 sm:px-5"
    >
      <div className="pointer-events-auto mx-auto flex w-full max-w-3xl items-center gap-2 rounded-[24px] border border-white/15 bg-[#043331]/95 p-2.5 text-white shadow-[0_18px_60px_rgba(4,51,49,.35)] backdrop-blur-xl sm:gap-3 sm:p-3">
        <div className="hidden min-w-0 flex-1 px-2 sm:block">
          <p className="text-[8px] font-black uppercase tracking-[.18em] text-[#7ce0d4]">
            Trip connected
          </p>
          <p className="mt-0.5 truncate text-sm font-black tracking-[-.02em]">
            {selectedPlan.title}
          </p>
        </div>

        <DockLink href={mapHref} label="Map" icon={MapPinned} />
        <DockLink href={conciergeHref} label="Concierge" icon={Sparkles} />
        <DockLink href={mobilityHref} label="Ride" icon={CarFront} primary />
      </div>
    </aside>
  );
}

function DockLink({
  href,
  label,
  icon: Icon,
  primary = false,
}: {
  href: string;
  label: string;
  icon: typeof MapPinned;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-[#f5c451] px-3 text-[9px] font-black uppercase tracking-[.12em] text-[#043331] transition hover:bg-[#ffdc76] sm:flex-none sm:px-5"
          : "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[.08] px-3 text-[9px] font-black uppercase tracking-[.12em] text-white transition hover:bg-white/[.14] sm:flex-none sm:px-4"
      }
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function buildConciergeHref(plan: JourneyPlan) {
  const params = new URLSearchParams({
    island: plan.island,
    trip: plan.id,
  });
  const stops = plan.plan
    .slice(0, 8)
    .map((stop) => stop.title)
    .filter(Boolean)
    .join(", ");
  const prompt = [
    `Help me continue my saved trip "${plan.title}".`,
    stops ? `Current stops: ${stops}.` : "The trip does not have any stops yet.",
    "Keep the Living Map, My Trip, and Mobility connected to this same trip.",
  ].join(" ");
  params.set("prompt", prompt.slice(0, 1200));
  return `/concierge?${params.toString()}`;
}
