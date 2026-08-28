import type { CollectiveAgentRegistry } from "@/lib/intelligence/agent-registry";
import { defaultCollectiveAgentRegistry } from "@/lib/intelligence/agent-registry";
import type { CollectivePolicy } from "@/lib/intelligence/agent-policy";
import { DEFAULT_COLLECTIVE_POLICY } from "@/lib/intelligence/agent-policy";
import type { AgentWorker, AgentWorkerOutput } from "@/lib/intelligence/agent-worker";
import { BoundedAgentCollective } from "@/lib/intelligence/coordination-runtime";
import type { IntelligenceToolDescriptor } from "@/lib/intelligence/tool-registry";
import type {
  IntelligenceCapability,
  IntelligenceCoordinationSummary,
  IntelligenceRequest,
} from "@/types/intelligence";

const DEFAULT_MAX_WORKER_TASKS = 2;

export type AgentWorkerShadowReport = Readonly<{
  status: "disabled" | "completed" | "partial" | "failed";
  workerId: string | null;
  model: string | null;
  attemptedTasks: number;
  completedTasks: number;
  failedTasks: number;
  acceptedDelegations: number;
  rejectedDelegations: number;
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
  return output.kind === "delegate" ? "proposal" : output.kind;
}

export async function runAgentWorkerShadow(input: {
  request: IntelligenceRequest;
  requiredCapabilities: readonly IntelligenceCapability[];
  tools: readonly IntelligenceToolDescriptor[];
  worker: AgentWorker | null;
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
        acceptedDelegations: 0,
        rejectedDelegations: 0,
      }),
    };
  }

  const maxWorkerTasks = Math.max(
    1,
    Math.min(input.maxWorkerTasks ?? DEFAULT_MAX_WORKER_TASKS, 4),
  );
  const attempted = new Set<string>();
  let attemptedTasks = 0;
  let completedTasks = 0;
  let failedTasks = 0;
  let acceptedDelegations = 0;
  let rejectedDelegations = 0;

  while (attemptedTasks < maxWorkerTasks) {
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

    try {
      const output = await input.worker.run({
        request: input.request,
        rootIntent: collective.board.rootIntent,
        agent,
        task,
        messages: collective.board.listMessages(),
        tools: input.tools,
      });

      if (output.kind === "delegate") {
        try {
          collective.delegate({
            fromAgentId: agent.id,
            title: `Advisory follow-up for ${task.title}`,
            description: output.summary,
            requiredCapabilities: output.requestedCapabilities,
            depth: task.depth + 1,
            dependsOn: [task.id],
          });
          acceptedDelegations += 1;
        } catch {
          rejectedDelegations += 1;
        }
      }

      collective.postMessage({
        fromAgentId: agent.id,
        taskId: task.id,
        type: messageTypeForOutput(output),
        content: `[${output.confidence}] ${output.summary}`,
        requestedCapabilities: output.requestedCapabilities,
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
      acceptedDelegations,
      rejectedDelegations,
    }),
  };
}
