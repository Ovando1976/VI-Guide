import fs from "fs";
import path from "path";

import { estateKnowledge } from "../src/data/estateKnowledge";
import { civicPlaces } from "../src/data/civicPlaces";
import type { EstateKnowledgeIndex } from "../src/types/estateKnowledge";
import { normalizeEstateName } from "../src/lib/estate-normalize";

const enrichedRecords = estateKnowledge.records.map((estate) => {
  const estateName = normalizeEstateName(estate.estateName);
  const estateAliases = estate.aliases.map(normalizeEstateName);

  const matchedCivicPlaces = civicPlaces.filter((place) => {
    if (place.estateGeoid && String(place.estateGeoid) === String(estate.geoid)) {
      return true;
    }

    if (!place.estateName) return false;

    const placeEstateName = normalizeEstateName(place.estateName);

    return estateName === placeEstateName || estateAliases.includes(placeEstateName);
  });

  if (matchedCivicPlaces.length === 0) return estate;

  return {
    ...estate,
    civicPlaces: Array.from(
      new Map(
        [...(estate.civicPlaces ?? []), ...matchedCivicPlaces].map((place) => [
          place.id,
          place,
        ])
      ).values()
    ),
    tags: Array.from(new Set([...(estate.tags ?? []), "civic-linked"])),
    searchText: [
      estate.searchText,
      ...matchedCivicPlaces.map((place) => place.name),
      ...matchedCivicPlaces.map((place) => place.type),
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

console.log("Civic-enriched estate knowledge:", enrichedRecords.length);
console.log(
  "Linked civic places:",
  enrichedRecords.reduce(
    (total, estate) => total + (estate.civicPlaces?.length ?? 0),
    0
  )
);