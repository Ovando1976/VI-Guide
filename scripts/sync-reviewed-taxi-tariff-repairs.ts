import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { getAdminDb } from "@/lib/firebase-admin";
import { auditTaxiTariffRoutes } from "@/lib/taxi-tariff-route-audit";
import { assertVerifiedActiveTariff } from "@/lib/taxi-tariff-governance";
import type {
  OfficialTaxiRateRule,
  OfficialTaxiTariff,
} from "@/types/taxi-operations";
import type { IslandCode } from "@/types/usvi";

type RepairManifest = {
  schemaVersion: 1;
  island: IslandCode;
  tariffVersion: string;
  reviewReference: string;
  sourceUrl: string;
  scope?: string;
  rules: OfficialTaxiRateRule[];
};

type RepairPlan = {
  changedRuleIds: string[];
  insertedRuleIds: string[];
  replacedRuleIds: string[];
  nextRules: OfficialTaxiRateRule[];
};

const DEFAULT_MANIFEST =
  "data/taxi-tariff-repairs/issue-385-stt-airport-release-gate.json";

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
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

function loadManifest(filePath: string) {
  const absolute = path.resolve(filePath);
  const raw = fs.readFileSync(absolute, "utf8");
  const parsed = JSON.parse(raw) as Partial<RepairManifest>;

  if (parsed.schemaVersion !== 1) {
    throw new Error("Repair manifest schemaVersion must be 1.");
  }
  const island = requiredText(parsed.island, "Manifest island") as IslandCode;
  if (!["stt", "stj", "stx"].includes(island)) {
    throw new Error("Manifest island must be stt, stj, or stx.");
  }
  const tariffVersion = requiredText(parsed.tariffVersion, "Manifest tariffVersion");
  const reviewReference = requiredText(parsed.reviewReference, "Manifest reviewReference");
  const sourceUrl = requiredText(parsed.sourceUrl, "Manifest sourceUrl");
  if (!Array.isArray(parsed.rules) || parsed.rules.length === 0) {
    throw new Error("Repair manifest must contain at least one rule.");
  }

  const rules = parsed.rules as OfficialTaxiRateRule[];
  const ids = new Set<string>();
  for (const rule of rules) {
    requiredText(rule.id, "Repair rule ID");
    if (ids.has(rule.id)) throw new Error(`Duplicate repair rule ID: ${rule.id}.`);
    ids.add(rule.id);
    if (!rule.originNames?.length || !rule.destinationNames?.length) {
      throw new Error(`Repair rule ${rule.id} needs both route endpoints.`);
    }
    if (rule.originCandidateAliases?.length || rule.destinationCandidateAliases?.length) {
      throw new Error(`Repair rule ${rule.id} contains candidate aliases and cannot be applied automatically.`);
    }
    if (rule.fareConfirmationRequired) {
      throw new Error(`Repair rule ${rule.id} still requires fare confirmation and cannot be applied automatically.`);
    }
  }

  return {
    absolute,
    raw,
    manifest: {
      schemaVersion: 1,
      island,
      tariffVersion,
      reviewReference,
      sourceUrl,
      scope: typeof parsed.scope === "string" ? parsed.scope : undefined,
      rules,
    } satisfies RepairManifest,
  };
}

