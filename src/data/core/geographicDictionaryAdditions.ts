// Compatibility wrapper for Geographic Dictionary additions.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "./cleanGeographicIndex";

export type GeographicDictionaryAddition = Record<string, any>;

export const geographicDictionaryAdditions = cleanGeographicIndex.filter((item: any) =>
  item.source === "geographic-dictionary-1925" ||
  item.sources?.includes("geographicDictionaryAdditions") ||
  item.sources?.includes("geographic-dictionary-1925")
) as GeographicDictionaryAddition[];

export default geographicDictionaryAdditions;
