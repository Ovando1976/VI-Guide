import type {
  OfficialCruisePortCall,
  OfficialCruisePortId,
} from "@/lib/cruise-port-calls";

export type ProviderCruiseOfferWindow = {
  offerId: string;
  offerTitle: string;
  active: boolean;
  validFrom: string;
  validThrough: string;
  supportedPorts: OfficialCruisePortId[];
};

export type ProviderCruiseDemandDate = {
  date: string;
  callCount: number;
  offerCount: number;
  shipNames: string[];
  terminalLabels: string[];
  portIds: OfficialCruisePortId[];
  offerIds: string[];
  offerTitles: string[];
  earliestArrivalAt: string;
  latestDepartureAt: string;
};

export function buildProviderCruiseDemandDates(input: {
  offers: ProviderCruiseOfferWindow[];
  calls: OfficialCruisePortCall[];
  from: string;
  through: string;
}): ProviderCruiseDemandDate[] {
  const from = isoDate(input.from);
  const through = isoDate(input.through);
  if (!from || !through || through < from) return [];

  const offers = input.offers.filter(
    (offer) =>
      offer.active &&
      isoDate(offer.validFrom) &&
      isoDate(offer.validThrough) &&
      offer.validThrough >= from &&
      offer.validFrom <= through &&
      offer.supportedPorts.length > 0,
  );
  if (!offers.length) return [];

  const byDate = new Map<
    string,
    {
      callIds: Set<string>;
      offerIds: Set<string>;
      shipNames: Set<string>;
      terminalLabels: Set<string>;
      portIds: Set<OfficialCruisePortId>;
      offerTitles: Set<string>;
      earliestArrivalAt: string;
      latestDepartureAt: string;
    }
  >();

  for (const call of input.calls) {
    if (
      call.status !== "scheduled" ||
      call.date < from ||
      call.date > through
    ) {
      continue;
    }

    const matchingOffers = offers.filter(
      (offer) =>
        offer.validFrom <= call.date &&
        offer.validThrough >= call.date &&
        offer.supportedPorts.includes(call.portId),
    );
    if (!matchingOffers.length) continue;

    const current = byDate.get(call.date) ?? {
      callIds: new Set<string>(),
      offerIds: new Set<string>(),
      shipNames: new Set<string>(),
      terminalLabels: new Set<string>(),
      portIds: new Set<OfficialCruisePortId>(),
      offerTitles: new Set<string>(),
      earliestArrivalAt: call.arrivesAt,
      latestDepartureAt: call.departsAt,
    };

    current.callIds.add(call.id);
    current.shipNames.add(call.shipName);
    current.terminalLabels.add(call.terminalLabel);
    current.portIds.add(call.portId);
    if (call.arrivesAt < current.earliestArrivalAt) {
      current.earliestArrivalAt = call.arrivesAt;
    }
    if (call.departsAt > current.latestDepartureAt) {
      current.latestDepartureAt = call.departsAt;
    }

    for (const offer of matchingOffers) {
      current.offerIds.add(offer.offerId);
      current.offerTitles.add(offer.offerTitle);
    }

    byDate.set(call.date, current);
  }

  return Array.from(byDate.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({
      date,
      callCount: value.callIds.size,
      offerCount: value.offerIds.size,
      shipNames: Array.from(value.shipNames).sort(),
      terminalLabels: Array.from(value.terminalLabels).sort(),
      portIds: Array.from(value.portIds).sort(),
      offerIds: Array.from(value.offerIds).sort(),
      offerTitles: Array.from(value.offerTitles).sort(),
      earliestArrivalAt: value.earliestArrivalAt,
      latestDepartureAt: value.latestDepartureAt,
    }));
}

function isoDate(value: unknown) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : "";
}