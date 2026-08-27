import type { TerritoryMapPlaceType } from "@/types/territory-map";
import type { IntelligenceIsland, IntelligencePlanStop } from "@/types/intelligence";

type RideTarget = {
  name: string;
  island: "stt" | "stj" | "stx";
  type?: TerritoryMapPlaceType | string;
  lat?: number | null;
  lng?: number | null;
  estateGeoid?: string | null;
  source?: "living-map" | "beach" | "planner" | "place" | "stay" | "historic";
  returnTo?: string;
};

export function buildMobilityRideHref(target: RideTarget) {
  const params = new URLSearchParams({
    island: target.island,
    destinationName: target.name.trim().slice(0, 220),
    source: target.source ?? "place",
  });

  if (target.type) params.set("destinationType", String(target.type).slice(0, 80));
  if (target.returnTo?.startsWith("/") && !target.returnTo.startsWith("//")) {
    params.set("returnTo", target.returnTo.slice(0, 600));
  }
  if (target.estateGeoid?.trim()) params.set("to", target.estateGeoid.trim().slice(0, 180));
  if (typeof target.lat === "number" && Number.isFinite(target.lat)) params.set("toLat", String(target.lat));
  if (typeof target.lng === "number" && Number.isFinite(target.lng)) params.set("toLng", String(target.lng));

  return `/mobility?${params.toString()}#book`;
}

type JourneyMobilityInput = {
  id: string;
  island: IntelligenceIsland;
  plan: IntelligencePlanStop[];
};

/**
 * Builds the canonical Concierge/My Trip -> Mobility handoff.
 * Verified estate GEOIDs are copied only from existing internal map or
 * mobility URLs. Without one, Mobility receives the place name and remains
 * fail-closed until the traveler chooses an official tariff estate.
 */
export function buildJourneyMobilityHref(journey: JourneyMobilityInput) {
  const params = new URLSearchParams({
    island: journey.island,
    trip: journey.id,
    source: "concierge",
    returnTo: "/trips",
  });
  const first = journey.plan[0];
  const last = journey.plan[journey.plan.length - 1];

  if (first && last && first.id !== last.id) {
    setJourneyEndpoint(params, "from", first, "pickupName", "fromLat", "fromLng");
  }
  if (last) {
    setJourneyEndpoint(params, "to", last, "destinationName", "toLat", "toLng");
  }

  return `/mobility?${params.toString()}#book`;
}

function setJourneyEndpoint(
  params: URLSearchParams,
  role: "from" | "to",
  stop: IntelligencePlanStop,
  nameKey: "pickupName" | "destinationName",
  latKey: "fromLat" | "toLat",
  lngKey: "fromLng" | "toLng",
) {
  params.set(nameKey, stop.title.trim().slice(0, 220));

  const estateGeoid = verifiedEstateFromStop(stop, role);
  if (estateGeoid) params.set(role, estateGeoid);
  if (typeof stop.lat === "number" && Number.isFinite(stop.lat)) {
    params.set(latKey, String(stop.lat));
  }
  if (typeof stop.lng === "number" && Number.isFinite(stop.lng)) {
    params.set(lngKey, String(stop.lng));
  }
}

function verifiedEstateFromStop(
  stop: IntelligencePlanStop,
  role: "from" | "to",
) {
  const mobilityParams = internalSearchParams(stop.bookingHref, "/mobility");
  const mobilityEstate = mobilityParams?.get(role)?.trim();
  if (mobilityEstate) return mobilityEstate.slice(0, 180);

  const mapParams = internalSearchParams(stop.mapHref, "/map");
  const mapEstate = mapParams?.get("estate")?.trim();
  return mapEstate ? mapEstate.slice(0, 180) : null;
}

function internalSearchParams(href: string | undefined, pathname: string) {
  if (!href?.startsWith("/") || href.startsWith("//")) return null;
  try {
    const url = new URL(href, "https://usvi-explorer.local");
    return url.pathname === pathname ? url.searchParams : null;
  } catch {
    return null;
  }
}
