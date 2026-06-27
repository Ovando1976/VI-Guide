import type { HistoryNode } from "../historyGraphTypes";

export const baselineDocuments: HistoryNode[] = [
  {
    id: "doc:rigsarkivet:iversen-1672",
    type: "source_document",
    label: "Jørgen Iversens dokumenter om St. Thomas beboere, 1672–1680",
    properties: {
      archive: "Rigsarkivet",
      collection: "Vestindisk-guineisk Kompagni",
      coverageStart: 1672,
      coverageEnd: 1680,
    },
    evidence: [],
  },
  {
    id: "doc:rigsarkivet:landbreve-1688",
    type: "source_document",
    label: "Vestindisk-guineisk Kompagni landbreve / land patents, 1688–1721",
    properties: {
      archive: "Rigsarkivet",
      collection: "Vestindisk-guineisk Kompagni",
      coverageStart: 1688,
      coverageEnd: 1721,
    },
    evidence: [],
  },
];
