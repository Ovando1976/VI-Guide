import type { IntelligenceCapability, IntelligenceRequest } from "@/types/intelligence";

export type IntelligenceToolCategory =
  | "discovery"
  | "planning"
  | "maps"
  | "mobility"
  | "commerce"
  | "knowledge"
  | "memory";

export type IntelligenceToolPermission = "read" | "write" | "execute";
export type IntelligenceToolRisk = "low" | "medium" | "high";

export type IntelligenceToolContext = {
  request: IntelligenceRequest;
};

export type IntelligenceToolDescriptor = {
  id: string;
  name: string;
  description: string;
  category: IntelligenceToolCategory;
  capability: IntelligenceCapability;
  permissions: IntelligenceToolPermission[];
  risk: IntelligenceToolRisk;
  requiresConfirmation: boolean;
  enabled: boolean;
  tags: string[];
  version: string;
};

export type IntelligenceTool<TInput = unknown, TOutput = unknown> =
  IntelligenceToolDescriptor & {
    canUse(context: IntelligenceToolContext): boolean;
    execute?: (input: TInput, context: IntelligenceToolContext) => Promise<TOutput>;
  };

const tools = new Map<string, IntelligenceTool>();

export function registerIntelligenceTool(tool: IntelligenceTool) {
  if (!/^[a-z][a-z0-9-]*(?:\.[a-z][a-z0-9-]*)+$/.test(tool.id)) {
    throw new Error(`Invalid intelligence tool id: ${tool.id}`);
  }
  if (tools.has(tool.id)) {
    throw new Error(`Intelligence tool already registered: ${tool.id}`);
  }
  tools.set(tool.id, Object.freeze({ ...tool }));
  return tool;
}

export function getIntelligenceTool(id: string) {
  return tools.get(id);
}

export function listIntelligenceTools(options?: {
  capability?: IntelligenceCapability;
  category?: IntelligenceToolCategory;
  includeDisabled?: boolean;
}) {
  return Array.from(tools.values())
    .filter((tool) => options?.includeDisabled || tool.enabled)
    .filter((tool) => !options?.capability || tool.capability === options.capability)
    .filter((tool) => !options?.category || tool.category === options.category)
    .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
}

export function findToolsForRequest(
  request: IntelligenceRequest,
  capabilities: IntelligenceCapability[],
) {
  const requested = new Set(capabilities);
  return listIntelligenceTools().filter(
    (tool) => requested.has(tool.capability) && tool.canUse({ request }),
  );
}

export function availableToolCapabilities(request: IntelligenceRequest) {
  return new Set(
    listIntelligenceTools()
      .filter((tool) => tool.canUse({ request }))
      .map((tool) => tool.capability),
  );
}

function always() {
  return true;
}

function hasIsland({ request }: IntelligenceToolContext) {
  return Boolean(request.context.island);
}

registerIntelligenceTool({
  id: "directory.search",
  name: "Search VI Guide Directory",
  description: "Search reviewed places, stays, beaches, restaurants, and local directory records.",
  category: "discovery",
  capability: "recommend",
  permissions: ["read"],
  risk: "low",
  requiresConfirmation: false,
  enabled: true,
  tags: ["places", "stays", "beaches", "restaurants", "local"],
  version: "1.0.0",
  canUse: hasIsland,
});

registerIntelligenceTool({
  id: "trip.plan",
  name: "Build Connected Itinerary",
  description: "Create a coherent island itinerary from grounded VI Guide recommendations.",
  category: "planning",
  capability: "plan",
  permissions: ["read"],
  risk: "low",
  requiresConfirmation: false,
  enabled: true,
  tags: ["itinerary", "trip", "cruise", "schedule"],
  version: "1.0.0",
  canUse: hasIsland,
});

registerIntelligenceTool({
  id: "map.open",
  name: "Open Intelligent Map",
  description: "Build a map handoff focused on a reviewed place, route, estate, or itinerary stop.",
  category: "maps",
  capability: "map",
  permissions: ["read"],
  risk: "low",
  requiresConfirmation: false,
  enabled: true,
  tags: ["map", "location", "estate", "route"],
  version: "1.0.0",
  canUse: hasIsland,
});

registerIntelligenceTool({
  id: "mobility.plan",
  name: "Plan Island Transportation",
  description: "Prepare taxi, transfer, ferry, and route-planning handoffs using trip context.",
  category: "mobility",
  capability: "mobility",
  permissions: ["read"],
  risk: "medium",
  requiresConfirmation: false,
  enabled: true,
  tags: ["taxi", "ferry", "pickup", "transfer", "route"],
  version: "1.0.0",
  canUse: hasIsland,
});

registerIntelligenceTool({
  id: "booking.review",
  name: "Review Booking Options",
  description: "Open a reviewed accommodation or experience booking workflow without completing a purchase.",
  category: "commerce",
  capability: "booking",
  permissions: ["read", "execute"],
  risk: "high",
  requiresConfirmation: true,
  enabled: true,
  tags: ["hotel", "stay", "reservation", "booking"],
  version: "1.0.0",
  canUse: hasIsland,
});

registerIntelligenceTool({
  id: "heritage.search",
  name: "Search Heritage Knowledge",
  description: "Search VI Guide heritage, historic places, governors, timelines, and source-backed records.",
  category: "knowledge",
  capability: "knowledge",
  permissions: ["read"],
  risk: "low",
  requiresConfirmation: false,
  enabled: true,
  tags: ["history", "heritage", "historic", "timeline"],
  version: "1.0.0",
  canUse: always,
});

export function publicToolDescriptor(tool: IntelligenceTool): IntelligenceToolDescriptor {
  const { canUse: _canUse, execute: _execute, ...descriptor } = tool;
  return descriptor;
}
