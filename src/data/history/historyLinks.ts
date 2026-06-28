import { searchHistoryKnowledge } from "./books/historyKnowledge";
import type { HistoricalKnowledgeRecord } from "./books/historyKnowledge";

function uniq(records: HistoricalKnowledgeRecord[]) {
  const seen = new Set<string>();
  return records.filter((record) => {
    if (seen.has(record.id)) return false;
    seen.add(record.id);
    return true;
  });
}

export function getHistoryForEstate(input: {
  name?: string | null;
  geoid?: string | null;
  estateId?: string | null;
}) {
  const queries = [input.name, input.geoid, input.estateId]
    .filter(Boolean)
    .map(String);

  return uniq(queries.flatMap((query) => searchHistoryKnowledge(query)));
}

export function getHistoryForHistoricSite(input: {
  name?: string | null;
  siteId?: string | null;
}) {
  const queries = [input.name, input.siteId].filter(Boolean).map(String);

  return uniq(queries.flatMap((query) => searchHistoryKnowledge(query)));
}