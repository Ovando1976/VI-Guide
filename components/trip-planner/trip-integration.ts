import type { TripItem, TripLeg, TripProfile } from "./trip-types";

const PART_RANK = { morning: 0, afternoon: 1, evening: 2, flexible: 3 } as const;

export function buildTripLegs(items: TripItem[], profile: TripProfile): TripLeg[] {
  const ordered = [...items].sort(
    (a, b) => a.day - b.day || PART_RANK[a.timeOfDay] - PART_RANK[b.timeOfDay],
  );
  const legs: TripLeg[] = [];

  for (let index = 0; index < ordered.length - 1; index += 1) {
    const from = ordered[index];
    const to = ordered[index + 1];
    if (from.day !== to.day) continue;
    const kind = transferKind(from, to);
    const hasLocations =
      typeof from.lat === "number" &&
      typeof from.lng === "number" &&
      typeof to.lat === "number" &&
      typeof to.lng === "number";
    const status =
      kind === "taxi"
        ? hasLocations
          ? "ready_for_review"
          : "needs_location"
        : "needs_transfer_planning";

    legs.push({
      id: `${from.kind}:${from.id}->${to.kind}:${to.id}`,
      day: from.day,
      from,
      to,
      kind,
      status,
      label:
        kind === "flight"
          ? "Inter-island flight required"
          : kind === "ferry"
            ? "Ferry transfer required"
            : "Taxi connection",
      href: mobilityHref(from, to, profile, kind),
    });
  }

  return legs;
}

export function mobilityHref(
  from: TripItem,
  to: TripItem,
  profile: TripProfile,
  kind: TripLeg["kind"] = transferKind(from, to),
) {
  if (kind !== "taxi") {
    const prompt = `Plan my ${kind} transfer from ${from.name} on ${islandName(from.island)} to ${to.name} on ${islandName(to.island)}. Preserve both itinerary stops and prepare ground transportation on each side for my review.`;
    return `/map?concierge=open&prompt=${encodeURIComponent(prompt)}`;
  }

  const prompt = `Prepare a ${profile.mobilityPreference} taxi route from ${from.name} to ${to.name} on ${islandName(from.island)} for ${profile.adults + profile.children} passenger${profile.adults + profile.children === 1 ? "" : "s"} with ${profile.luggage} bag${profile.luggage === 1 ? "" : "s"}. Resolve both named endpoints, populate the route, and open official-fare review. Do not book or charge anything; leave final confirmation to me.`;
  return `/map?island=${from.island}&concierge=open&prompt=${encodeURIComponent(prompt)}`;
}

export function tripReadiness(items: TripItem[], legs: TripLeg[]) {
  const unresolvedLocations = legs.filter((leg) => leg.status === "needs_location").length;
  const transfers = legs.filter((leg) => leg.status === "needs_transfer_planning").length;
  return {
    ready: items.length > 0 && unresolvedLocations === 0 && transfers === 0,
    unresolvedLocations,
    transfers,
    taxiLegs: legs.filter((leg) => leg.kind === "taxi").length,
  };
}

function transferKind(from: TripItem, to: TripItem): TripLeg["kind"] {
  if (from.island === to.island) return "taxi";
  if (from.island === "stx" || to.island === "stx") return "flight";
  return "ferry";
}

function islandName(island: TripItem["island"]) {
  return island === "stt" ? "St. Thomas" : island === "stj" ? "St. John" : "St. Croix";
}
