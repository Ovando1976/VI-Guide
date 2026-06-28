import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import { dictionaryGraph, type DictionaryNode } from "../../../data/dictionaryGraph";
import type { KnowledgeSourceAdapter, KnowledgeSourceInput } from "./types";

function normalize(value?: string | null) {
  return (value || "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/\bft\.?\b/g, "fort")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toIslandCode(value?: string | null) {
  if (value === "stt") return "st_thomas";
  if (value === "stj") return "st_john";
  if (value === "stx") return "st_croix";
  if (value === "wat") return "water_island";
  return value || "unknown";
}

function wantsDictionary(input: KnowledgeSourceInput) {
  return (
    input.detectedDomains.includes("all") ||
    input.detectedDomains.includes("dictionary") ||
    /\b(what is|define|dictionary|meaning|called|also known as|spelled|old name|where is|what was)\b/i.test(input.query)
  );
}

function ocrPenalty(node: DictionaryNode) {
  const label = node.label || "";
  const text = `${label} ${node.description || ""}`;

  let penalty = 0;
  if (/[0-9][A-Za-z]{2,}|[A-Za-z]{2,}[0-9]/.test(label)) penalty += 35;
  if (/[?@%]|\\b[a-z]{1}\\s+[a-z]{1}\\s+[a-z]{1}\\b/i.test(text)) penalty += 20;
  if ((node.description || "").length < 18) penalty += 60;
  if (label.length <= 2) penalty += 250;
  if (node.type === "dictionary_entry" && !node.description) penalty += 20;

  return penalty;
}

function scoreDictionaryNode(node: DictionaryNode, query: string) {
  const q = normalize(query);
  const label = normalize(node.label || "");
  const type = normalize(node.type || "");
  const featureType = normalize(node.featureType || "");
  const description = normalize(node.description || "");
  const aliases = (node.aliases || []).map(normalize);
  const searchText = normalize(node.searchText || "");

  let score = 0;

  if (label === q) score += 220;
  if (label.includes(q) || q.includes(label)) score += 130;
  if (aliases.some((alias) => alias === q)) score += 150;
  if (aliases.some((alias) => alias.includes(q) || q.includes(alias))) score += 90;
  if (featureType.includes(q) || type.includes(q)) score += 35;
  if (description.includes(q)) score += 30;
  if (searchText.includes(q)) score += 22;

  for (const token of q.split(" ").filter((part) => part.length > 2)) {
    if (label.includes(token)) score += 18;
    if (aliases.some((alias) => alias.includes(token))) score += 14;
    if (description.includes(token)) score += 6;
    if (searchText.includes(token)) score += 4;
  }

  if (/\b(what is|define|dictionary|meaning|called|spelled|old name|also known as)\b/i.test(query)) {
    score += 90;
  }

  if (node.lat && node.lng) score += 8;
  if (node.description && node.description.length > 40) score += 8;
  if (node.type !== "dictionary_entry" && node.type !== "unknown") score += 8;

  score -= ocrPenalty(node);

  return score;
}

function toGeographicItem(node: DictionaryNode): GeographicIndexItem {
  const island = toIslandCode(node.island);

  return {
    id: node.id,
    source: "dictionary",
    category: "dictionary",
    type: node.featureType || node.type || "dictionaryEntry",
    name: node.label,
    canonicalName: node.label,
    displayName: node.label,
    baseName: node.label,
    featureType: node.featureType || node.type || "dictionaryEntry",
    island,
    coordinates:
      typeof node.lat === "number" && typeof node.lng === "number"
        ? { lat: node.lat, lng: node.lng }
        : null,
    estateId: "",
    estateName: "",
    aliases: node.aliases || [node.label],
    imageUrl: "",
    coverImage: "",
    description: node.description || `${node.label} is a Geographic Dictionary entry that still needs cleanup.`,
    sourceUrl: "",
    sources: node.source ? [{ title: node.source }] : [{ title: "Geographic Dictionary of the Virgin Islands" }],
    tags: [
      "dictionaryEntry",
      node.type,
      node.featureType,
      node.island,
      ocrPenalty(node) > 0 ? "needs-cleanup" : "cleaner-entry",
    ].filter(Boolean) as string[],
    searchText: node.searchText,
  } as GeographicIndexItem;
}

export const dictionaryKnowledgeSource: KnowledgeSourceAdapter = {
  sourceId: "dictionary",
  label: "Geographic Dictionary",
  canHandle: wantsDictionary,
  search(input) {
    const desiredIsland = input.island;

    const queryName = normalize(input.query)
  .replace(/^(what is|define|explain|where is|what was)\s+/i, "")
  .replace(/\?+$/g, "")
  .trim();

const scored = dictionaryGraph.nodes
  .filter((node) => {
    const island = toIslandCode(node.island);
    return island === desiredIsland || island === "unknown" || !node.island;
  })
  .map((node) => ({
    node,
    score: scoreDictionaryNode(node, input.query),
  }))
  .filter((item) => item.score > 0)
  .sort((a, b) => b.score - a.score);

const exactMatches = scored.filter((item) => {
  const label = normalize(item.node.label || item.node.name || "");
  return label === queryName;
});

const sourceItems = exactMatches.length > 0 ? exactMatches : scored;

const seen = new Set<string>();
const deduped = sourceItems.filter((item) => {
  const key = normalize(item.node.label || item.node.name || item.node.id);
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
});

const scoredItems = deduped
  .slice(0, input.limit)
  .map((item) => toGeographicItem(item.node));
  

    return {
      sourceId: "dictionary",
      label: "Geographic Dictionary",
      items: scoredItems,
    };
  },
};
