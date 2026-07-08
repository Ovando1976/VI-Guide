import type { MobilityIsland } from "./mobilityOs";
import {
  getTaxiFareRules,
  TAXI_ADDITIONAL_CHARGES,
  TAXI_TARIFF_SOURCES,
  type TaxiFareRule,
} from "./usviTaxiRateData";

export type OfficialTaxiFareInput = {
  island: MobilityIsland;
  pickup: string;
  dropoff: string;
  passengerCount: number;
  luggageCount: number;
  oversizedLuggageCount?: number;
  exclusiveRide?: boolean;
  afterHours?: boolean;
  radioCall?: boolean;
  roundTrip?: boolean;
  waitingMinutes?: number;
  kennelLargeCount?: number;
  kennelSmallCount?: number;
};

export type OfficialTaxiFareStatus =
  | "official_match"
  | "dispatcher_review_required"
  | "unsupported_island";

export type OfficialTaxiFareBreakdown = {
  label: string;
  amount: number;
};

export type OfficialTaxiFareQuote = {
  status: OfficialTaxiFareStatus;
  totalFare: number | null;
  perPersonFare: number | null;
  baseFare: number | null;
  routeName: string;
  sourceLabel: string;
  complianceNote: string;
  breakdown: OfficialTaxiFareBreakdown[];
  matchedRuleId?: string;
  matchedSourceTable?: string;
};

const RULES = getTaxiFareRules();

const ISLAND_ALIASES: Partial<Record<MobilityIsland, Record<string, string[]>>> = {
  st_thomas: {
    "cyril e king airport": [
      "airport",
      "airport terminal",
      "stt airport",
      "cyril e king",
      "cyril e. king airport",
    ],
    "charlotte amalie": [
      "town",
      "downtown",
      "within town",
      "within town limits",
      "charlotte amalie town",
    ],
    "red hook": ["red hook ferry terminal", "red hook dock"],
    "magens bay": ["magens bay beach"],
    "havensight wico": [
      "havensight",
      "havensight cruise port",
      "wico",
      "west indian dock",
      "yacht haven",
      "yacht haven havensight",
    ],
    "havensight crossroad": ["havensight", "havensight cruise port"],
    "west indian dock": ["havensight", "havensight cruise port", "wico"],
    "crown bay": ["crown bay cruise port", "crown bay dock"],
    "coki point": ["coki", "coral world", "coral world ocean park"],
    "sapphire beach": ["sapphire", "sapphire beach resort"],
    "frenchmans reef": [
      "frenchman's reef",
      "frenchman’s reef",
      "frenchman’s reef & cove",
      "frenchmans reef and cove",
    ],
    "ritz carlton": ["ritz carlton resort", "ritz carlton resort & club"],
  },
  st_john: {
    "cruz bay": ["cruz bay ferry dock", "ferry dock", "st john ferry"],
    "gallows point": ["gallows"],
    "caneel bay": ["caneel"],
    "westin resort": ["westin", "westin st john"],
    "trunk bay": ["trunk bay beach"],
    "maho bay beach": ["maho bay", "goat path", "goat path maho bay beach"],
    "coral bay": ["coral bay harbor"],
    "cinnamon bay": ["cinnamon bay beach"],
  },
  st_croix: {
    airport: [
      "henry e rohlsen airport",
      "henry e. rohlsen airport",
      "stx airport",
      "rohlsen airport",
    ],
    christiansted: ["christiansted town", "downtown christiansted"],
    frederiksted: [
      "frederiksted cruise pier",
      "frederiksted pier",
      "frederiksted town",
      "cruise pier",
    ],
    carambola: ["carambola beach resort", "carambola resort"],
    "lime tree bay": ["limetree", "limetree bay"],
    "sunny isle": ["sunny isle shopping center", "sunny isle island center"],
  },
};

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function expandAliases(island: MobilityIsland, value: string) {
  const normalized = normalize(value);
  const aliases = ISLAND_ALIASES[island] || {};
  const results = new Set<string>([normalized]);

  for (const [canonical, aliasList] of Object.entries(aliases)) {
    const canonicalNorm = normalize(canonical);

    if (normalized === canonicalNorm || aliasList.map(normalize).includes(normalized)) {
      results.add(canonicalNorm);
      aliasList.forEach((alias) => results.add(normalize(alias)));
    }

    if (
      normalized.includes(canonicalNorm) ||
      aliasList.some((alias) => normalized.includes(normalize(alias)))
    ) {
      results.add(canonicalNorm);
      aliasList.forEach((alias) => results.add(normalize(alias)));
    }
  }

  return Array.from(results).filter(Boolean);
}

function endpointMatches(island: MobilityIsland, input: string, tariffName: string) {
  const inputNames = expandAliases(island, input);
  const tariffNames = expandAliases(island, tariffName);

  return inputNames.some((inputName) =>
    tariffNames.some(
      (tariff) =>
        inputName === tariff ||
        inputName.includes(tariff) ||
        tariff.includes(inputName)
    )
  );
}

