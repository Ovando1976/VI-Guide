// Compatibility wrapper for generated Geographic Dictionary entries.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "../core/cleanGeographicIndex";

export type GeographicDictionaryEntry = Record<string, any>;

export const geographicDictionaryEntries = cleanGeographicIndex.filter((item: any) =>
  item.type === "dictionaryEntry" ||
  item.sources?.includes("geographicDictionaryEntries") ||
  item.sources?.includes("standaloneDictionaryPlaces")
) as GeographicDictionaryEntry[];

export default geographicDictionaryEntries;
