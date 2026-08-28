import { randomUUID } from "node:crypto";

import type { CollectiveAgentRegistry } from "@/lib/intelligence/agent-registry";
import { defaultCollectiveAgentRegistry } from "@/lib/intelligence/agent-registry";
import type { CollectivePolicy } from "@/lib/intelligence/agent-policy";
import { DEFAULT_COLLECTIVE_POLICY } from "@/lib/intelligence/agent-policy";
import type {
  AgentToolAuditRecord,
  AgentToolEvidence,
  ReadOnlyAgentToolBroker,
} from "@/lib/intelligence/agent-tool-broker";
import type { AgentWorker, AgentWorkerOutput } from "@/lib/intelligence/agent-worker";
import { BoundedAgentCollective } from "@/lib/intelligence/coordination-runtime";
import type { IntelligenceToolDescriptor } from "@/lib/intelligence/tool-registry";
import type {
  IntelligenceCapability,
  IntelligenceCoordinationSummary,
  IntelligenceRequest,
} from "@/types/intelligence";

const DEFAULT_MAX_WORKER_TASKS = 2;
const MAX_MODEL_CALLS = 3;

export type AgentWorkerShadowReport = Readonly<{
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
  brokerAudits: readonly AgentToolAuditRecord[];
}>;

export type AgentWorkerShadowResult = Readonly<{
  coordination: IntelligenceCoordinationSummary;
  workerShadow: AgentWorkerShadowReport;
}>;

function safeWorkerError(error: unknown) {
  if (error instanceof Error && error.name === "AbortError") {
    return "Advisory worker timed out.";
  }
  return "Advisory worker could not complete this task.";
}

function messageTypeForOutput(output: AgentWorkerOutput) {
  if (output.kind === "delegate") return "proposal" as const;
  if (output.kind === "tool_request") return "challenge" as const;
  return output.kind;
}

function authorizedWorkerCapabilities(
  output: AgentWorkerOutput,
  allowedCapabilities: readonly IntelligenceCapability[],
) {
  const allowed = new Set(allowedCapabilities);
  return Array.from(
    new Set(
      output.requestedCapabilities.filter((capability) =>
        allowed.has(capability),
      ),
    ),
  );
}

function syntheticChallenge(summary: string): AgentWorkerOutput {
  return Object.freeze({
    kind: "challenge" as const,
    summary,
    confidence: "low" as const,
    requestedCapabilities: Object.freeze([]),
    toolRequest: null,
  });
}

function evidenceMessage(evidence: AgentToolEvidence) {
  const header = `Read-only broker evidence from ${evidence.toolId} (${evidence.queryHash}).`;
  const records = evidence.records.slice(0, 3).map((record) => {
    const summary = record.summary.replace(/\s+/g, " ").trim().slice(0, 320);
    return `[${record.sourceSystem}:${record.sourceId}] ${record.title} — ${summary}`;
  });
  return [header, ...records].join("\n").slice(0, 1_900);
}

