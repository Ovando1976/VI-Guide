import {
  createJourneyPlan,
  readJourneyPlans,
  upsertJourneyPlan,
  type JourneyPlan,
} from "@/lib/journey-planner";
import {
  readSelectedTravelerTripPlanId,
  writeSelectedTravelerTripPlanId,
} from "@/lib/traveler-trip-selection";
import type {
  IntelligenceIsland,
  IntelligencePlanStop,
  IntelligenceResponse,
} from "@/types/intelligence";

export type ConciergeTripHandoff = {
  plan: JourneyPlan;
  created: boolean;
  mapHref: string;
  tripHref: string;
  mobilityHref: string;
};

export function saveConciergeResponseToTrip(
  response: IntelligenceResponse,
  fallbackIsland: IntelligenceIsland = "stt",
): ConciergeTripHandoff | null {
  if (typeof window === "undefined" || !response.plan?.length) return null;

  const island = response.context?.island ?? response.plan[0]?.island ?? fallbackIsland;
  const selectedId = readSelectedTravelerTripPlanId();
  const plans = readJourneyPlans();
  const selected = selectedId ? plans.find((plan) => plan.id === selectedId) : undefined;
  const compatibleSelected = selected?.island === island ? selected : undefined;
  const existing = compatibleSelected ?? plans.find((plan) => plan.island === island);
  const created = !existing;
  const base = existing ?? createJourneyPlan(island, conciergeTripTitle(response, island));
  const now = new Date().toISOString();
  const plan: JourneyPlan = {
    ...base,
    title: base.title || conciergeTripTitle(response, island),
    island,
    updatedAt: now,
    status: response.orchestration?.status === "ready" ? "ready" : base.status,
    notes: response.answer?.trim() || base.notes,
    plan: mergePlanStops(base.plan, response.plan),
  };

  upsertJourneyPlan(plan);
  writeSelectedTravelerTripPlanId(plan.id, now);

  return {
    plan,
    created,
    tripHref: "/trips",
    mapHref: buildConciergeMapHref(plan),
    mobilityHref: buildConciergeMobilityHref(plan),
  };
}

function mergePlanStops(
  existing: IntelligencePlanStop[],
  incoming: IntelligencePlanStop[],
): IntelligencePlanStop[] {
  const byKey = new Map<string, IntelligencePlanStop>();
  for (const stop of existing) byKey.set(stopKey(stop), stop);
  for (const stop of incoming) {
    const key = stopKey(stop);
    const previous = byKey.get(key);
    byKey.set(key, previous ? { ...previous, ...stop } : stop);
  }
  return Array.from(byKey.values());
}

function stopKey(stop: IntelligencePlanStop) {
  return stop.placeId || stop.id || `${stop.island}:${stop.title}`.toLowerCase();
}

function conciergeTripTitle(response: IntelligenceResponse, island: IntelligenceIsland) {
  const label = island === "stj" ? "St. John" : island === "stx" ? "St. Croix" : "St. Thomas";
  const intent = response.intent?.replaceAll("_", " ").trim();
  return intent ? `${label} · ${titleCase(intent)}` : `My ${label} trip`;
}

function titleCase(value: string) {
  return value.replace(/\b\w/g, (character) => character.toUpperCase());
}

function buildConciergeMapHref(plan: JourneyPlan) {
  const positioned = plan.plan.filter(
    (stop) => Number.isFinite(stop.lat) && Number.isFinite(stop.lng),
  );
  const params = new URLSearchParams({ island: plan.island, trip: plan.id });
  if (positioned.length) {
    params.set(
      "stops",
      positioned
        .map((stop) => `${stop.lat},${stop.lng},${encodeURIComponent(stop.title)}`)
        .join("|"),
    );
  }
  return `/map?${params.toString()}`;
}

function buildConciergeMobilityHref(plan: JourneyPlan) {
  const first = plan.plan[0];
  const last = plan.plan[plan.plan.length - 1];
  const params = new URLSearchParams({ island: plan.island, trip: plan.id });
  if (first?.title) params.set("from", first.title);
  if (last?.title && last !== first) params.set("to", last.title);
  return `/mobility?${params.toString()}`;
}
