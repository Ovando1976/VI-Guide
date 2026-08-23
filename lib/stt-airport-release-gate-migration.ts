import { auditTaxiTariffRoutes } from "@/lib/taxi-tariff-route-audit";
import { assertVerifiedActiveTariff } from "@/lib/taxi-tariff-governance";
import type {
  OfficialTaxiRateRule,
  OfficialTaxiTariff,
} from "@/types/taxi-operations";

export const LEGACY_STT_TARIFF_VERSION = "2022-10-24-reviewed version-1";
export const GOVERNED_STT_TARIFF_VERSION = "vicc-2022-10-24-stta-2026-web-v1";
export const LEGACY_AIRPORT_CROSSROAD_RULE_ID =
  "stt-cyril-e-king-airport-havensight-crossroad";
export const REVIEWED_AIRPORT_TOWN_RULE_ID = "to-town-airport-terminal";
export const REVIEWED_AIRPORT_CROSSROAD_RULE_ID =
  "to-airport-havensight-crossroad";

export type AirportReleaseGateManifest = {
  tariffVersion: string;
  reviewReference: string;
  sourceUrl: string;
  rules: OfficialTaxiRateRule[];
};

export type LegacyAirportReleaseGatePlan = {
  fromVersion: string;
  toVersion: string;
  removedRuleIds: string[];
  insertedRuleIds: string[];
  nextRules: OfficialTaxiRateRule[];
};

const normalize = (value: unknown) =>
  String(value ?? "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const AIRPORT_NAMES = new Set([
  "airport terminal",
  "lindbergh bay",
  "cyril e king airport",
]);
const TOWN_NAMES = new Set(["town", "charlotte amalie"]);
const CROSSROAD_NAMES = new Set(["havensight crossroad"]);

function hasExactName(names: string[] | undefined, accepted: Set<string>) {
  return Boolean(names?.some((name) => accepted.has(normalize(name))));
}

function matchesUndirectedRoute(
  rule: OfficialTaxiRateRule,
  left: Set<string>,
  right: Set<string>,
) {
  return (
    (hasExactName(rule.originNames, left) &&
      hasExactName(rule.destinationNames, right)) ||
    (hasExactName(rule.destinationNames, left) &&
      hasExactName(rule.originNames, right))
  );
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, entry]) => [key, canonicalize(entry)]),
  );
}

function sameValue(a: unknown, b: unknown) {
  return JSON.stringify(canonicalize(a)) === JSON.stringify(canonicalize(b));
}

function requireReviewedManifest(manifest: AirportReleaseGateManifest) {
  if (manifest.tariffVersion !== GOVERNED_STT_TARIFF_VERSION) {
    throw new Error(
      `Migration manifest must target ${GOVERNED_STT_TARIFF_VERSION}; received ${manifest.tariffVersion}.`,
    );
  }

  const byId = new Map(manifest.rules.map((rule) => [rule.id, rule]));
  if (byId.size !== 2 || manifest.rules.length !== 2) {
    throw new Error("Migration manifest must contain exactly the two reviewed airport release-gate rules.");
  }

  const town = byId.get(REVIEWED_AIRPORT_TOWN_RULE_ID);
  const crossroad = byId.get(REVIEWED_AIRPORT_CROSSROAD_RULE_ID);
  if (!town || !crossroad) {
    throw new Error("Migration manifest is missing a reviewed airport release-gate rule.");
  }

  if (!matchesUndirectedRoute(town, AIRPORT_NAMES, TOWN_NAMES)) {
    throw new Error("Reviewed Airport ↔ Town rule does not have the expected endpoints.");
  }
  if (town.onePassengerFare !== 11 || town.perPersonFare !== 9) {
    throw new Error("Reviewed Airport ↔ Town rule does not have the approved $11/$9 fares.");
  }
  if (town.luggageFarePerPiece !== 3 || town.luggageIncluded !== 0) {
    throw new Error("Reviewed Airport ↔ Town luggage terms do not match the approved repair.");
  }

  if (!matchesUndirectedRoute(crossroad, AIRPORT_NAMES, CROSSROAD_NAMES)) {
    throw new Error("Reviewed Airport ↔ Havensight Crossroad rule does not have the expected endpoints.");
  }
  if (crossroad.onePassengerFare !== 12 || crossroad.perPersonFare !== 11) {
    throw new Error(
      "Reviewed Airport ↔ Havensight Crossroad rule does not have the approved $12/$11 fares.",
    );
  }
  if (crossroad.luggageFarePerPiece !== 3 || crossroad.luggageIncluded !== 0) {
    throw new Error(
      "Reviewed Airport ↔ Havensight Crossroad luggage terms do not match the approved repair.",
    );
  }

  for (const rule of manifest.rules) {
    if (rule.fareConfirmationRequired) {
      throw new Error(`Reviewed rule ${rule.id} still requires fare confirmation.`);
    }
    if (rule.originCandidateAliases?.length || rule.destinationCandidateAliases?.length) {
      throw new Error(`Reviewed rule ${rule.id} still contains candidate aliases.`);
    }
  }

  return { town, crossroad };
}

