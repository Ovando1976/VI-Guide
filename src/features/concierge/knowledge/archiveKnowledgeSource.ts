import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import { danishArchives } from "../../../data/danishArchives";
import type { KnowledgeSourceAdapter, KnowledgeSourceInput } from "./types";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/\bft\.?\b/g, "fort")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wantsArchives(input: KnowledgeSourceInput) {
  return (
    input.detectedDomains.includes("all") ||
    input.detectedDomains.includes("archive") ||
    /\b(archive|archives|record|records|source|document|documents|deed|census|map|maps|nara|danish|moravian|research|translation)\b/i.test(input.query)
  );
}

function scoreArchive(record: (typeof danishArchives)[number], query: string) {
  const q = normalize(query);
  const title = normalize(record.title || "");
  const estate = normalize(record.estate || "");
  const collection = normalize(record.archiveCollection || "");
  const reference = normalize(record.archiveReference || "");
  const summary = normalize(record.summary || "");
  const translatedText = normalize(record.translatedText || "");
  const tags = (record.tags || []).map(normalize);

  const relatedText = [
    ...(record.relatedEstates || []),
    ...(record.relatedHistoricSites || []),
    ...(record.relatedDictionaryEntries || []),
  ]
    .map(normalize)
    .join(" ");

  const searchText = [
    title,
    estate,
    collection,
    reference,
    summary,
    translatedText,
    relatedText,
    ...tags,
  ].join(" ");

  let score = 0;

  if (title === q) score += 180;
  if (title.includes(q) || q.includes(title)) score += 120;
  if (estate && (estate === q || estate.includes(q) || q.includes(estate))) score += 90;
  if (reference.includes(q)) score += 70;
  if (summary.includes(q)) score += 45;
  if (translatedText.includes(q)) score += 35;
  if (collection.includes(q)) score += 25;
  if (tags.some((tag) => tag === q || tag.includes(q) || q.includes(tag))) score += 35;
  if (relatedText.includes(q)) score += 30;
  if (searchText.includes(q)) score += 25;

  for (const token of q.split(" ").filter((part) => part.length > 2)) {
    if (title.includes(token)) score += 16;
    if (estate.includes(token)) score += 14;
    if (reference.includes(token)) score += 10;
    if (summary.includes(token)) score += 8;
    if (translatedText.includes(token)) score += 6;
    if (tags.some((tag) => tag.includes(token))) score += 8;
    if (relatedText.includes(token)) score += 6;
  }

  if (/\b(archive|archives|record|records|source|document|research|translation)\b/i.test(query)) {
    score += 80;
  }

  return score;
}

function toGeographicItem(record: (typeof danishArchives)[number]): GeographicIndexItem {
  return {
    id: record.id,
    source: "archive",
    category: "archive",
    type: "archive_record",
    name: record.title,
    canonicalName: record.title,
    displayName: record.title,
    baseName: record.title,
    featureType: "archive_record",
    island: record.island,
    coordinates: null,
    estateId: "",
    estateName: record.estate || "",
    aliases: [record.title, record.archiveReference, record.estate].filter(Boolean),
    imageUrl: "",
    coverImage: "",
    description:
      record.summary ||
      record.translatedText ||
      `${record.title} is an archive research lead for VI Guide.`,
    sourceUrl: record.sourceUrl,
    sources: [
      {
        title: record.archiveCollection || "Archive",
        url: record.sourceUrl,
        note: record.archiveReference,
      },
    ],
    tags: record.tags || [],
    searchText: [
      record.id,
      record.title,
      record.subtitle,
      record.estate,
      record.archiveCollection,
      record.archiveReference,
      record.originalLanguage,
      record.summary,
      record.translatedText,
      ...(record.relatedEstates || []),
      ...(record.relatedHistoricSites || []),
      ...(record.relatedDictionaryEntries || []),
      ...(record.tags || []),
    ]
      .filter(Boolean)
      .join(" "),
  } as unknown as GeographicIndexItem;
}

export const archiveKnowledgeSource: KnowledgeSourceAdapter = {
  sourceId: "archive",
  label: "Archives",
  canHandle: wantsArchives,
  search(input) {
    const scored = danishArchives
      .filter((record) => record.island === input.island)
      .map((record) => ({
        record,
        score: scoreArchive(record, input.query),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit)
      .map((item) => toGeographicItem(item.record));

    return {
      sourceId: "archive",
      label: "Archives",
      items: scored,
    };
  },
};
