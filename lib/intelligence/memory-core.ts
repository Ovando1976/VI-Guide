import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { normalizeActiveTrip } from "@/lib/intelligence/active-trip";
import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import type {
  IntelligenceMemory,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

const PROFILE_COLLECTION = "intelligence_memory_profiles";
const WORKFLOW_COLLECTION = "intelligence_workflows";
const MEMORY_VERSION = 2;

export type PersistentToolState = {
  toolId: string;
  status: "pending" | "waiting" | "ready" | "completed" | "failed";
  updatedAt: string;
  detail?: string;
};

export type PersistentWorkflow = {
  id: string;
  ownerKey: string;
  sessionId: string;
  userId?: string;
  island: string;
  intent: string;
  status: "active" | "waiting_for_user" | "completed" | "failed";
  currentStep: string;
  missingInformation: string[];
  toolStates: PersistentToolState[];
  memory: IntelligenceMemory;
  createdAt: string;
  updatedAt: string;
};

export type MemorySnapshot = {
  ownerKey: string;
  memory: IntelligenceMemory;
  activeWorkflow?: PersistentWorkflow;
  source: "firestore" | "request";
  version: number;
};

function ownerKey(request: IntelligenceRequest) {
  return request.context.userId
    ? `user_${request.context.userId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 150)}`
    : `session_${request.context.sessionId}`;
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export function mergeIntelligenceMemory(
  stored: IntelligenceMemory | undefined,
  incoming: IntelligenceMemory,
): IntelligenceMemory {
  const activeTrip = normalizeActiveTrip(incoming.activeTrip ?? stored?.activeTrip);
  return {
    ...(stored ?? {}),
    ...incoming,
    party: { ...(stored?.party ?? {}), ...(incoming.party ?? {}) },
    preferences: {
      ...(stored?.preferences ?? {}),
      ...(incoming.preferences ?? {}),
      interests: Array.from(
        new Set([
          ...(stored?.preferences?.interests ?? []),
          ...(incoming.preferences?.interests ?? []),
        ]),
      ).slice(0, 40),
      food: Array.from(
        new Set([
          ...(stored?.preferences?.food ?? []),
          ...(incoming.preferences?.food ?? []),
        ]),
      ).slice(0, 30),
      avoid: Array.from(
        new Set([
          ...(stored?.preferences?.avoid ?? []),
          ...(incoming.preferences?.avoid ?? []),
        ]),
      ).slice(0, 30),
    },
    cruise: { ...(stored?.cruise ?? {}), ...(incoming.cruise ?? {}) },
    ...(activeTrip ? { activeTrip } : {}),
    recentPlaceIds: Array.from(
      new Set([
        ...(stored?.recentPlaceIds ?? []),
        ...(incoming.recentPlaceIds ?? []),
      ]),
    ).slice(-30),
    savedPlaceIds: Array.from(
      new Set([
        ...(stored?.savedPlaceIds ?? []),
        ...(incoming.savedPlaceIds ?? []),
      ]),
    ).slice(-100),
  };
}

export function applyCanonicalActiveTripState(
  memory: IntelligenceMemory,
  canonicalProfileLoaded: boolean,
  canonicalMemory: IntelligenceMemory | undefined,
  requestMemory: IntelligenceMemory,
): IntelligenceMemory {
  if (
    !canonicalProfileLoaded ||
    canonicalMemory?.activeTrip ||
    requestMemory.activeTrip
  ) {
    return memory;
  }
  const { activeTrip: _staleActiveTrip, ...remaining } = memory;
  return remaining;
}

function deserializeWorkflow(
  id: string,
  data: Record<string, unknown>,
): PersistentWorkflow {
  return {
    id,
    ownerKey: String(data.ownerKey ?? "unknown"),
    sessionId: String(data.sessionId ?? "unknown"),
    ...(data.userId ? { userId: String(data.userId) } : {}),
    island: String(data.island ?? "stt"),
    intent: String(data.intent ?? "discovery"),
    status: (data.status ?? "active") as PersistentWorkflow["status"],
    currentStep: String(data.currentStep ?? "classify"),
    missingInformation: Array.isArray(data.missingInformation)
      ? data.missingInformation.map(String)
      : [],
    toolStates: Array.isArray(data.toolStates)
      ? (data.toolStates as PersistentToolState[])
      : [],
    memory: (data.memory ?? {}) as IntelligenceMemory,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function loadMemorySnapshot(
  request: IntelligenceRequest,
): Promise<MemorySnapshot> {
  const key = ownerKey(request);
  const fallback: MemorySnapshot = {
    ownerKey: key,
    memory: request.context.memory,
    source: "request",
    version: MEMORY_VERSION,
  };

  if (!hasFirebaseAdminConfiguration()) return fallback;

  try {
    const db = getAdminDb();
    const travelerProfileRef = request.context.userId
      ? db
          .collection("users")
          .doc(request.context.userId)
          .collection("profile")
          .doc("travel")
      : null;
    const [profile, workflows, travelerProfile] = await Promise.all([
      db.collection(PROFILE_COLLECTION).doc(key).get(),
      db
        .collection(WORKFLOW_COLLECTION)
        .where("ownerKey", "==", key)
        .where("status", "in", ["active", "waiting_for_user"])
        .limit(5)
        .get(),
      travelerProfileRef ? travelerProfileRef.get() : Promise.resolve(null),
    ]);

    const storedMemory = profile.exists
      ? (profile.data()?.memory as IntelligenceMemory | undefined)
      : undefined;
    const canonicalMemory = travelerProfile?.exists
      ? (travelerProfile.data()?.memory as IntelligenceMemory | undefined)
      : undefined;
    const activeDocument = workflows.docs.sort((a, b) => {
      const aTime = a.data().updatedAt as Timestamp | undefined;
      const bTime = b.data().updatedAt as Timestamp | undefined;
      return (bTime?.toMillis() ?? 0) - (aTime?.toMillis() ?? 0);
    })[0];
    const mergedMemory = mergeIntelligenceMemory(
      mergeIntelligenceMemory(storedMemory, canonicalMemory ?? {}),
      request.context.memory,
    );
    const hydratedMemory = applyCanonicalActiveTripState(
      mergedMemory,
      travelerProfile?.exists === true,
      canonicalMemory,
      request.context.memory,
    );

    return {
      ownerKey: key,
      memory: hydratedMemory,
      ...(activeDocument
        ? { activeWorkflow: deserializeWorkflow(activeDocument.id, activeDocument.data()) }
        : {}),
      source: "firestore",
      version: MEMORY_VERSION,
    };
  } catch (error) {
    console.warn("USVI Explorer memory hydration fell back to request context.", error);
    return fallback;
  }
}

export function hydrateRequestFromMemory(
  request: IntelligenceRequest,
  snapshot: MemorySnapshot,
): IntelligenceRequest {
  return {
    ...request,
    context: {
      ...request.context,
      memory: snapshot.memory,
      party: {
        ...request.context.party,
        ...(snapshot.memory.party ?? {}),
        accessibilityNeeds:
          request.context.party.accessibilityNeeds ??
          snapshot.memory.party?.accessibilityNeeds ??
          [],
      },
      preferences: {
        ...request.context.preferences,
        ...(snapshot.memory.preferences ?? {}),
        interests: Array.from(
          new Set([
            ...(snapshot.memory.preferences?.interests ?? []),
            ...request.context.preferences.interests,
          ]),
        ),
        food:
          request.context.preferences.food ??
          snapshot.memory.preferences?.food ??
          [],
        avoid:
          request.context.preferences.avoid ??
          snapshot.memory.preferences?.avoid ??
          [],
      },
    },
  };
}

function toolStatesFromResult(result: IntelligenceResponse): PersistentToolState[] {
  const now = new Date().toISOString();
  return (result.orchestration?.tools ?? []).map((tool) => ({
    toolId: tool.id,
    status: result.orchestration?.status === "waiting_for_user" ? "waiting" : "ready",
    updatedAt: now,
    detail: `${tool.name} selected for ${result.orchestration?.intent ?? result.intent}`,
  }));
}

export async function persistMemoryResult(
  request: IntelligenceRequest,
  snapshot: MemorySnapshot,
  result: IntelligenceResponse,
) {
  if (!hasFirebaseAdminConfiguration()) return;

  const memory = mergeIntelligenceMemory(snapshot.memory, result.memoryPatch);
  const status =
    result.orchestration?.status === "waiting_for_user"
      ? "waiting_for_user"
      : "active";
  const workflowId = snapshot.activeWorkflow?.id ?? crypto.randomUUID();
  const currentStep =
    result.orchestration?.trace.at(-1)?.node ?? snapshot.activeWorkflow?.currentStep ?? "finalize";

  try {
    const db = getAdminDb();
    const batch = db.batch();
    const profileRef = db.collection(PROFILE_COLLECTION).doc(snapshot.ownerKey);
    const workflowRef = db.collection(WORKFLOW_COLLECTION).doc(workflowId);

    batch.set(
      profileRef,
      {
        ownerKey: snapshot.ownerKey,
        sessionId: request.context.sessionId,
        ...(request.context.userId ? { userId: request.context.userId } : {}),
        preferredIsland: request.context.island,
        memory,
        version: MEMORY_VERSION,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    batch.set(
      workflowRef,
      {
        ownerKey: snapshot.ownerKey,
        sessionId: request.context.sessionId,
        ...(request.context.userId ? { userId: request.context.userId } : {}),
        island: request.context.island,
        intent: result.orchestration?.intent ?? result.intent,
        status,
        currentStep,
        missingInformation: result.orchestration?.missingInformation ?? [],
        toolStates: toolStatesFromResult(result),
        memory,
        lastRunId: result.runId,
        version: MEMORY_VERSION,
        updatedAt: FieldValue.serverTimestamp(),
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    await batch.commit();
  } catch (error) {
    console.warn("USVI Explorer memory persistence did not block the response.", error);
  }
}
