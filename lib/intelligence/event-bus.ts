import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";

const EVENT_COLLECTION = "intelligence_events";

export type IntelligenceEventType =
  | "workflow.created"
  | "workflow.updated"
  | "workflow.waiting"
  | "workflow.resumed"
  | "trip.planned"
  | "mobility.requested"
  | "booking.reviewed"
  | "memory.updated";

export type IntelligenceEvent = {
  id: string;
  type: IntelligenceEventType;
  ownerKey: string;
  workflowId?: string;
  runId: string;
  island: string;
  intent: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AgentEventResult = {
  agentId: string;
  status: "completed" | "skipped" | "failed";
  detail: string;
  durationMs: number;
};

export type AgentEventHandler = {
  agentId: string;
  eventTypes: readonly IntelligenceEventType[];
  handle(event: IntelligenceEvent): Promise<Omit<AgentEventResult, "agentId" | "durationMs">>;
};

const handlers = new Map<string, AgentEventHandler>();

export function registerAgentEventHandler(handler: AgentEventHandler) {
  if (handlers.has(handler.agentId)) {
    throw new Error(`Agent event handler already registered: ${handler.agentId}`);
  }
  handlers.set(handler.agentId, handler);
  return handler;
}

export function listAgentEventHandlers() {
  return Array.from(handlers.values()).map((handler) => ({
    agentId: handler.agentId,
    eventTypes: [...handler.eventTypes],
  }));
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

async function persistEvent(
  event: IntelligenceEvent,
  status: "processing" | "completed" | "partial" | "failed",
  results: AgentEventResult[] = [],
) {
  if (!hasFirebaseAdminConfiguration()) return;

  try {
    await getAdminDb().collection(EVENT_COLLECTION).doc(event.id).set(
      {
        ...event,
        createdAt: FieldValue.serverTimestamp(),
        status,
        agentResults: results,
        processedAt:
          status === "processing" ? null : FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("VI Guide event persistence did not block execution.", error);
  }
}

export async function publishIntelligenceEvent(
  input: Omit<IntelligenceEvent, "id" | "createdAt">,
) {
  const event: IntelligenceEvent = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };

  await persistEvent(event, "processing");

  const subscribers = Array.from(handlers.values()).filter((handler) =>
    handler.eventTypes.includes(event.type),
  );
  const results: AgentEventResult[] = [];

  for (const subscriber of subscribers) {
    const startedAt = Date.now();
    try {
      const result = await subscriber.handle(event);
      results.push({
        agentId: subscriber.agentId,
        ...result,
        durationMs: Date.now() - startedAt,
      });
    } catch (error) {
      results.push({
        agentId: subscriber.agentId,
        status: "failed",
        detail: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      });
    }
  }

  const failed = results.filter((result) => result.status === "failed").length;
  const finalStatus = failed === 0 ? "completed" : failed === results.length ? "failed" : "partial";
  await persistEvent(event, finalStatus, results);

  return { event, results, status: finalStatus };
}

export async function listRecentIntelligenceEvents(limit = 50) {
  if (!hasFirebaseAdminConfiguration()) return [];

  try {
    const snapshot = await getAdminDb()
      .collection(EVENT_COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(Math.max(1, Math.min(limit, 100)))
      .get();

    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        type: String(data.type),
        ownerKey: String(data.ownerKey ?? "unknown"),
        workflowId: data.workflowId ? String(data.workflowId) : undefined,
        runId: String(data.runId ?? "unknown"),
        island: String(data.island ?? "unknown"),
        intent: String(data.intent ?? "unknown"),
        status: String(data.status ?? "unknown"),
        agentResults: Array.isArray(data.agentResults) ? data.agentResults : [],
        createdAt: timestampToIso(data.createdAt),
        processedAt: data.processedAt ? timestampToIso(data.processedAt) : undefined,
      };
    });
  } catch (error) {
    console.warn("Could not read intelligence events.", error);
    return [];
  }
}
