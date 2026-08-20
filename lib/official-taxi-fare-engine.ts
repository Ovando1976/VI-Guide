import type { OfficialTaxiRateRule } from "@/types/taxi-operations";

export type OfficialTaxiFareEndpoint = {
  geoid: string;
  baseName: string;
  tariffEndpointName?: string;
  parentEstateGeoid?: string;
  parentEstateName?: string;
};

export class OfficialTaxiRateUnavailableError extends Error {
  status = 422;
  code = "OFFICIAL_TAXI_RATE_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "OfficialTaxiRateUnavailableError";
  }
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const REVIEWED_ENDPOINT_ALIASES: Record<string, string> = {
  "cruz bay town": "cruz bay",
  "town of cruz bay": "cruz bay",
  "cyril e king airport": "airport terminal",
  "cyril king airport": "airport terminal",
  "st thomas airport": "airport terminal",
  "urman victor fredericks marine terminal": "red hook",
  "urman v fredericks marine terminal": "red hook",
  "red hook ferry terminal": "red hook",
  "red hook passenger ferry terminal": "red hook",
  stt: "airport terminal",
  tist: "airport terminal",
  airport: "airport terminal",
};

function canonicalEndpointName(value: string) {
  const normalized = normalize(value);
  return REVIEWED_ENDPOINT_ALIASES[normalized] ?? normalized;
}

function hasName(values: string[] | undefined, name: string) {
  const target = canonicalEndpointName(name);
  return (values ?? []).some(
    (value) => canonicalEndpointName(value) === target,
  );
}

function endpointMatches(
  ruleGeoids: string[] | undefined,
  ruleNames: string[],
  endpoint: OfficialTaxiFareEndpoint,
) {
  const fareName = endpoint.tariffEndpointName ?? endpoint.baseName;
  return Boolean(
    ruleGeoids?.includes(endpoint.geoid) || hasName(ruleNames, fareName),
  );
}

function addPublishedCandidates(
  candidates: Map<string, string>,
  ruleGeoids: string[] | undefined,
  ruleNames: string[] | undefined,
  geoid?: string,
  name?: string,
) {
  const geoidMatch = Boolean(geoid && ruleGeoids?.includes(geoid));
  const nameMatch = Boolean(name && hasName(ruleNames, name));
  if (!geoidMatch && !nameMatch) return;

  for (const publishedName of ruleNames ?? []) {
    const canonical = canonicalEndpointName(publishedName);
    if (!canonical) continue;
    if (!candidates.has(canonical)) candidates.set(canonical, publishedName);
  }
}

function findUniquePublishedEndpointName(
  rules: OfficialTaxiRateRule[],
  geoid?: string,
  name?: string,
) {
  const candidates = new Map<string, string>();

  for (const rule of rules) {
    addPublishedCandidates(
      candidates,
      rule.originEstateGeoids,
      rule.originNames,
      geoid,
      name,
    );
    addPublishedCandidates(
      candidates,
      rule.destinationEstateGeoids,
      rule.destinationNames,
      geoid,
      name,
    );
  }

  return candidates.size === 1 ? [...candidates.values()][0] : undefined;
}

/**
 * Attach a governed fare identity to a selectable place without inventing one.
 *
 * Precedence:
 * 1. Explicit reviewed tariffEndpointName (special destinations win).
 * 2. Unique exact published GEOID/name match.
 * 3. Unique published match for the verified parent estate.
 * 4. Leave unresolved so quoting fails closed.
 *
 * Parent resolution is intentionally exact and unique. It never uses map
 * distance, nearest-road logic, fuzzy names, or geographic proximity.
 */
export function resolveOfficialTaxiFareEndpoint<
  T extends OfficialTaxiFareEndpoint,
