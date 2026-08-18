import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import { assertVerifiedActiveTariff } from "@/lib/taxi-tariff-governance";
import type { FareBreakdown } from "@/types/mobility";
import type { EstateRecord, IslandCode } from "@/types/usvi";
import type {
  OfficialTaxiRateRule,
  OfficialTaxiTariff,
} from "@/types/taxi-operations";

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

function hasName(values: string[] | undefined, name: string) {
  const target = normalize(name);
  return (values ?? []).some((value) => normalize(value) === target);
}

const STT_ENDPOINT_REVIEW_GATES = new Map<string, string>([
  [
    "town",
    "Town cannot be treated as Charlotte Amalie until the tariff endpoint identity is confirmed.",
  ],
  [
    "lindbergh bay",
    "Lindbergh Bay cannot inherit Airport Terminal pricing until the tariff endpoint identity is confirmed.",
  ],
  [
    "dorothea estate",
    "Dorothea Estate cannot inherit Dorothea pricing until the tariff endpoint identity is confirmed.",
  ],
]);

function assertEndpointIdentityConfirmed(estate: EstateRecord) {
  if (estate.island !== "stt") return;
  const reason = STT_ENDPOINT_REVIEW_GATES.get(normalize(estate.baseName));
  if (!reason) return;
  throw new OfficialTaxiRateUnavailableError(
    `Official fare confirmation required: ${reason} Dispatch must verify the regulated endpoint before quoting.`,
  );
}

function endpointMatches(
  ruleGeoids: string[] | undefined,
  ruleNames: string[],
  estate: EstateRecord,
) {
  return Boolean(
    ruleGeoids?.includes(estate.geoid) || hasName(ruleNames, estate.baseName),
  );
}

function findRule(
  tariff: OfficialTaxiTariff,
  origin: EstateRecord,
  destination: EstateRecord,
) {
  for (const rule of tariff.rules) {
    const direct =
      endpointMatches(rule.originEstateGeoids, rule.originNames, origin) &&
      endpointMatches(
        rule.destinationEstateGeoids,
        rule.destinationNames,
        destination,
      );
    const reverse =
      endpointMatches(rule.originEstateGeoids, rule.originNames, destination) &&
      endpointMatches(
        rule.destinationEstateGeoids,
        rule.destinationNames,
        origin,
      );
    if (direct || reverse) return rule;
  }
  return null;
}

async function loadActiveTariff(
  island: IslandCode,
): Promise<OfficialTaxiTariff> {
  const snapshot = await getAdminDb()
    .collection("taxiTariffs")
    .where("island", "==", island)
    .where("status", "==", "active")
    .limit(2)
    .get();

  if (snapshot.empty) {
    throw new OfficialTaxiRateUnavailableError(
      "No active official USVI taxi tariff is published for this island. Dispatch must verify the regulated fare.",
    );
  }
  if (snapshot.size !== 1) {
    throw new OfficialTaxiRateUnavailableError(
      "More than one active taxi tariff is configured. An administrator must resolve the tariff versions before quoting.",
    );
  }

  const document = snapshot.docs[0];
  const tariff = {
    id: document.id,
    ...document.data(),
  } as OfficialTaxiTariff;
  try {
    return assertVerifiedActiveTariff(tariff);
  } catch (error) {
    throw new OfficialTaxiRateUnavailableError(
      error instanceof Error
        ? error.message
        : "The active tariff failed governance verification.",
    );
  }
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

function calculateRuleFare(
  rule: OfficialTaxiRateRule,
  passengers: number,
  luggage: number,
) {
  const party = Math.max(1, Math.trunc(passengers));
  assertFareConfirmationNotRequired(rule, party);

  let routeFare = rule.onePassengerFare;
  let passengerFare = 0;

  if (party > 1) {
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

export async function quoteOfficialTaxiFare(params: {
  origin: EstateRecord;
  destination: EstateRecord;
  passengers: number;
  luggage: number;
}): Promise<FareBreakdown> {
  if (params.origin.island !== params.destination.island) {
    throw new OfficialTaxiRateUnavailableError(
      "Taxi quotes cannot cross islands. Choose endpoints on the same island.",
    );
  }
  assertEndpointIdentityConfirmed(params.origin);
  assertEndpointIdentityConfirmed(params.destination);
  const tariff = await loadActiveTariff(params.origin.island);
  const rule = findRule(tariff, params.origin, params.destination);
  if (!rule) {
    throw new OfficialTaxiRateUnavailableError(
      `No published official route rate matches ${params.origin.baseName} to ${params.destination.baseName}. Dispatch must verify the regulated fare.`,
    );
  }
  const amounts = calculateRuleFare(
    rule,
    params.passengers,
    params.luggage,
  );
  const total = Number(
    (amounts.routeFare + amounts.passengerFare + amounts.luggageFare).toFixed(2),
  );
  return {
    pricingModel: "official_usvi_taxi_tariff",
    quoteStatus: "official",
    currency: "USD",
    tariffId: tariff.id,
    tariffTitle: tariff.title,
    tariffVersion: tariff.version,
    tariffSourceUrl: tariff.sourceUrl,
    tariffEffectiveAt: tariff.effectiveAt,
    rateRuleId: rule.id,
    matchedOrigin: params.origin.baseName,
    matchedDestination: params.destination.baseName,
    routeFare: amounts.routeFare,
    passengerFare: amounts.passengerFare,
    luggageFare: amounts.luggageFare,
    authorizedAdditionalCharges: 0,
    total,
    ruleNotes: rule.notes,
  };
}
