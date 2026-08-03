import "@/lib/intelligence/agent-subscribers";

import { publishIntelligenceEvent, type IntelligenceEventType } from "@/lib/intelligence/event-bus";
import {
  hydrateRequestFromMemory,
  loadMemorySnapshot,
  persistMemoryResult,
} from "@/lib/intelligence/memory-core";
import { runIntelligenceOrchestrator } from "@/lib/intelligence/orchestrator";
import {
  availableToolCapabilities,
  findToolsForRequest,
  publicToolDescriptor,
} from "@/lib/intelligence/tool-registry";
import type {
  IntelligenceCapability,
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

const ALL_CAPABILITIES: IntelligenceCapability[] = [
  "recommend",
  "plan",
  "map",
  "mobility",
  "booking",
  "knowledge",
];

function eventTypesForResult(
  request: IntelligenceRequest,
  result: IntelligenceResponse,
  resumed: boolean,
): IntelligenceEventType[] {
  const types = new Set<IntelligenceEventType>([
    resumed ? "workflow.resumed" : "workflow.created",
    "memory.updated",
  ]);

  if (result.orchestration?.status === "waiting_for_user") {
    types.add("workflow.waiting");
  } else {
    types.add("workflow.updated");
  }
  if (result.plan.length) types.add("trip.planned");
  if (
    result.orchestration?.requiredCapabilities.includes("mobility") ||
    result.actions.some((action) => action.type === "plan_ride")
  ) {
    types.add("mobility.requested");
  }
  if (
    result.orchestration?.requiredCapabilities.includes("booking") ||
    result.actions.some((action) => action.type === "start_booking")
  ) {
    types.add("booking.reviewed");
  }

  return Array.from(types);
}

export async function runRegisteredIntelligenceOrchestrator(
  request: IntelligenceRequest,
): Promise<IntelligenceResponse> {
  const memorySnapshot = await loadMemorySnapshot(request);
  const hydratedRequest = hydrateRequestFromMemory(request, memorySnapshot);
  const available = availableToolCapabilities(hydratedRequest);
  const requested = hydratedRequest.capabilities?.length
    ? hydratedRequest.capabilities
    : ALL_CAPABILITIES;
  const authorizedCapabilities = requested.filter((capability) =>
    available.has(capability),
  );
  const selectedTools = findToolsForRequest(
    hydratedRequest,
    authorizedCapabilities,
  );

  const result = await runIntelligenceOrchestrator({
    ...hydratedRequest,
    capabilities: authorizedCapabilities,
  });

  const registryWarning =
    authorizedCapabilities.length < requested.length
      ? `The tool registry disabled unavailable capabilities: ${requested
          .filter((capability) => !available.has(capability))
          .join(", ")}.`
      : null;
  const memoryWarning =
    memorySnapshot.source === "request"
      ? "Persistent memory was unavailable, so this run used the request context only."
      : null;

  const enriched: IntelligenceResponse = {
    ...result,
    warnings: Array.from(
      new Set(
        [
          ...result.warnings,
          registryWarning,
          memoryWarning,
        ].filter((warning): warning is string => Boolean(warning)),
      ),
    ),
    orchestration: result.orchestration
      ? {
          ...result.orchestration,
          tools: selectedTools.map(publicToolDescriptor),
        }
      : result.orchestration,
  };

  await persistMemoryResult(hydratedRequest, memorySnapshot, enriched);

  const eventPayload = {
    workflowStatus: enriched.orchestration?.status ?? "ready",
    missingInformation: enriched.orchestration?.missingInformation ?? [],
    selectedTools: selectedTools.map((tool) => tool.id),
    requiresMobility: authorizedCapabilities.includes("mobility"),
    requiresBooking: authorizedCapabilities.includes("booking"),
    recommendationCount: enriched.recommendations.length,
    planStopCount: enriched.plan.length,
  };
  const eventTypes = eventTypesForResult(
    hydratedRequest,
    enriched,
    Boolean(memorySnapshot.activeWorkflow),
  );

  for (const type of eventTypes) {
    await publishIntelligenceEvent({
      type,
      ownerKey: memorySnapshot.ownerKey,
      ...(memorySnapshot.activeWorkflow?.id
        ? { workflowId: memorySnapshot.activeWorkflow.id }
        : {}),
      runId: enriched.runId,
      island: hydratedRequest.context.island,
      intent: enriched.orchestration?.intent ?? enriched.intent,
      payload: eventPayload,
    });
  }

  return enriched;
}
