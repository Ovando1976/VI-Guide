import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  MapPin,
  Ship,
  Sparkles,
  Users,
} from "lucide-react";

import { ferryRoutes } from "../data/mobility/ferryRoutes";
import { mobilityPlaces } from "../data/mobility/mobilityPlaces";
import { calculateTaxiTariffCents } from "../data/mobility/taxiTariffs";
import type {
  MobilityIslandCode,
  MobilityPlace,
} from "../types/mobility";

type MobilityProps = {
  selectedIsland?: string;
  user?: unknown;
};

type ServiceClass = "shared" | "private";

type QuoteLineItem = {
  label: string;
  amountCents: number;
  detail?: string;
};

type SegmentQuote = {
  amountCents: number;
  lineItems: QuoteLineItem[];
  notes: string[];
  usedTariff: boolean;
};

type TripQuote = {
  totalFareCents: number;
  taxiFareCents: number;
  ferryFareCents: number;
  lineItems: QuoteLineItem[];
  notes: string[];
  sourceLabel: string;
  confidence: "high" | "medium" | "low";
  isInterIsland: boolean;
  connectorLabel: string;
  routeDescription: string;
};

type LocalTripRequestDraft = {
  id: string;
  status: "draft";
  createdAt: string;
  pickupPlaceId: string;
  dropoffPlaceId: string;
  pickupName: string;
  dropoffName: string;
  pickupIsland: MobilityIslandCode;
  dropoffIsland: MobilityIslandCode;
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
  totalFareCents: number;
  taxiFareCents: number;
  ferryFareCents: number;
  connectorLabel: string;
  routeDescription: string;
  sourceLabel: string;
  confidence: TripQuote["confidence"];
  lineItems: QuoteLineItem[];
  notes: string[];
};

const ISLAND_LABELS: Record<MobilityIslandCode, string> = {
  st_thomas: "St. Thomas",
  st_john: "St. John",
  st_croix: "St. Croix",
  water_island: "Water Island",
};

const TEST_ROUTES: Array<[string, string]> = [
  ["stt-airport-cyril-e-king", "stt-red-hook-ferry-terminal"],
  ["stt-airport-cyril-e-king", "stj-trunk-bay"],
  ["stt-havensight-cruise-pier", "stt-magens-bay"],
  ["stx-airport-henry-e-rohlsen", "stx-christiansted"],
  ["stx-christiansted", "stx-frederiksted"],
  ["stj-cruz-bay-ferry-terminal", "stj-trunk-bay"],
];

function firstPlace(): MobilityPlace {
  const first = mobilityPlaces[0];

  if (!first) {
    throw new Error("mobilityPlaces is empty");
  }

  return first;
}

function placeById(id: string): MobilityPlace {
  return mobilityPlaces.find((place) => place.id === id) ?? firstPlace();
}

function defaultOriginForIsland(selectedIsland?: string) {
  if (selectedIsland === "st_john") return "stj-cruz-bay-ferry-terminal";
  if (selectedIsland === "st_croix") return "stx-airport-henry-e-rohlsen";
  if (selectedIsland === "water_island") return "wat-water-island-ferry-terminal";
  return "stt-airport-cyril-e-king";
}

function defaultDestinationForIsland(selectedIsland?: string) {
  if (selectedIsland === "st_john") return "stj-trunk-bay";
  if (selectedIsland === "st_croix") return "stx-christiansted";
  if (selectedIsland === "water_island") return "wat-honeymoon-beach";
  return "stt-red-hook-ferry-terminal";
}

function moneyFromCents(cents: number) {
  const dollars = cents / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(dollars);
}

function plural(value: number, singular: string, pluralLabel = `${singular}s`) {
  return value === 1 ? singular : pluralLabel;
}

function routeLabel(originId: string, destinationId: string) {
  return `${placeById(originId).name} → ${placeById(destinationId).name}`;
}