function manifestChecksum(raw: string) {
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function planRepair(activeTariff: OfficialTaxiTariff, manifest: RepairManifest): RepairPlan {
  assertVerifiedActiveTariff(activeTariff);

  if (activeTariff.island !== manifest.island) {
    throw new Error(`Active tariff island ${activeTariff.island} does not match repair manifest ${manifest.island}.`);
  }
  if (activeTariff.version !== manifest.tariffVersion) {
    throw new Error(`Active tariff version ${activeTariff.version} does not match reviewed repair version ${manifest.tariffVersion}.`);
  }

  const repairsById = new Map(manifest.rules.map((rule) => [rule.id, rule]));
  const existingIds = new Set(activeTariff.rules.map((rule) => rule.id));
  const replacedRuleIds: string[] = [];
  const insertedRuleIds: string[] = [];

  const nextRules = activeTariff.rules.map((rule) => {
    const repair = repairsById.get(rule.id);
    if (!repair) return rule;
    if (sameValue(rule, repair)) return rule;
    replacedRuleIds.push(rule.id);
    return repair;
  });

  for (const repair of manifest.rules) {
    if (existingIds.has(repair.id)) continue;
    insertedRuleIds.push(repair.id);
    nextRules.push(repair);
  }

  const changedRuleIds = [...replacedRuleIds, ...insertedRuleIds].sort();
  if (!changedRuleIds.length) {
    return { changedRuleIds, insertedRuleIds, replacedRuleIds, nextRules };
  }

  const candidate = {
    ...activeTariff,
    rules: nextRules,
    reviewReference: manifest.reviewReference,
    reviewedBy: "scoped-reviewed-repair-manifest",
  };
  const audit = auditTaxiTariffRoutes([candidate]);
  const repairIds = new Set(manifest.rules.map((rule) => rule.id));
  const blocking = audit.findings.filter(
    (finding) =>
      (finding.status === "manual_confirmation_required" || finding.status === "rejected") &&
      (repairIds.has(finding.ruleId) ||
        (finding.conflictsWith ? repairIds.has(finding.conflictsWith) : false)),
  );
  if (blocking.length) {
    const summary = blocking
      .map((finding) => `${finding.ruleId}:${finding.reason ?? finding.status}`)
      .join(", ");
    throw new Error(`Reviewed repair failed route audit: ${summary}.`);
  }

  return { changedRuleIds, insertedRuleIds, replacedRuleIds, nextRules };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const manifestArg = args.find((arg) => !arg.startsWith("--"));
  const confirmReview = args
    .find((arg) => arg.startsWith("--confirm-review="))
    ?.slice("--confirm-review=".length);
  const actor = args
    .find((arg) => arg.startsWith("--actor="))
    ?.slice("--actor=".length)
    .trim();
  return { apply, manifestPath: manifestArg ?? DEFAULT_MANIFEST, confirmReview, actor };
}

async function getSingleActiveTariff(island: IslandCode) {
  const snapshot = await getAdminDb()
    .collection("taxiTariffs")
    .where("island", "==", island)
    .where("status", "==", "active")
    .limit(2)
    .get();

  if (snapshot.empty) throw new Error(`No active ${island} taxi tariff exists.`);
  if (snapshot.size !== 1) {
    throw new Error(`Expected exactly one active ${island} taxi tariff; found ${snapshot.size}.`);
  }
  const doc = snapshot.docs[0];
  return { ref: doc.ref, tariff: { id: doc.id, ...doc.data() } as OfficialTaxiTariff };
}

async function main() {
  const args = parseArgs();
  const { absolute, raw, manifest } = loadManifest(args.manifestPath);
  const checksum = manifestChecksum(raw);
  const initial = await getSingleActiveTariff(manifest.island);
  const initialPlan = planRepair(initial.tariff, manifest);

  const summary = {
    mode: args.apply ? "apply" : "dry-run",
    manifest: absolute,
    manifestSha256: checksum,
    reviewReference: manifest.reviewReference,
    island: manifest.island,
    tariffId: initial.tariff.id,
    tariffVersion: initial.tariff.version,
    changedRuleIds: initialPlan.changedRuleIds,
    insertedRuleIds: initialPlan.insertedRuleIds,
    replacedRuleIds: initialPlan.replacedRuleIds,
    activationMetadataPreserved: true,
  };

  if (!args.apply) {
    console.log(JSON.stringify({ ...summary, applied: false }, null, 2));
    return;
  }

  if (args.confirmReview !== manifest.reviewReference) {
    throw new Error(`Apply requires --confirm-review=${manifest.reviewReference}.`);
  }
  if (!args.actor) throw new Error("Apply requires --actor=<authenticated operator identifier>.");
  if (!initialPlan.changedRuleIds.length) {
    console.log(JSON.stringify({ ...summary, applied: false, noOp: true }, null, 2));
    return;
  }

  const db = getAdminDb();
  const query = db
    .collection("taxiTariffs")
    .where("island", "==", manifest.island)
    .where("status", "==", "active")
    .limit(2);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(query);
    if (snapshot.size !== 1) {
      throw new Error(`Apply aborted: expected exactly one active ${manifest.island} tariff; found ${snapshot.size}.`);
    }
    const document = snapshot.docs[0];
    const fresh = { id: document.id, ...document.data() } as OfficialTaxiTariff;
    const freshPlan = planRepair(fresh, manifest);

    if (!sameValue(freshPlan.changedRuleIds, initialPlan.changedRuleIds)) {
      throw new Error("Apply aborted because the active tariff changed after the dry-run plan was created.");
    }
    if (!freshPlan.changedRuleIds.length) return;

    transaction.update(document.ref, {
      rules: freshPlan.nextRules,
      updatedAt: new Date().toISOString(),
      lastReviewedRepair: {
        reviewReference: manifest.reviewReference,
        sourceUrl: manifest.sourceUrl,
        manifestSha256: checksum,
        changedRuleIds: freshPlan.changedRuleIds,
        actor: args.actor,
        appliedAt: new Date().toISOString(),
      },
    });
  });

  const verified = await getSingleActiveTariff(manifest.island);
  const verificationPlan = planRepair(verified.tariff, manifest);
  if (verificationPlan.changedRuleIds.length) {
    throw new Error(`Post-apply verification failed; remaining drift: ${verificationPlan.changedRuleIds.join(", ")}.`);
  }

  console.log(JSON.stringify({ ...summary, applied: true, verifiedNoDrift: true }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
