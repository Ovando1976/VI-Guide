// Compatibility wrapper for standalone dictionary places.
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