>(
  rules: OfficialTaxiRateRule[],
  endpoint: T,
): T & { tariffEndpointName?: string } {
  if (endpoint.tariffEndpointName) return endpoint;

  const direct = findUniquePublishedEndpointName(
    rules,
    endpoint.geoid,
    endpoint.baseName,
  );
  if (direct) return { ...endpoint, tariffEndpointName: direct };

  const parent = findUniquePublishedEndpointName(
    rules,
    endpoint.parentEstateGeoid,
    endpoint.parentEstateName,
  );
  if (parent) return { ...endpoint, tariffEndpointName: parent };

  return endpoint;
}

export function findOfficialTaxiRateRule(
  rules: OfficialTaxiRateRule[],
  origin: OfficialTaxiFareEndpoint,
  destination: OfficialTaxiFareEndpoint,
) {
  for (const rule of rules) {
    const direct =
      endpointMatches(rule.originEstateGeoids, rule.originNames, origin) &&
      endpointMatches(rule.destinationEstateGeoids, rule.destinationNames, destination);
    const reverse =
      endpointMatches(rule.originEstateGeoids, rule.originNames, destination) &&
      endpointMatches(rule.destinationEstateGeoids, rule.destinationNames, origin);
    if (direct || reverse) return rule;
  }
  return null;
}

function assertFareConfirmationNotRequired(
  rule: OfficialTaxiRateRule,
  passengers: number,
) {
  const party = Math.max(1, Math.trunc(passengers));
  const blocked =
    rule.fareConfirmationRequired === "all" ||
    (rule.fareConfirmationRequired === "two_or_more" && party > 1);
  if (!blocked) return;

  throw new OfficialTaxiRateUnavailableError(
    rule.fareConfirmationReason
      ? `Official fare confirmation required: ${rule.fareConfirmationReason}`
      : "Official fare confirmation is required for this route and passenger count. Dispatch must verify the regulated fare.",
  );
}

function calculateTierFare(rule: OfficialTaxiRateRule, party: number) {
  const tiers = rule.passengerFareTiers;
  if (!tiers?.length) return null;

  const tier = tiers.find(
    ({ minPassengers, maxPassengers }) =>
      party >= minPassengers &&
      (typeof maxPassengers !== "number" || party <= maxPassengers),
  );

  if (!tier) {
    throw new OfficialTaxiRateUnavailableError(
      "The official route rule does not define a published fare tier for this passenger count.",
    );
  }

  if (tier.basis === "party") {
    return { routeFare: tier.fare, passengerFare: 0 };
  }

  return { routeFare: 0, passengerFare: tier.fare * party };
}

export function calculateOfficialTaxiRuleFare(
  rule: OfficialTaxiRateRule,
  passengers: number,
  luggage: number,
) {
  const party = Math.max(1, Math.trunc(passengers));
  assertFareConfirmationNotRequired(rule, party);

  const tierFare = calculateTierFare(rule, party);
  let routeFare = tierFare?.routeFare ?? rule.onePassengerFare;
  let passengerFare = tierFare?.passengerFare ?? 0;

  // Backward-compatible calculation for active tariff documents that have not
  // yet migrated to passengerFareTiers. New reviewed data should use tiers.
  if (!tierFare && party > 1) {
    if (typeof rule.perPersonFare === "number") {
      routeFare = 0;
      passengerFare = rule.perPersonFare * party;
    } else if (typeof rule.additionalPassengerFare === "number") {
      passengerFare = rule.additionalPassengerFare * (party - 1);
    } else {
      throw new OfficialTaxiRateUnavailableError(
        "The official route rule does not define a fare for this passenger count.",
      );
    }
  }

  const chargeableLuggage = Math.max(
    0,
    Math.trunc(luggage) - (rule.luggageIncluded ?? 0),
  );
  if (
    chargeableLuggage > 0 &&
    typeof rule.luggageFarePerPiece !== "number"
  ) {
    throw new OfficialTaxiRateUnavailableError(
      "The selected route needs an official luggage charge that is not configured. Dispatch must verify the regulated fare.",
    );
  }
  const luggageFare = chargeableLuggage * (rule.luggageFarePerPiece ?? 0);
  return { routeFare, passengerFare, luggageFare };
}
