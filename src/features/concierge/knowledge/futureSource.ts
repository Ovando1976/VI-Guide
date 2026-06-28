import type { KnowledgeDomain } from "../conciergeKnowledge";
import type { KnowledgeSourceAdapter } from "./types";

export function createFutureKnowledgeSource(
  sourceId: KnowledgeDomain,
  label: string,
): KnowledgeSourceAdapter {
  return {
    sourceId,
    label,
    canHandle(input) {
      return input.detectedDomains.includes(sourceId);
    },
    search() {
      return {
        sourceId,
        label,
        items: [],
      };
    },
  };
}
