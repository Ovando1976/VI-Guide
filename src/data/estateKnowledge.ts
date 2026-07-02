// Compatibility wrapper for the old estate knowledge module.
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
