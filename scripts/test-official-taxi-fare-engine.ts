import {
  calculateOfficialTaxiRuleFare,
  findOfficialTaxiRateRule,
  OfficialTaxiRateUnavailableError,
  resolveOfficialTaxiFareEndpoint,
  type OfficialTaxiFareEndpoint,
} from "../lib/official-taxi-fare-engine";
import type { OfficialTaxiRateRule } from "../types/taxi-operations";

function endpoint(baseName: string): OfficialTaxiFareEndpoint {
  return { geoid: `test:${baseName.toLowerCase().replace(/\W+/g, "-")}`, baseName };
}

function expectEqual(actual: unknown, expected: unknown, label: string) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function expectThrows(fn: () => unknown, includes: string, label: string) {
  try {
    fn();
  } catch (error) {
    if (
      error instanceof OfficialTaxiRateUnavailableError &&
      error.message.includes(includes)
    ) {
      return;
    }
    throw error;
  }
  throw new Error(`${label}: expected OfficialTaxiRateUnavailableError`);
}

function total(rule: OfficialTaxiRateRule, passengers: number, luggage = 0) {
  const fare = calculateOfficialTaxiRuleFare(rule, passengers, luggage);
  return fare.routeFare + fare.passengerFare + fare.luggageFare;
}

// Representative rows from the reviewed 2026-08-19 production tariff audit export.
const sttCharlotteAmalieAnchorage: OfficialTaxiRateRule = {
  id: "stt-charlotte-amalie-anchorage",
  originNames: ["Charlotte Amalie"],
  destinationNames: ["Anchorage"],
  onePassengerFare: 23,
  perPersonFare: 15,
};

const stjCruzBayAnnaberg: OfficialTaxiRateRule = {
  id: "stj-cruz-bay-annaberg",
  originNames: ["Cruz Bay"],
  destinationNames: ["Annaberg"],
  onePassengerFare: 20,
  perPersonFare: 14,
};

const stxAirportAnnaly: OfficialTaxiRateRule = {
  id: "stx-henry-e-rohlsen-airport-annaly",
  originNames: ["Henry E. Rohlsen Airport"],
  destinationNames: ["Annaly"],
  onePassengerFare: 30,
  perPersonFare: 15,
};

const matrix = [
  {
    label: "STT Charlotte Amalie → Anchorage",
    rule: sttCharlotteAmalieAnchorage,
    origin: endpoint("Charlotte Amalie"),
    destination: endpoint("Anchorage"),
    expected: [23, 30, 45],
  },
  {
    label: "STJ Cruz Bay → Annaberg",
    rule: stjCruzBayAnnaberg,
    origin: endpoint("Cruz Bay"),
    destination: endpoint("Annaberg"),
    expected: [20, 28, 42],
  },
  {
    label: "STX Henry E. Rohlsen Airport → Annaly",
    rule: stxAirportAnnaly,
    origin: endpoint("Henry E. Rohlsen Airport"),
    destination: endpoint("Annaly"),
    expected: [30, 30, 45],
  },
] as const;

for (const test of matrix) {
  const rules = [test.rule];
  expectEqual(
    findOfficialTaxiRateRule(rules, test.origin, test.destination)?.id,
    test.rule.id,
    `${test.label} direct route selection`,
  );
  expectEqual(
    findOfficialTaxiRateRule(rules, test.destination, test.origin)?.id,
    test.rule.id,
    `${test.label} reverse route selection`,
  );
  expectEqual(total(test.rule, 1), test.expected[0], `${test.label} 1 passenger`);
  expectEqual(total(test.rule, 2), test.expected[1], `${test.label} 2 passengers`);
  expectEqual(total(test.rule, 3), test.expected[2], `${test.label} 3 passengers`);
}

