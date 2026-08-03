import { FieldValue, Timestamp } from "firebase-admin/firestore";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import type {
  IntelligenceOrchestrationStep,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

const COLLECTION = "intelligence_runs";
const MAX_MESSAGE_PREVIEW = 280;
const MAX_ERROR_LENGTH = 1_000;

export type IntelligenceRunStatus =
  | "ready"
  | "waiting_for_user"
  | "failed";

export type IntelligenceRunRecord = {
  id: string;
  sessionId: string;
  userId?: string;
  island: string;
  page: string;
  messagePreview: string;
  status: IntelligenceRunStatus;
  intent: string;
  confidence?: string;
  requiredCapabilities: string[];
  missingInformation: string[];
  trace: IntelligenceOrchestrationStep[];
  warnings: string[];
  recommendationCount: number;
  actionCount: number;
  durationMs: number;
  modelEnabled: boolean;
  error?: string;
  createdAt: string;
  completedAt: string;
};

type RunStart = {
  id: string;
  startedAt: number;
};

function cleanPreview(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, MAX_MESSAGE_PREVIEW);
}

function safeError(error: unknown) {
  return (error instanceof Error ? error.message : String(error))
    .replace(/\s+/g, " ")
    .slice(0, MAX_ERROR_LENGTH);
}

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

export async function beginIntelligenceRun(
  request: IntelligenceRequest,
): Promise<RunStart> {
  const id = crypto.randomUUID();
  const startedAt = Date.now();

  if (!hasFirebaseAdminConfiguration()) return { id, startedAt };

  try {
    await getAdminDb().collection(COLLECTION).doc(id).set({
      sessionId: request.context.sessionId,
      ...(request.context.userId ? { userId: request.context.userId } : {}),
      island: request.context.island,
      page: request.context.page,
      messagePreview: cleanPreview(request.message),
      status: "running",
      intent: "pending",
      confidence: null,
      requiredCapabilities: request.capabilities ?? [],
      missingInformation: [],
      trace: [],
      warnings: [],
      recommendationCount: 0,
      actionCount: 0,
      durationMs: 0,
      modelEnabled: Boolean(process.env.OPENAI_API_KEY),
      createdAt: FieldValue.serverTimestamp(),
      completedAt: null,
    });
  } catch (error) {
    console.warn("Could not start intelligence telemetry.", error);
  }

  return { id, startedAt };
}

export async function completeIntelligenceRun(
  run: RunStart,
  result: IntelligenceResponse,
) {
  if (!hasFirebaseAdminConfiguration()) return;

  try {
    await getAdminDb().collection(COLLECTION).doc(run.id).set(
      {
        status: result.orchestration?.status ?? "ready",
        intent: result.orchestration?.intent ?? result.intent,
        confidence: result.confidence,
        requiredCapabilities:
          result.orchestration?.requiredCapabilities ?? [],
        missingInformation: result.orchestration?.missingInformation ?? [],
        trace: result.orchestration?.trace ?? [],
        warnings: result.warnings.slice(0, 20),
        recommendationCount: result.recommendations.length,
        actionCount: result.actions.length,
        durationMs: Date.now() - run.startedAt,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (error) {
    console.warn("Could not complete intelligence telemetry.", error);
  }
}

export async function failIntelligenceRun(run: RunStart, error: unknown) {
  if (!hasFirebaseAdminConfiguration()) return;

  try {
    await getAdminDb().collection(COLLECTION).doc(run.id).set(
      {
        status: "failed",
        error: safeError(error),
        durationMs: Date.now() - run.startedAt,
        completedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  } catch (telemetryError) {
    console.warn("Could not record intelligence failure telemetry.", telemetryError);
  }
}

export async function listRecentIntelligenceRuns(limit = 40) {
  if (!hasFirebaseAdminConfiguration()) return [] as IntelligenceRunRecord[];

  try {
    const snapshot = await getAdminDb()
      .collection(COLLECTION)
      .orderBy("createdAt", "desc")
      .limit(Math.max(1, Math.min(limit, 100)))
      .get();

    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        sessionId: String(data.sessionId ?? "unknown"),
        ...(data.userId ? { userId: String(data.userId) } : {}),
        island: String(data.island ?? "unknown"),
        page: String(data.page ?? "unknown"),
        messagePreview: String(data.messagePreview ?? ""),
        status: (data.status ?? "failed") as IntelligenceRunStatus,
        intent: String(data.intent ?? "pending"),
        ...(data.confidence ? { confidence: String(data.confidence) } : {}),
        requiredCapabilities: Array.isArray(data.requiredCapabilities)
          ? data.requiredCapabilities.map(String)
          : [],
        missingInformation: Array.isArray(data.missingInformation)
          ? data.missingInformation.map(String)
          : [],
        trace: Array.isArray(data.trace)
          ? (data.trace as IntelligenceOrchestrationStep[])
          : [],
        warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : [],
        recommendationCount: Number(data.recommendationCount ?? 0),
        actionCount: Number(data.actionCount ?? 0),
        durationMs: Number(data.durationMs ?? 0),
        modelEnabled: Boolean(data.modelEnabled),
        ...(data.error ? { error: String(data.error) } : {}),
        createdAt: timestampToIso(data.createdAt),
        completedAt: timestampToIso(data.completedAt ?? data.createdAt),
      } satisfies IntelligenceRunRecord;
    });
  } catch (error) {
    console.warn("Could not read intelligence telemetry.", error);
    return [] as IntelligenceRunRecord[];
  }
}
