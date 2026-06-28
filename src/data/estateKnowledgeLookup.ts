// src/data/estateKnowledgeLookup.ts
import { estateKnowledge } from "./estateKnowledge";

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/^estate\s+/i, "")
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getEstateKnowledgeByEstateId(estateId: string) {
  return estateKnowledge.records.find((item) => item.estateId === estateId);
}

export function getEstateKnowledgeByGeoid(geoid: string) {
  return estateKnowledge.records.find(
    (item) => String(item.geoid) === String(geoid)
  );
}

export function getEstateKnowledgeByName(name: string) {
  const key = normalize(name);

  return estateKnowledge.records.find((item) => {
    const nameMatch = normalize(item.estateName) === key;
    const normalizedMatch = item.normalizedName === key;
    const aliasMatch = item.aliases.some((alias) => normalize(alias) === key);

    return nameMatch || normalizedMatch || aliasMatch;
  });
}

export function getEstateKnowledgeForEstate(input: {
  geoid?: string;
  name?: string;
}) {
  if (input.geoid) {
    const byGeoid = getEstateKnowledgeByGeoid(input.geoid);
    if (byGeoid) return byGeoid;
  }

  if (input.name) {
    return getEstateKnowledgeByName(input.name);
  }

  return undefined;
}