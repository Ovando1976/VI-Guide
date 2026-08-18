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
): TariffRouteAuditStatus {
  if (!tariff.sourceUrl || !tariff.effectiveAt) {
    return "manual_confirmation_required";
  }
  if (rule.fareConfirmationRequired) {
    return "manual_confirmation_required";
  }

  const hasOrigin = Boolean(
    rule.originEstateGeoids?.length || rule.originNames?.length,
  );
  const hasDestination = Boolean(
    rule.destinationEstateGeoids?.length || rule.destinationNames?.length,
  );
  if (
    !hasOrigin ||
    !hasDestination ||
    typeof rule.onePassengerFare !== "number"
  ) {
    return "rejected";
  }

  const canonical = Boolean(
    rule.originEstateGeoids?.length && rule.destinationEstateGeoids?.length,
  );
  return canonical ? "official_verified" : "alias_verified";
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
      let status = classify(rule, tariff);
      let reason: string | undefined;
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