function samePlace(a: MobilityPlace, b: MobilityPlace) {
  return a.id === b.id;
}

function terminalPlaceById(terminalId: string) {
  return mobilityPlaces.find((place) => place.ferryTerminalId === terminalId);
}

function findBestFerryRoute(
  fromIsland: MobilityIslandCode,
  toIsland: MobilityIslandCode
) {
  const candidates = ferryRoutes
    .filter((route) => {
      const direct =
        route.fromIsland === fromIsland && route.toIsland === toIsland;
      const reverse =
        route.fromIsland === toIsland && route.toIsland === fromIsland;

      return direct || reverse;
    })
    .sort((a, b) => a.durationMinutes - b.durationMinutes);

  return candidates[0];
}

function terminalForIsland(
  route: NonNullable<ReturnType<typeof findBestFerryRoute>>,
  island: MobilityIslandCode
) {
  const terminalId =
    route.fromIsland === island ? route.fromTerminalId : route.toTerminalId;

  return terminalPlaceById(terminalId);
}

function fallbackTaxiFareCents(args: {
  from: MobilityPlace;
  to: MobilityPlace;
  passengers: number;
  luggage?: number;
  serviceClass: ServiceClass;
}) {
  const { from, to, passengers, serviceClass } = args;
  const luggage = Math.max(0, args.luggage ?? 0);
  const luggageFeeCents = luggage * 300;

  let sharedBaseCents = 1200;

  if (from.island !== to.island) {
    sharedBaseCents = 4800;
  } else if (from.type === "airport" || to.type === "airport") {
    sharedBaseCents = 2200;
  } else if (from.type === "cruise_port" || to.type === "cruise_port") {
    sharedBaseCents = 1800;
  } else if (from.taxiZoneId !== to.taxiZoneId) {
    sharedBaseCents = 1600;
  }

  if (serviceClass === "private") {
    return Math.max(3000, sharedBaseCents * 3) + luggageFeeCents;
  }

  return sharedBaseCents * Math.max(1, passengers) + luggageFeeCents;
}

function buildTaxiSegmentQuote(args: {
  from: MobilityPlace;
  to: MobilityPlace;
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
}): SegmentQuote {
  const { from, to, passengers, luggage, serviceClass } = args;

  if (samePlace(from, to)) {
    return {
      amountCents: 0,
      lineItems: [],
      notes: [`No taxi segment needed at ${from.name}.`],
      usedTariff: true,
    };
  }

  const tariff = calculateTaxiTariffCents({
    fromZoneId: from.taxiZoneId,
    toZoneId: to.taxiZoneId,
    passengers,
    luggage,
    serviceClass,
    cruiseTransfer: from.type === "cruise_port" || to.type === "cruise_port",
  });

  if (tariff) {
    const amountCents = tariff.totalFareCents;

    const detailParts = [
      `${moneyFromCents(tariff.baseFareCents)} base zone fare`,
      tariff.passengerFeeCents > 0
        ? `${moneyFromCents(tariff.passengerFeeCents)} passenger fee`
        : "",
      tariff.luggageFeeCents > 0
        ? `${moneyFromCents(tariff.luggageFeeCents)} luggage fee`
        : "",
    ].filter(Boolean);

    return {
      amountCents,
      lineItems: [
        {
          label:
            serviceClass === "private"
              ? `Private taxi: ${from.name} → ${to.name}`
              : `Shared taxi: ${from.name} → ${to.name}`,
          amountCents,
          detail: detailParts.join(" + "),
        },
      ],
      notes: tariff.notes,
      usedTariff: true,
    };
  }

  const fallbackCents = fallbackTaxiFareCents({
    from,
    to,
    passengers,
    luggage,
    serviceClass,
  });

  return {
    amountCents: fallbackCents,
    lineItems: [
      {
        label: `Planning taxi estimate: ${from.name} → ${to.name}`,
        amountCents: fallbackCents,
        detail: "No exact official tariff pair found yet for these taxi zones.",
      },
    ],
    notes: [
      `Missing official tariff pair for ${from.taxiZoneId ?? "unknown"} ↔ ${
        to.taxiZoneId ?? "unknown"
      }.`,
      "This segment uses the safe fallback estimate until the tariff matrix is expanded.",
    ],
    usedTariff: false,
  };
}

