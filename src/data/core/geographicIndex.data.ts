// Compatibility wrapper for old geographicIndex.data module.
// Runtime data now lives in cleanGeographicIndex.data.js.

import { cleanGeographicIndexItems } from "./cleanGeographicIndex";

export const geographicIndexDataItems = cleanGeographicIndexItems;
export default geographicIndexDataItems;
