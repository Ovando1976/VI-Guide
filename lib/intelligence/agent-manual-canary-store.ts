import { createHash } from "node:crypto";

import { FieldValue } from "firebase-admin/firestore";

import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";
import {
  sanitizeAgentControlTelemetry,
  type AgentControlTelemetry,
} from "@/lib/intelligence/agent-control-telemetry";

const CLAIM_COLLECTION = "agent_canary_run_claims";
const EVENT_COLLECTION = "intelligence_events";

export type ManualAgentCanaryClaim = Readonly<{
  status: "claimed" | "replayed" | "pending" | "unavailable";
  runId: string | null;
  claimId: string | null;
}>;

export function validManualAgentCanaryIdempotencyKey(value: string | null) {
  if (!value) return false;
  const key = value.trim();
  return (
    key.length >= 20 &&
    key.length <= 160 &&
    /^[A-Za-z0-9._:-]+$/.test(key)
  );
}

function claimIdForKey(key: string) {
  return createHash("sha256").update(key).digest("hex");
}

export async function claimManualAgentCanaryRun(
  idempotencyKey: string,
): Promise<ManualAgentCanaryClaim> {
  if (!hasFirebaseAdminConfiguration()) {
    return Object.freeze({
      status: "unavailable",
      runId: null,
      claimId: null,
    });
  }

  const key = idempotencyKey.trim();
  if (!validManualAgentCanaryIdempotencyKey(key)) {
    throw new Error("Invalid manual canary idempotency key.");
  }

  const claimId = claimIdForKey(key);
  const runId = `manual-canary-${claimId.slice(0, 24)}`;
  const reference = getAdminDb().collection(CLAIM_COLLECTION).doc(claimId);
  let status: ManualAgentCanaryClaim["status"] = "claimed";

  await getAdminDb().runTransaction(async (transaction) => {
    const existing = await transaction.get(reference);
    if (existing.exists) {
      status = existing.get("status") === "completed" ? "replayed" : "pending";
      return;
    }

    transaction.create(reference, {
      runId,
      status: "claimed",
      createdAt: FieldValue.serverTimestamp(),
      // Never persist the raw idempotency key. The document id is its SHA-256.
      source: "admin_preview_manual_canary",
    });
  });

  return Object.freeze({ status, runId, claimId });
}

export async function recordManualAgentCanaryEvent(input: {
  runId: string;
  claimId: string;
  control: AgentControlTelemetry;
  workerStatus: string;
}) {
  if (!hasFirebaseAdminConfiguration()) {
    throw new Error("Agent canary control store is unavailable.");
  }

  const db = getAdminDb();
  const control = sanitizeAgentControlTelemetry(input.control);
  const eventReference = db
    .collection(EVENT_COLLECTION)
    .doc(`manual-agent-canary-${input.runId}`);
  const claimReference = db.collection(CLAIM_COLLECTION).doc(input.claimId);
  const batch = db.batch();
  const eventStatus =
    input.workerStatus === "completed"
      ? "completed"
      : input.workerStatus === "failed"
        ? "failed"
        : "partial";

  // This is an isolated observability write. It intentionally bypasses the
  // event bus so no subscriber, booking, mobility, notification, or commerce
  // handler can execute from a manual synthetic canary.
  batch.set(eventReference, {
    type: "agent.canary.manual",
    ownerKey: "system:manual-agent-canary",
    runId: input.runId,
    island: "stt",
    intent: "synthetic_preview_canary",
    payload: {
      shadowCanary: control.shadowCanary,
      collective: control.collective,
    },
    createdAt: FieldValue.serverTimestamp(),
    processedAt: FieldValue.serverTimestamp(),
    status: eventStatus,
    agentResults: [],
    source: "admin_preview_manual_canary",
  });
  batch.update(claimReference, {
    status: "completed",
    workerStatus: input.workerStatus,
    completedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}
