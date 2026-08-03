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
  const available = availableToolCapabilities(request);
  const requested = request.capabilities?.length
    ? request.capabilities
    : ALL_CAPABILITIES;
  const authorizedCapabilities = requested.filter((capability) =>
    available.has(capability),
  );
  const selectedTools = findToolsForRequest(request, authorizedCapabilities);

  const result = await runIntelligenceOrchestrator({
    ...request,
    capabilities: authorizedCapabilities,
  });

  const registryWarning =
    authorizedCapabilities.length < requested.length
      ? `The tool registry disabled unavailable capabilities: ${requested
          .filter((capability) => !available.has(capability))
          .join(", ")}.`
      : null;

  return {
    ...result,
    warnings: registryWarning
      ? Array.from(new Set([...result.warnings, registryWarning]))
      : result.warnings,
    orchestration: result.orchestration
      ? {
          ...result.orchestration,
          tools: selectedTools.map(publicToolDescriptor),
        }
      : result.orchestration,
  } as IntelligenceResponse;
}
