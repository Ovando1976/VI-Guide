import { Timestamp } from "firebase-admin/firestore";

import { getAdminDb, hasFirebaseAdminConfiguration } from "@/lib/firebase-admin";
import {
  listAgentEventHandlers,
  listRecentIntelligenceEvents,
  type AgentEventResult,
} from "@/lib/intelligence/event-bus";
import {
  listRecentIntelligenceRuns,
  type IntelligenceRunRecord,
} from "@/lib/intelligence/telemetry";

const WORKFLOW_COLLECTION = "intelligence_workflows";

export type OperationsWorkflow = {
  id: string;
  island: string;
  intent: string;
  status: string;
  currentStep: string;
  missingInformation: string[];
  toolStates: Array<{ toolId: string; status: string; detail?: string }>;
  updatedAt: string;
};

export type AgentHealth = {
  agentId: string;
  subscriptions: string[];
  handled: number;
  completed: number;
  failed: number;
  averageDurationMs: number;
  health: "healthy" | "degraded" | "idle";
};

export type ToolUsage = {
  toolId: string;
  uses: number;
  waiting: number;
  failed: number;
};

function timestampToIso(value: unknown) {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
}

async function listRecentWorkflows(limit = 30): Promise<OperationsWorkflow[]> {
  if (!hasFirebaseAdminConfiguration()) return [];

  try {
    const snapshot = await getAdminDb()
      .collection(WORKFLOW_COLLECTION)
      .orderBy("updatedAt", "desc")
      .limit(Math.max(1, Math.min(limit, 60)))
      .get();

    return snapshot.docs.map((document) => {
      const data = document.data();
      return {
        id: document.id,
        island: String(data.island ?? "unknown"),
        intent: String(data.intent ?? "unknown"),
        status: String(data.status ?? "unknown"),
        currentStep: String(data.currentStep ?? "unknown"),
        missingInformation: Array.isArray(data.missingInformation)
          ? data.missingInformation.map(String)
          : [],
        toolStates: Array.isArray(data.toolStates)
          ? data.toolStates.map((state) => ({
              toolId: String(state?.toolId ?? "unknown"),
              status: String(state?.status ?? "unknown"),
              ...(state?.detail ? { detail: String(state.detail) } : {}),
            }))
          : [],
        updatedAt: timestampToIso(data.updatedAt),
      };
    });
  } catch (error) {
    console.warn("Could not read intelligence workflows.", error);
    return [];
  }
}

function summarizeAgents(
  events: Awaited<ReturnType<typeof listRecentIntelligenceEvents>>,
): AgentHealth[] {
  const handlers = listAgentEventHandlers();
  return handlers.map((handler) => {
    const results = events.flatMap((event) =>
      (event.agentResults as AgentEventResult[]).filter(
        (result) => result.agentId === handler.agentId,
      ),
    );
    const completed = results.filter((result) => result.status === "completed").length;
    const failed = results.filter((result) => result.status === "failed").length;
    const averageDurationMs = results.length
      ? Math.round(
          results.reduce((sum, result) => sum + Number(result.durationMs || 0), 0) /
            results.length,
        )
      : 0;

    return {
      agentId: handler.agentId,
      subscriptions: handler.eventTypes,
      handled: results.length,
      completed,
      failed,
      averageDurationMs,
      health: !results.length ? "idle" : failed / results.length > 0.2 ? "degraded" : "healthy",
    };
  });
}

function summarizeTools(workflows: OperationsWorkflow[]): ToolUsage[] {
  const usage = new Map<string, ToolUsage>();
  for (const workflow of workflows) {
    for (const state of workflow.toolStates) {
      const current = usage.get(state.toolId) ?? {
        toolId: state.toolId,
        uses: 0,
        waiting: 0,
        failed: 0,
      };
      current.uses += 1;
      if (state.status === "waiting") current.waiting += 1;
      if (state.status === "failed") current.failed += 1;
      usage.set(state.toolId, current);
    }
  }
  return Array.from(usage.values()).sort((a, b) => b.uses - a.uses);
}

function medianDuration(runs: IntelligenceRunRecord[]) {
  const values = runs.map((run) => run.durationMs).filter((value) => value >= 0).sort((a, b) => a - b);
  if (!values.length) return 0;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : Math.round((values[middle - 1] + values[middle]) / 2);
}

export async function loadOperationsConsoleData() {
  const [runs, events, workflows] = await Promise.all([
    listRecentIntelligenceRuns(60),
    listRecentIntelligenceEvents(80),
    listRecentWorkflows(40),
  ]);

  const failedEvents = events.filter((event) => event.status === "failed" || event.status === "partial").length;
  const waitingWorkflows = workflows.filter((workflow) => workflow.status === "waiting_for_user").length;
  const activeWorkflows = workflows.filter((workflow) => workflow.status === "active").length;

  return {
    runs,
    events,
    workflows,
    agents: summarizeAgents(events),
    tools: summarizeTools(workflows),
    metrics: {
      runs: runs.length,
      activeWorkflows,
      waitingWorkflows,
      failedRuns: runs.filter((run) => run.status === "failed").length,
      events: events.length,
      failedEvents,
      medianDurationMs: medianDuration(runs),
      healthyAgents: summarizeAgents(events).filter((agent) => agent.health === "healthy").length,
    },
  };
}
