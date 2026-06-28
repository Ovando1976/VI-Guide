import type { IslandCode } from "../../../types";
import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import type { KnowledgeDomain } from "../conciergeKnowledge";

export type KnowledgeSourceInput = {
  query: string;
  island: IslandCode;
  contextTitle?: string;
  limit: number;
  detectedDomains: KnowledgeDomain[];
};

export type KnowledgeSourceResult = {
  sourceId: KnowledgeDomain;
  label: string;
  items: GeographicIndexItem[];
};

export type KnowledgeSourceAdapter = {
  sourceId: KnowledgeDomain;
  label: string;
  canHandle: (input: KnowledgeSourceInput) => boolean;
  search: (input: KnowledgeSourceInput) => KnowledgeSourceResult;
};
