export type HistoryNodeType =
  | "person"
  | "family"
  | "estate"
  | "historical_place"
  | "spatial_asset"
  | "organization"
  | "source_document"
  | "event"
  | "archival_target";

export type HistoryRelationshipType =
  | "ASSERTS"
  | "FIRST_GRANTEE_OF"
  | "OWNS"
  | "INHERITS"
  | "PURCHASES"
  | "SELLS"
  | "MARRIED_TO"
  | "CHILD_OF"
  | "ALIAS_OF"
  | "LOCATED_IN"
  | "CONSOLIDATED_INTO"
  | "PARTITIONED_INTO"
  | "RENAMED_TO"
  | "MORTGAGED_TO"
  | "FORECLOSED_BY"
  | "GUARDIAN_OF"
  | "EXECUTOR_OF"
  | "MEMORIALIZES"
  | "PROBABLE_IDENTITY"
  | "REFERENCED_IN"
  | "MENTIONED_IN"
  | "REQUIRES_ARCHIVAL_TARGET";

export type ConfidenceLabel =
  | "confirmed"
  | "high"
  | "probable"
  | "possible"
  | "unresolved";

export interface ConfidenceMetric {
  label: ConfidenceLabel;
  score: number;
}

export interface ArchivalEvidence {
  sourceDocumentId: string;
  sourceCollection: string;
  volume?: string;
  folio?: string;
  page?: string;
  recordId?: string;
  confidence: ConfidenceMetric;
  extractedTextOriginal?: string;
  extractedTextTranslation?: string;
  notes?: string;
}

export interface HistoryNode {
  id: string;
  type: HistoryNodeType;
  label: string;
  properties: Record<string, unknown>;
  evidence: ArchivalEvidence[];
}

export interface HistoryEdge {
  id: string;
  type: HistoryRelationshipType;
  sourceNodeId: string;
  targetNodeId: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  properties: Record<string, unknown>;
  evidence: ArchivalEvidence[];
}

export interface HistoryGraphPayload {
  nodes: HistoryNode[];
  edges: HistoryEdge[];
}