export async function runAgentWorkerShadow(input: {
  request: IntelligenceRequest;
  requiredCapabilities: readonly IntelligenceCapability[];
  tools: readonly IntelligenceToolDescriptor[];
  worker: AgentWorker | null;
  broker?: ReadOnlyAgentToolBroker | null;
  registry?: CollectiveAgentRegistry;
  policy?: CollectivePolicy;
  maxWorkerTasks?: number;
}): Promise<AgentWorkerShadowResult> {
  const registry = input.registry ?? defaultCollectiveAgentRegistry;
  const policy = input.policy ?? DEFAULT_COLLECTIVE_POLICY;
  const requiredCapabilities = Array.from(
    new Set(input.requiredCapabilities),
  );
  const collective = new BoundedAgentCollective(
    input.request,
    input.tools,
    registry,
    policy,
    requiredCapabilities,
  );
  collective.bootstrap(requiredCapabilities);

  if (!input.worker) {
    return {
      coordination: collective.summary(),
      workerShadow: Object.freeze({
        status: "disabled",
        workerId: null,
        model: null,
        attemptedTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        modelCalls: 0,
        acceptedDelegations: 0,
        rejectedDelegations: 0,
        brokerCalls: 0,
        brokerCompleted: 0,
        brokerRejected: 0,
        brokerFailed: 0,
        brokerAudits: Object.freeze([]),
      }),
    };
  }

  const maxWorkerTasks = Math.max(
    1,
    Math.min(input.maxWorkerTasks ?? DEFAULT_MAX_WORKER_TASKS, 4),
  );
  const attempted = new Set<string>();
  const brokerAudits: AgentToolAuditRecord[] = [];
  let attemptedTasks = 0;
  let completedTasks = 0;
  let failedTasks = 0;
  let modelCalls = 0;
  let acceptedDelegations = 0;
  let rejectedDelegations = 0;
  let brokerCalls = 0;
  let brokerCompleted = 0;
  let brokerRejected = 0;
  let brokerFailed = 0;

  while (attemptedTasks < maxWorkerTasks && modelCalls < MAX_MODEL_CALLS) {
    const task = collective.board
      .listTasks()
      .find(
        (candidate) =>
          candidate.status === "claimed" && !attempted.has(candidate.id),
      );
    if (!task?.claimedBy) break;

    attempted.add(task.id);
    attemptedTasks += 1;
    const agent = registry.get(task.claimedBy);
    if (!agent) {
      failedTasks += 1;
      try {
        collective.board.failTask(
          task.id,
          task.claimedBy,
          "Assigned collective agent is unavailable.",
        );
      } catch {
        // The immutable runtime may already have expired; fail closed.
      }
      continue;
    }

    const brokerContext = {
      request: input.request,
      rootIntent: collective.board.rootIntent,
      agent,
      task,
      tools: input.tools,
    };
    const requestableToolIds =
      input.broker?.listAvailableToolIds(brokerContext) ?? [];

    try {
      let output = await input.worker.run({
        request: input.request,
        rootIntent: collective.board.rootIntent,
        agent,
        task,
        messages: collective.board.listMessages(),
        tools: input.tools,
        requestableToolIds,
      });
      modelCalls += 1;

      if (output.kind === "tool_request") {
        if (!input.broker || !output.toolRequest) {
          brokerRejected += 1;
          output = syntheticChallenge(
            "The requested read-only evidence lookup is not available for this task.",
          );
        } else {
          brokerCalls += 1;
          const brokerResult = await input.broker.execute(
            output.toolRequest,
            brokerContext,
          );
          brokerAudits.push(brokerResult.audit);

          if (brokerResult.status === "completed" && brokerResult.evidence) {
            brokerCompleted += 1;
            collective.board.postMessage({
              id: `broker-evidence-${randomUUID()}`,
              type: "evidence",
              fromAgentId: "read-only-tool-broker",
              taskId: task.id,
              content: evidenceMessage(brokerResult.evidence),
              requestedCapabilities: [],
            });

            if (modelCalls < MAX_MODEL_CALLS) {
              const followUp = await input.worker.run({
                request: input.request,
                rootIntent: collective.board.rootIntent,
                agent,
                task,
                messages: collective.board.listMessages(),
                tools: input.tools,
                requestableToolIds: [],
              });
              modelCalls += 1;
              output =
                followUp.kind === "tool_request"
                  ? syntheticChallenge(
                      "Only one read-only broker lookup is permitted per task.",
                    )
                  : followUp;
              if (followUp.kind === "tool_request") brokerRejected += 1;
            } else {
              output = syntheticChallenge(
                "Read-only evidence was collected, but the bounded model-call budget was exhausted before a follow-up assessment.",
              );
            }
          } else if (brokerResult.status === "rejected") {
            brokerRejected += 1;
            output = syntheticChallenge(
              `Read-only broker request rejected by policy (${brokerResult.audit.reason ?? "policy_denied"}).`,
            );
          } else {
            brokerFailed += 1;
            output = syntheticChallenge(
              "The read-only evidence lookup failed safely; do not infer missing facts.",
            );
          }
        }
      }

      const requestedCapabilities = authorizedWorkerCapabilities(
        output,
        collective.board.rootIntent.allowedCapabilities,
      );
      const attemptedEscalation =
        requestedCapabilities.length !== output.requestedCapabilities.length;

      if (output.kind === "delegate") {
        if (attemptedEscalation || !requestedCapabilities.length) {
          rejectedDelegations += 1;
        } else {
          try {
            collective.delegate({
              fromAgentId: agent.id,
              title: `Advisory follow-up for ${task.title}`,
              description: output.summary,
              requiredCapabilities: requestedCapabilities,
              depth: task.depth + 1,
              dependsOn: [task.id],
            });
            acceptedDelegations += 1;
          } catch {
            rejectedDelegations += 1;
          }
        }
      }

      collective.postMessage({
        fromAgentId: agent.id,
        taskId: task.id,
        type:
          output.kind === "delegate" && attemptedEscalation
            ? "challenge"
            : messageTypeForOutput(output),
        content:
          output.kind === "delegate" && attemptedEscalation
            ? "Worker delegation was rejected because it exceeded the immutable root intent."
            : `[${output.confidence}] ${output.summary}`,
        requestedCapabilities,
      });
      collective.complete(task.id, agent.id, output.summary);
      completedTasks += 1;
    } catch (error) {
      failedTasks += 1;
      try {
        collective.board.failTask(
          task.id,
          agent.id,
          safeWorkerError(error),
        );
      } catch {
        // The immutable runtime may already have expired; fail closed.
      }
    }
  }

  const status: AgentWorkerShadowReport["status"] =
    failedTasks === 0
      ? "completed"
      : completedTasks > 0
        ? "partial"
        : "failed";

  return {
    coordination: collective.summary(),
    workerShadow: Object.freeze({
      status,
      workerId: input.worker.id,
      model: input.worker.model ?? null,
      attemptedTasks,
      completedTasks,
      failedTasks,
      modelCalls,
      acceptedDelegations,
      rejectedDelegations,
      brokerCalls,
      brokerCompleted,
      brokerRejected,
      brokerFailed,
      brokerAudits: Object.freeze([...brokerAudits]),
    }),
  };
}
