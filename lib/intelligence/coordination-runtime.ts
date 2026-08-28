import {
  AgentBlackboard,
  type AgentBlackboardTask,
} from "@/lib/intelligence/agent-blackboard";
import {
  defaultCollectiveAgentRegistry,
  type CollectiveAgentDescriptor,
  type CollectiveAgentRegistry,
} from "@/lib/intelligence/agent-registry";
import {
  createCoordinationRootIntent,
  DEFAULT_COLLECTIVE_POLICY,
  evaluateAutonomousToolAccess,
  type CollectivePolicy,
} from "@/lib/intelligence/agent-policy";
import type { IntelligenceToolDescriptor } from "@/lib/intelligence/tool-registry";
import type {
  IntelligenceCapability,
  IntelligenceCoordinationSummary,
  IntelligenceRequest,
} from "@/types/intelligence";

type ActiveAgent = {
  agent: CollectiveAgentDescriptor;
  reason: string;
};

const TASK_LABELS: Record<
  IntelligenceCapability,
  { title: string; description: string }
> = {
  recommend: {
    title: "Find grounded options",
    description:
      "Identify traveler-relevant USVI options and explain why they fit the request.",
  },
  plan: {
    title: "Build a feasible plan",
    description:
      "Turn grounded options into a time-aware plan while preserving traveler constraints.",
  },
  map: {
    title: "Resolve map context",
    description:
      "Resolve places and route context needed for geographic or mobility decisions.",
  },
  mobility: {
    title: "Resolve mobility",
    description:
      "Evaluate taxi, ferry, transfer, and timing constraints without inventing fares or availability.",
  },
  booking: {
    title: "Review booking path",
    description:
      "Prepare a booking path while keeping all commercial execution behind explicit confirmation.",
  },
  knowledge: {
    title: "Ground local knowledge",
    description:
      "Check territory knowledge, geography, and supporting context for the traveler request.",
  },
};

function uniqueCapabilities(
  capabilities: readonly IntelligenceCapability[],
): IntelligenceCapability[] {
  return [...new Set(capabilities)];
}

function dependenciesFor(
  capability: IntelligenceCapability,
  createdTaskIds: ReadonlyMap<IntelligenceCapability, string>,
) {
  const dependencies: string[] = [];
  if (capability === "plan") {
    const recommendation = createdTaskIds.get("recommend");
    const knowledge = createdTaskIds.get("knowledge");
    if (recommendation) dependencies.push(recommendation);
    if (knowledge) dependencies.push(knowledge);
  }
  if (capability === "mobility") {
    const map = createdTaskIds.get("map");
    if (map) dependencies.push(map);
  }
  if (capability === "booking") {
    const plan = createdTaskIds.get("plan");
    if (plan) dependencies.push(plan);
  }
  return dependencies;
}

export class BoundedAgentCollective {
  readonly board: AgentBlackboard;
  private readonly activeAgents = new Map<string, ActiveAgent>();
  private nextTaskId = 1;
  private nextMessageId = 1;

  constructor(
    readonly request: IntelligenceRequest,
    readonly tools: readonly IntelligenceToolDescriptor[],
    readonly registry: CollectiveAgentRegistry = defaultCollectiveAgentRegistry,
    readonly policy: CollectivePolicy = DEFAULT_COLLECTIVE_POLICY,
    requiredCapabilities: readonly IntelligenceCapability[] = [],
  ) {
    const allowedCapabilities = uniqueCapabilities(requiredCapabilities);
    this.board = new AgentBlackboard(
      createCoordinationRootIntent({
        id: `collective-${request.context.sessionId}-${Date.now().toString(36)}`,
        userMessage: request.message,
        allowedCapabilities,
        policy,
      }),
      policy,
    );
  }

  private nextTask() {
    return `collective-task-${this.nextTaskId++}`;
  }

  private nextMessage() {
    return `collective-message-${this.nextMessageId++}`;
  }

  addAgent(agent: CollectiveAgentDescriptor, reason: string) {
    const existing = this.activeAgents.get(agent.id);
    if (existing) return existing.agent;
    if (this.activeAgents.size >= this.policy.maxAgents) {
      throw new Error("Collective agent limit reached.");
    }
    this.activeAgents.set(agent.id, { agent, reason });
    return agent;
  }

