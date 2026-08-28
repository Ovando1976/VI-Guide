import type { IntelligenceToolDescriptor } from "@/lib/intelligence/tool-registry";
import type { IntelligenceCapability } from "@/types/intelligence";

export type CollectivePolicy = Readonly<{
  maxAgents: number;
  maxTasks: number;
  maxMessages: number;
  maxDepth: number;
  maxRuntimeMs: number;
}>;

export const DEFAULT_COLLECTIVE_POLICY: CollectivePolicy = Object.freeze({
  maxAgents: 6,
  maxTasks: 12,
  maxMessages: 48,
  maxDepth: 2,
  maxRuntimeMs: 15_000,
});

export type CoordinationRootIntent = Readonly<{
  id: string;
  userMessage: string;
  allowedCapabilities: readonly IntelligenceCapability[];
  createdAt: string;
  expiresAt: string;
}>;

export type ToolAutonomyDecision = Readonly<{
  toolId: string;
  allowed: boolean;
  reason:
    | "read_only_tool"
    | "tool_disabled"
    | "human_confirmation_required"
    | "high_risk_tool"
    | "mutating_tool";
}>;

export function createCoordinationRootIntent(input: {
  id: string;
  userMessage: string;
  allowedCapabilities: readonly IntelligenceCapability[];
  createdAt?: Date;
  policy?: CollectivePolicy;
}): CoordinationRootIntent {
  const policy = input.policy ?? DEFAULT_COLLECTIVE_POLICY;
  const createdAt = input.createdAt ?? new Date();
  const allowedCapabilities = Object.freeze([
    ...new Set(input.allowedCapabilities),
  ]);

  return Object.freeze({
    id: input.id,
    userMessage: input.userMessage,
    allowedCapabilities,
    createdAt: createdAt.toISOString(),
    expiresAt: new Date(createdAt.getTime() + policy.maxRuntimeMs).toISOString(),
  });
}

export function capabilityAllowedByRootIntent(
  rootIntent: CoordinationRootIntent,
  capability: IntelligenceCapability,
) {
  return rootIntent.allowedCapabilities.includes(capability);
}

export function evaluateAutonomousToolAccess(
  tool: IntelligenceToolDescriptor,
): ToolAutonomyDecision {
  if (!tool.enabled) {
    return Object.freeze({
      toolId: tool.id,
      allowed: false,
      reason: "tool_disabled",
    });
  }
  if (tool.requiresConfirmation) {
    return Object.freeze({
      toolId: tool.id,
      allowed: false,
      reason: "human_confirmation_required",
    });
  }
  if (tool.risk === "high") {
    return Object.freeze({
      toolId: tool.id,
      allowed: false,
      reason: "high_risk_tool",
    });
  }
  if (
    tool.permissions.includes("write") ||
    tool.permissions.includes("execute")
  ) {
    return Object.freeze({
      toolId: tool.id,
      allowed: false,
      reason: "mutating_tool",
    });
  }
  return Object.freeze({
    toolId: tool.id,
    allowed: true,
    reason: "read_only_tool",
  });
}
