import "@/lib/intelligence/agent-subscribers";

import {
  buildAgentContext,
  publicAgentContext,
} from "@/lib/intelligence/context-engine";
import {
  publishIntelligenceEvent,
  type IntelligenceEventType,
} from "@/lib/intelligence/event-bus";
import { persistMemoryResult } from "@/lib/intelligence/memory-core";
import { runIntelligenceOrchestrator } from "@/lib/intelligence/orchestrator";
import type {
  IntelligenceRequest,
  IntelligenceResponse,
} from "@/types/intelligence";

function eventTypesForResult(
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
  const { context, memorySnapshot } = await buildAgentContext(request);
  const result = await runIntelligenceOrchestrator({
    ...context.request,
    capabilities: context.authorizedCapabilities,
  });

  const registryWarning = context.unavailableCapabilities.length
    ? `The tool registry disabled unavailable capabilities: ${context.unavailableCapabilities.join(", ")}.`
    : null;
  const memoryWarning =
    context.memorySource === "request"
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
          tools: context.tools,
          context: publicAgentContext(context),
        }
      : result.orchestration,
  };

  await persistMemoryResult(context.request, memorySnapshot, enriched);

  const eventPayload = {
    workflowStatus: enriched.orchestration?.status ?? "ready",
    missingInformation: enriched.orchestration?.missingInformation ?? [],
    selectedTools: context.tools.map((tool) => tool.id),
    requiresMobility: context.confirmations.mobilityRequired,
    requiresBooking: context.confirmations.bookingRequired,
    pendingConfirmations: context.confirmations.pending,
    recommendationCount: enriched.recommendations.length,
    planStopCount: enriched.plan.length,
    contextVersion: context.version,
    memorySource: context.memorySource,
    map: context.map,
  };
  const eventTypes = eventTypesForResult(
    enriched,
    Boolean(context.workflow),
  );

  for (const type of eventTypes) {
    await publishIntelligenceEvent({
      type,
      ownerKey: context.ownerKey,
      ...(context.workflow?.id ? { workflowId: context.workflow.id } : {}),
      runId: enriched.runId,
      island: context.request.context.island,
      intent: enriched.orchestration?.intent ?? enriched.intent,
      payload: eventPayload,
    });
  }

  return enriched;
}