function assertLegacyCrossroadRule(rule: OfficialTaxiRateRule) {
  if (rule.id !== LEGACY_AIRPORT_CROSSROAD_RULE_ID) {
    throw new Error(`Unexpected legacy Airport ↔ Havensight Crossroad rule ${rule.id}.`);
  }
  if (!matchesUndirectedRoute(rule, AIRPORT_NAMES, CROSSROAD_NAMES)) {
    throw new Error("Legacy Airport ↔ Havensight Crossroad rule endpoints changed.");
  }
  if (rule.onePassengerFare !== 12 || rule.perPersonFare !== 11) {
    throw new Error("Legacy Airport ↔ Havensight Crossroad fares changed from the reviewed $12/$11 values.");
  }
  if (rule.luggageFarePerPiece !== 3) {
    throw new Error("Legacy Airport ↔ Havensight Crossroad luggage fare changed from $3.");
  }
  if (rule.luggageIncluded != null && rule.luggageIncluded !== 0) {
    throw new Error("Legacy Airport ↔ Havensight Crossroad included-luggage value is unexpected.");
  }
  if (rule.fareConfirmationRequired) {
    throw new Error("Legacy Airport ↔ Havensight Crossroad unexpectedly requires confirmation.");
  }
}

export function planLegacySttAirportReleaseGateMigration(
  activeTariff: OfficialTaxiTariff,
  manifest: AirportReleaseGateManifest,
): LegacyAirportReleaseGatePlan {
  assertVerifiedActiveTariff(activeTariff);
  requireReviewedManifest(manifest);

  if (activeTariff.island !== "stt") {
    throw new Error(`Legacy airport migration only supports STT; received ${activeTariff.island}.`);
  }
  if (activeTariff.version !== LEGACY_STT_TARIFF_VERSION) {
    throw new Error(
      `Legacy airport migration requires ${LEGACY_STT_TARIFF_VERSION}; active version is ${activeTariff.version}.`,
    );
  }

  const existingIds = new Set(activeTariff.rules.map((rule) => rule.id));
  for (const id of [
    REVIEWED_AIRPORT_TOWN_RULE_ID,
    REVIEWED_AIRPORT_CROSSROAD_RULE_ID,
  ]) {
    if (existingIds.has(id)) {
      throw new Error(`Legacy migration aborted because target rule ${id} already exists.`);
    }
  }

  const crossroadMatches = activeTariff.rules.filter((rule) =>
    matchesUndirectedRoute(rule, AIRPORT_NAMES, CROSSROAD_NAMES),
  );
  if (crossroadMatches.length !== 1) {
    throw new Error(
      `Legacy migration expected exactly one Airport ↔ Havensight Crossroad semantic rule; found ${crossroadMatches.length}.`,
    );
  }
  assertLegacyCrossroadRule(crossroadMatches[0]);

  const townMatches = activeTariff.rules.filter((rule) =>
    matchesUndirectedRoute(rule, AIRPORT_NAMES, TOWN_NAMES),
  );
  if (townMatches.length) {
    throw new Error(
      `Legacy migration will not auto-insert Airport ↔ Town because ${townMatches.length} semantic match(es) already exist: ${townMatches
        .map((rule) => rule.id)
        .join(", ")}.`,
    );
  }

  const nextRules = activeTariff.rules.filter(
    (rule) => rule.id !== LEGACY_AIRPORT_CROSSROAD_RULE_ID,
  );
  nextRules.push(...manifest.rules);

  if (nextRules.length !== activeTariff.rules.length + 1) {
    throw new Error("Legacy airport migration produced an unexpected rule-count change.");
  }

  const candidate: OfficialTaxiTariff = {
    ...activeTariff,
    version: manifest.tariffVersion,
    rules: nextRules,
  };
  assertVerifiedActiveTariff(candidate);

  const audit = auditTaxiTariffRoutes([candidate]);
  const targetIds = new Set([
    REVIEWED_AIRPORT_TOWN_RULE_ID,
    REVIEWED_AIRPORT_CROSSROAD_RULE_ID,
  ]);
  const blocking = audit.findings.filter(
    (finding) =>
      (finding.status === "manual_confirmation_required" ||
        finding.status === "rejected") &&
      (targetIds.has(finding.ruleId) ||
        (finding.conflictsWith ? targetIds.has(finding.conflictsWith) : false)),
  );
  if (blocking.length) {
    throw new Error(
      `Migrated airport rules failed route audit: ${blocking
        .map((finding) => `${finding.ruleId}:${finding.reason ?? finding.status}`)
        .join(", ")}.`,
    );
  }

  return {
    fromVersion: activeTariff.version,
    toVersion: manifest.tariffVersion,
    removedRuleIds: [LEGACY_AIRPORT_CROSSROAD_RULE_ID],
    insertedRuleIds: manifest.rules.map((rule) => rule.id).sort(),
    nextRules,
  };
}

