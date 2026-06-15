import type { IslandCode } from "../../types";

export type ArchiveRecordType =
  | "map"
  | "census"
  | "church"
  | "estate"
  | "military"
  | "deed"
  | "government"
  | "document"
  | "drawing"
  | "photo"
  | "unknown";

export type HistoricArchiveRecord = {
  id: string;
  title: string;
  translatedTitle?: string;
  displayTitle?: string;
  translatedDescription?: string;
  description?: string;
  source?: string;
  sourceUrl?: string;
  image?: string;
  highResImage?: string;
  island?: IslandCode | "all";
  location?: string;
  year?: number | null;
  yearLabel?: string;
  recordType: ArchiveRecordType;
  category?: string;
  featureType?: string;
  language?: string;
  originalText?: string[];
  extractedText?: string;
  englishTranslation?: string[];
  translatedText?: string[];
  detectedPlaces?: string[];
  detectedPeople?: string[];
  detectedYears?: number[];
  topics?: string[];
  tags?: string[];
  relatedEstateIds?: string[];
  relatedEventIds?: string[];
  relatedArchiveIds?: string[];
  translationConfidence?: number;
  needsHumanReview?: boolean;
};

type SearchArchivesParams = {
  island?: IslandCode | "all";
  query?: string;
  type?: ArchiveRecordType | "all" | string;
};

const FALLBACK_ARCHIVES: HistoricArchiveRecord[] = [
  {
    id: "danish-west-indies-theme",
    title: "Danish West Indies Archive Theme",
    translatedTitle: "Danish West Indies Archive Theme",
    translatedDescription:
      "Gateway record for Danish National Archives material connected to the Virgin Islands.",
    source: "Danish National Archives / Rigsarkivet",
    sourceUrl: "https://arkivalieronline.rigsarkivet.dk/en/collection/theme/8",
    island: "all",
    location: "Danish West Indies / Virgin Islands",
    yearLabel: "1672–1917",
    recordType: "document",
    tags: ["danish-archives", "danish-west-indies", "usvi"],
    englishTranslation: [],
    relatedEstateIds: [],
    relatedEventIds: ["1917-transfer-day"],
  },
  {
    id: "central-directorate-maps-drawings",
    title: "Central Directorate for the Colonies - Maps and Drawings",
    translatedTitle: "Central Directorate for the Colonies - Maps and Drawings",
    translatedDescription:
      "Map and drawing series for the Danish West Indies, including St. Thomas, St. John, St. Croix, harbors, towns, plantations, and public works.",
    source: "Danish National Archives / Rigsarkivet",
    sourceUrl:
      "https://arkivalieronline.rigsarkivet.dk/en/other/index-creator/153/2354827/20104126",
    island: "all",
    location: "Danish West Indies / Virgin Islands",
    yearLabel: "1760–1916",
    recordType: "map",
    tags: ["maps", "drawings", "danish-west-indies", "central-directorate"],
    englishTranslation: [],
    relatedEstateIds: [],
    relatedEventIds: ["1764-free-port", "1917-transfer-day"],
  },
  {
    id: "chamber-revenue-maps-drawings",
    title: "Chamber of Revenue - Maps and Drawings",
    translatedTitle: "Chamber of Revenue - Maps and Drawings",
    translatedDescription:
      "Revenue and administrative map material connected to land, estates, taxation, government, and colonial planning.",
    source: "Danish National Archives / Rigsarkivet",
    sourceUrl:
      "https://arkivalieronline.rigsarkivet.dk/en/other/index-creator/153/6754/20104124",
    island: "all",
    location: "Danish West Indies / Virgin Islands",
    yearLabel: "Danish period",
    recordType: "map",
    tags: ["maps", "drawings", "revenue", "estates"],
    englishTranslation: [],
    relatedEstateIds: [],
    relatedEventIds: [],
  },
];

function normalizeText(value: unknown) {
  return String(value ?? "").toLowerCase().trim();
}

function normalizeArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  if (!value) return [];
  return [String(value)];
}