  addAgentById(agentId: string, reason: string) {
    const agent = this.registry.get(agentId);
    if (!agent || !agent.enabled) {
      throw new Error(`Collective agent is unavailable: ${agentId}`);
    }
    return this.addAgent(agent, reason);
  }

  recruit(
    requesterId: string,
    requiredCapabilities: readonly IntelligenceCapability[],
    reason: string,
  ) {
    const capabilities = uniqueCapabilities(requiredCapabilities);
    for (const capability of capabilities) {
      if (!this.board.rootIntent.allowedCapabilities.includes(capability)) {
        throw new Error(
          `Recruitment capability ${capability} is outside the immutable root intent.`,
        );
      }
    }

    const alreadyActive = Array.from(this.activeAgents.values()).find(
      ({ agent }) =>
        agent.roles.includes("specialist") &&
        capabilities.every((capability) =>
          agent.capabilities.includes(capability),
        ),
    );
    if (alreadyActive) return alreadyActive.agent;

    const agent =
      this.registry.findBest(capabilities, ["specialist"]) ??
      this.registry.findBest(capabilities, ["orchestrator"]);
    if (!agent) return undefined;

    this.addAgent(agent, reason);
    this.board.postMessage({
      id: this.nextMessage(),
      type: "recruitment",
      fromAgentId: requesterId,
      content: `${agent.name} joined the collective: ${reason}`,
      requestedCapabilities: capabilities,
    });
    return agent;
  }

  delegate(input: {
    fromAgentId: string;
    title: string;
    description: string;
    requiredCapabilities: readonly IntelligenceCapability[];
    depth: number;
    dependsOn?: readonly string[];
  }) {
    if (
      input.fromAgentId !== "system" &&
      !this.activeAgents.has(input.fromAgentId)
    ) {
      throw new Error(
        `Only active collective agents may delegate tasks: ${input.fromAgentId}`,
      );
    }

    const task = this.board.createTask({
      id: this.nextTask(),
      title: input.title,
      description: input.description,
      requiredCapabilities: input.requiredCapabilities,
      depth: input.depth,
      dependsOn: input.dependsOn,
      createdBy: input.fromAgentId,
    });
    const agent = this.recruit(
      input.fromAgentId,
      task.requiredCapabilities,
      `Needed for "${task.title}".`,
    );
    if (agent && this.board.isReady(task.id)) {
      return this.board.claimTask(task.id, agent);
    }
    return task;
  }

  complete(taskId: string, agentId: string, result: string) {
    const completed = this.board.completeTask(taskId, agentId, result);
    this.claimNewlyReadyTasks();
    return completed;
  }

  postMessage(input: {
    fromAgentId: string;
    taskId?: string;
    type:
      | "observation"
      | "question"
      | "proposal"
      | "evidence"
      | "dependency"
      | "challenge"
      | "result";
    content: string;
    requestedCapabilities?: readonly IntelligenceCapability[];
  }) {
    if (!this.activeAgents.has(input.fromAgentId)) {
      throw new Error(
        `Only active collective agents may post messages: ${input.fromAgentId}`,
      );
    }
    return this.board.postMessage({
      id: this.nextMessage(),
      ...input,
    });
  }

  private claimNewlyReadyTasks() {
    for (const task of this.board.listReadyTasks()) {
      const agent = Array.from(this.activeAgents.values())
        .map(({ agent }) => agent)
        .filter((candidate) => candidate.roles.includes("specialist"))
        .find((candidate) =>
          task.requiredCapabilities.every((capability) =>
            candidate.capabilities.includes(capability),
          ),
        );
      if (agent) this.board.claimTask(task.id, agent);
    }
  }