function buildTripQuote(args: {
  origin: MobilityPlace;
  destination: MobilityPlace;
  passengers: number;
  luggage: number;
  serviceClass: ServiceClass;
}): TripQuote {
  const { origin, destination, passengers, luggage, serviceClass } = args;
  const notes: string[] = [];
  const lineItems: QuoteLineItem[] = [];
  let taxiFareCents = 0;
  let ferryFareCents = 0;
  let usedFallback = false;

  if (luggage > 0) {
    notes.push(
      `${luggage} ${plural(
        luggage,
        "bag"
      )} captured. Baggage surcharges are not added until baggage tariff rules are modeled.`
    );
  }

  if (origin.island === destination.island) {
    const taxi = buildTaxiSegmentQuote({
      from: origin,
      to: destination,
      passengers,
      luggage,
      serviceClass,
    });

    taxiFareCents += taxi.amountCents;
    lineItems.push(...taxi.lineItems);
    notes.push(...taxi.notes);
    usedFallback = usedFallback || !taxi.usedTariff;

    return {
      totalFareCents: taxiFareCents,
      taxiFareCents,
      ferryFareCents,
      lineItems,
      notes,
      sourceLabel: usedFallback
        ? "Tariff fallback estimate"
        : "Taxi tariff table",
      confidence: usedFallback ? "medium" : "high",
      isInterIsland: false,
      connectorLabel: "Local",
      routeDescription: `${origin.name} → ${destination.name}`,
    };
  }

  const ferryRoute = findBestFerryRoute(origin.island, destination.island);

  if (!ferryRoute) {
    const fallback = fallbackTaxiFareCents({
      from: origin,
      to: destination,
      passengers,
      luggage,
      serviceClass,
    });

    lineItems.push({
      label: `Inter-island planning estimate: ${origin.name} → ${destination.name}`,
      amountCents: fallback,
      detail: "No ferry connector exists yet for this island pair.",
    });

    return {
      totalFareCents: fallback,
      taxiFareCents: fallback,
      ferryFareCents: 0,
      lineItems,
      notes: [
        ...notes,
        `No ferry route found for ${ISLAND_LABELS[origin.island]} ↔ ${
          ISLAND_LABELS[destination.island]
        }.`,
      ],
      sourceLabel: "Fallback estimate",
      confidence: "low",
      isInterIsland: true,
      connectorLabel: "Missing ferry",
      routeDescription: `${origin.name} → ${destination.name}`,
    };
  }

  const fromTerminal = terminalForIsland(ferryRoute, origin.island);
  const toTerminal = terminalForIsland(ferryRoute, destination.island);

  if (!fromTerminal || !toTerminal) {
    const fallback = fallbackTaxiFareCents({
      from: origin,
      to: destination,
      passengers,
      luggage,
      serviceClass,
    });

    lineItems.push({
      label: `Inter-island planning estimate: ${origin.name} → ${destination.name}`,
      amountCents: fallback,
      detail: "Ferry route exists, but a terminal place is missing.",
    });

    return {
      totalFareCents: fallback,
      taxiFareCents: fallback,
      ferryFareCents: 0,
      lineItems,
      notes: [
        ...notes,
        `Missing terminal place for ferry route ${ferryRoute.name}.`,
      ],
      sourceLabel: "Fallback estimate",
      confidence: "low",
      isInterIsland: true,
      connectorLabel: "Terminal missing",
      routeDescription: `${origin.name} → ${destination.name}`,
    };
  }

  const pickupTaxi = buildTaxiSegmentQuote({
    from: origin,
    to: fromTerminal,
    passengers,
    luggage,
    serviceClass,
  });

  taxiFareCents += pickupTaxi.amountCents;
  lineItems.push(...pickupTaxi.lineItems);
  notes.push(...pickupTaxi.notes);
  usedFallback = usedFallback || !pickupTaxi.usedTariff;

  const ferryCents = ferryRoute.passengerFareCents * Math.max(1, passengers);
  ferryFareCents += ferryCents;
  lineItems.push({
    label: ferryRoute.name,
    amountCents: ferryCents,
    detail: `${moneyFromCents(ferryRoute.passengerFareCents)} × ${passengers} ${plural(
      passengers,
      "passenger"
    )}.`,
  });
  notes.push(...(ferryRoute.notes ?? []));

  const dropoffTaxi = buildTaxiSegmentQuote({
    from: toTerminal,
    to: destination,
    passengers,
    luggage,
    serviceClass,
  });

  taxiFareCents += dropoffTaxi.amountCents;
  lineItems.push(...dropoffTaxi.lineItems);
  notes.push(...dropoffTaxi.notes);
  usedFallback = usedFallback || !dropoffTaxi.usedTariff;

  const totalFareCents = taxiFareCents + ferryFareCents;

  return {
    totalFareCents,
    taxiFareCents,
    ferryFareCents,
    lineItems,
    notes,
    sourceLabel: usedFallback
      ? "Taxi tariffs + ferry estimate"
      : "Taxi tariffs + ferry estimate",
    confidence: usedFallback ? "medium" : "high",
    isInterIsland: true,
    connectorLabel: "Ferry",
    routeDescription: `${origin.name} → ${fromTerminal.name} → ${toTerminal.name} → ${destination.name}`,
  };
}

