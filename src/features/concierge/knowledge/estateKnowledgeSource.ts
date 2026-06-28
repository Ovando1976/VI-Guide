import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import { estateKnowledge } from "../../../data/estateKnowledge";
import type { KnowledgeSourceAdapter, KnowledgeSourceInput } from "./types";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wantsEstateKnowledge(input: KnowledgeSourceInput) {
  return (
    input.detectedDomains.includes("all") ||
    input.detectedDomains.includes("estate") ||
    /\bestate\b/i.test(input.query)
  );
}

function scoreEstate(record: (typeof estateKnowledge.records)[number], query: string) {
  const q = normalize(query);
  const name = normalize(record.estateName);
  const normalized = normalize(record.normalizedName || "");
  const aliases = record.aliases.map(normalize);
  const searchText = normalize(record.searchText || "");

  let score = 0;

  if (name === q) score += 100;
  if (normalized === q) score += 95;
  if (aliases.includes(q)) score += 90;
  if (name.includes(q) || q.includes(name)) score += 65;
  if (normalized.includes(q) || q.includes(normalized)) score += 60;
  if (aliases.some((alias) => alias.includes(q) || q.includes(alias))) score += 55;
  if (searchText.includes(q)) score += 35;

  for (const token of q.split(" ").filter((part) => part.length > 2)) {
    if (searchText.includes(token)) score += 4;
  }

  if (record.historicSummary || record.relatedArchives.length > 0) score += 8;
  if (record.tags.length > 0) score += 4;
  if (record.relatedHistoricSites.length > 0) score += 5;
  if (record.relatedArchives.length > 0) score += 5;

  return score;
}

function islandMatches(recordIsland: string, inputIsland: string) {
  return recordIsland === inputIsland;
}

function toGeographicItem(record: (typeof estateKnowledge.records)[number]): GeographicIndexItem {
  return {
    id: record.estateId,
    source: "estate",
    category: "estate",
    type: "estate",
    name: record.estateName,
    estateId: record.estateId,
    geoid: record.geoid,
    island: record.island,
    quarter: record.quarter,
    quarterGroup: record.quarterGroup,
    coordinates: record.coordinates,
    description:
      record.historicSummary ||
      record.description ||
      `${record.estateName} is an official USVI estate record.`,
    tags: record.tags,
    searchText: record.searchText,
  } as GeographicIndexItem;
}

export const estateKnowledgeSource: KnowledgeSourceAdapter = {
  sourceId: "estate",
  label: "Estate Knowledge",
  canHandle: wantsEstateKnowledge,
  search(input) {
    const scored = estateKnowledge.records
      .filter((record) => islandMatches(record.island, input.island))
      .map((record) => ({
        record,
        score: scoreEstate(record, input.query),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit)
      .map((item) => toGeographicItem(item.record));

    return {
      sourceId: "estate",
      label: "Estate Knowledge",
      items: scored,
    };
  },
};
