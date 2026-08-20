import "server-only";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  calculateOfficialTaxiRuleFare,
  findOfficialTaxiRateRule,
  OfficialTaxiRateUnavailableError,
  resolveOfficialTaxiFareEndpoint,
} from "@/lib/official-taxi-fare-engine";
import { taxiEndpointGovernanceHold } from "@/lib/taxi-endpoint-governance";
import { assertVerifiedActiveTariff } from "@/lib/taxi-tariff-governance";
import type { FareBreakdown } from "@/types/mobility";
import type { EstateRecord, IslandCode } from "@/types/usvi";
import type { OfficialTaxiTariff } from "@/types/taxi-operations";

export { OfficialTaxiRateUnavailableError } from "@/lib/official-taxi-fare-engine";

function assertEndpointIdentityConfirmed(estate: EstateRecord) {
  const reason = taxiEndpointGovernanceHold({
    island: estate.island,
    placeName: estate.baseName,
    tariffEndpointName: estate.tariffEndpointName,
  });
  if (!reason) return;

  throw new OfficialTaxiRateUnavailableError(
    `Official fare confirmation required: ${reason} Dispatch must verify the regulated endpoint before quoting.`,
  );
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

  const tariff = await loadActiveTariff(params.origin.island);
  const origin = resolveOfficialTaxiFareEndpoint(tariff.rules, params.origin);
  const destination = resolveOfficialTaxiFareEndpoint(
    tariff.rules,
    params.destination,
  );

  assertEndpointIdentityConfirmed(origin);
  assertEndpointIdentityConfirmed(destination);

  const rule = findOfficialTaxiRateRule(tariff.rules, origin, destination);
  if (!rule) {
    throw new OfficialTaxiRateUnavailableError(
      `No published official route rate matches ${params.origin.baseName} to ${params.destination.baseName}. Dispatch must verify the regulated fare.`,
    );
  }
  const amounts = calculateOfficialTaxiRuleFare(
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
    matchedOrigin: origin.tariffEndpointName ?? params.origin.baseName,
    matchedDestination:
      destination.tariffEndpointName ?? params.destination.baseName,
    routeFare: amounts.routeFare,
    passengerFare: amounts.passengerFare,
    luggageFare: amounts.luggageFare,
    authorizedAdditionalCharges: 0,
    total,
    ruleNotes: rule.notes,
  };
}
