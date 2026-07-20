import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import type { FareBreakdown } from "@/types/mobility";
import type { EstateRecord, IslandCode } from "@/types/usvi";
import type { OfficialTaxiRateRule, OfficialTaxiTariff } from "@/types/taxi-operations";
import { getOfficialTaxiTariffValidationErrors } from "@/lib/official-taxi-tariff-validation";

export class OfficialTaxiRateUnavailableError extends Error {
  status = 422;
  code = "OFFICIAL_TAXI_RATE_UNAVAILABLE";

  constructor(message: string) {
    super(message);
    this.name = "OfficialTaxiRateUnavailableError";
  }
}

function normalize(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();
}

function hasName(values: string[] | undefined, name: string) {
  const target = normalize(name);
  return (values ?? []).some((value) => normalize(value) === target);
}

function endpointMatches(ruleGeoids: string[] | undefined, ruleNames: string[], estate: EstateRecord) {
  return Boolean(ruleGeoids?.includes(estate.geoid) || hasName(ruleNames, estate.baseName));
}

function endpointMatchesName(ruleNames: string[], requestedLabel: string | undefined, estate: EstateRecord) {
  if (requestedLabel) return hasName(ruleNames, requestedLabel);
  return endpointMatches(undefined, ruleNames, estate);
}

function findRule(
  tariff: OfficialTaxiTariff,
  origin: EstateRecord,
  destination: EstateRecord,
  requestedOriginLabel?: string,
  requestedDestinationLabel?: string,
) {
  const matches = tariff.rules.filter((rule) => {
    const originDirect = requestedOriginLabel
      ? endpointMatchesName(rule.originNames, requestedOriginLabel, origin)
      : endpointMatches(rule.originEstateGeoids, rule.originNames, origin);
    const destinationDirect = requestedDestinationLabel
      ? endpointMatchesName(rule.destinationNames, requestedDestinationLabel, destination)
      : endpointMatches(rule.destinationEstateGeoids, rule.destinationNames, destination);
    const originReverse = requestedOriginLabel
      ? endpointMatchesName(rule.destinationNames, requestedOriginLabel, origin)
      : endpointMatches(rule.destinationEstateGeoids, rule.destinationNames, origin);
    const destinationReverse = requestedDestinationLabel
      ? endpointMatchesName(rule.originNames, requestedDestinationLabel, destination)
      : endpointMatches(rule.originEstateGeoids, rule.originNames, destination);
    const direct = originDirect && destinationDirect;
    const reverse = originReverse && destinationReverse;
    return direct || reverse;
  });
  if (matches.length > 1) {
    throw new OfficialTaxiRateUnavailableError(
      `Multiple official tariff rules match ${origin.baseName} to ${destination.baseName}. An administrator must remove the ambiguity before quoting.`,
    );
  }
  return matches[0] ?? null;
}

async function loadTariffForQuote(island: IslandCode): Promise<OfficialTaxiTariff> {
  const collection = getAdminDb().collection("taxiTariffs");
  const activeSnapshot = await collection
    .where("island", "==", island)
    .where("status", "==", "active")
    .limit(2)
    .get();

  if (activeSnapshot.size > 1) {
    throw new OfficialTaxiRateUnavailableError(
      "More than one active taxi tariff is configured. An administrator must resolve the tariff versions before quoting.",
    );
  }
  let document = activeSnapshot.docs[0];
  if (!document) {
    const provisionalSnapshot = await collection
      .where("island", "==", island)
      .where("status", "==", "provisional")
      .limit(2)
      .get();
    if (provisionalSnapshot.empty) {
      throw new OfficialTaxiRateUnavailableError(
        "No active or provisional USVI taxi tariff is available for this island. Dispatch must verify the regulated fare.",
      );
    }
    if (provisionalSnapshot.size !== 1) {
      throw new OfficialTaxiRateUnavailableError(
        "More than one provisional taxi tariff is configured. An administrator must resolve the tariff versions before quoting.",
      );
    }
    document = provisionalSnapshot.docs[0];
  }
  const tariff = { id: document.id, ...document.data() } as OfficialTaxiTariff;
  const validationErrors = getOfficialTaxiTariffValidationErrors(tariff);
  if (validationErrors.length) throw new OfficialTaxiRateUnavailableError(validationErrors[0]);
  return tariff;
}

function calculateRuleFare(rule: OfficialTaxiRateRule, passengers: number, luggage: number) {
  const party = passengers;
  let routeFareCents = Math.round(rule.onePassengerFare * 100);
  let passengerFareCents = 0;

  if (rule.passengerFareBands?.length) {
    const matchingBands = rule.passengerFareBands.filter((band) =>
      party >= band.minimumPassengers && (band.maximumPassengers === undefined || party <= band.maximumPassengers),
    );
    if (matchingBands.length !== 1) {
      throw new OfficialTaxiRateUnavailableError(
        "The official route rule does not define one unambiguous fare band for this passenger count.",
      );
    }
    const band = matchingBands[0];
    routeFareCents = band.calculation === "flat_party" ? Math.round(band.amount * 100) : 0;
    passengerFareCents = band.calculation === "per_person" ? Math.round(band.amount * 100) * party : 0;
  } else if (party > 1) {
    if (typeof rule.perPersonFare === "number") {
      routeFareCents = 0;
      passengerFareCents = Math.round(rule.perPersonFare * 100) * party;
    } else if (typeof rule.additionalPassengerFare === "number") {
      passengerFareCents = Math.round(rule.additionalPassengerFare * 100) * (party - 1);
    } else {
      throw new OfficialTaxiRateUnavailableError(
        "The official route rule does not define a fare for this passenger count.",
      );
    }
  }

  const chargeableLuggage = Math.max(0, Math.trunc(luggage) - (rule.luggageIncluded ?? 0));
  if (chargeableLuggage > 0 && typeof rule.luggageFarePerPiece !== "number") {
    throw new OfficialTaxiRateUnavailableError(
      "The selected route needs an official luggage charge that is not configured. Dispatch must verify the regulated fare.",
    );
  }
  const luggageFareCents = chargeableLuggage * Math.round((rule.luggageFarePerPiece ?? 0) * 100);
  return {
    routeFare: routeFareCents / 100,
    passengerFare: passengerFareCents / 100,
    luggageFare: luggageFareCents / 100,
    total: (routeFareCents + passengerFareCents + luggageFareCents) / 100,
  };
}

