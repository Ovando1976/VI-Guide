import type { CollectiveAgentDescriptor } from "@/lib/intelligence/agent-registry";
import type {
  CollectivePolicy,
  CoordinationRootIntent,
} from "@/lib/intelligence/agent-policy";
import type { IntelligenceCapability } from "@/types/intelligence";

export type BlackboardTaskStatus =
  | "pending"
  | "claimed"
  | "completed"
  | "failed";

export type BlackboardMessageType =
  | "observation"
  | "question"
  | "proposal"
  | "evidence"
  | "dependency"
  | "challenge"
  | "result"
  | "recruitment";

export type AgentBlackboardTask = Readonly<{
  id: string;
  title: string;
  description: string;
  requiredCapabilities: readonly IntelligenceCapability[];
  status: BlackboardTaskStatus;
  depth: number;
  dependsOn: readonly string[];
  createdBy: string;
  claimedBy?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
}>;

export type AgentBlackboardMessage = Readonly<{
  id: string;
  type: BlackboardMessageType;
  fromAgentId: string;
  taskId?: string;
  content: string;
  requestedCapabilities: readonly IntelligenceCapability[];
  createdAt: string;
}>;

type MutableTask = {
  id: string;
  title: string;
  description: string;
  requiredCapabilities: IntelligenceCapability[];
  status: BlackboardTaskStatus;
  depth: number;
  dependsOn: string[];
  createdBy: string;
  claimedBy?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
};

function publicTask(task: MutableTask): AgentBlackboardTask {
  return Object.freeze({
    ...task,
    requiredCapabilities: Object.freeze([...task.requiredCapabilities]),
    dependsOn: Object.freeze([...task.dependsOn]),
  });
}

export class AgentBlackboard {
  private readonly tasks = new Map<string, MutableTask>();
  private readonly messages: AgentBlackboardMessage[] = [];

  constructor(
    readonly rootIntent: CoordinationRootIntent,
    readonly policy: CollectivePolicy,
  ) {}

  private assertWithinRuntime(now: Date) {
    if (now.getTime() > Date.parse(this.rootIntent.expiresAt)) {
      throw new Error("Collective runtime limit reached.");
    }
  }

