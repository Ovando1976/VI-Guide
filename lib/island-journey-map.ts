import type { LineString, Position } from "geojson";

import { FERRY_ROUTES } from "@/lib/ferry-planner";
import { FERRY_TERMINAL_COORDS } from "@/lib/smart-island-journey";
import type { SmartJourneyPlan } from "@/lib/smart-island-journey";
import type { IntelligencePlanStop } from "@/types/intelligence";
import { buildJourneyMapHref, type JourneyPlan } from "@/lib/journey-planner";

export function buildIslandJourneyMapStops(
  plan: SmartJourneyPlan,
  journeyId: string,
): IntelligencePlanStop[] {
  const fromTerminal = FERRY_TERMINAL_COORDS[plan.route.from];
  const toTerminal = FERRY_TERMINAL_COORDS[plan.route.to];
  const ferryLeg = plan.legs.find((leg) => leg.mode === "ferry");
  const originRide = plan.legs.find(
    (leg) => leg.mode === "taxi" && leg.from === plan.origin.label,
  );
  const arrivalRide = [...plan.legs]
    .reverse()
    .find((leg) => leg.mode === "taxi" && leg.to === plan.destination.label);

  const stops: IntelligencePlanStop[] = [];

  if (isPositioned(plan.origin)) {
    stops.push({
      id: `${journeyId}_origin`.slice(0, 160),
      placeId: plan.origin.id,
      title: plan.origin.label,
      island: plan.origin.island,
      kind: "journey-origin",
      summary: originRide?.note ?? "Island Journey origin.",
      startTime: plan.leaveOriginTime,
      lat: plan.origin.lat,
      lng: plan.origin.lng,
      ...(plan.origin.sourceHref ? { href: plan.origin.sourceHref } : {}),
      ...(originRide?.mobilityHref ? { bookingHref: originRide.mobilityHref } : {}),
    });
  }

  stops.push({
    id: `${journeyId}_ferry_departure`.slice(0, 160),
    title: plan.route.fromLabel,
    island: plan.origin.island,
    kind: "ferry-terminal-departure",
    summary: `Board the ${plan.route.serviceLabel.toLowerCase()} after the published check-in buffer.`,
    startTime: plan.ferryDepartureTime,
    durationMinutes: plan.route.durationMinutes,
    lat: fromTerminal.lat,
    lng: fromTerminal.lng,
    href: plan.route.sourceUrl,
  });

  stops.push({
    id: `${journeyId}_ferry_arrival`.slice(0, 160),
    title: plan.route.toLabel,
    island: plan.destination.island,
    kind: "ferry-terminal-arrival",
    summary: ferryLeg?.note ?? "Ferry arrival terminal.",
    startTime: ferryLeg?.endTime,
    lat: toTerminal.lat,
    lng: toTerminal.lng,
    href: plan.route.sourceUrl,
    ...(arrivalRide?.mobilityHref ? { bookingHref: arrivalRide.mobilityHref } : {}),
  });

  if (isPositioned(plan.destination)) {
    stops.push({
      id: `${journeyId}_destination`.slice(0, 160),
      placeId: plan.destination.id,
      title: plan.destination.label,
      island: plan.destination.island,
      kind: "journey-destination",
      summary: arrivalRide?.note ?? "Island Journey destination.",
      startTime: plan.destinationArrivalTime,
      lat: plan.destination.lat,
      lng: plan.destination.lng,
      ...(plan.destination.sourceHref ? { href: plan.destination.sourceHref } : {}),
    });
  }

  return stops;
}

export function isIslandJourneyPlan(plan: JourneyPlan | null | undefined) {
  if (!plan) return false;
  return plan.plan.some(
    (stop) =>
      stop.kind === "ferry" ||
      stop.kind === "ferry-terminal-departure" ||
      stop.kind === "ferry-terminal-arrival",
  );
}

export function mapHrefForJourneyPlan(plan: JourneyPlan | null | undefined) {
  if (!plan) return "/map";
  return isIslandJourneyPlan(plan)
    ? `/map/journey?trip=${encodeURIComponent(plan.id)}`
    : buildJourneyMapHref(plan);
}

export function positionedJourneyStops(plan: JourneyPlan) {
  const positioned: IntelligencePlanStop[] = [];

  for (const stop of plan.plan) {
    if (!hasPosition(stop)) continue;
    positioned.push(stop);

    // PR #241/#242 saved the ferry leg as one positioned stop at the
    // departure terminal. Infer the arrival terminal from the governed
    // ferry route so those already-saved trips become map-native too.
    if (stop.kind === "ferry") {
      const route = FERRY_ROUTES.find(
        (candidate) =>
          stop.title === `${candidate.fromLabel} → ${candidate.toLabel}`,
      );
      if (route) {
        const arrival = FERRY_TERMINAL_COORDS[route.to];
        positioned.push({
          id: `${stop.id}_arrival`.slice(0, 160),
          title: route.toLabel,
          island:
            route.to === "cruz-bay"
              ? "stj"
              : route.to === "gallows-bay"
                ? "stx"
                : "stt",
          kind: "ferry-terminal-arrival",
          summary: `Arrival terminal for ${route.serviceLabel.toLowerCase()}.`,
          lat: arrival.lat,
          lng: arrival.lng,
          href: route.sourceUrl,
        });
      }
    }
  }

  return positioned;
}

export function isFerryWaterSegment(
  from: IntelligencePlanStop,
  to: IntelligencePlanStop,
) {
  if (
    from.kind === "ferry-terminal-departure" &&
    to.kind === "ferry-terminal-arrival"
  ) {
    return true;
  }
  if (from.kind !== "ferry" || to.kind !== "ferry-terminal-arrival") {
    return false;
  }
  return FERRY_ROUTES.some(
    (route) => from.title === `${route.fromLabel} → ${route.toLabel}`,
  );
}

export function directJourneySegment(
  from: IntelligencePlanStop,
  to: IntelligencePlanStop,
): LineString {
  return {
    type: "LineString",
    coordinates: [
      [from.lng!, from.lat!],
      [to.lng!, to.lat!],
    ],
  };
}

export function joinJourneySegments(segments: LineString[]): LineString | null {
  const coordinates: Position[] = [];
  for (const segment of segments) {
    for (const coordinate of segment.coordinates) {
      const previous = coordinates[coordinates.length - 1];
      if (
        previous &&
        previous[0] === coordinate[0] &&
        previous[1] === coordinate[1]
      ) {
        continue;
      }
      coordinates.push(coordinate);
    }
  }
  return coordinates.length >= 2 ? { type: "LineString", coordinates } : null;
}

function hasPosition(stop: IntelligencePlanStop) {
  return (
    typeof stop.lat === "number" &&
    Number.isFinite(stop.lat) &&
    typeof stop.lng === "number" &&
    Number.isFinite(stop.lng)
  );
}

function isPositioned(
  place: SmartJourneyPlan["origin"] | SmartJourneyPlan["destination"],
) {
  return (
    typeof place.lat === "number" &&
    Number.isFinite(place.lat) &&
    typeof place.lng === "number" &&
    Number.isFinite(place.lng)
  );
}
