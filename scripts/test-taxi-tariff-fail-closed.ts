import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const types = fs.readFileSync(
  path.join(root, "types/taxi-operations.ts"),
  "utf8",
);
const governance = fs.readFileSync(
  path.join(root, "lib/taxi-tariff-governance.ts"),
  "utf8",
);
const reviewGates = fs.readFileSync(
  path.join(root, "lib/taxi-tariff-review-gates.ts"),
  "utf8",
);
const quoting = fs.readFileSync(
  path.join(root, "lib/usvi-taxi-tariffs.ts"),
  "utf8",
);
const fareEngine = fs.readFileSync(
  path.join(root, "lib/official-taxi-fare-engine.ts"),
  "utf8",
);
const mobilityHubs = fs.readFileSync(
  path.join(root, "lib/mobility-hubs.ts"),
  "utf8",
);
const quoteApi = fs.readFileSync(
  path.join(root, "app/api/bookings/quote/route.ts"),
  "utf8",
);
const estatesApi = fs.readFileSync(
  path.join(root, "app/api/estates/route.ts"),
  "utf8",
);
const activation = fs.readFileSync(
  path.join(root, "app/api/admin/taxi-tariffs/[tariffId]/activate/route.ts"),
  "utf8",
);
const routeAudit = fs.readFileSync(
  path.join(root, "lib/taxi-tariff-route-audit.ts"),
  "utf8",
);
const routeAuditApi = fs.readFileSync(
  path.join(root, "app/api/admin/taxi-tariffs/audit/route.ts"),
  "utf8",
);

function expectSource(source: string, value: string, label: string) {
  if (!source.includes(value)) {
    throw new Error(`Taxi tariff fail-closed contract failed: ${label}`);
  }
}

expectSource(
  types,
  "originCandidateAliases?: string[]",
  "origin review-only aliases are modeled separately from canonical names",
);
expectSource(
  types,
  "destinationCandidateAliases?: string[]",
  "destination review-only aliases are modeled separately from canonical names",
);
expectSource(
  types,
  'TaxiFareConfirmationScope = "all" | "two_or_more"',
  "fare disputes can be scoped to all riders or the 2+ tier",
);
expectSource(
  governance,
  "assertCandidateAliasesAreReviewOnly",
  "candidate aliases cannot also be canonical quote names",
);
expectSource(
  governance,
  "applyKnownTariffReviewGates(version, rule)",
  "known review gates are applied before tariff rules become quoteable",
);
expectSource(
  governance,
  "fare confirmation reason when automatic quoting is restricted",
  "disputed fare tiers require an auditable reason",
);
expectSource(
  reviewGates,
  '{ canonicalSourceName: "Town", candidateAlias: "Charlotte Amalie" }',
  "Town to Charlotte Amalie remains a review-only mapping",
);
expectSource(
  reviewGates,
  '{ canonicalSourceName: "Airport Terminal", candidateAlias: "Lindbergh Bay" }',
  "Airport Terminal to Lindbergh Bay remains a review-only mapping",
);
expectSource(
  reviewGates,
  'ruleId: "misc-red-hook-to-dorothea"',
  "Red Hook to Dorothea dispute is explicitly gated",
);
expectSource(
  fareEngine,
  'rule.fareConfirmationRequired === "two_or_more" && party > 1',
  "2+ disputed fares fail closed before calculation",
);
expectSource(
  fareEngine,
  "Official fare confirmation required:",
  "blocked fares surface an explicit confirmation-required error",
);
expectSource(
  fareEngine,
  '"cyril e king airport": "airport terminal"',
  "the customer-facing STT airport name maps only to the governed Airport Terminal tariff endpoint",
);
expectSource(
  fareEngine,
  "endpoint.tariffEndpointName ?? endpoint.baseName",
  "mobility-place geography cannot silently replace an explicit tariff identity",
);
expectSource(
  mobilityHubs,
  'CYRIL_E_KING_AIRPORT_GEOID = "mobility:stt:airport:stt"',
  "STT airport has a stable canonical mobility identifier",
);
expectSource(
  mobilityHubs,
  'fullname: "Airport Road / VI Route 302"',
  "STT airport routing is anchored to the terminal access road",
);
expectSource(
  mobilityHubs,
  'SMITH_BAY_ESTATE_GEOID = "7803072500"',
  "Red Hook records retain their verified Estate Smith Bay parent",
);
expectSource(
  mobilityHubs,
  'tariffEndpointName: "Red Hook"',
  "Red Hook retains the direct published tariff identity instead of inheriting Smith Bay pricing",
);
expectSource(
  mobilityHubs,
  'RED_HOOK_FERRY_TERMINAL_GEOID',
  "the Red Hook passenger ferry has a dedicated routing endpoint",
);
expectSource(
  mobilityHubs,
  "OpenStreetMap way 522497662 ferry-terminal point",
  "the ferry routing point records coordinate provenance",
);
expectSource(
  quoteApi,
  "resolveMobilityEndpoint(body.originEstateGeoid, estates)",
  "official quote API accepts canonical mobility hubs without replacing tariff pricing",
);
expectSource(
  estatesApi,
  "withMobilityHubs(estates)",
  "customer mobility choices include canonical hubs alongside estates",
);
expectSource(
  quoting,
  "calculateOfficialTaxiRuleFare",
  "production quoting uses the shared fail-closed fare engine",
);
expectSource(
  activation,
  "candidate aliases awaiting human confirmation",
  "unresolved candidate aliases block tariff activation",
);
expectSource(
  activation,
  "disputed fares awaiting human confirmation",
  "unresolved fare disputes block tariff activation",
);
expectSource(
  routeAudit,
  'routeReview?.decision === "rejected"',
  "a rejected route review remains fail-closed",
);
expectSource(
  routeAudit,
  'routeReview?.decision === "needs_changes"',
  "a needs-changes route review remains fail-closed",
);
expectSource(
  routeAudit,
  'routeReview?.decision === "verified"',
  "an exact verified route review can satisfy the governance gate",
);
expectSource(
  routeAudit,
  "candidate_alias_requires_confirmation",
  "route review verification does not bypass candidate-alias confirmation",
);
expectSource(
  routeAudit,
  "fare_confirmation_required",
  "route review verification does not bypass disputed-fare confirmation",
);
expectSource(
  routeAuditApi,
  'db.collection("taxiTariffRouteReviews").get()',
  "the production route audit loads imported route review decisions",
);
expectSource(
  routeAuditApi,
  "auditTaxiTariffRoutes(tariffs, routeReviews)",
  "the production audit passes route reviews into the shared audit engine",
);

console.log("USVI Explorer taxi tariff fail-closed contracts passed.");
