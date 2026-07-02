// Compatibility wrapper for estate histories.
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
