import {
  cleanGeographicIndex,
  cleanGeographicIndexItems,
  cleanGeographicIndexMeta,
  type CleanGeographicIndexRecord,
  type IslandCode,
} from "./cleanGeographicIndex";

export type { IslandCode };

export type GeographicIndexItem = CleanGeographicIndexRecord;
export type GeographicIndexRecord = CleanGeographicIndexRecord;

export const geographicIndexItems = cleanGeographicIndexItems as GeographicIndexItem[];

export const geographicIndexMeta = {
  ...cleanGeographicIndexMeta,
  totalRecords: geographicIndexItems.length,
};

export const geographicIndex = Object.assign(geographicIndexItems, {
  items: geographicIndexItems,
  records: geographicIndexItems,
  meta: geographicIndexMeta,
});

export const geographicIndexRecords = geographicIndexItems;
export const GEOGRAPHIC_INDEX_ITEMS = geographicIndexItems;
export const GEOGRAPHIC_INDEX = geographicIndex;
export const items = geographicIndexItems;
export const records = geographicIndexItems;
export const GEOGRAPHIC_INDEX_META = geographicIndexMeta;

export default geographicIndex;
