// Compatibility wrapper for the old atlas search index.
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
