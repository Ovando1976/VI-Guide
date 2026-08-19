import "server-only";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "@/lib/firebase-admin";
import type {
  OfficialTaxiRateRule,
  OfficialTaxiTariff,
} from "@/types/taxi-operations";

export const dynamic = "force-dynamic";

const REPAIR_REFERENCE = "phase1-airport-runtime-gate-2026-08-19";

const REQUIRED_RULES: OfficialTaxiRateRule[] = [
  {
    id: "stt-cyril-e-king-airport-charlotte-amalie",
    originNames: ["Airport Terminal"],
    destinationNames: ["Charlotte Amalie"],
    onePassengerFare: 11,
    perPersonFare: 9,
    notes:
      "Reviewed STT published tariff: Airport Terminal to Charlotte Amalie; reverse matching is handled by the official fare engine.",
  },
  {
    id: "stt-cyril-e-king-airport-havensight-crossroad",
    originNames: ["Airport Terminal"],
    destinationNames: ["Havensight", "Havensight (crossroad)"],
    onePassengerFare: 12,
    perPersonFare: 11,
    notes:
      "Reviewed STT published tariff: Airport Terminal to Havensight (crossroad); reverse matching is handled by the official fare engine. Yacht Haven-Havensight remains a distinct endpoint.",
  },
];

function sameRule(a: OfficialTaxiRateRule, b: OfficialTaxiRateRule) {
  return (
    a.id === b.id &&
    JSON.stringify(a.originNames) === JSON.stringify(b.originNames) &&
    JSON.stringify(a.destinationNames) === JSON.stringify(b.destinationNames) &&
    a.onePassengerFare === b.onePassengerFare &&
    a.perPersonFare === b.perPersonFare
  );
}

/**
 * One-shot Phase 1 repair endpoint.
 *
 * No request body is accepted. The operation is intentionally hard-coded to
 * two reviewed STT airport relationships, updates exactly one active verified
 * tariff in a transaction, and is idempotent. Delete this route before merge.
 */
export async function POST() {
  try {
    const db = getAdminDb();
    const query = db
      .collection("taxiTariffs")
      .where("island", "==", "stt")
      .where("status", "==", "active")
      .limit(2);

    const result = await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(query);
      if (snapshot.size !== 1) {
        throw new Error(
          `Expected exactly one active STT tariff; found ${snapshot.size}. No repair applied.`,
        );
      }

      const doc = snapshot.docs[0];
      const tariff = { id: doc.id, ...doc.data() } as OfficialTaxiTariff;

      if (tariff.activationStatus !== "verified") {
        throw new Error("Active STT tariff is not verified. No repair applied.");
      }
      if (!Array.isArray(tariff.rules)) {
        throw new Error("Active STT tariff has no valid rules array. No repair applied.");
      }

      const nextRules = [...tariff.rules];
      const changes: Array<{ id: string; action: "added" | "replaced" | "unchanged" }> = [];

      for (const required of REQUIRED_RULES) {
        const index = nextRules.findIndex((rule) => rule.id === required.id);
        if (index === -1) {
          nextRules.push(required);
          changes.push({ id: required.id, action: "added" });
          continue;
        }
        if (sameRule(nextRules[index], required)) {
          changes.push({ id: required.id, action: "unchanged" });
          continue;
        }
        nextRules[index] = required;
        changes.push({ id: required.id, action: "replaced" });
      }

      const changed = changes.some((entry) => entry.action !== "unchanged");
      if (changed) {
        transaction.update(doc.ref, {
          rules: nextRules,
          updatedAt: FieldValue.serverTimestamp(),
          reviewReference: tariff.reviewReference
            ? `${tariff.reviewReference}; ${REPAIR_REFERENCE}`
            : REPAIR_REFERENCE,
        });
      }

      return {
        tariffId: doc.id,
        tariffVersion: tariff.version,
        changed,
        changes,
        ruleCountBefore: tariff.rules.length,
        ruleCountAfter: nextRules.length,
      };
    });

    return NextResponse.json({ ok: true, repairReference: REPAIR_REFERENCE, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "airport_tariff_repair_failed",
        reason: error instanceof Error ? error.message : "Unknown repair failure.",
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error: "method_not_allowed",
      reason: "This one-shot repair accepts POST only.",
    },
    { status: 405, headers: { Allow: "POST" } },
  );
}