  claimedTaskCount(agentId: string) {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === "claimed" && task.claimedBy === agentId,
    ).length;
  }

  canAgentAcceptTask(agent: CollectiveAgentDescriptor) {
    return this.claimedTaskCount(agent.id) < agent.maxConcurrentTasks;
  }

  createTask(input: {
    id: string;
    title: string;
    description: string;
    requiredCapabilities: readonly IntelligenceCapability[];
    depth: number;
    dependsOn?: readonly string[];
    createdBy: string;
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    this.assertWithinRuntime(now);
    if (this.tasks.size >= this.policy.maxTasks) {
      throw new Error("Collective task limit reached.");
    }
    if (this.tasks.has(input.id)) {
      throw new Error(`Collective task already exists: ${input.id}`);
    }
    if (input.depth < 0 || input.depth > this.policy.maxDepth) {
      throw new Error(`Collective task depth exceeds policy: ${input.depth}`);
    }
    if (!input.requiredCapabilities.length) {
      throw new Error("Collective tasks must require at least one capability.");
    }
    for (const capability of input.requiredCapabilities) {
      if (!this.rootIntent.allowedCapabilities.includes(capability)) {
        throw new Error(
          `Capability ${capability} is outside the immutable root intent.`,
        );
      }
    }

    const dependsOn = [...new Set(input.dependsOn ?? [])];
    for (const dependencyId of dependsOn) {
      if (!this.tasks.has(dependencyId)) {
        throw new Error(`Unknown collective task dependency: ${dependencyId}`);
      }
    }

    const task: MutableTask = {
      id: input.id,
      title: input.title,
      description: input.description,
      requiredCapabilities: [...new Set(input.requiredCapabilities)],
      status: "pending",
      depth: input.depth,
      dependsOn,
      createdBy: input.createdBy,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    this.tasks.set(task.id, task);
    return publicTask(task);
  }

  getTask(id: string) {
    const task = this.tasks.get(id);
    return task ? publicTask(task) : undefined;
  }

  listTasks() {
    return Array.from(this.tasks.values()).map(publicTask);
  }

  isReady(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== "pending") return false;
    return task.dependsOn.every(
      (dependencyId) => this.tasks.get(dependencyId)?.status === "completed",
    );
  }

  listReadyTasks() {
    return Array.from(this.tasks.values())
      .filter((task) => this.isReady(task.id))
      .map(publicTask);
  }

  claimTask(taskId: string, agent: CollectiveAgentDescriptor, now = new Date()) {
    this.assertWithinRuntime(now);
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Unknown collective task: ${taskId}`);
    if (!agent.enabled) throw new Error(`Collective agent is disabled: ${agent.id}`);
    if (task.status !== "pending") {
      throw new Error(`Collective task is not claimable: ${taskId}`);
    }
    if (!this.isReady(taskId)) {
      throw new Error(`Collective task dependencies are incomplete: ${taskId}`);
    }
    if (!this.canAgentAcceptTask(agent)) {
      throw new Error(`Collective agent concurrency limit reached: ${agent.id}`);
    }
    if (
      !task.requiredCapabilities.every((capability) =>
        agent.capabilities.includes(capability),
      )
    ) {
      throw new Error(
        `Collective agent ${agent.id} lacks task capabilities for ${taskId}.`,
      );
    }

    task.status = "claimed";
    task.claimedBy = agent.id;
    task.updatedAt = now.toISOString();
    return publicTask(task);
  }

  completeTask(
    taskId: string,
    agentId: string,
    result: string,
    now = new Date(),
  ) {
    this.assertWithinRuntime(now);
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Unknown collective task: ${taskId}`);
    if (task.status !== "claimed" || task.claimedBy !== agentId) {
      throw new Error(`Collective task ${taskId} is not claimed by ${agentId}.`);
    }

    task.status = "completed";
    task.result = result.slice(0, 4_000);
    task.updatedAt = now.toISOString();
    return publicTask(task);
  }

  failTask(
    taskId: string,
    agentId: string,
    reason: string,
    now = new Date(),
  ) {
    this.assertWithinRuntime(now);
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Unknown collective task: ${taskId}`);
    if (task.status !== "claimed" || task.claimedBy !== agentId) {
      throw new Error(`Collective task ${taskId} is not claimed by ${agentId}.`);
    }

    task.status = "failed";
    task.result = reason.slice(0, 2_000);
    task.updatedAt = now.toISOString();
    return publicTask(task);
  }

  postMessage(input: {
    id: string;
    type: BlackboardMessageType;
    fromAgentId: string;
    taskId?: string;
    content: string;
    requestedCapabilities?: readonly IntelligenceCapability[];
    now?: Date;
  }) {
    const now = input.now ?? new Date();
    this.assertWithinRuntime(now);
    if (this.messages.length >= this.policy.maxMessages) {
      throw new Error("Collective message limit reached.");
    }
    if (input.taskId && !this.tasks.has(input.taskId)) {
      throw new Error(`Unknown collective task for message: ${input.taskId}`);
    }

    const requestedCapabilities = [
      ...new Set(input.requestedCapabilities ?? []),
    ];
    for (const capability of requestedCapabilities) {
      if (!this.rootIntent.allowedCapabilities.includes(capability)) {
        throw new Error(
          `Requested capability ${capability} is outside the immutable root intent.`,
        );
      }
    }

    const message = Object.freeze({
      id: input.id,
      type: input.type,
      fromAgentId: input.fromAgentId,
      ...(input.taskId ? { taskId: input.taskId } : {}),
      content: input.content.slice(0, 2_000),
      requestedCapabilities: Object.freeze(requestedCapabilities),
      createdAt: now.toISOString(),
    }) satisfies AgentBlackboardMessage;
    this.messages.push(message);
    return message;
  }

  listMessages() {
    return [...this.messages];
  }
}
