import assert from "node:assert/strict";
import fs from "node:fs";

import {
  assertMigratedSttAirportReleaseGate,
  GOVERNED_STT_TARIFF_VERSION,
  LEGACY_AIRPORT_CROSSROAD_RULE_ID,
  LEGACY_STT_TARIFF_VERSION,
  planLegacySttAirportReleaseGateMigration,
  REVIEWED_AIRPORT_CROSSROAD_RULE_ID,
  REVIEWED_AIRPORT_TOWN_RULE_ID,
  type AirportReleaseGateManifest,
} from "@/lib/stt-airport-release-gate-migration";
import type {
  OfficialTaxiRateRule,
  OfficialTaxiTariff,
} from "@/types/taxi-operations";

const manifestRaw = JSON.parse(
  fs.readFileSync(
    "data/taxi-tariff-repairs/issue-385-stt-airport-release-gate.json",
    "utf8",
  ),
) as AirportReleaseGateManifest;

const legacyCrossroadRule: OfficialTaxiRateRule = {
  id: LEGACY_AIRPORT_CROSSROAD_RULE_ID,
  originNames: ["Cyril E. King Airport"],
  destinationNames: ["Havensight Crossroad"],
  onePassengerFare: 12,
  perPersonFare: 11,
  luggageFarePerPiece: 3,
};

const unrelatedRule: OfficialTaxiRateRule = {
  id: "stt-cyril-e-king-airport-frenchtown",
  originNames: ["Cyril E. King Airport"],
  destinationNames: ["Frenchtown"],
  onePassengerFare: 11,
  perPersonFare: 9,
  luggageFarePerPiece: 3,
};

function makeTariff(rules: OfficialTaxiRateRule[]): OfficialTaxiTariff {
  return {
    id: "active-stt",
    title: "STT reviewed tariff",
    version: LEGACY_STT_TARIFF_VERSION,
    island: "stt",
    status: "active",
    effectiveAt: "2022-10-24T00:00:00.000Z",
    sourceUrl: "https://www.saintthomastaxi.com/rates.html",
    issuingAuthority: "Virgin Islands Taxicab Commission",
    currency: "USD",
    rules,
    reviewReference: "internal review",
    reviewedBy: "test-reviewer",
    activationStatus: "verified",
    activatedAt: "2026-08-23T00:00:00.000Z",
    activatedBy: "test-operator",
    activationReviewReference: "test-activation-review",
  };
}

const source = makeTariff([legacyCrossroadRule, unrelatedRule]);
const plan = planLegacySttAirportReleaseGateMigration(source, manifestRaw);

assert.equal(plan.fromVersion, LEGACY_STT_TARIFF_VERSION);
assert.equal(plan.toVersion, GOVERNED_STT_TARIFF_VERSION);
assert.deepEqual(plan.removedRuleIds, [LEGACY_AIRPORT_CROSSROAD_RULE_ID]);
assert.deepEqual(plan.insertedRuleIds, [
  REVIEWED_AIRPORT_CROSSROAD_RULE_ID,
  REVIEWED_AIRPORT_TOWN_RULE_ID,
]);
assert.equal(plan.nextRules.length, source.rules.length + 1);
assert.equal(
  plan.nextRules.some((rule) => rule.id === LEGACY_AIRPORT_CROSSROAD_RULE_ID),
  false,
);
assert.equal(
  plan.nextRules.some((rule) => rule.id === REVIEWED_AIRPORT_TOWN_RULE_ID),
  true,
);
assert.equal(
  plan.nextRules.some((rule) => rule.id === REVIEWED_AIRPORT_CROSSROAD_RULE_ID),
  true,
);
assert.equal(
  plan.nextRules.some((rule) => rule.id === unrelatedRule.id),
  true,
);

assertMigratedSttAirportReleaseGate(
  {
    ...source,
    version: plan.toVersion,
    rules: plan.nextRules,
  },
  manifestRaw,
);

assert.throws(
  () =>
    planLegacySttAirportReleaseGateMigration(
      makeTariff([
        legacyCrossroadRule,
        {
          id: "legacy-airport-town",
          originNames: ["Cyril E. King Airport"],
          destinationNames: ["Charlotte Amalie"],
          onePassengerFare: 11,
          perPersonFare: 9,
          luggageFarePerPiece: 3,
        },
      ]),
      manifestRaw,
    ),
  /will not auto-insert Airport ↔ Town/,
);

assert.throws(
  () =>
    planLegacySttAirportReleaseGateMigration(
      makeTariff([
        {
          ...legacyCrossroadRule,
          onePassengerFare: 13,
        },
      ]),
      manifestRaw,
    ),
  /fares changed from the reviewed \$12\/\$11 values/,
);

assert.throws(
  () =>
    planLegacySttAirportReleaseGateMigration(
      makeTariff([
        legacyCrossroadRule,
        {
          ...legacyCrossroadRule,
          id: "duplicate-airport-crossroad",
        },
      ]),
      manifestRaw,
    ),
  /expected exactly one Airport ↔ Havensight Crossroad semantic rule; found 2/,
);

console.log(
  JSON.stringify(
    {
      ok: true,
      fromVersion: plan.fromVersion,
      toVersion: plan.toVersion,
      removedRuleIds: plan.removedRuleIds,
      insertedRuleIds: plan.insertedRuleIds,
      nextRuleCount: plan.nextRules.length,
    },
    null,
    2,
  ),
);
