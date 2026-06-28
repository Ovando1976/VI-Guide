import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import { searchAllGeography } from "../../../lib/search/geographicSearch";
import type { KnowledgeSourceAdapter, KnowledgeSourceInput } from "./types";

function wantsGeography(input: KnowledgeSourceInput) {
  return (
    input.detectedDomains.includes("all") ||
    input.detectedDomains.includes("estate") ||
    input.detectedDomains.includes("historicSite") ||
    input.detectedDomains.includes("dictionary") ||
    input.detectedDomains.includes("archive") ||
    input.detectedDomains.includes("beach")
  );
}

export const geographicKnowledgeSource: KnowledgeSourceAdapter = {
  sourceId: "all",
  label: "Geographic Index",
  canHandle: wantsGeography,
  search(input) {
    const searchQuery = [input.query, input.contextTitle].filter(Boolean).join(" ");

    const items = searchAllGeography(searchQuery, {
      island: input.island,
      limit: Math.max(input.limit, 20),
    }) as GeographicIndexItem[];

    return {
      sourceId: "all",
      label: "Geographic Index",
      items,
    };
  },
};
