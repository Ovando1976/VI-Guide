import type { HistoryNode, HistoryEdge, ArchivalEvidence, ConfidenceLabel, ConfidenceMetric } from "../historyGraphTypes";

const CONFIDENCE_MATRIX: Record<ConfidenceLabel, number> = {
  confirmed: 1.00,
  high: 0.90,
  probable: 0.70,
  possible: 0.45,
  unresolved: 0.10,
};

export function createConfidence(label: ConfidenceLabel): ConfidenceMetric {
  return {
    label,
    score: CONFIDENCE_MATRIX[label],
  };
}

/**
 * Encapsulates an assertion made by an archival document.
 */
export function createAssertionEdge(
  id: string,
  type: any,
  sourceId: string,
  targetId: string,
  evidence: ArchivalEvidence,
  dates?: { from?: string; to?: string }
): HistoryEdge {
  return {
    id,
    type,
    sourceNodeId: sourceId,
    targetNodeId: targetId,
    effectiveFrom: dates?.from,
    effectiveTo: dates?.to,
    properties: {},
    evidence: [evidence],
  };
}
