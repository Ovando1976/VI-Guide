// Compatibility wrapper for quarter feature links.
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