export function assertMigratedSttAirportReleaseGate(
  activeTariff: OfficialTaxiTariff,
  manifest: AirportReleaseGateManifest,
) {
  assertVerifiedActiveTariff(activeTariff);
  const reviewed = requireReviewedManifest(manifest);

  if (activeTariff.version !== manifest.tariffVersion) {
    throw new Error(`Post-migration tariff version is ${activeTariff.version}; expected ${manifest.tariffVersion}.`);
  }
  if (activeTariff.rules.some((rule) => rule.id === LEGACY_AIRPORT_CROSSROAD_RULE_ID)) {
    throw new Error("Post-migration tariff still contains the legacy Airport ↔ Havensight Crossroad rule.");
  }

  const townMatches = activeTariff.rules.filter((rule) =>
    matchesUndirectedRoute(rule, AIRPORT_NAMES, TOWN_NAMES),
  );
  const crossroadMatches = activeTariff.rules.filter((rule) =>
    matchesUndirectedRoute(rule, AIRPORT_NAMES, CROSSROAD_NAMES),
  );

  if (townMatches.length !== 1 || townMatches[0].id !== REVIEWED_AIRPORT_TOWN_RULE_ID) {
    throw new Error("Post-migration Airport ↔ Town semantic route is not uniquely canonical.");
  }
  if (
    crossroadMatches.length !== 1 ||
    crossroadMatches[0].id !== REVIEWED_AIRPORT_CROSSROAD_RULE_ID
  ) {
    throw new Error(
      "Post-migration Airport ↔ Havensight Crossroad semantic route is not uniquely canonical.",
    );
  }
  if (!sameValue(townMatches[0], reviewed.town)) {
    throw new Error("Post-migration Airport ↔ Town rule differs from the reviewed manifest.");
  }
  if (!sameValue(crossroadMatches[0], reviewed.crossroad)) {
    throw new Error(
      "Post-migration Airport ↔ Havensight Crossroad rule differs from the reviewed manifest.",
    );
  }
}
