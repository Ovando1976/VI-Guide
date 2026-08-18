import fs from "node:fs";
import path from "node:path";

type Status =
  | "official_verified"
  | "alias_verified"
  | "nearest_tariff_rule"
  | "manual_confirmation_required"
  | "rejected";

type Rule = {
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

type Tariff = {
  id?: string;
  island: string;
  title?: string;
  version?: string;
  sourceUrl?: string;
  effectiveAt?: string;
  rules: Rule[];
};

const normalize = (value: string) =>
  value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, " ").trim();

function endpointKey(names: string[] | undefined, geoids: string[] | undefined) {
  const ids = [...(geoids ?? [])].sort();
  const normalizedNames = [...(names ?? [])].map(normalize).filter(Boolean).sort();
  return JSON.stringify({ ids, names: normalizedNames });
}

function routeKey(rule: Rule) {
  const a = endpointKey(rule.originNames, rule.originEstateGeoids);
  const b = endpointKey(rule.destinationNames, rule.destinationEstateGeoids);
  return [a, b].sort().join(" <-> ");
}

function fareSignature(rule: Rule) {
  return JSON.stringify({
    one: rule.onePassengerFare ?? null,
    perPerson: rule.perPersonFare ?? null,
    additional: rule.additionalPassengerFare ?? null,
    confirmation: rule.fareConfirmationRequired ?? null,
  });
}

function classify(rule: Rule, tariff: Tariff): Status {
  if (!tariff.sourceUrl || !tariff.effectiveAt) return "manual_confirmation_required";
  if (rule.fareConfirmationRequired) return "manual_confirmation_required";
  const hasOrigin = Boolean(rule.originEstateGeoids?.length || rule.originNames?.length);
  const hasDestination = Boolean(rule.destinationEstateGeoids?.length || rule.destinationNames?.length);
  if (!hasOrigin || !hasDestination || typeof rule.onePassengerFare !== "number") return "rejected";
  const canonical = Boolean(rule.originEstateGeoids?.length && rule.destinationEstateGeoids?.length);
  return canonical ? "official_verified" : "alias_verified";
}

function main() {
  const input = process.argv[2];
  if (!input) throw new Error("Usage: tsx scripts/audit-taxi-tariff-routes.ts <tariff-json>");
  const absolute = path.resolve(input);
  const parsed = JSON.parse(fs.readFileSync(absolute, "utf8"));
  const tariffs: Tariff[] = Array.isArray(parsed) ? parsed : [parsed];
  const findings: unknown[] = [];
  let blocking = 0;

  for (const tariff of tariffs) {
    const seen = new Map<string, Rule>();
    for (const rule of tariff.rules ?? []) {
      const status = classify(rule, tariff);
      const key = routeKey(rule);
      const prior = seen.get(key);
      if (prior && fareSignature(prior) !== fareSignature(rule)) {
        blocking++;
        findings.push({ island: tariff.island, ruleId: rule.id, status: "rejected", reason: "conflicting_duplicate_fare", conflictsWith: prior.id });
      } else {
        seen.set(key, rule);
        if (status === "manual_confirmation_required" || status === "rejected") blocking++;
        findings.push({ island: tariff.island, ruleId: rule.id, status, routeKey: key, sourceUrl: tariff.sourceUrl ?? null, effectiveAt: tariff.effectiveAt ?? null });
      }
    }
  }

  const report = { generatedAt: new Date().toISOString(), tariffCount: tariffs.length, ruleCount: findings.length, blockingFindings: blocking, findings };
  const output = path.resolve("artifacts/tariff-route-audit.json");
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify({ output, tariffCount: tariffs.length, ruleCount: findings.length, blockingFindings: blocking }, null, 2));
  if (blocking > 0) process.exitCode = 1;
}

main();
