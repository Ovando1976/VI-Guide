import {
  calculateOfficialTaxiFare,
  type OfficialTaxiFareInput,
  type OfficialTaxiFareQuote,
} from "./viOfficialTaxiTariff";
import {
  getTaxiTariffPlaces,
  TAXI_ADDITIONAL_CHARGES,
} from "./usviTaxiRateData";
import type { MobilityIsland, MobilityServiceType } from "./mobilityOs";

export type RoadConditionFlag = {
  place: string;
  severity: "standard" | "narrow" | "steep_narrow" | "restricted";
  label: string;
  note: string;
  adjustment: number;
};

export type CustomerMobilityQuote = Omit<OfficialTaxiFareQuote, "status"> & {
  status: OfficialTaxiFareQuote["status"] | "custom_estimate";
  quoteMode:
    | "official_tariff"
    | "custom_dispatch_estimate"
    | "dispatcher_review";
  isOfficialTariff: boolean;
  roadFlags: RoadConditionFlag[];
  pricingPolicyNote: string;
};

const ROAD_PROFILES: Record<
  Exclude<MobilityIsland, "water_island">,
  Array<{
    aliases: string[];
    severity: RoadConditionFlag["severity"];
    label: string;
    note: string;
    adjustment: number;
  }>
> = {
  st_thomas: [
    {
      aliases: ["Dorothea", "Dorothea Upper", "Dorothea Lower"],
      severity: "steep_narrow",
      label: "Steep / narrow road",
      note: "Dispatcher should confirm vehicle type and access before pickup.",
      adjustment: 15,
    },
    {
      aliases: ["Rosendahl", "Rosendal"],
      severity: "narrow",
      label: "Narrow residential road",
      note: "Allow extra approach time and confirm exact pickup point.",
      adjustment: 10,
    },
    {
      aliases: ["Bordeaux", "Bordeaux Mountain"],
      severity: "steep_narrow",
      label: "Mountain road",
      note: "Steep road conditions; dispatcher should confirm access.",
      adjustment: 15,
    },
    {
      aliases: ["Caret Bay", "Caret Bay Upper", "Caret Bay Lower"],
      severity: "steep_narrow",
      label: "Steep / narrow road",
      note: "Confirm road access and vehicle suitability.",
      adjustment: 15,
    },
    {
      aliases: ["Hull Bay", "Peterborg", "Mandahl", "Wintberg", "Lovenlund"],
      severity: "narrow",
      label: "Narrow road",
      note: "Dispatcher should verify pickup point and turnaround access.",
      adjustment: 10,
    },
    {
      aliases: ["Crown Mountain", "Mountain Top", "St. Peter Mountain"],
      severity: "steep_narrow",
      label: "Mountain road",
      note: "Steep approach; confirm timing and access.",
      adjustment: 15,
    },
  ],
  st_john: [
    {
      aliases: ["Bordeaux Mountain", "Chateau de Bordeaux"],
      severity: "steep_narrow",
      label: "Mountain road",
      note: "Steep St. John road; confirm access and vehicle.",
      adjustment: 15,
    },
    {
      aliases: ["Catherineberg", "Fish Bay", "Gift Hill", "Calabash Boom"],
      severity: "narrow",
      label: "Narrow residential road",
      note: "Confirm exact pickup point and turnaround.",
      adjustment: 10,
    },
    {
      aliases: ["Lameshur", "Lamishur", "Privateer Bay", "East End", "Vie’s", "Vie's"],
      severity: "restricted",
      label: "Remote / restricted road",
      note: "Remote road segment; dispatcher confirmation required.",
      adjustment: 25,
    },
  ],
  st_croix: [
    {
      aliases: ["Canaan Ridge", "Seven Hills", "Lowry Hill"],
      severity: "narrow",
      label: "Hill road",
      note: "Confirm access and pickup detail.",
      adjustment: 10,
    },
    {
      aliases: ["Mt. Washington", "Mount Washington"],
      severity: "steep_narrow",
      label: "Mountain / estate road",
      note: "Confirm vehicle and road access.",
      adjustment: 15,
    },
    {
      aliases: ["Cotton Valley", "Grapetree Bay", "Solitude"],
      severity: "narrow",
      label: "East End road",
      note: "Dispatcher should confirm timing and access.",
      adjustment: 10,
    },
    {
      aliases: ["Cane Bay", "Carambola", "Annaly"],
      severity: "narrow",
      label: "North shore road",
      note: "Allow extra travel and approach time.",
      adjustment: 10,
    },
  ],
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function endpointMatches(value: string, alias: string) {
  const a = normalize(value);
  const b = normalize(alias);
  return a === b || a.includes(b) || b.includes(a);
}

function getRoadFlags(
  island: MobilityIsland,
  pickup: string,
  dropoff: string
): RoadConditionFlag[] {
  if (island === "water_island") return [];

  const flags: RoadConditionFlag[] = [];

  for (const endpoint of [pickup, dropoff]) {
    const profile = ROAD_PROFILES[island].find((item) =>
      item.aliases.some((alias) => endpointMatches(endpoint, alias))
    );

    if (profile) {
      flags.push({
        place: endpoint,
        severity: profile.severity,
        label: profile.label,
        note: profile.note,
        adjustment: profile.adjustment,
      });
    }
  }

  return flags;
}

function isKnownTariffPlace(
  island: MobilityIsland,
  pickup: string,
  dropoff: string
) {
  const places = getTaxiTariffPlaces(island).map(normalize);
  return places.includes(normalize(pickup)) && places.includes(normalize(dropoff));
}

function customBaseForIsland(island: MobilityIsland) {
  if (island === "st_thomas") return 22;
  if (island === "st_john") return 18;
  if (island === "st_croix") return 18;
  return 0;
}

function serviceAdjustment(serviceType: MobilityServiceType) {
  const values: Record<MobilityServiceType, number> = {
    airport_transfer: 8,
    cruise_pickup: 6,
    ferry_transfer: 6,
    beach_trip: 4,
    dinner_nightlife: 6,
    private_group: 25,
    custom_ride: 8,
  };

  return values[serviceType] ?? 8;
}

function passengerAdjustment(island: MobilityIsland, passengers: number) {
  const extraPassengers = Math.max(passengers - 1, 0);
  return extraPassengers * (island === "st_john" ? 6 : 7);
}

export function calculateMobilityCustomerQuote(
  input: OfficialTaxiFareInput & { serviceType: MobilityServiceType }
): CustomerMobilityQuote {
  const official = calculateOfficialTaxiFare(input);
  const roadFlags = getRoadFlags(input.island, input.pickup, input.dropoff);

  if (official.status === "official_match") {
    return {
      ...official,
      quoteMode: "official_tariff",
      isOfficialTariff: true,
      roadFlags,
      pricingPolicyNote:
        "This is an official tariff match. Road flags are shown for dispatch awareness unless an operator confirms a separate custom-service arrangement.",
    };
  }

  if (
    input.island === "water_island" ||
    !isKnownTariffPlace(input.island, input.pickup, input.dropoff)
  ) {
    return {
      ...official,
      quoteMode: "dispatcher_review",
      isOfficialTariff: false,
      roadFlags,
      pricingPolicyNote:
        "No customer estimate is shown because this route requires dispatcher review before quoting.",
    };
  }

  const passengers = Math.max(1, Number(input.passengerCount || 1));
  const luggage = Math.max(0, Number(input.luggageCount || 0));
  const oversized = Math.max(0, Number(input.oversizedLuggageCount || 0));
  const waiting = Math.max(0, Number(input.waitingMinutes || 0));
  const charges = TAXI_ADDITIONAL_CHARGES[input.island];

  const base =
    customBaseForIsland(input.island) +
    serviceAdjustment(input.serviceType) +
    passengerAdjustment(input.island, passengers);

  const breakdown = [
    {
      label: "VI Guide custom base estimate",
      amount: base,
    },
  ];

  let total = base;

  const roadAdjustment = roadFlags.reduce((sum, flag) => sum + flag.adjustment, 0);
  if (roadAdjustment > 0) {
    breakdown.push({
      label: "Narrow / difficult road adjustment",
      amount: roadAdjustment,
    });
    total += roadAdjustment;
  }

  const luggageCharge = luggage * charges.luggagePerBag;
  if (luggageCharge > 0) {
    breakdown.push({
      label: `${luggage} luggage item${luggage === 1 ? "" : "s"} · $${charges.luggagePerBag} each`,
      amount: luggageCharge,
    });
    total += luggageCharge;
  }

  const oversizedCharge = oversized * charges.oversizedLuggageMax;
  if (oversizedCharge > 0) {
    breakdown.push({
      label: `${oversized} oversized luggage item${oversized === 1 ? "" : "s"}`,
      amount: oversizedCharge,
    });
    total += oversizedCharge;
  }

  const waitingCharge =
    Math.max(waiting - 5, 0) * charges.waitingPerMinuteAfterFirstFive;
  if (waitingCharge > 0) {
    breakdown.push({
      label: `${waiting} waiting minutes · first 5 free`,
      amount: waitingCharge,
    });
    total += waitingCharge;
  }

  const afterHoursCharge = input.afterHours
    ? passengers * charges.afterHoursPerPassenger
    : 0;

  if (afterHoursCharge > 0) {
    breakdown.push({
      label: "After-hours charge",
      amount: afterHoursCharge,
    });
    total += afterHoursCharge;
  }

  if (input.roundTrip) {
    breakdown.push({
      label: "Round trip · add second one-way custom base",
      amount: base,
    });
    total += base;
  }

  return {
    ...official,
    status: "custom_estimate",
    totalFare: Math.round(total * 100) / 100,
    baseFare: base,
    perPersonFare: null,
    breakdown,
    quoteMode: "custom_dispatch_estimate",
    isOfficialTariff: false,
    roadFlags,
    sourceLabel:
      "VI Guide custom dispatcher estimate for a non-direct official-place route",
    complianceNote:
      "This is not an official tariff fare. It is a VI Guide custom dispatcher estimate for a non-direct official-place combination. Dispatcher/operator must confirm the final fare before accepting.",
    pricingPolicyNote:
      "Custom estimate includes service type, passengers, luggage, waiting/after-hours options, and narrow/difficult road flags.",
  };
}