  bootstrap(requiredCapabilities: readonly IntelligenceCapability[]) {
    if (!requiredCapabilities.length) return;

    const concierge = this.registry.get("island-concierge");
    if (concierge?.enabled) {
      this.addAgent(
        concierge,
        "Preserve the root traveler objective and coordinate specialists.",
      );
    }

    const createdTaskIds = new Map<IntelligenceCapability, string>();
    const orderedCapabilities: IntelligenceCapability[] = [
      "recommend",
      "knowledge",
      "map",
      "plan",
      "mobility",
      "booking",
    ];

    for (const capability of orderedCapabilities) {
      if (!requiredCapabilities.includes(capability)) continue;
      const label = TASK_LABELS[capability];
      const task = this.delegate({
        fromAgentId: concierge?.enabled ? concierge.id : "system",
        title: label.title,
        description: label.description,
        requiredCapabilities: [capability],
        depth: 1,
        dependsOn: dependenciesFor(capability, createdTaskIds),
      });
      createdTaskIds.set(capability, task.id);
    }

    const critic = this.registry.findByRole("critic")[0];
    if (critic && this.activeAgents.size < this.policy.maxAgents) {
      this.addAgent(
        critic,
        "Challenge unsupported assumptions before the collective result is trusted.",
      );
      this.board.postMessage({
        id: this.nextMessage(),
        type: "recruitment",
        fromAgentId: concierge?.enabled ? concierge.id : "system",
        content: `${critic.name} joined as an independent critic.`,
        requestedCapabilities: [],
      });
    }

    this.claimNewlyReadyTasks();
  }

  task(taskId: string): AgentBlackboardTask | undefined {
    return this.board.getTask(taskId);
  }

  summary(): IntelligenceCoordinationSummary {
    const toolDecisions = this.tools
      .filter((tool) =>
        this.board.rootIntent.allowedCapabilities.includes(tool.capability),
      )
      .map(evaluateAutonomousToolAccess);
    const missingCapabilities = this.board.rootIntent.allowedCapabilities.filter(
      (capability) =>
        !Array.from(this.activeAgents.values()).some(({ agent }) =>
          agent.capabilities.includes(capability),
        ),
    );

    return {
      version: 1,
      status: missingCapabilities.length ? "limited" : "planned",
      rootIntentId: this.board.rootIntent.id,
      rootIntentExpiresAt: this.board.rootIntent.expiresAt,
      team: Array.from(this.activeAgents.values()).map(({ agent, reason }) => ({
        agentId: agent.id,
        name: agent.name,
        roles: [...agent.roles],
        capabilities: [...agent.capabilities],
        reason,
      })),
      tasks: this.board.listTasks().map((task) => ({
        id: task.id,
        title: task.title,
        requiredCapabilities: [...task.requiredCapabilities],
        status: task.status,
        depth: task.depth,
        dependsOn: [...task.dependsOn],
        ...(task.claimedBy ? { claimedBy: task.claimedBy } : {}),
      })),
      messageCount: this.board.listMessages().length,
      safeAutonomousTools: toolDecisions
        .filter((decision) => decision.allowed)
        .map((decision) => decision.toolId),
      blockedAutonomousTools: toolDecisions
        .filter((decision) => !decision.allowed)
        .map((decision) => ({
          toolId: decision.toolId,
          reason: decision.reason,
        })),
      missingCapabilities,
      limits: {
        maxAgents: this.policy.maxAgents,
        maxTasks: this.policy.maxTasks,
        maxMessages: this.policy.maxMessages,
        maxDepth: this.policy.maxDepth,
        maxRuntimeMs: this.policy.maxRuntimeMs,
      },
    };
  }
}

export function planBoundedAgentCollective(input: {
  request: IntelligenceRequest;
  requiredCapabilities: readonly IntelligenceCapability[];
  tools: readonly IntelligenceToolDescriptor[];
  registry?: CollectiveAgentRegistry;
  policy?: CollectivePolicy;
}) {
  const requiredCapabilities = uniqueCapabilities(input.requiredCapabilities);
  const collective = new BoundedAgentCollective(
    input.request,
    input.tools,
    input.registry ?? defaultCollectiveAgentRegistry,
    input.policy ?? DEFAULT_COLLECTIVE_POLICY,
    requiredCapabilities,
  );
  collective.bootstrap(requiredCapabilities);
  return collective.summary();
}
