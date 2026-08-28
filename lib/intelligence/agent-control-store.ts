import { FieldValue, Timestamp } from "firebase-admin/firestore";

import {
  sanitizeAgentControlTelemetry,
  type AgentControlEventLike,
} from "@/lib/intelligence/agent-control-telemetry";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

const EVENT_COLLECTION = "intelligence_events";
const OPERATOR_CANARY_COLLECTION = "agent_operator_canary_runs";

export type OperatorCanaryRunStatus = "running" | "completed" | "failed";

export type OperatorCanarySafeRecord = Readonly<{
  version: 1;
  environment: "preview";
  worker: Readonly<{
    status: "disabled" | "completed" | "partial" | "failed";
    workerId: string | null;
    model: string | null;
    attemptedTasks: number;
    completedTasks: number;
    failedTasks: number;
    modelCalls: number;
    acceptedDelegations: number;
    rejectedDelegations: number;
    brokerCalls: number;
    brokerCompleted: number;
    brokerRejected: number;
    brokerFailed: number;
  }>;
  agentIds: readonly string[];
  taskCount: number;
  messageCount: number;
  missingCapabilities: readonly string[];
}>;

export type OperatorCanaryClaim = Readonly<{
  claimed: boolean;
  status: OperatorCanaryRunStatus | null;
}>;

export type OperatorCanaryRunStore = Readonly<{
  claim(runKey: string): Promise<OperatorCanaryClaim>;
  complete(runKey: string, record: OperatorCanarySafeRecord): Promise<void>;
  fail(runKey: string, record?: OperatorCanarySafeRecord): Promise<void>;
}>;

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

function safeRunKey(runKey: string) {
  const normalized = runKey.trim().toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error("Invalid operator canary run key.");
  }
  return normalized;
}

function storedStatus(value: unknown): OperatorCanaryRunStatus | null {
  return value === "running" || value === "completed" || value === "failed"
    ? value
    : null;
}

function telemetryPayload(record: OperatorCanarySafeRecord) {
  return {
    shadowCanary: {
      selected: true,
      reason: "operator_selected",
      environment: record.environment,
      sampleRateBps: 0,
      sampleBucket: null,
      explicitCohort: false,
      maxWorkerTasks: 1,
    },
    collective: {
      status: record.worker.status,
      agents: [...record.agentIds].slice(0, 8),
      taskCount: record.taskCount,
      messageCount: record.messageCount,
      missingCapabilities: [...record.missingCapabilities].slice(0, 8),
      workerShadow: { ...record.worker },
    },
  };
}

function canaryEvent(
  key: string,
  record: OperatorCanarySafeRecord,
  status: "completed" | "failed",
) {
  return {
    id: `operator-canary-${key}`,
    type: "agent.operator_canary",
    ownerKey: "system:operator-canary",
    runId: `operator-canary-${key.slice(0, 16)}`,
    island: "stt",
    intent: "operator_preview_canary",
    payload: telemetryPayload(record),
    status,
    agentResults: [],
    createdAt: FieldValue.serverTimestamp(),
    processedAt: FieldValue.serverTimestamp(),
  };
}

export function createFirestoreOperatorCanaryRunStore(): OperatorCanaryRunStore | null {
  if (!hasFirebaseAdminConfiguration()) return null;
  const db = getAdminDb();

  return Object.freeze({
    async claim(runKey: string) {
      const key = safeRunKey(runKey);
      const ref = db.collection(OPERATOR_CANARY_COLLECTION).doc(key);
      return db.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (snapshot.exists) {
          return Object.freeze({
            claimed: false,
            status: storedStatus(snapshot.data()?.status),
          });
        }
        transaction.create(ref, {
          version: 1,
          status: "running",
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        });
        return Object.freeze({ claimed: true, status: "running" as const });
      });
    },

    async complete(runKey: string, record: OperatorCanarySafeRecord) {
      const key = safeRunKey(runKey);
      const runRef = db.collection(OPERATOR_CANARY_COLLECTION).doc(key);
      const eventRef = db.collection(EVENT_COLLECTION).doc(`operator-canary-${key}`);
      const batch = db.batch();
      batch.set(
        runRef,
        {
          version: 1,
          status: "completed",
          result: record,
          updatedAt: FieldValue.serverTimestamp(),
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      batch.set(eventRef, canaryEvent(key, record, "completed"));
      await batch.commit();
    },

    async fail(runKey: string, record?: OperatorCanarySafeRecord) {
      const key = safeRunKey(runKey);
      const runRef = db.collection(OPERATOR_CANARY_COLLECTION).doc(key);
      const batch = db.batch();
      batch.set(
        runRef,
        {
          version: 1,
          status: "failed",
          failureReason: "execution_failed",
          ...(record ? { result: record } : {}),
          updatedAt: FieldValue.serverTimestamp(),
          completedAt: FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
      if (record) {
        const eventRef = db
          .collection(EVENT_COLLECTION)
          .doc(`operator-canary-${key}`);
        batch.set(eventRef, canaryEvent(key, record, "failed"));
      }
      await batch.commit();
    },
  });
}

export async function listRecentAgentControlEvents(limit = 100) {
  if (!hasFirebaseAdminConfiguration()) return [] as AgentControlEventLike[];

  try {
    const snapshot = await getAdminDb()
      .collection(EVENT_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(Math.max(1, Math.min(limit, 100)))
      .get();

    return snapshot.docs.map((document) => {
      const data = document.data();
      return Object.freeze({
        runId: String(data.runId ?? document.id).slice(0, 160),
        createdAt: timestampToIso(data.createdAt),
        control: sanitizeAgentControlTelemetry(data.payload),
      });
    });
  } catch (error) {
    console.warn("Could not read agent control telemetry.", error);
    return [] as AgentControlEventLike[];
  }
}
