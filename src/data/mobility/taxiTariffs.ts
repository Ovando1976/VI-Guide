import {
  baseZoneFares,
  tariffSettings,
  tariffZones,
} from "./tariffRules";
import type { TaxiZoneId } from "./tariffRules";

export type TaxiTariffPair = {
  fromZoneId: string;
  toZoneId: string;
  sharedFareCents: number;
  privateFareCents?: number;
  notes?: string[];
};

export type TaxiTariffLookup = TaxiTariffPair;

function dollarsToCents(value: number) {
  return Math.round(value * 100);
}

function isKnownTaxiZoneId(value?: string): value is TaxiZoneId {
  return Boolean(value && tariffZones.some((zone) => zone.id === value));
}

export function getTariffZoneById(zoneId?: string) {
  if (!zoneId) return undefined;
  return tariffZones.find((zone) => zone.id === zoneId);
}

export function findBaseZoneFareDollars(
  fromZoneId?: string,
  toZoneId?: string
) {
  if (!isKnownTaxiZoneId(fromZoneId) || !isKnownTaxiZoneId(toZoneId)) {
    return undefined;
  }

  const direct = baseZoneFares[fromZoneId]?.[toZoneId];
  if (typeof direct === "number") return direct;

  const reverse = baseZoneFares[toZoneId]?.[fromZoneId];
  if (typeof reverse === "number") return reverse;

  return undefined;
}

export const taxiTariffPairs: TaxiTariffPair[] = Object.entries(
  baseZoneFares
).flatMap(([fromZoneId, destinations]) => {
  return Object.entries(destinations ?? {}).map(([toZoneId, fareDollars]) => {
    const sharedFareCents = dollarsToCents(Number(fareDollars));
    const privateFareCents = dollarsToCents(
      Math.max(
        tariffSettings.minimumFare,
        Number(fareDollars) * tariffSettings.privateServiceMultiplier
      )
    );

    return {
      fromZoneId,
      toZoneId,
      sharedFareCents,
      privateFareCents,
      notes: ["Fare generated from official seeded VITC zone matrix."],
    };
  });
});

export function findTaxiTariff(
  fromZoneId?: string,
  toZoneId?: string
): TaxiTariffLookup | undefined {
  const baseFareDollars = findBaseZoneFareDollars(fromZoneId, toZoneId);

  if (typeof baseFareDollars !== "number") {
    return undefined;
  }

  return {
    fromZoneId: fromZoneId ?? "",
    toZoneId: toZoneId ?? "",
    sharedFareCents: dollarsToCents(baseFareDollars),
    privateFareCents: dollarsToCents(
      Math.max(
        tariffSettings.minimumFare,
        baseFareDollars * tariffSettings.privateServiceMultiplier
      )
    ),
    notes: [
      "Fare matched official seeded VITC zone matrix.",
      "Shared fare is stored as the single-passenger base fare.",
    ],
  };
}

export function calculateTaxiTariffCents(args: {
  fromZoneId?: string;
  toZoneId?: string;
  passengers: number;
  luggage: number;
  serviceClass: "shared" | "private";
  cruiseTransfer?: boolean;
}) {
  const passengers = Math.max(1, args.passengers || 1);
  const luggage = Math.max(0, args.luggage || 0);

  const baseFareDollars = findBaseZoneFareDollars(
    args.fromZoneId,
    args.toZoneId
  );

  if (typeof baseFareDollars !== "number") {
    return undefined;
  }

  const passengerFeeDollars =
    args.serviceClass === "shared"
      ? Math.max(0, passengers - 1) * tariffSettings.additionalPassengerFee
      : 0;

  const luggageFeeDollars = luggage * tariffSettings.luggageFeePerBag;

  const sharedTotalDollars =
    baseFareDollars + passengerFeeDollars + luggageFeeDollars;

  const privateBaseDollars = Math.max(
    tariffSettings.minimumFare,
    baseFareDollars * tariffSettings.privateServiceMultiplier
  );

  const privateTotalDollars = privateBaseDollars + luggageFeeDollars;

  const cruiseMultiplier = args.cruiseTransfer
    ? tariffSettings.cruiseDemandMultiplier
    : 1;

  const totalDollars =
    args.serviceClass === "private"
      ? privateTotalDollars * cruiseMultiplier
      : sharedTotalDollars * cruiseMultiplier;

  return {
    baseFareCents: dollarsToCents(baseFareDollars),
    passengerFeeCents: dollarsToCents(passengerFeeDollars),
    luggageFeeCents: dollarsToCents(luggageFeeDollars),
    totalFareCents: dollarsToCents(totalDollars),
    confidence: "official_seed" as const,
    notes: [
      `Official seeded zone fare matched: ${args.fromZoneId} ↔ ${args.toZoneId}.`,
      `${passengers} passenger(s), ${luggage} bag(s), ${args.serviceClass} service.`,
    ],
  };
}
