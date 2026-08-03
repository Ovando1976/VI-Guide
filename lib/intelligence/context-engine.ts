import type { MemorySnapshot, PersistentWorkflow } from "@/lib/intelligence/memory-core";
import { hydrateRequestFromMemory, loadMemorySnapshot } from "@/lib/intelligence/memory-core";
import {
  availableToolCapabilities,
  findToolsForRequest,
  publicToolDescriptor,
  type IntelligenceToolDescriptor,
} from "@/lib/intelligence/tool-registry";
import type {
  IntelligenceCapability,
  IntelligenceLocation,
  IntelligenceRequest,
} from "@/types/intelligence";

const CONTEXT_VERSION = 1;
const ALL_CAPABILITIES: IntelligenceCapability[] = [
  "recommend",
  "plan",
  "map",
  "mobility",
  "booking",
  "knowledge",
];

export type AgentContext = Readonly<{
  version: number;
  builtAt: string;
  ownerKey: string;
  request: IntelligenceRequest;
  memory: MemorySnapshot["memory"];
  memorySource: MemorySnapshot["source"];
  workflow?: PersistentWorkflow;
  tools: IntelligenceToolDescriptor[];
  requestedCapabilities: IntelligenceCapability[];
  authorizedCapabilities: IntelligenceCapability[];
  unavailableCapabilities: IntelligenceCapability[];
  map: Readonly<{
    island: IntelligenceRequest["context"]["island"];
    currentLocation?: IntelligenceLocation;
    selectedPlace?: IntelligenceLocation;
    pickup?: IntelligenceLocation;
    destination?: IntelligenceLocation;
  }>;
  confirmations: Readonly<{
    bookingRequired: boolean;
    mobilityRequired: boolean;
    pending: string[];
  }>;
}>;

export type BuiltAgentContext = {
  context: AgentContext;
  memorySnapshot: MemorySnapshot;
};

function pendingConfirmations(
  request: IntelligenceRequest,
  capabilities: IntelligenceCapability[],
  workflow?: PersistentWorkflow,
) {
  const pending = new Set<string>();
  if (capabilities.includes("booking")) pending.add("booking confirmation");
  if (workflow?.status === "waiting_for_user") {
    for (const item of workflow.missingInformation) pending.add(item);
  }
  if (
    capabilities.includes("mobility") &&
    (!request.context.pickup || !request.context.destination)
  ) {
    if (!request.context.pickup) pending.add("pickup location");
    if (!request.context.destination) pending.add("destination");
  }
  return Array.from(pending);
}

export async function buildAgentContext(
  incomingRequest: IntelligenceRequest,
): Promise<BuiltAgentContext> {
  const memorySnapshot = await loadMemorySnapshot(incomingRequest);
  const request = hydrateRequestFromMemory(incomingRequest, memorySnapshot);
  const available = availableToolCapabilities(request);
  const requestedCapabilities = request.capabilities?.length
    ? [...request.capabilities]
    : [...ALL_CAPABILITIES];
  const authorizedCapabilities = requestedCapabilities.filter((capability) =>
    available.has(capability),
  );
  const unavailableCapabilities = requestedCapabilities.filter(
    (capability) => !available.has(capability),
  );
  const tools = findToolsForRequest(request, authorizedCapabilities).map(
    publicToolDescriptor,
  );
  const pending = pendingConfirmations(
    request,
    authorizedCapabilities,
    memorySnapshot.activeWorkflow,
  );

  const context: AgentContext = Object.freeze({
    version: CONTEXT_VERSION,
    builtAt: new Date().toISOString(),
    ownerKey: memorySnapshot.ownerKey,
    request,
    memory: memorySnapshot.memory,
    memorySource: memorySnapshot.source,
    ...(memorySnapshot.activeWorkflow
      ? { workflow: memorySnapshot.activeWorkflow }
      : {}),
    tools,
    requestedCapabilities,
    authorizedCapabilities,
    unavailableCapabilities,
    map: Object.freeze({
      island: request.context.island,
      ...(request.context.currentLocation
        ? { currentLocation: request.context.currentLocation }
        : {}),
      ...(request.context.selectedPlace
        ? { selectedPlace: request.context.selectedPlace }
        : {}),
      ...(request.context.pickup ? { pickup: request.context.pickup } : {}),
      ...(request.context.destination
        ? { destination: request.context.destination }
        : {}),
    }),
    confirmations: Object.freeze({
      bookingRequired: authorizedCapabilities.includes("booking"),
      mobilityRequired: authorizedCapabilities.includes("mobility"),
      pending,
    }),
  });

  return { context, memorySnapshot };
}

export function publicAgentContext(context: AgentContext) {
  return {
    version: context.version,
    builtAt: context.builtAt,
    ownerKey: context.ownerKey,
    memorySource: context.memorySource,
    workflow: context.workflow
      ? {
          id: context.workflow.id,
          status: context.workflow.status,
          intent: context.workflow.intent,
          currentStep: context.workflow.currentStep,
          missingInformation: context.workflow.missingInformation,
        }
      : null,
    tools: context.tools,
    requestedCapabilities: context.requestedCapabilities,
    authorizedCapabilities: context.authorizedCapabilities,
    unavailableCapabilities: context.unavailableCapabilities,
    map: context.map,
    confirmations: context.confirmations,
  };
}