function normalizeRecordType(item: any): ArchiveRecordType {
  const raw = normalizeText(item.recordType || item.featureType || item.category);

  if (raw.includes("map")) return "map";
  if (raw.includes("census")) return "census";
  if (raw.includes("church")) return "church";
  if (raw.includes("estate")) return "estate";
  if (raw.includes("military")) return "military";
  if (raw.includes("deed")) return "deed";
  if (raw.includes("government")) return "government";
  if (raw.includes("drawing")) return "drawing";
  if (raw.includes("photo")) return "photo";
  if (raw.includes("document")) return "document";

  return "unknown";
}

function normalizeArchiveRecord(item: any): HistoricArchiveRecord {
  const englishTranslation = normalizeArray(
    item.englishTranslation || item.translatedText
  );

  const originalText = normalizeArray(item.originalText || item.extractedText);

  const translatedTitle =
    item.displayTitle ||
    item.translatedTitle ||
    item.title ||
    "Untitled Archive Record";

  return {
    id: String(item.id),
    title: String(item.title || translatedTitle),
    translatedTitle,
    displayTitle: translatedTitle,
    translatedDescription: item.translatedDescription || item.description || "",
    description: item.description || item.translatedDescription || "",
    source: item.source || "Danish National Archives / Rigsarkivet",
    sourceUrl: item.sourceUrl,
    image: item.image,
    highResImage: item.highResImage,
    island: item.island || "all",
    location: item.location || "Danish West Indies / Virgin Islands",
    year: item.year ?? null,
    yearLabel: item.yearLabel || (item.year ? String(item.year) : ""),
    recordType: normalizeRecordType(item),
    category: item.category,
    featureType: item.featureType,
    language: item.language,
    originalText,
    extractedText: originalText.join("\n"),
    englishTranslation,
    translatedText: englishTranslation,
    detectedPlaces: normalizeArray(item.detectedPlaces),
    detectedPeople: normalizeArray(item.detectedPeople),
    detectedYears: Array.isArray(item.detectedYears)
      ? item.detectedYears
          .filter((year: unknown) => Number.isFinite(Number(year)))
          .map(Number)
      : [],
    topics: normalizeArray(item.topics),
    tags: normalizeArray(item.tags),
    relatedEstateIds: normalizeArray(item.relatedEstateIds),
    relatedEventIds: normalizeArray(item.relatedEventIds),
    relatedArchiveIds: normalizeArray(item.relatedArchiveIds),
    translationConfidence:
      typeof item.translationConfidence === "number"
        ? item.translationConfidence
        : undefined,
    needsHumanReview: Boolean(item.needsHumanReview),
  };
}

export const HISTORIC_ARCHIVE_RECORDS: HistoricArchiveRecord[] =
  FALLBACK_ARCHIVES.map(normalizeArchiveRecord);

export function searchArchives({
  island = "all",
  query = "",
  type = "all",
}: SearchArchivesParams): HistoricArchiveRecord[] {
  const q = normalizeText(query);
  const requestedType = normalizeText(type);

  return HISTORIC_ARCHIVE_RECORDS.filter((record) => {
    const islandMatch =
      island === "all" ||
      record.island === "all" ||
      record.island === island;

    const typeMatch =
      requestedType === "all" ||
      record.recordType === requestedType ||
      record.category === requestedType ||
      record.featureType === requestedType;

    const haystack = [
      record.title,
      record.translatedTitle,
      record.displayTitle,
      record.translatedDescription,
      record.location,
      record.source,
      record.recordType,
      record.category,
      record.featureType,
      record.language,
      ...(record.originalText || []),
      ...(record.englishTranslation || []),
      ...(record.detectedPlaces || []),
      ...(record.detectedPeople || []),
      ...(record.topics || []),
      ...(record.tags || []),
      ...(record.relatedEstateIds || []),
      ...(record.relatedEventIds || []),
      ...(record.relatedArchiveIds || []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return islandMatch && typeMatch && (!q || haystack.includes(q));
  });
}

export function getArchiveRecordById(id?: string | null) {
  if (!id) return null;

  return HISTORIC_ARCHIVE_RECORDS.find((record) => record.id === id) ?? null;
}

export function getArchiveRecordsForEvent(eventId: string) {
  return HISTORIC_ARCHIVE_RECORDS.filter((record) =>
    record.relatedEventIds?.includes(eventId)
  );
}

export function getArchiveRecordsForEstate(estateId: string) {
  return HISTORIC_ARCHIVE_RECORDS.filter((record) =>
    record.relatedEstateIds?.includes(estateId)
  );
}