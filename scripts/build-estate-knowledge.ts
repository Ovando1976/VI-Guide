import fs from "fs";
import path from "path";

import { estates } from "../src/data/estates";
import {
  buildSearchText,
  buildStableEstateId,
  normalizeEstateName,
  normalizeIslandCode,
} from "../src/lib/estate-normalize";

const seenIds = new Map<string, number>();

const records = estates.map((estate) => {
  const baseId = buildStableEstateId({
    island: String(estate.island),
    name: estate.name,
    quarter: estate.quarter,
    geoid: estate.geoid,
  });

  const count = seenIds.get(baseId) ?? 0;
  seenIds.set(baseId, count + 1);

  const estateId = count === 0 ? baseId : `${baseId}:${count + 1}`;

  return {
    estateId,
    geoid: estate.geoid,
    estateName: estate.name,
    normalizedName: normalizeEstateName(estate.name),
    aliases: estate.aliases ?? [],
    island: normalizeIslandCode(String(estate.island)),
    quarter: estate.quarter,
    quarterGroup: estate.quarterGroup,
    category: "estate" as const,
    coordinates: estate.centroid,
    description: estate.description ?? "",
    historicSummary: "",
    danishName: "",
    relatedPlaces: [],
    relatedHistoricSites: [],
    relatedArchives: [],
    tags: [],
    civicPlaces: [],
estateRules: [
  {
    id: "estate-boundary-rule",
    title: "Estate boundary",
    description:
      "This record represents an estate geography layer. Nearby civic places, businesses, schools, churches, and landmarks may be associated with this estate even when their exact parcel relationship still needs review.",
    ruleType: "property",
  },
  {
    id: "archive-review-rule",
    title: "Archive review",
    description:
      "Historical claims should be treated as research leads until connected to a source-backed archive, map, deed, census, church, dictionary, or government record.",
    ruleType: "archive",
  },
  {
    id: "civic-review-rule",
    title: "Civic place review",
    description:
      "Schools, churches, government offices, ports, clinics, and other civic places may be marked as inside, near, serving, unknown, or review until confirmed by parcel or coordinate matching.",
    ruleType: "civic",
  },
],
archiveTargets: {
  historicMaps: true,
  censusRecords: true,
  plantationDocuments: true,
  churchRecords: true,
  photographs: true,
  landRecords: true,
},
confidence: 0.5,
status: "seed",
sources: [],
    searchText: buildSearchText(
      estate.name,
      Array.isArray(estate.aliases) ? estate.aliases : [],
      estate.quarter,
      estate.quarterGroup
      
    ),
  };
});

const output = `import type { EstateKnowledgeIndex } from "../types/estateKnowledge";

export const estateKnowledge: EstateKnowledgeIndex = ${JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    totalEstates: records.length,
    records,
  },
  null,
  2
)};
`;

const outputPath = path.resolve("src/data/estateKnowledge.ts");

fs.writeFileSync(outputPath, output);

console.log("Built estate knowledge:", records.length, "records");
console.log("Unique estate IDs:", new Set(records.map((r) => r.estateId)).size);