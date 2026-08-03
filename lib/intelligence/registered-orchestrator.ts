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
  return enriched;
}