for (const cruzBayUiName of ["Cruz Bay Town", "Town of Cruz Bay"]) {
  expectEqual(
    findOfficialTaxiRateRule(
      [stjCruzBayAnnaberg],
      endpoint("Annaberg"),
      endpoint(cruzBayUiName),
    )?.id,
    stjCruzBayAnnaberg.id,
    `STJ Annaberg → ${cruzBayUiName} resolves to published Cruz Bay endpoint`,
  );
  expectEqual(
    findOfficialTaxiRateRule(
      [stjCruzBayAnnaberg],
      endpoint(cruzBayUiName),
      endpoint("Annaberg"),
    )?.id,
    stjCruzBayAnnaberg.id,
    `STJ ${cruzBayUiName} → Annaberg resolves in reverse direction`,
  );
}

const charlotteAmaliePoi = resolveOfficialTaxiFareEndpoint(
  [sttCharlotteAmalieAnchorage],
  {
    geoid: "poi:stt:hotel",
    baseName: "Example Hotel",
    parentEstateName: "Charlotte Amalie",
  },
);
expectEqual(
  charlotteAmaliePoi.tariffEndpointName,
  "Charlotte Amalie",
  "a place inherits a unique published parent-estate tariff endpoint",
);
expectEqual(
  findOfficialTaxiRateRule(
    [sttCharlotteAmalieAnchorage],
    charlotteAmaliePoi,
    endpoint("Anchorage"),
  )?.id,
  sttCharlotteAmalieAnchorage.id,
  "a uniquely resolved parent place can use the governed published route",
);

const explicitSpecialDestination = resolveOfficialTaxiFareEndpoint(
  [
    {
      id: "stt-smith-bay-town",
      originNames: ["Smith Bay"],
      destinationNames: ["Charlotte Amalie"],
      onePassengerFare: 20,
    },
  ],
  {
    geoid: "mobility:stt:red-hook",
    baseName: "Red Hook Ferry Terminal",
    tariffEndpointName: "Red Hook",
    parentEstateName: "Smith Bay",
  },
);
expectEqual(
  explicitSpecialDestination.tariffEndpointName,
  "Red Hook",
  "an explicit reviewed special-destination endpoint overrides its parent estate",
);

const ambiguousParentRules: OfficialTaxiRateRule[] = [
  {
    id: "stt-smith-bay-a",
    originNames: ["Smith Bay"],
    originEstateGeoids: ["7803072500"],
    destinationNames: ["Charlotte Amalie"],
    onePassengerFare: 20,
  },
  {
    id: "stt-red-hook-a",
    originNames: ["Red Hook"],
    originEstateGeoids: ["7803072500"],
    destinationNames: ["Charlotte Amalie"],
    onePassengerFare: 18,
  },
];
const ambiguousParentPlace = resolveOfficialTaxiFareEndpoint(
  ambiguousParentRules,
  {
    geoid: "poi:stt:smith-bay-example",
    baseName: "Example Smith Bay POI",
    parentEstateGeoid: "7803072500",
  },
);
expectEqual(
  ambiguousParentPlace.tariffEndpointName,
  undefined,
  "ambiguous parent-estate tariff identities remain unresolved and fail closed",
);

expectEqual(
  findOfficialTaxiRateRule(
    [stjCruzBayAnnaberg],
    endpoint("Cruz Bay"),
    endpoint("Unknown Destination"),
  ),
  null,
  "unknown endpoint fails route selection closed",
);

expectThrows(
  () => calculateOfficialTaxiRuleFare(stjCruzBayAnnaberg, 2, 1),
  "official luggage charge",
  "unconfigured luggage charge fails closed",
);

expectThrows(
  () =>
    calculateOfficialTaxiRuleFare(
      {
        ...stjCruzBayAnnaberg,
        fareConfirmationRequired: "two_or_more",
        fareConfirmationReason: "Human confirmation required.",
      },
      2,
      0,
    ),
  "Human confirmation required",
  "fare-confirmation gate remains fail-closed",
);

console.log(
  "Official taxi fare engine contracts passed: STT/STJ/STX matrix, reviewed aliases, governed parent-place resolution, explicit special-destination precedence, ambiguous-parent fail-closed, reverse matching, unknown-route, luggage, and confirmation gates.",
);
