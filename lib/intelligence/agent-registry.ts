import type { IntelligenceCapability } from "@/types/intelligence";

export type CollectiveAgentRole =
  | "orchestrator"
  | "specialist"
  | "critic"
  | "guardian";

export type CollectiveAgentDescriptor = Readonly<{
  id: string;
  name: string;
  purpose: string;
  capabilities: readonly IntelligenceCapability[];
  roles: readonly CollectiveAgentRole[];
  domains: readonly string[];
  priority: number;
  maxConcurrentTasks: number;
  enabled: boolean;
  version: string;
}>;

const AGENT_ID_PATTERN = /^[a-z][a-z0-9-]{2,63}$/;

function frozenAgentDescriptor(
  descriptor: CollectiveAgentDescriptor,
): CollectiveAgentDescriptor {
  if (!AGENT_ID_PATTERN.test(descriptor.id)) {
    throw new Error(`Invalid collective agent id: ${descriptor.id}`);
  }
  if (!descriptor.capabilities.length) {
    throw new Error(`Collective agent ${descriptor.id} must declare capabilities.`);
  }
  if (!descriptor.roles.length) {
    throw new Error(`Collective agent ${descriptor.id} must declare at least one role.`);
  }
  if (!Number.isInteger(descriptor.maxConcurrentTasks) || descriptor.maxConcurrentTasks < 1) {
    throw new Error(`Collective agent ${descriptor.id} has an invalid concurrency limit.`);
  }

  return Object.freeze({
    ...descriptor,
    capabilities: Object.freeze([...new Set(descriptor.capabilities)]),
    roles: Object.freeze([...new Set(descriptor.roles)]),
    domains: Object.freeze([...new Set(descriptor.domains)]),
  });
}

export class CollectiveAgentRegistry {
  private readonly agents = new Map<string, CollectiveAgentDescriptor>();

  register(descriptor: CollectiveAgentDescriptor) {
    if (this.agents.has(descriptor.id)) {
      throw new Error(`Collective agent already registered: ${descriptor.id}`);
    }
    const frozen = frozenAgentDescriptor(descriptor);
    this.agents.set(frozen.id, frozen);
    return frozen;
  }

  get(id: string) {
    return this.agents.get(id);
  }

  list() {
    return Array.from(this.agents.values()).sort(
      (left, right) =>
        right.priority - left.priority || left.id.localeCompare(right.id),
    );
  }

  findBest(
    requiredCapabilities: readonly IntelligenceCapability[],
    roles: readonly CollectiveAgentRole[] = ["specialist", "orchestrator"],
  ) {
    const required = new Set(requiredCapabilities);
    return this.list().find((agent) => {
      if (!agent.enabled) return false;
      if (!agent.roles.some((role) => roles.includes(role))) return false;
      return Array.from(required).every((capability) =>
        agent.capabilities.includes(capability),
      );
    });
  }

  findByRole(role: CollectiveAgentRole) {
    return this.list().filter(
      (agent) => agent.enabled && agent.roles.includes(role),
    );
  }
}

export const defaultCollectiveAgentRegistry = new CollectiveAgentRegistry();

defaultCollectiveAgentRegistry.register({
  id: "island-concierge",
  name: "Island Concierge",
  purpose:
    "Own the traveler objective, coordinate specialists, and preserve a coherent USVI experience.",
  capabilities: ["recommend", "plan", "knowledge"],
  roles: ["orchestrator"],
  domains: ["traveler-intent", "itinerary", "usvi"],
  priority: 100,
  maxConcurrentTasks: 4,
  enabled: true,
  version: "1.0.0",
});

defaultCollectiveAgentRegistry.register({
  id: "travel-planner",
  name: "Travel Planner",
  purpose:
    "Turn traveler preferences, timing, and local constraints into feasible plans.",
  capabilities: ["recommend", "plan"],
  roles: ["specialist"],
  domains: ["itinerary", "activities", "stays", "dining"],
  priority: 90,
  maxConcurrentTasks: 3,
  enabled: true,
  version: "1.0.0",
});

defaultCollectiveAgentRegistry.register({
  id: "mobility-coordinator",
  name: "Mobility Coordinator",
  purpose:
    "Coordinate map, taxi, ferry, and transfer dependencies without inventing transport authority.",
  capabilities: ["map", "mobility"],
  roles: ["specialist"],
  domains: ["maps", "taxi", "ferry", "transfer"],
  priority: 95,
  maxConcurrentTasks: 3,
  enabled: true,
  version: "1.0.0",
});

defaultCollectiveAgentRegistry.register({
  id: "booking-guardian",
  name: "Booking Guardian",
  purpose:
    "Review booking steps and keep commercial actions behind explicit user confirmation.",
  capabilities: ["booking"],
  roles: ["specialist", "guardian"],
  domains: ["booking", "commerce", "confirmation"],
  priority: 100,
  maxConcurrentTasks: 2,
  enabled: true,
  version: "1.0.0",
});

defaultCollectiveAgentRegistry.register({
  id: "knowledge-specialist",
  name: "USVI Knowledge Specialist",
  purpose:
    "Ground recommendations in territory knowledge and challenge unsupported local claims.",
  capabilities: ["knowledge", "recommend"],
  roles: ["specialist"],
  domains: ["heritage", "geography", "directory", "local-knowledge"],
  priority: 88,
  maxConcurrentTasks: 3,
  enabled: true,
  version: "1.0.0",
});

defaultCollectiveAgentRegistry.register({
  id: "verification-critic",
  name: "Verification Critic",
  purpose:
    "Challenge weak assumptions, inspect dependency gaps, and surface evidence or confirmation needs.",
  capabilities: ["recommend", "plan", "map", "mobility", "booking", "knowledge"],
  roles: ["critic", "guardian"],
  domains: ["verification", "safety", "evidence"],
  priority: 80,
  maxConcurrentTasks: 4,
  enabled: true,
  version: "1.0.0",
});

export function listCollectiveAgents() {
  return defaultCollectiveAgentRegistry.list().map((agent) => ({
    id: agent.id,
    name: agent.name,
    purpose: agent.purpose,
    capabilities: [...agent.capabilities],
    roles: [...agent.roles],
    domains: [...agent.domains],
    priority: agent.priority,
    maxConcurrentTasks: agent.maxConcurrentTasks,
    enabled: agent.enabled,
    version: agent.version,
  }));
}
