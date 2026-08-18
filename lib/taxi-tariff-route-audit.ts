export type TariffRouteAuditStatus =
  | "official_verified"
  | "alias_verified"
  | "nearest_tariff_rule"
  | "manual_confirmation_required"
  | "rejected";

export type TariffAuditRule = {
  id: string;
  originNames?: string[];
  destinationNames?: string[];
  originEstateGeoids?: string[];
  destinationEstateGeoids?: string[];
  originCandidateAliases?: string[];
  destinationCandidateAliases?: string[];
  onePassengerFare?: number;
  perPersonFare?: number;
  additionalPassengerFare?: number;
  fareConfirmationRequired?: "all" | "two_or_more";
  fareConfirmationReason?: string;
};

export type TariffAuditDocument = {
  id?: string;
  island: string;
  title?: string;
  version?: string;
  sourceUrl?: string;
  effectiveAt?: string;
  status?: string;
  activationStatus?: string;
  issuingAuthority?: string;
  currency?: string;
  reviewReference?: string;
  reviewedBy?: string;
  rules: TariffAuditRule[];
};

export type TariffRouteAuditFinding = {
  tariffId: string | null;
  island: string;
  ruleId: string;
  status: TariffRouteAuditStatus;
  routeKey?: string;
  reason?: string;
  conflictsWith?: string;
  sourceUrl: string | null;
  effectiveAt: string | null;
};

export type TariffRouteAuditReport = {
  generatedAt: string;
  tariffCount: number;
  ruleCount: number;
  blockingFindings: number;
  byIsland: Record<
    string,
    {
      tariffCount: number;
      ruleCount: number;
      blockingFindings: number;
      statuses: Record<TariffRouteAuditStatus, number>;
    }
  >;
  findings: TariffRouteAuditFinding[];
};

const STATUSES: TariffRouteAuditStatus[] = [
  "official_verified",
  "alias_verified",
  "nearest_tariff_rule",
  "manual_confirmation_required",
  "rejected",
];

const COMMISSION = "Virgin Islands Taxicab Commission";

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function endpointKey(names: string[] | undefined, geoids: string[] | undefined) {
  const ids = [...(geoids ?? [])].sort();
  const normalizedNames = [...(names ?? [])]
    .map(normalize)
    .filter(Boolean)
    .sort();
  return JSON.stringify({ ids, names: normalizedNames });
}

function routeKey(rule: TariffAuditRule) {
  const a = endpointKey(rule.originNames, rule.originEstateGeoids);
  const b = endpointKey(rule.destinationNames, rule.destinationEstateGeoids);
  return [a, b].sort().join(" <-> ");
}

function fareSignature(rule: TariffAuditRule) {
  return JSON.stringify({
    one: rule.onePassengerFare ?? null,
    perPerson: rule.perPersonFare ?? null,
    additional: rule.additionalPassengerFare ?? null,
    confirmation: rule.fareConfirmationRequired ?? null,
  });
}

function classify(
  rule: TariffAuditRule,
  tariff: TariffAuditDocument,
): { status: TariffRouteAuditStatus; reason?: string } {
  if (!tariff.sourceUrl || !tariff.effectiveAt) {
    return {
      status: "manual_confirmation_required",
      reason: "missing_source_or_effective_date",
    };
  }
  if (tariff.issuingAuthority !== COMMISSION) {
    return {
      status: "manual_confirmation_required",
      reason: "issuing_authority_not_verified",
    };
  }
  if (tariff.currency !== "USD") {
    return {
      status: "manual_confirmation_required",
      reason: "currency_not_verified",
    };
  }
  if (!tariff.reviewReference || !tariff.reviewedBy) {
    return {
      status: "manual_confirmation_required",
      reason: "missing_governance_review",
    };
  }
  if (
    rule.originCandidateAliases?.length ||
    rule.destinationCandidateAliases?.length
  ) {
    return {
      status: "manual_confirmation_required",
      reason: "candidate_alias_requires_confirmation",
    };
  }
  if (rule.fareConfirmationRequired) {
    return {
      status: "manual_confirmation_required",
      reason: rule.fareConfirmationReason
        ? "fare_confirmation_required"
        : "fare_confirmation_required_without_reason",
    };
  }

  const hasOrigin = Boolean(
    rule.originEstateGeoids?.length || rule.originNames?.length,
  );
  const hasDestination = Boolean(
    rule.destinationEstateGeoids?.length || rule.destinationNames?.length,
  );
  if (!hasOrigin || !hasDestination) {
    return { status: "rejected", reason: "missing_route_endpoint" };
  }
  if (typeof rule.onePassengerFare !== "number") {
    return { status: "rejected", reason: "missing_one_passenger_fare" };
  }

  const canonical = Boolean(
    rule.originEstateGeoids?.length && rule.destinationEstateGeoids?.length,
  );
  return canonical
    ? { status: "official_verified" }
    : { status: "alias_verified", reason: "reviewed_name_based_endpoint" };
}

function emptyIslandSummary() {
  return {
    tariffCount: 0,
    ruleCount: 0,
    blockingFindings: 0,
    statuses: Object.fromEntries(
      STATUSES.map((status) => [status, 0]),
    ) as Record<TariffRouteAuditStatus, number>,
  };
}

export function auditTaxiTariffRoutes(
  tariffs: TariffAuditDocument[],
): TariffRouteAuditReport {
  const findings: TariffRouteAuditFinding[] = [];
  const byIsland: TariffRouteAuditReport["byIsland"] = {};
  let blockingFindings = 0;

  for (const tariff of tariffs) {
    const islandSummary = (byIsland[tariff.island] ??= emptyIslandSummary());
    islandSummary.tariffCount += 1;

    const seen = new Map<string, TariffAuditRule>();
    for (const rule of tariff.rules ?? []) {
      islandSummary.ruleCount += 1;
      const key = routeKey(rule);
      const prior = seen.get(key);
      const classification = classify(rule, tariff);
      let status = classification.status;
      let reason = classification.reason;
      let conflictsWith: string | undefined;

      if (prior && fareSignature(prior) !== fareSignature(rule)) {
        status = "rejected";
        reason = "conflicting_duplicate_fare";
        conflictsWith = prior.id;
      } else {
        seen.set(key, rule);
      }

      const isBlocking =
        status === "manual_confirmation_required" || status === "rejected";
      if (isBlocking) {
        blockingFindings += 1;
        islandSummary.blockingFindings += 1;
      }
      islandSummary.statuses[status] += 1;

      findings.push({
        tariffId: tariff.id ?? null,
        island: tariff.island,
        ruleId: rule.id,
        status,
        routeKey: key,
        reason,
        conflictsWith,
        sourceUrl: tariff.sourceUrl ?? null,
        effectiveAt: tariff.effectiveAt ?? null,
      });
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    tariffCount: tariffs.length,
    ruleCount: findings.length,
    blockingFindings,
    byIsland,
    findings,
  };
}
