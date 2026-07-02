import { writeFileSync } from "node:fs";

const files = {
  "src/data/atlas/atlasSearchIndex.ts": `// Compatibility wrapper for the old atlas search index.
// Data now comes from the unified clean geographic index.

import {
  cleanGeographicIndex,
  type CleanGeographicIndexRecord,
} from "../core/cleanGeographicIndex";

export type AtlasSearchRecord = CleanGeographicIndexRecord & Record<string, any>;

export const atlasSearchIndex = cleanGeographicIndex as AtlasSearchRecord[];
export const atlasSearchRecords = atlasSearchIndex;
export const atlasSearchItems = atlasSearchIndex;

export default atlasSearchIndex;
`,

  "src/data/estateKnowledge.ts": `// Compatibility wrapper for the old estate knowledge module.
// Data now comes from the unified clean geographic index.

import {
  cleanGeographicIndex,
  type CleanGeographicIndexRecord,
} from "./core/cleanGeographicIndex";

export type EstateKnowledgeRecord = CleanGeographicIndexRecord & Record<string, any>;

function isEstate(item: any) {
  return (
    item.type === "estate" ||
    item.category === "estate" ||
    item.sources?.includes("estateKnowledge") ||
    item.sources?.includes("estateFeatureLinks") ||
    item.sources?.includes("estateHistories")
  );
}

const records = cleanGeographicIndex.filter(isEstate) as EstateKnowledgeRecord[];

const byId = Object.fromEntries(
  records.map((item: any) => [item.id || item.slug || item.name, item]),
);

const byGeoid = Object.fromEntries(
  records
    .map((item: any) => [item.geoid || item.estateId || item.id || item.slug, item])
    .filter(([key]) => Boolean(key)),
);

export const estateKnowledgeRecords = records;
export const estateKnowledgeItems = records;
export const estateKnowledgeById = byId;
export const estateKnowledgeByGeoid = byGeoid;

export const estateKnowledge = Object.assign(records, {
  records,
  items: records,
  byId,
  byGeoid,
}) as any;

export default estateKnowledge;
`,

  "src/data/standaloneDictionaryPlaces.ts": `// Compatibility wrapper for standalone dictionary places.
// Data now comes from the unified clean geographic index.

import {
  cleanGeographicIndex,
  type CleanGeographicIndexRecord,
} from "./core/cleanGeographicIndex";

export type StandaloneDictionaryPlace = CleanGeographicIndexRecord & Record<string, any>;

export const standaloneDictionaryPlaces = cleanGeographicIndex.filter((item: any) =>
  item.type === "dictionaryEntry" ||
  item.sources?.includes("standaloneDictionaryPlaces") ||
  item.sources?.includes("geographicDictionaryEntries")
) as StandaloneDictionaryPlace[];

export default standaloneDictionaryPlaces;
`,

  "src/data/quarterFeatureLinks.ts": `// Compatibility wrapper for quarter feature links.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "./core/cleanGeographicIndex";

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type QuarterFeatureLink = Record<string, any>;

export const quarterFeatureLinks = cleanGeographicIndex.filter((item: any) =>
  item.type === "quarter" ||
  item.sources?.includes("quarterFeatureLinks")
) as QuarterFeatureLink[];

export function getQuarterFeatures(quarterNameOrId?: string, island?: string) {
  const key = normalize(quarterNameOrId);

  return cleanGeographicIndex.filter((item: any) => {
    if (island && item.island && item.island !== island) return false;

    if (!key) {
      return item.type !== "quarter" && item.island === island;
    }

    const haystack = normalize([
      item.id,
      item.slug,
      item.name,
      item.displayName,
      item.quarter,
      item.quarterName,
      item.quarterId,
      item.description,
      ...(item.tags || []),
      ...(item.aliases || []),
    ].join(" "));

    return haystack.includes(key);
  });
}

export function getQuarterFeaturesByQuarter(quarterNameOrId?: string, island?: string) {
  return getQuarterFeatures(quarterNameOrId, island);
}

export default quarterFeatureLinks;
`,

  "src/data/estateFeatureLinks.ts": `// Compatibility wrapper for estate feature links.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "./core/cleanGeographicIndex";

function normalize(value: unknown) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type EstateFeatureLink = Record<string, any>;

export const estateFeatureLinks = cleanGeographicIndex.filter((item: any) =>
  item.type === "estate" ||
  item.sources?.includes("estateFeatureLinks")
) as EstateFeatureLink[];

export function getEstateFeaturesByGeoid(geoid?: string) {
  const key = normalize(geoid);

  if (!key) return [];

  return cleanGeographicIndex.filter((item: any) => {
    const haystack = normalize([
      item.id,
      item.slug,
      item.name,
      item.displayName,
      item.geoid,
      item.estateId,
      item.description,
      ...(item.tags || []),
      ...(item.aliases || []),
    ].join(" "));

    return haystack.includes(key);
  });
}

export function getEstateFeatures(geoid?: string) {
  return getEstateFeaturesByGeoid(geoid);
}

export default estateFeatureLinks;
`,

  "src/data/estateHistories.ts": `// Compatibility wrapper for estate histories.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "./core/cleanGeographicIndex";

export type EstateHistoryRecord = Record<string, any>;

export const estateHistories = cleanGeographicIndex.filter((item: any) =>
  item.type === "estate" && Boolean(item.description)
) as EstateHistoryRecord[];

export function getEstateHistoryByGeoid(geoid?: string) {
  const key = String(geoid || "").toLowerCase();

  return estateHistories.find((item: any) =>
    String(item.geoid || item.estateId || item.id || item.slug || "")
      .toLowerCase()
      .includes(key)
  );
}

export default estateHistories;
`,

  "src/data/history/generated/usviHistoryExtract.ts": `// Compatibility wrapper for generated USVI history extract.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "../../core/cleanGeographicIndex";

export type UsviHistoryExtractRecord = Record<string, any>;

export const usviHistoryExtract = cleanGeographicIndex.filter((item: any) =>
  ["event", "historyRecord", "archiveRecord"].includes(item.type) ||
  item.sources?.includes("usviHistoryExtract")
) as UsviHistoryExtractRecord[];

export const usviHistoryRecords = usviHistoryExtract;
export const historyExtractRecords = usviHistoryExtract;

export default usviHistoryExtract;
`,

  "src/data/generated/geographicDictionaryEntries.ts": `// Compatibility wrapper for generated Geographic Dictionary entries.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "../core/cleanGeographicIndex";

export type GeographicDictionaryEntry = Record<string, any>;

export const geographicDictionaryEntries = cleanGeographicIndex.filter((item: any) =>
  item.type === "dictionaryEntry" ||
  item.sources?.includes("geographicDictionaryEntries") ||
  item.sources?.includes("standaloneDictionaryPlaces")
) as GeographicDictionaryEntry[];

export default geographicDictionaryEntries;
`,

  "src/data/core/geographicDictionaryAdditions.ts": `// Compatibility wrapper for Geographic Dictionary additions.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "./cleanGeographicIndex";

export type GeographicDictionaryAddition = Record<string, any>;

export const geographicDictionaryAdditions = cleanGeographicIndex.filter((item: any) =>
  item.source === "geographic-dictionary-1925" ||
  item.sources?.includes("geographicDictionaryAdditions") ||
  item.sources?.includes("geographic-dictionary-1925")
) as GeographicDictionaryAddition[];

export default geographicDictionaryAdditions;
`,

  "src/data/core/geographicIndex.data.ts": `// Compatibility wrapper for old geographicIndex.data module.
// Runtime data now lives in cleanGeographicIndex.data.js.

import { cleanGeographicIndexItems } from "./cleanGeographicIndex";

export const geographicIndexDataItems = cleanGeographicIndexItems;
export default geographicIndexDataItems;
`,
};

for (const [file, text] of Object.entries(files)) {
  writeFileSync(file, text);
  console.log(`Repaired ${file}`);
}
