import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { getAdminDb } from "@/lib/firebase-admin";
import {
  assertMigratedSttAirportReleaseGate,
  type AirportReleaseGateManifest,
  planLegacySttAirportReleaseGateMigration,
} from "@/lib/stt-airport-release-gate-migration";
import type { OfficialTaxiTariff } from "@/types/taxi-operations";

const DEFAULT_MANIFEST =
  "data/taxi-tariff-repairs/issue-385-stt-airport-release-gate.json";

function requiredText(value: unknown, label: string) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${label} is required.`);
  }
  return value.trim();
}

function loadManifest(filePath: string) {
  const absolute = path.resolve(filePath);
  const raw = fs.readFileSync(absolute, "utf8");
  const parsed = JSON.parse(raw) as Partial<AirportReleaseGateManifest> & {
    schemaVersion?: number;
  };

  if (parsed.schemaVersion !== 1) {
    throw new Error("Airport release-gate manifest schemaVersion must be 1.");
  }
  const tariffVersion = requiredText(
    parsed.tariffVersion,
    "Airport release-gate manifest tariffVersion",
  );
  const reviewReference = requiredText(
    parsed.reviewReference,
    "Airport release-gate manifest reviewReference",
  );
  const sourceUrl = requiredText(
    parsed.sourceUrl,
    "Airport release-gate manifest sourceUrl",
  );
  if (!Array.isArray(parsed.rules)) {
    throw new Error("Airport release-gate manifest rules are required.");
  }

  return {
    absolute,
    raw,
    manifest: {
      tariffVersion,
      reviewReference,
      sourceUrl,
      rules: parsed.rules,
    } satisfies AirportReleaseGateManifest,
  };
}

function sha256(value: string) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function stateChecksum(tariff: OfficialTaxiTariff) {
  return sha256(
    JSON.stringify({
      version: tariff.version,
      rules: tariff.rules,
    }),
  );
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

  return {
    apply,
    manifestPath: manifestArg ?? DEFAULT_MANIFEST,
    confirmReview,
    actor,
  };
}

async function getSingleActiveSttTariff() {
  const snapshot = await getAdminDb()
    .collection("taxiTariffs")
    .where("island", "==", "stt")
    .where("status", "==", "active")
    .limit(2)
    .get();

  if (snapshot.size !== 1) {
    throw new Error(
      `Expected exactly one active STT taxi tariff; found ${snapshot.size}.`,
    );
  }

  const doc = snapshot.docs[0];
  return {
    ref: doc.ref,
    tariff: { id: doc.id, ...doc.data() } as OfficialTaxiTariff,
  };
}

async function main() {
  const args = parseArgs();
  const { absolute, raw, manifest } = loadManifest(args.manifestPath);
  const manifestSha256 = sha256(raw);

  const initial = await getSingleActiveSttTariff();
  const initialStateSha256 = stateChecksum(initial.tariff);
  const plan = planLegacySttAirportReleaseGateMigration(
    initial.tariff,
    manifest,
  );

  const summary = {
    mode: args.apply ? "apply" : "dry-run",
    manifest: absolute,
    manifestSha256,
    reviewReference: manifest.reviewReference,
    tariffId: initial.tariff.id,
    fromVersion: plan.fromVersion,
    toVersion: plan.toVersion,
    initialRuleCount: initial.tariff.rules.length,
    nextRuleCount: plan.nextRules.length,
    removedRuleIds: plan.removedRuleIds,
    insertedRuleIds: plan.insertedRuleIds,
    activationMetadataPreserved: true,
    sourceStateSha256: initialStateSha256,
  };

  if (!args.apply) {
    console.log(JSON.stringify({ ...summary, applied: false }, null, 2));
    return;
  }

  if (args.confirmReview !== manifest.reviewReference) {
    throw new Error(
      `Apply requires --confirm-review=${manifest.reviewReference}.`,
    );
  }
  if (!args.actor) {
    throw new Error("Apply requires --actor=<authenticated operator identifier>.");
  }

  const db = getAdminDb();
  const query = db
    .collection("taxiTariffs")
    .where("island", "==", "stt")
    .where("status", "==", "active")
    .limit(2);

  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(query);
    if (snapshot.size !== 1) {
      throw new Error(
        `Apply aborted: expected exactly one active STT tariff; found ${snapshot.size}.`,
      );
    }

    const document = snapshot.docs[0];
    const fresh = {
      id: document.id,
      ...document.data(),
    } as OfficialTaxiTariff;

    if (stateChecksum(fresh) !== initialStateSha256) {
      throw new Error(
        "Apply aborted because the active STT tariff changed after the dry-run plan was created.",
      );
    }

    const freshPlan = planLegacySttAirportReleaseGateMigration(fresh, manifest);
    const appliedAt = new Date().toISOString();

    transaction.update(document.ref, {
      version: freshPlan.toVersion,
      rules: freshPlan.nextRules,
      updatedAt: appliedAt,
      lastReviewedRepair: {
        migration: "legacy-stt-airport-release-gate",
        migrationFromVersion: freshPlan.fromVersion,
        reviewReference: manifest.reviewReference,
        sourceUrl: manifest.sourceUrl,
        manifestSha256,
        removedRuleIds: freshPlan.removedRuleIds,
        insertedRuleIds: freshPlan.insertedRuleIds,
        actor: args.actor,
        appliedAt,
      },
    });
  });

  const verified = await getSingleActiveSttTariff();
  assertMigratedSttAirportReleaseGate(verified.tariff, manifest);

  console.log(
    JSON.stringify(
      {
        ...summary,
        applied: true,
        verifiedNoSemanticDuplicates: true,
        verifiedReviewedRulesExact: true,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