export default function Mobility({ selectedIsland }: MobilityProps) {
  const [originId, setOriginId] = useState(() =>
    defaultOriginForIsland(selectedIsland)
  );
  const [destinationId, setDestinationId] = useState(() =>
    defaultDestinationForIsland(selectedIsland)
  );
  const [passengers, setPassengers] = useState(2);
  const [luggage, setLuggage] = useState(1);
  const [serviceClass, setServiceClass] = useState<ServiceClass>("shared");
  const [tripDraft, setTripDraft] =
    useState<LocalTripRequestDraft | null>(null);

  const origin = placeById(originId);
  const destination = placeById(destinationId);

  const quote = useMemo(() => {
    return buildTripQuote({
      origin,
      destination,
      passengers,
      luggage,
      serviceClass,
    });
  }, [origin, destination, passengers, luggage, serviceClass]);

  useEffect(() => {
    setTripDraft(null);
  }, [originId, destinationId, passengers, luggage, serviceClass]);

  function createLocalTripDraft() {
    const createdAt = new Date().toISOString();

    setTripDraft({
      id: `mobility-draft-${Date.now().toString(36)}`,
      status: "draft",
      createdAt,
      pickupPlaceId: origin.id,
      dropoffPlaceId: destination.id,
      pickupName: origin.name,
      dropoffName: destination.name,
      pickupIsland: origin.island,
      dropoffIsland: destination.island,
      passengers,
      luggage,
      serviceClass,
      totalFareCents: quote.totalFareCents,
      taxiFareCents: quote.taxiFareCents,
      ferryFareCents: quote.ferryFareCents,
      connectorLabel: quote.connectorLabel,
      routeDescription: quote.routeDescription,
      sourceLabel: quote.sourceLabel,
      confidence: quote.confidence,
      lineItems: quote.lineItems,
      notes: quote.notes,
    });
  }

  return (
    <main className="min-h-screen bg-[#f7edcf] px-4 py-8 text-slate-950 sm:px-6 lg:px-10">
      <section className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] border border-amber-100 bg-white shadow-2xl shadow-amber-950/10">
        <div className="bg-[#020617] px-6 py-10 text-white sm:px-10 lg:px-12">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-black uppercase tracking-[0.35em] text-slate-950">
              USVI Mobility
            </span>
            <span className="rounded-full border border-white/15 px-3 py-1 text-xs font-bold text-white/70">
              Real tariff layer
            </span>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
            <div>
              <h1 className="max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                Transportation system restored.
              </h1>
              <p className="mt-5 max-w-3xl text-base font-medium leading-8 text-slate-300 sm:text-lg">
                This layer uses your real mobility places, taxi tariff pairs,
                and ferry connector data while keeping Firebase and map
                dispatch disabled.
              </p>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-300 text-slate-950">
                  <Sparkles className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-amber-200">
                    Live quote preview
                  </p>
                  <p className="text-3xl font-black">
                    {moneyFromCents(quote.totalFareCents)}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Source: {quote.sourceLabel}. Confidence: {quote.confidence}.
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr]">
          <section className="border-b border-slate-200 bg-[#fff9e8] p-6 sm:p-8 lg:border-b-0 lg:border-r lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-200">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">
                  Plan a trip
                </p>
                <h2 className="text-2xl font-black">Where are you going?</h2>
              </div>
            </div>

            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Pickup
                </span>
                <select
                  value={originId}
                  onChange={(event) => setOriginId(event.target.value)}
                  className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                >
                  {mobilityPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name} — {ISLAND_LABELS[place.island]}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Dropoff
                </span>
                <select
                  value={destinationId}
                  onChange={(event) => setDestinationId(event.target.value)}
                  className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                >
                  {mobilityPlaces.map((place) => (
                    <option key={place.id} value={place.id}>
                      {place.name} — {ISLAND_LABELS[place.island]}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Passengers
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    value={passengers}
                    onChange={(event) =>
                      setPassengers(Math.max(1, Number(event.target.value) || 1))
                    }
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">
                    Bags
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={20}
                    value={luggage}
                    onChange={(event) =>
                      setLuggage(Math.max(0, Number(event.target.value) || 0))
                    }
                    className="w-full rounded-2xl border border-amber-200 bg-white px-4 py-4 text-base font-bold shadow-sm outline-none focus:border-amber-500"
                  />
                </label>
              </div>

              <div>
                <span className="mb-2 block text-sm font-black text-slate-700">
                  Service
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setServiceClass("shared")}
                    className={`rounded-2xl border px-4 py-4 text-left font-black transition ${
                      serviceClass === "shared"
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-amber-200 bg-white text-slate-900"
                    }`}
                  >
                    Shared taxi
                    <span className="mt-1 block text-sm font-semibold opacity-70">
                      Per passenger tariff
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceClass("private")}
                    className={`rounded-2xl border px-4 py-4 text-left font-black transition ${
                      serviceClass === "private"
                        ? "border-slate-950 bg-slate-950 text-white"
                        : "border-amber-200 bg-white text-slate-900"
                    }`}
                  >
                    Private transfer
                    <span className="mt-1 block text-sm font-semibold opacity-70">
                      Vehicle tariff where available
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 sm:p-8 lg:p-10">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-white">
                <Car className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">
                  Route preview
                </p>
                <h2 className="text-2xl font-black">Compare route</h2>
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Pickup
                  </p>
                  <p className="mt-2 text-lg font-black">{origin.name}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {ISLAND_LABELS[origin.island]} · {origin.taxiZoneId ?? origin.type}
                  </p>
                </div>

                <div className="hidden h-11 w-11 place-items-center rounded-full bg-amber-200 sm:grid">
                  <ArrowRight className="h-5 w-5" />
                </div>

                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                    Dropoff
                  </p>
                  <p className="mt-2 text-lg font-black">{destination.name}</p>
                  <p className="text-sm font-semibold text-slate-500">
                    {ISLAND_LABELS[destination.island]} ·{" "}
                    {destination.taxiZoneId ?? destination.type}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Users className="mb-3 h-5 w-5 text-amber-700" />
                  <p className="text-sm font-bold text-slate-500">Passengers</p>
                  <p className="text-xl font-black">{passengers}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <Ship className="mb-3 h-5 w-5 text-amber-700" />
                  <p className="text-sm font-bold text-slate-500">Connector</p>
                  <p className="text-xl font-black">{quote.connectorLabel}</p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <CheckCircle2 className="mb-3 h-5 w-5 text-amber-700" />
                  <p className="text-sm font-bold text-slate-500">Estimate</p>
                  <p className="text-xl font-black">
                    {moneyFromCents(quote.totalFareCents)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Fare breakdown
                </p>

                <div className="mt-3 space-y-3">
                  {quote.lineItems.length ? (
                    quote.lineItems.map((item, index) => (
                      <div
                        key={`${item.label}-${index}`}
                        className="flex gap-4 rounded-xl bg-slate-50 p-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-black text-slate-950">
                            {item.label}
                          </p>
                          {item.detail ? (
                            <p className="mt-1 text-sm font-semibold leading-5 text-slate-500">
                              {item.detail}
                            </p>
                          ) : null}
                        </div>
                        <p className="shrink-0 font-black">
                          {moneyFromCents(item.amountCents)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm font-semibold text-slate-500">
                      No paid segment needed for this selection.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-800">
                  Dispatch status
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Trip request saving is still disabled. This layer only proves
                  the real fare data can drive the planner safely.
                </p>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">
                  Route logic
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  {quote.routeDescription}
                </p>

                {quote.notes.length ? (
                  <ul className="mt-3 space-y-2">
                    {quote.notes.slice(0, 5).map((note, index) => (
                      <li
                        key={`${note}-${index}`}
                        className="text-sm font-semibold leading-5 text-slate-500"
                      >
                        • {note}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            <button
              type="button"
              onClick={createLocalTripDraft}
              className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 text-base font-black text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              Create local request draft
            </button>

            {tripDraft ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-[#fff9e8] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-amber-800">
                      Draft ready
                    </p>
                    <p className="mt-2 text-lg font-black text-slate-950">
                      {tripDraft.pickupName} → {tripDraft.dropoffName}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-600">
                      Draft ID: {tripDraft.id}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-500">
                      Total
                    </p>
                    <p className="text-xl font-black">
                      {moneyFromCents(tripDraft.totalFareCents)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Status
                    </p>
                    <p className="mt-1 font-black capitalize">
                      {tripDraft.status}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Service
                    </p>
                    <p className="mt-1 font-black capitalize">
                      {tripDraft.serviceClass}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white p-3">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                      Connector
                    </p>
                    <p className="mt-1 font-black">
                      {tripDraft.connectorLabel}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-sm font-semibold leading-6 text-slate-700">
                  This is local-only. The next layer will send this same draft
                  shape to Firebase dispatch.
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <section className="border-t border-slate-200 bg-[#fff7df] p-6 sm:p-8 lg:p-10">
          <div className="mb-5">
            <p className="text-xs font-black uppercase tracking-[0.3em] text-amber-800">
              Test routes
            </p>
            <h2 className="text-2xl font-black">Tap a route to test tariffs</h2>
          </div>

          <div className="grid gap-3 lg:grid-cols-2">
            {TEST_ROUTES.map(([fromId, toId]) => (
              <button
                key={`${fromId}-${toId}`}
                type="button"
                onClick={() => {
                  setOriginId(fromId);
                  setDestinationId(toId);
                }}
                className="rounded-2xl border border-amber-200 bg-white px-5 py-4 text-left text-sm font-black shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md"
              >
                {routeLabel(fromId, toId)}
              </button>
            ))}
          </div>
        </section>
      </section>
    </main>
  );
}
