import { Timestamp } from "firebase-admin/firestore";

import {
  sanitizeAgentControlTelemetry,
  type AgentControlEventLike,
} from "@/lib/intelligence/agent-control-telemetry";
import {
  getAdminDb,
  hasFirebaseAdminConfiguration,
} from "@/lib/firebase-admin";

const EVENT_COLLECTION = "intelligence_events";

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
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