function findRule(input: OfficialTaxiFareInput) {
  return RULES.find((rule) => {
    if (rule.island !== input.island) return false;

    const forward =
      endpointMatches(rule.island, input.pickup, rule.from) &&
      endpointMatches(rule.island, input.dropoff, rule.to);

    const reverse =
      endpointMatches(rule.island, input.pickup, rule.to) &&
      endpointMatches(rule.island, input.dropoff, rule.from);

    return forward || reverse;
  });
}

function stThomasExclusiveFare(rule: TaxiFareRule, passengers: number) {
  const airportRedHook =
    (endpointMatches("st_thomas", rule.from, "Cyril E. King Airport") &&
      endpointMatches("st_thomas", rule.to, "Red Hook")) ||
    (endpointMatches("st_thomas", rule.to, "Cyril E. King Airport") &&
      endpointMatches("st_thomas", rule.from, "Red Hook"));

  const withinTown =
    endpointMatches("st_thomas", rule.from, "Within Town Limits") ||
    endpointMatches("st_thomas", rule.to, "Within Town Limits") ||
    (endpointMatches("st_thomas", rule.from, "Charlotte Amalie") &&
      endpointMatches("st_thomas", rule.to, "Charlotte Amalie"));

  if (airportRedHook) {
    return 135 + Math.max(passengers - 4, 0) * 23;
  }

  if (withinTown) {
    return 83 + Math.max(passengers - 4, 0) * 11;
  }

  return null;
}

function baseFareForRule(
  rule: TaxiFareRule,
  passengerCount: number,
  exclusiveRide: boolean
) {
  const breakdown: OfficialTaxiFareBreakdown[] = [];
  let baseFare = 0;
  let perPersonFare: number | null = null;

  if (exclusiveRide) {
    if (rule.island === "st_thomas") {
      const exclusiveFare = stThomasExclusiveFare(rule, passengerCount);
      if (exclusiveFare === null) return null;

      breakdown.push({
        label: "Exclusive taxi published fare",
        amount: exclusiveFare,
      });

      return {
        baseFare: exclusiveFare,
        perPersonFare: null,
        breakdown,
      };
    }

    if (rule.island === "st_john") {
      return null;
    }

    if (rule.island === "st_croix") {
      const exclusivePassengerCount = Math.max(4, passengerCount);

      if (rule.pricingModel === "stx_one_or_two_then_three_plus_each") {
        const amount =
          exclusivePassengerCount <= 2
            ? Number(rule.oneOrTwoPeopleFare || 0)
            : Number(rule.threePlusEachFare || 0) * exclusivePassengerCount;

        breakdown.push({
          label: `Exclusive taxi · charged at ${exclusivePassengerCount} passenger rate`,
          amount,
        });

        return {
          baseFare: amount,
          perPersonFare: rule.threePlusEachFare || null,
          breakdown,
        };
      }
    }
  }

  if (rule.pricingModel === "per_person_same_group") {
    perPersonFare =
      passengerCount >= 2
        ? Number(rule.sameGroupTwoPlusPerPerson || 0)
        : Number(rule.onePassengerFare || 0);

    baseFare = perPersonFare * passengerCount;

    breakdown.push({
      label:
        passengerCount >= 2
          ? `${passengerCount} passengers · same group per-person tariff`
          : "1 passenger tariff",
      amount: baseFare,
    });

    return { baseFare, perPersonFare, breakdown };
  }

  const oneOrTwoFare = Number(rule.oneOrTwoPeopleFare || 0);
  const threePlusFare = Number(rule.threePlusEachFare || 0);

  if (passengerCount <= 2) {
    baseFare = oneOrTwoFare;
    breakdown.push({
      label: `${passengerCount} passenger${passengerCount === 1 ? "" : "s"} · 1 or 2 people tariff`,
      amount: baseFare,
    });
  } else {
    perPersonFare = threePlusFare;
    baseFare = threePlusFare * passengerCount;
    breakdown.push({
      label: `${passengerCount} passengers · 3+ each tariff`,
      amount: baseFare,
    });
  }

  return { baseFare, perPersonFare, breakdown };
}

