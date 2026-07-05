export type TaxiTariffPair = {
  fromZoneId: string;
  toZoneId: string;
  sharedFareCents: number;
  privateFareCents?: number;
  notes?: string[];
};

export const taxiTariffPairs: TaxiTariffPair[] = [
  {
    fromZoneId: "stt_airport",
    toZoneId: "stt_charlotte_amalie",
    sharedFareCents: 1000,
    privateFareCents: 4500,
  },
  {
    fromZoneId: "stt_airport",
    toZoneId: "stt_havensight",
    sharedFareCents: 1200,
    privateFareCents: 5000,
  },
  {
    fromZoneId: "stt_airport",
    toZoneId: "stt_red_hook",
    sharedFareCents: 2300,
    privateFareCents: 9000,
  },
  {
    fromZoneId: "stt_charlotte_amalie",
    toZoneId: "stt_havensight",
    sharedFareCents: 600,
    privateFareCents: 3000,
  },
  {
    fromZoneId: "stt_red_hook",
    toZoneId: "stt_sapphire",
    sharedFareCents: 600,
    privateFareCents: 3000,
  },
  {
    fromZoneId: "stt_charlotte_amalie",
    toZoneId: "stt_magens_bay",
    sharedFareCents: 1500,
    privateFareCents: 6500,
  },
  {
    fromZoneId: "stt_havensight",
    toZoneId: "stt_magens_bay",
    sharedFareCents: 1500,
    privateFareCents: 6500,
  },
  {
    fromZoneId: "stj_cruz_bay",
    toZoneId: "stj_north_shore",
    sharedFareCents: 1200,
    privateFareCents: 5500,
  },
  {
    fromZoneId: "stj_cruz_bay",
    toZoneId: "stj_coral_bay",
    sharedFareCents: 2200,
    privateFareCents: 8500,
  },
  {
    fromZoneId: "stx_airport",
    toZoneId: "stx_christiansted",
    sharedFareCents: 2500,
    privateFareCents: 8500,
  },
  {
    fromZoneId: "stx_airport",
    toZoneId: "stx_frederiksted",
    sharedFareCents: 1600,
    privateFareCents: 6500,
  },
  {
    fromZoneId: "stx_christiansted",
    toZoneId: "stx_frederiksted",
    sharedFareCents: 3000,
    privateFareCents: 9500,
  },
];

export function findTaxiTariff(fromZoneId?: string, toZoneId?: string) {
  if (!fromZoneId || !toZoneId) return undefined;

  return taxiTariffPairs.find((pair) => {
    const direct =
      pair.fromZoneId === fromZoneId && pair.toZoneId === toZoneId;
    const reverse =
      pair.fromZoneId === toZoneId && pair.toZoneId === fromZoneId;

    return direct || reverse;
  });
}

export type TaxiTariffLookup = {
  fromZoneId: string;
  toZoneId: string;
  sharedFareCents: number;
  privateFareCents?: number;
  notes?: string[];
};

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

export function findTaxiTariff(
  fromZoneId?: string,
  toZoneId?: string
): TaxiTariffLookup | undefined {
  const baseFareDollars = findBaseZoneFareDollars(fromZoneId, toZoneId);

  if (typeof baseFareDollars !== "number") {
    return undefined;
  }

  const privateFareDollars = Math.max(
    tariffSettings.minimumFare,
    baseFareDollars * tariffSettings.privateServiceMultiplier
  );

  return {
    fromZoneId: fromZoneId ?? "",
    toZoneId: toZoneId ?? "",
    sharedFareCents: dollarsToCents(baseFareDollars),
    privateFareCents: dollarsToCents(privateFareDollars),
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

  const privateTotalDollars =
    Math.max(
      tariffSettings.minimumFare,
      baseFareDollars * tariffSettings.privateServiceMultiplier
    ) + luggageFeeDollars;

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
