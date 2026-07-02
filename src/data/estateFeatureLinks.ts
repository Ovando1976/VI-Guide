// Compatibility wrapper for estate feature links.
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