export function calculateOfficialTaxiFare(
  input: OfficialTaxiFareInput
): OfficialTaxiFareQuote {
  const passengerCount = Math.max(1, Number(input.passengerCount || 1));
  const luggageCount = Math.max(0, Number(input.luggageCount || 0));
  const oversizedLuggageCount = Math.max(0, Number(input.oversizedLuggageCount || 0));
  const waitingMinutes = Math.max(0, Number(input.waitingMinutes || 0));
  const kennelLargeCount = Math.max(0, Number(input.kennelLargeCount || 0));
  const kennelSmallCount = Math.max(0, Number(input.kennelSmallCount || 0));

  if (input.island === "water_island") {
    return {
      status: "unsupported_island",
      totalFare: null,
      perPersonFare: null,
      baseFare: null,
      routeName: `${input.pickup} → ${input.dropoff}`,
      sourceLabel: "Dispatcher review required",
      complianceNote:
        "Water Island taxi tariff data is not loaded. Dispatcher must verify the applicable posted tariff before quoting.",
      breakdown: [],
    };
  }

  const rule = findRule(input);
  const sourceLabel = TAXI_TARIFF_SOURCES[input.island];

  if (!rule) {
    return {
      status: "dispatcher_review_required",
      totalFare: null,
      perPersonFare: null,
      baseFare: null,
      routeName: `${input.pickup} → ${input.dropoff}`,
      sourceLabel,
      complianceNote:
        "Unlisted destination. Use the nearest tariffed place crossed to the next tariffed place ahead, then dispatcher must verify before confirming.",
      breakdown: [],
    };
  }

  const base = baseFareForRule(rule, passengerCount, Boolean(input.exclusiveRide));

  if (!base) {
    return {
      status: "dispatcher_review_required",
      totalFare: null,
      perPersonFare: null,
      baseFare: null,
      routeName: `${rule.from} → ${rule.to}`,
      sourceLabel,
      complianceNote:
        input.exclusiveRide
          ? "Exclusive taxi requested. This route requires dispatcher/operator confirmation under the loaded exclusive taxi rule."
          : "Dispatcher review required before confirming this fare.",
      breakdown: [],
      matchedRuleId: rule.id,
      matchedSourceTable: rule.sourceTable,
    };
  }

  const charges = TAXI_ADDITIONAL_CHARGES[input.island];
  const breakdown = [...base.breakdown];

  let totalFare = base.baseFare;

  if (input.roundTrip) {
    breakdown.push({
      label: "Round trip · add second one-way fare",
      amount: base.baseFare,
    });
    totalFare += base.baseFare;
  }

  const luggageCharge = luggageCount * charges.luggagePerBag;
  if (luggageCharge > 0) {
    breakdown.push({
      label: `${luggageCount} luggage item${luggageCount === 1 ? "" : "s"} · $${charges.luggagePerBag} each`,
      amount: luggageCharge,
    });
    totalFare += luggageCharge;
  }

  const oversizedCharge = oversizedLuggageCount * charges.oversizedLuggageMax;
  if (oversizedCharge > 0) {
    breakdown.push({
      label: `${oversizedLuggageCount} oversized item${oversizedLuggageCount === 1 ? "" : "s"} · up to $${charges.oversizedLuggageMax} each`,
      amount: oversizedCharge,
    });
    totalFare += oversizedCharge;
  }

  const afterHoursCharge = input.afterHours
    ? passengerCount * charges.afterHoursPerPassenger
    : 0;
  if (afterHoursCharge > 0) {
    breakdown.push({
      label: "After-hours / odd-hours charge · midnight to 6:00 AM",
      amount: afterHoursCharge,
    });
    totalFare += afterHoursCharge;
  }

  const waitingCharge =
    Math.max(waitingMinutes - 5, 0) * charges.waitingPerMinuteAfterFirstFive;
  if (waitingCharge > 0) {
    breakdown.push({
      label: `${waitingMinutes} waiting minutes · first 5 free`,
      amount: waitingCharge,
    });
    totalFare += waitingCharge;
  }

  const radioCallCharge = input.radioCall
    ? passengerCount === 1
      ? Math.round((base.baseFare / 3) * 100) / 100
      : passengerCount * charges.radioCallMoreThanOnePerPassenger
    : 0;

  if (radioCallCharge > 0) {
    breakdown.push({
      label:
        passengerCount === 1
          ? "Radio/phone call · add one third of basic fare"
          : `Radio/phone call · $${charges.radioCallMoreThanOnePerPassenger} per passenger`,
      amount: radioCallCharge,
    });
    totalFare += radioCallCharge;
  }

  const kennelLargeCharge = kennelLargeCount * charges.kennelLarge;
  if (kennelLargeCharge > 0) {
    breakdown.push({
      label: `${kennelLargeCount} large kennel${kennelLargeCount === 1 ? "" : "s"}`,
      amount: kennelLargeCharge,
    });
    totalFare += kennelLargeCharge;
  }

  const kennelSmallCharge = kennelSmallCount * charges.kennelSmall;
  if (kennelSmallCharge > 0) {
    breakdown.push({
      label: `${kennelSmallCount} small kennel${kennelSmallCount === 1 ? "" : "s"}`,
      amount: kennelSmallCharge,
    });
    totalFare += kennelSmallCharge;
  }

  return {
    status: "official_match",
    totalFare: Math.round(totalFare * 100) / 100,
    perPersonFare: base.perPersonFare,
    baseFare: Math.round(base.baseFare * 100) / 100,
    routeName: `${rule.from} → ${rule.to}`,
    sourceLabel,
    complianceNote:
      "Official published tariff match. Driver/dispatcher should confirm final total before boarding, including luggage, waiting, after-hours, radio/phone call, kennel, round-trip, and exclusive taxi terms.",
    breakdown,
    matchedRuleId: rule.id,
    matchedSourceTable: rule.sourceTable,
  };
}
