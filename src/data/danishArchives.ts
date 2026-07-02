export type DanishArchiveRecord = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  summary?: string;
  translatedText?: string;
  originalLanguage?: string;
  type?: string;
  island?: string;
  estate?: string;
  archiveCollection?: string;
  archiveReference?: string;
  year?: string | number;
  source?: string;
  sourceUrl?: string;
  imageUrl?: string;
  tags?: string[];
  relatedEstates?: string[];
  relatedHistoricSites?: string[];
  relatedDictionaryEntries?: string[];
  searchText?: string;
};

export const danishArchives: DanishArchiveRecord[] = [
  {
    id: "danish-west-indies-archive-theme",
    title: "Danish West Indies Archive Theme",
    subtitle: "Gateway archive record",
    description: "Danish West Indies records connected to Virgin Islands estates, maps, deeds, censuses, church books, and colonial administration.",
    summary: "Gateway record for Danish West Indies archive research.",
    translatedText: "",
    originalLanguage: "Danish",
    type: "archive",
    island: "usvi",
    estate: "",
    archiveCollection: "Danish West Indies",
    archiveReference: "Research gateway",
    year: "1672–1917",
    source: "Danish Archives",
    sourceUrl: "",
    imageUrl: "",
    tags: ["danish archives", "danish west indies", "usvi"],
    relatedEstates: [],
    relatedHistoricSites: [],
    relatedDictionaryEntries: [],
    searchText: "Danish Archives Danish West Indies Virgin Islands estate records maps deeds census church books colonial administration",
  },
];

export const danishArchiveRecords = danishArchives;
export default danishArchives;
