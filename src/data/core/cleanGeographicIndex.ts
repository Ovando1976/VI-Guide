import cleanGeographicIndexData from "./cleanGeographicIndex.data.js";

export type IslandCode =
  | "st_thomas"
  | "st_john"
  | "st_croix"
  | "water_island"
  | "";

export type CleanGeographicIndexRecord = {
  id: string;
  name: string;
  displayName: string;
  normalizedName: string;
  slug: string;
  island: IslandCode;
  type: string;
  category: string;
  description: string;
  shortDescription?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  aliases: string[];
  historicalNames: string[];
  tags: string[];
  sources: string[];
  sourceRecords: Array<{
    source: string;
    id?: string;
    name?: string;
    type?: string;
    priority: number;
  }>;
  relationships: Array<{
    type: string;
    targetId?: string;
    targetName?: string;
    source: string;
  }>;
  confidence: "high" | "medium" | "low";
  needsReview: boolean;
  reviewNotes: string[];
  [key: string]: any;
};

export const cleanGeographicIndex =
  cleanGeographicIndexData as CleanGeographicIndexRecord[];

export const cleanGeographicIndexMeta = {
  totalRecords: cleanGeographicIndex.length,
  byIsland: cleanGeographicIndex.reduce<Record<string, number>>((acc, item) => {
    const island = item.island || "unknown";
    acc[island] = (acc[island] || 0) + 1;
    return acc;
  }, {}),
  byType: cleanGeographicIndex.reduce<Record<string, number>>((acc, item) => {
    const type = item.type || "unknown";
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}),
  needsReview: cleanGeographicIndex.filter((item) => item.needsReview).length,
};

export const cleanGeographicIndexItems = cleanGeographicIndex;
export default cleanGeographicIndex;
