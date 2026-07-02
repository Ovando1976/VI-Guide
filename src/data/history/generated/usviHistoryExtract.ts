// Compatibility wrapper for generated USVI history extract.
// Data now comes from the unified clean geographic index.

import { cleanGeographicIndex } from "../../core/cleanGeographicIndex";

export type UsviHistoryExtractRecord = Record<string, any>;

export const usviHistoryExtract = cleanGeographicIndex.filter((item: any) =>
  ["event", "historyRecord", "archiveRecord"].includes(item.type) ||
  item.sources?.includes("usviHistoryExtract")
) as UsviHistoryExtractRecord[];

export const usviHistoryRecords = usviHistoryExtract;
export const historyExtractRecords = usviHistoryExtract;

export default usviHistoryExtract;