export async function quoteOfficialTaxiFare(params: {
  origin: EstateRecord;
  destination: EstateRecord;
  passengers: number;
  luggage: number;
  requestedOriginLabel?: string;
  requestedDestinationLabel?: string;
}): Promise<FareBreakdown> {
  if (params.origin.island !== params.destination.island) {
    throw new OfficialTaxiRateUnavailableError("Taxi quotes cannot cross islands. Choose endpoints on the same island.");
  }
  if (params.origin.geoid === params.destination.geoid) {
    throw new OfficialTaxiRateUnavailableError("Pickup and destination must be different tariff endpoints.");
  }
  if (!Number.isInteger(params.passengers) || params.passengers < 1 || params.passengers > 12) {
    throw new OfficialTaxiRateUnavailableError("Passenger count must be a whole number from 1 through 12.");
  }
  if (!Number.isInteger(params.luggage) || params.luggage < 0 || params.luggage > 12) {
    throw new OfficialTaxiRateUnavailableError("Luggage count must be a whole number from 0 through 12.");
  }
  const tariff = await loadTariffForQuote(params.origin.island);
  const rule = findRule(
    tariff,
    params.origin,
    params.destination,
    params.requestedOriginLabel,
    params.requestedDestinationLabel,
  );
  if (!rule) {
    throw new OfficialTaxiRateUnavailableError(
      `No published official route rate matches ${params.requestedOriginLabel ?? params.origin.baseName} to ${params.requestedDestinationLabel ?? params.destination.baseName}. Dispatch must verify the regulated fare.`,
    );
  }
  const amounts = calculateRuleFare(rule, params.passengers, params.luggage);
  const total = amounts.total;
  const quotedAt = new Date();
  const expiresAt = new Date(quotedAt.getTime() + 30 * 60 * 1000);
  return {
    pricingModel: "official_usvi_taxi_tariff",
    quoteStatus: tariff.status === "active" ? "official" : "provisional",
    currency: "USD",
    tariffId: tariff.id,
    tariffTitle: tariff.title,
    tariffVersion: tariff.version,
    tariffSourceUrl: tariff.sourceUrl,
    tariffEffectiveAt: tariff.effectiveAt,
    quotedAt: quotedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    rateRuleId: rule.id,
    matchedOrigin: params.requestedOriginLabel ?? params.origin.baseName,
    matchedDestination: params.requestedDestinationLabel ?? params.destination.baseName,
    routeFare: amounts.routeFare,
    passengerFare: amounts.passengerFare,
    luggageFare: amounts.luggageFare,
    authorizedAdditionalCharges: 0,
    total,
    ruleNotes: rule.notes,
  };
}

export async function verifyOfficialTaxiFareSnapshot(params: {
  fare: FareBreakdown;
  island: IslandCode;
  passengers: number;
  luggage: number;
}) {
  if (params.fare.pricingModel !== "official_usvi_taxi_tariff" || params.fare.quoteStatus !== "official") {
    throw new OfficialTaxiRateUnavailableError("The booking does not contain an official USVI taxi tariff quote.");
  }
  if (!params.fare.expiresAt || !Number.isFinite(Date.parse(params.fare.expiresAt)) || Date.parse(params.fare.expiresAt) <= Date.now()) {
    throw new OfficialTaxiRateUnavailableError("The official taxi quote has expired. Return to mobility review to refresh it.");
  }
  const tariff = await loadTariffForQuote(params.island);
  if (tariff.id !== params.fare.tariffId || tariff.version !== params.fare.tariffVersion || tariff.sourceUrl !== params.fare.tariffSourceUrl) {
    throw new OfficialTaxiRateUnavailableError("The active official tariff changed after this quote was created. Refresh the route before payment.");
  }
  const rule = tariff.rules.find((candidate) => candidate.id === params.fare.rateRuleId);
  if (!rule) throw new OfficialTaxiRateUnavailableError("The quoted official tariff rule is no longer active.");
  const recalculated = calculateRuleFare(rule, params.passengers, params.luggage);
  const unchanged =
    recalculated.routeFare === params.fare.routeFare &&
    recalculated.passengerFare === params.fare.passengerFare &&
    recalculated.luggageFare === params.fare.luggageFare &&
    recalculated.total === params.fare.total;
  if (!unchanged) {
    throw new OfficialTaxiRateUnavailableError("The official fare changed after this quote was created. Refresh the route before payment.");
  }
  return params.fare;
}
