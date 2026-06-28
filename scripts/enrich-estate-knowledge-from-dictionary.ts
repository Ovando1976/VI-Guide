// scripts/enrich-estate-knowledge-from-dictionary.ts
import fs from "fs";
import path from "path";

import { estateKnowledge } from "../src/data/estateKnowledge";
import { dictionaryGraph } from "../src/data/dictionaryGraph";
import type { EstateKnowledgeIndex } from "../src/types/estateKnowledge";
import { normalizeEstateName } from "../src/lib/estate-normalize";

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function getNodeSearchText(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  const item = node as Record<string, unknown>;

  return [
    item.label,
    item.name,
    item.title,
    item.description,
    item.featureType,
    item.island,
    item.quarter,
  ]
    .map(asString)
    .join(" ")
    .toLowerCase();
}

function getNodeLabel(node: unknown): string {
  if (!node || typeof node !== "object") return "Unknown dictionary feature";

  const item = node as Record<string, unknown>;

  return (
    asString(item.label) ||
    asString(item.name) ||
    asString(item.title) ||
    "Unknown dictionary feature"
  );
}

const enrichedRecords = estateKnowledge.records.map((estate) => {
  const names = [
    estate.estateName,
    estate.normalizedName,
    ...estate.aliases,
  ]
    .map(normalizeEstateName)
    .filter(Boolean);

  const matchedNodes = dictionaryGraph.nodes.filter((node) => {
    const text = getNodeSearchText(node);
    if (!text) return false;

    return names.some((name) => text.includes(name));
  });

  const dictionaryPlaces = matchedNodes
    .map(getNodeLabel)
    .filter(Boolean)
    .slice(0, 25);

  const relatedPlaces = Array.from(
    new Set([...(estate.relatedPlaces ?? []), ...dictionaryPlaces])
  ).slice(0, 30);

  const relatedArchives =
    matchedNodes.length > 0
      ? Array.from(
          new Set([
            ...(estate.relatedArchives ?? []),
            "Geographic Dictionary of the Virgin Islands",
          ])
        )
      : estate.relatedArchives;

  const tags =
    matchedNodes.length > 0
      ? Array.from(new Set([...(estate.tags ?? []), "dictionary-linked"]))
      : estate.tags;

  const description =
    estate.description ||
    `${estate.estateName} is an official estate record in the U.S. Virgin Islands estate layer. Dictionary-linked evidence is being reviewed to connect this estate with historic place names, nearby features, and archive references.`;

  return {
    ...estate,
    description,
    relatedPlaces,
    relatedArchives,
    tags,
    searchText: [
      estate.searchText,
      ...dictionaryPlaces,
      ...relatedArchives,
      ...tags,
    ]
      .join(" ")
      .toLowerCase(),
  };
});

const outputIndex: EstateKnowledgeIndex = {
  generatedAt: new Date().toISOString(),
  totalEstates: enrichedRecords.length,
  records: enrichedRecords,
};

const output = `import type { EstateKnowledgeIndex } from "../types/estateKnowledge";

export const estateKnowledge: EstateKnowledgeIndex = ${JSON.stringify(
  outputIndex,
  null,
  2
)};
`;

fs.writeFileSync(path.resolve("src/data/estateKnowledge.ts"), output);

console.log("Dictionary-enriched estate knowledge:", enrichedRecords.length);