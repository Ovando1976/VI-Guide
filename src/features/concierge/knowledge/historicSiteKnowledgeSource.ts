import type { GeographicIndexItem } from "../../../data/core/geographicIndex";
import { historicSites } from "../../../data/historicSites";
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

function wantsHistoricSites(input: KnowledgeSourceInput) {
  return (
    input.detectedDomains.includes("all") ||
    input.detectedDomains.includes("historicSite") ||
    input.detectedDomains.includes("archive") ||
    input.detectedDomains.includes("dictionary") ||
    /\b(history|historic|fort|church|synagogue|plantation|ruins|nrhp|national register|danish|moravian|sugar|emancipation|fireburn|archive)\b/i.test(input.query)
  );
}

function scoreHistoricSite(site: (typeof historicSites)[number], query: string) {
  const q = normalize(query);
  const name = normalize(site.name);
  const estate = normalize(site.estate || "");
  const type = normalize(site.type || "");
  const category = normalize(site.category || "");
  const description = normalize(site.description || "");
  const history = normalize(site.history || "");
  const significance = normalize(site.significance || "");
  const tags = site.tags.map(normalize);

  const searchText = [
    name,
    estate,
    type,
    category,
    description,
    history,
    significance,
    ...tags,
    ...(site.relatedEstates || []).map(normalize),
    ...(site.relatedArchives || []).map(normalize),
    ...(site.relatedDictionaryEntries || []).map(normalize),
  ].join(" ");

  let score = 0;

  if (name === q) score += 120;
  if (name.includes(q) || q.includes(name)) score += 80;
  if (estate && (estate === q || estate.includes(q) || q.includes(estate))) score += 40;
  if (type && (type === q || type.includes(q) || q.includes(type))) score += 28;
  if (category && category.includes(q)) score += 12;
  if (tags.some((tag) => tag === q || tag.includes(q) || q.includes(tag))) score += 28;
  if (description.includes(q)) score += 20;
  if (history.includes(q)) score += 20;
  if (significance.includes(q)) score += 18;
  if (searchText.includes(q)) score += 16;

  for (const token of q.split(" ").filter((part) => part.length > 2)) {
    if (name.includes(token)) score += 12;
    if (estate.includes(token)) score += 8;
    if (type.includes(token)) score += 6;
    if (tags.some((tag) => tag.includes(token))) score += 6;
    if (description.includes(token)) score += 4;
    if (history.includes(token)) score += 4;
    if (significance.includes(token)) score += 4;
  }

  if (site.coordinates) score += 4;
  if (site.relatedArchives?.length) score += 5;
  if (site.tags.includes("nrhp")) score += 5;

  return score;
}

function toGeographicItem(site: (typeof historicSites)[number]): GeographicIndexItem {
  return {
    id: site.id,
    source: "historicSite",
    category: site.category || "historic",
    type: site.type,
    name: site.name,
    canonicalName: site.name,
    displayName: site.name,
    baseName: site.name,
    featureType: site.type,
    island: site.island,
    coordinates: site.coordinates || null,
    estateId: site.estateId || "",
    estateName: site.estate || "",
    aliases: [site.name],
    imageUrl: site.imageUrl || site.coverImage || site.thumbnailUrl || "",
    coverImage: site.coverImage || site.imageUrl || site.thumbnailUrl || "",
    description:
      site.significance ||
      site.history ||
      site.description ||
      `${site.name} is a historic site in the U.S. Virgin Islands.`,
    tags: site.tags,
    sources: site.source ? [{ title: site.source }] : [],
    searchText: [
      site.id,
      site.name,
      site.estate,
      site.type,
      site.category,
      site.description,
      site.history,
      site.significance,
      ...(site.tags || []),
      ...(site.relatedEstates || []),
      ...(site.relatedArchives || []),
      ...(site.relatedDictionaryEntries || []),
    ]
      .filter(Boolean)
      .join(" "),
  } as unknown as GeographicIndexItem;
}

export const historicSiteKnowledgeSource: KnowledgeSourceAdapter = {
  sourceId: "historicSite",
  label: "Historic Sites",
  canHandle: wantsHistoricSites,
  search(input) {
    const scored = historicSites
      .filter((site) => site.island === input.island)
      .map((site) => ({
        site,
        score: scoreHistoricSite(site, input.query),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, input.limit)
      .map((item) => toGeographicItem(item.site));

    return {
      sourceId: "historicSite",
      label: "Historic Sites",
      items: scored,
    };
  },
};
