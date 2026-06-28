import {
  stThomasPortKnowledge,
  type HistoricalKnowledgeRecord,
} from "./stThomasPortKnowledge";
import {
  historicalAccountStThomasFacts,
  historicalAccountStThomasPages46To53,
  historicalAccountStThomasPages54To63,
  historicalAccountStThomasPages64To72,
  historicalAccountStThomasPages73To82,
  historicalAccountStThomasPages83To92,
  knoxOcrRecords093To102,
  knoxOcrRecords103To112,
  knoxOcrRecords113To122,
  knoxOcrRecords123To132,
  knoxOcrRecords133To142,
  knoxOcrRecords143To152,
  knoxOcrRecords153To162,
  knoxOcrRecords163To172,
  knoxOcrRecords173To182,
  knoxOcrRecords183To192,
  knoxOcrRecords193To202,
  knoxOcrRecords203To212,
  knoxOcrRecords213To222,
  knoxOcrRecords223To232,
  knoxOcrRecords233To242,
  knoxOcrRecords243To252,
  knoxOcrRecords253To262,
  knoxOcrRecords263To264,
} from "../sources";
import { usviHistoryExtract } from "../generated/usviHistoryExtract";

export type { HistoricalKnowledgeRecord };

function sourceFactToKnowledgeRecord(
  fact: (typeof historicalAccountStThomasFacts)[number],
): HistoricalKnowledgeRecord {
  return {
    id: fact.id,
    title: fact.title,
    type:
      fact.type === "source_author"
        ? "person"
        : fact.type === "settlement" ||
            fact.type === "migration" ||
            fact.type === "agriculture"
          ? "event"
          : fact.type,
    island: "st_thomas",
    relatedPlaces: fact.places,
    dateRange: fact.year ? String(fact.year) : fact.yearRange,
    summary: fact.summary,
    significance: fact.significance,
    relatedIds: [],
    searchTerms: [
      fact.title,
      ...fact.places,
      ...fact.people,
      fact.source.book,
      fact.source.section ?? "",
    ],
    source: {
      title: fact.source.book,
      author: "Unknown / historical compilation",
      publication: "Historical source",
      year: 0,
      pages: fact.source.page,
    },
  };
}

function generatedRecordToKnowledgeRecord(
  record: (typeof usviHistoryExtract)[number],
): HistoricalKnowledgeRecord {
  const island =
    record.places.includes("St. John")
      ? "st_john"
      : record.places.includes("St. Croix")
        ? "st_croix"
        : "st_thomas";

  return {
    id: record.id,
    title: record.title,
    type: record.type === "maritime" ? "industry" : "event",
    island,
    relatedPlaces: [
      ...record.places,
      ...(record.estates ?? []),
      ...(record.historicSites ?? []),
    ],
    dateRange: record.year ? String(record.year) : undefined,
    summary: record.summary,
    significance:
      "This record is part of the imported USVI historical chronology and may connect to people, places, estates, institutions, infrastructure, labor history, or public events.",
    relatedIds: [],
    searchTerms: [
      record.title,
      record.type,
      ...record.places,
      ...record.people,
      ...(record.organizations ?? []),
      ...(record.estates ?? []),
      ...(record.historicSites ?? []),
      record.source.title,
      record.source.file,
    ],
    source: {
      title: record.source.title,
      author: "Imported historical document",
      publication: record.source.file,
      year: record.year ?? 0,
      pages: `paragraph ${record.source.paragraph}`,
    },
  };
}

const knoxSourceRecords = [
  ...historicalAccountStThomasPages46To53,
  ...historicalAccountStThomasPages54To63,
  ...historicalAccountStThomasPages64To72,
  ...historicalAccountStThomasPages73To82,
  ...historicalAccountStThomasPages83To92,
  ...knoxOcrRecords093To102,
  ...knoxOcrRecords103To112,
  ...knoxOcrRecords113To122,
  ...knoxOcrRecords123To132,
  ...knoxOcrRecords133To142,
  ...knoxOcrRecords143To152,
  ...knoxOcrRecords153To162,
  ...knoxOcrRecords163To172,
  ...knoxOcrRecords173To182,
  ...knoxOcrRecords183To192,
  ...knoxOcrRecords193To202,
  ...knoxOcrRecords203To212,
  ...knoxOcrRecords213To222,
  ...knoxOcrRecords223To232,
  ...knoxOcrRecords233To242,
  ...knoxOcrRecords243To252,
  ...knoxOcrRecords253To262,
  ...knoxOcrRecords263To264,
];

function getKnoxYear(fact: (typeof knoxSourceRecords)[number]): number | undefined {
  return "year" in fact && typeof fact.year === "number" ? fact.year : undefined;
}

function knoxSourceToKnowledgeRecord(
  fact: (typeof knoxSourceRecords)[number],
): HistoricalKnowledgeRecord {
  const year = getKnoxYear(fact);

  return {
    id: fact.id,
    title: fact.title,
    type:
      fact.type === "estate"
        ? "place"
        : fact.type === "law"
          ? "law"
          : fact.type === "document"
            ? "document"
            : fact.type === "place"
              ? "place"
              : "event",
    island: "st_thomas",
    relatedPlaces: [...fact.places, ...fact.estates, ...fact.historicSites],
    dateRange: year ? String(year) : undefined,
    summary: fact.summary,
    significance: fact.significance,
    relatedIds: [],
    searchTerms: [
      fact.title,
      fact.type,
      fact.summary,
      fact.significance,
      year ? String(year) : "",
      year ? `${year} ${fact.title}` : fact.title,
      year ? `${year} deeds` : "",

      fact.title.toLowerCase().includes("landholder") ||
      fact.summary.toLowerCase().includes("landholder")
        ? "early landholders"
        : "",

      fact.title.toLowerCase().includes("landholder") ||
      fact.summary.toLowerCase().includes("landholder")
        ? "first landholders"
        : "",

      fact.title.toLowerCase().includes("deed") ||
      fact.summary.toLowerCase().includes("deed")
        ? "early deeds"
        : "",

      fact.summary.toLowerCase().includes("plantation boundaries")
        ? "plantation boundaries"
        : "",

      ...fact.places,
      ...fact.people,
      ...fact.organizations,
      ...fact.estates,
      ...fact.historicSites,
      fact.source.book,
      fact.source.section,
    ],
    source: {
      title: fact.source.book,
      author: fact.source.author,
      publication: "Historical source",
      year: year ?? 0,
      pages: fact.source.page,
    },
  };
}

export const historyKnowledge: HistoricalKnowledgeRecord[] = [
  ...stThomasPortKnowledge,
  ...historicalAccountStThomasFacts.map(sourceFactToKnowledgeRecord),
  ...knoxSourceRecords.map(knoxSourceToKnowledgeRecord),
  ...usviHistoryExtract.map(generatedRecordToKnowledgeRecord),
];

export function getHistoryRecordById(id: string) {
  return historyKnowledge.find((record) => record.id === id) ?? null;
}

export function searchHistoryKnowledge(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return historyKnowledge;

  return historyKnowledge.filter((record) => {
    const haystack = [
      record.id,
      record.title,
      record.type,
      record.island,
      record.dateRange ?? "",
      record.summary,
      record.significance,
      ...record.relatedPlaces,
      ...record.relatedIds,
      ...record.searchTerms,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });
}

export function getHistoryRecordsByIsland(
  island: HistoricalKnowledgeRecord["island"],
) {
  return historyKnowledge.filter((record) => record.island === island);
}

export function getHistoryRecordsByType(
  type: HistoricalKnowledgeRecord["type"],
) {
  return historyKnowledge.filter((record) => record.type === type);
}