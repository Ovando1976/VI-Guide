import type { IslandCode } from "../../types";
import type { GeographicIndexItem } from "../../data/core/geographicIndex";
import { conciergeKnowledgeSources } from "./knowledge";

export type KnowledgeDomain =
  | "all"
  | "estate"
  | "historicSite"
  | "dictionary"
  | "archive"
  | "beach"
  | "business"
  | "event"
  | "parcel"
  | "route";

export type KnowledgeQueryInput = {
  query: string;
  island: IslandCode;
  contextTitle?: string;
  limit?: number;
  domains?: KnowledgeDomain[];
};

export type KnowledgeBucket = {
  domain: KnowledgeDomain;
  label: string;
  items: GeographicIndexItem[];
};

export type KnowledgeResult = {
  items: GeographicIndexItem[];
  top?: GeographicIndexItem;
  buckets: KnowledgeBucket[];
  detectedDomains: KnowledgeDomain[];
  confidence: number;
  summary: string;
};

const DOMAIN_LABELS: Record<KnowledgeDomain, string> = {
  all: "All",
  estate: "Estates",
  historicSite: "Historic Sites",
  dictionary: "Dictionary",
  archive: "Archives",
  beach: "Beaches",
  business: "Businesses",
  event: "Events",
  parcel: "Parcels",
  route: "Routes",
};


function normalizeKnowledgeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/&/g, " and ")
    .replace(/\bft\.?\b/g, "fort")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rankKnowledgeItem(
  item: GeographicIndexItem,
  query: string,
  detectedDomains: KnowledgeDomain[],
) {
  const q = normalizeKnowledgeText(query);
  const name = normalizeKnowledgeText(item.name || "");
  const source = item.source || "";
  const type = normalizeKnowledgeText(item.type || item.category || "");
  const description = normalizeKnowledgeText(item.description || "");
  const searchText = normalizeKnowledgeText(String(item.searchText || ""));
  const tags = Array.isArray(item.tags) ? item.tags.map((tag) => normalizeKnowledgeText(String(tag))) : [];

  let score = 0;

  if (name === q) score += 200;
  if (name.includes(q) || q.includes(name)) score += 130;
  if (searchText.includes(q)) score += 55;
  if (description.includes(q)) score += 35;
  if (type.includes(q)) score += 25;
  if (tags.some((tag) => tag === q || tag.includes(q) || q.includes(tag))) score += 30;

  for (const token of q.split(" ").filter((part) => part.length > 2)) {
    if (name.includes(token)) score += 18;
    if (searchText.includes(token)) score += 6;
    if (description.includes(token)) score += 6;
    if (tags.some((tag) => tag.includes(token))) score += 8;
  }

  const visitorHistoricQuery =
    /(visit|tour|show|open|where|near|nearby|historic site|landmark|museum|fort|church|synagogue|plantation|ruins|whim|annaberg)/i.test(query);

  const archiveResearchQuery =
    /(archive|record|source|document|citation|deed|census|map|nara|danish|moravian|research)/i.test(query);

  const estatePropertyQuery =
    /(estate|property|parcel|quarter|boundary|address|tax|zoning)/i.test(query);

  if (visitorHistoricQuery && !archiveResearchQuery && source === "historicSite") score += 110;
  if (archiveResearchQuery && source === "archive") score += 1000;
  if (estatePropertyQuery && source === "estate") score += 90;

  if (detectedDomains.includes("historicSite") && source === "historicSite") score += 75;
  if (detectedDomains.includes("estate") && source === "estate") score += 55;
  if (detectedDomains.includes("beach") && source === "beach") score += 55;
  if (detectedDomains.includes("dictionary") && source === "dictionary") score += 35;
  if (detectedDomains.includes("archive") && source === "archive") score += 35;

  if (visitorHistoricQuery && source === "archive") score -= 25;
  if (visitorHistoricQuery && source === "dictionary") score -= 90;
  if (archiveResearchQuery && source === "historicSite") score -= 250;
  if (archiveResearchQuery && source === "estate") score -= 350;
  if (visitorHistoricQuery && source === "dictionary") score -= 15;

  if (item.coordinates) score += 250;

  return score;
}


function uniqueAndRankItems(
  items: GeographicIndexItem[],
  query: string,
  detectedDomains: KnowledgeDomain[],
  limit: number,
) {
  const q = normalizeKnowledgeText(query);

  const ranked = items
    .map((item) => {
      let score = rankKnowledgeItem(item, query, detectedDomains);

      const name = normalizeKnowledgeText(
        item.name || item.displayName || item.id,
      );

      if (name === q) score += 500;
      if (item.coordinates) score += 300;

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => {
      const scoreDiff = b.score - a.score;
      if (scoreDiff !== 0) return scoreDiff;

      const aExact =
        normalizeKnowledgeText(a.item.name || "") === q ? 1 : 0;
      const bExact =
        normalizeKnowledgeText(b.item.name || "") === q ? 1 : 0;

      if (aExact !== bExact) return bExact - aExact;

      const aCoords = a.item.coordinates ? 1 : 0;
      const bCoords = b.item.coordinates ? 1 : 0;

      if (aCoords !== bCoords) return bCoords - aCoords;

      return String(a.item.id || "").localeCompare(
        String(b.item.id || ""),
      );
    });

  const seen = new Set<string>();

  return ranked
    .filter(({ item }) => {
      const name = normalizeKnowledgeText(
        item.name || item.displayName || item.id,
      );
      const source = String(item.source || "");
      const island = String(item.island || "");

      const key =
        source === "dictionary"
          ? `dictionary:${island || "unknown"}:${name}`
          : `${source}:${island}:${name}`;

      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit)
    .map(({ item }) => item);
}


function detectDomains(query: string): KnowledgeDomain[] {
  const text = query.toLowerCase();
  const domains = new Set<KnowledgeDomain>();

  if (/(estate|plantation|quarter|property|land)/.test(text)) domains.add("estate");
  if (/(historic|history|fort|church|archive|danish|moravian|cemetery|ruin)/.test(text)) {
    domains.add("historicSite");
    domains.add("archive");
    domains.add("dictionary");
  }
  if (/(dictionary|meaning|what is|define|explain)/.test(text)) domains.add("dictionary");
  if (/(beach|bay|snorkel|swim|sand|reef)/.test(text)) domains.add("beach");
  if (/(business|restaurant|food|contractor|merchant|shop|service)/.test(text)) {
    domains.add("business");
  }
  if (/(event|tonight|today|weekend|festival|concert|calendar)/.test(text)) {
    domains.add("event");
  }
  if (/(parcel|address|lot|zoning|property line|tax)/.test(text)) domains.add("parcel");
  if (/(route|ride|taxi|drive|directions|pickup|drop off|dropoff|ferry|airport)/.test(text)) {
    domains.add("route");
  }

  return domains.size > 0 ? [...domains] : ["all"];
}

function itemDomain(item: GeographicIndexItem): KnowledgeDomain {
  if (item.source === "estate") return "estate";
  if (item.source === "historicSite") return "historicSite";
  if (item.source === "archive") return "archive";
  if (item.source === "dictionary") return "dictionary";
  if (item.source === "beach") return "beach";
  return "all";
}

function domainAllowed(item: GeographicIndexItem, domains?: KnowledgeDomain[]) {
  if (!domains || domains.length === 0 || domains.includes("all")) return true;
  const domain = itemDomain(item);
  return domains.includes(domain);
}

function bucketize(items: GeographicIndexItem[]): KnowledgeBucket[] {
  const groups = new Map<KnowledgeDomain, GeographicIndexItem[]>();

  for (const item of items) {
    const domain = itemDomain(item);
    const list = groups.get(domain) || [];
    list.push(item);
    groups.set(domain, list);
  }

  return [...groups.entries()].map(([domain, bucketItems]) => ({
    domain,
    label: DOMAIN_LABELS[domain],
    items: bucketItems,
  }));
}

function summarize(input: {
  items: GeographicIndexItem[];
  buckets: KnowledgeBucket[];
  detectedDomains: KnowledgeDomain[];
}) {
  const { items, buckets, detectedDomains } = input;

  if (items.length === 0) {
    return "No strong VI Guide match found yet.";
  }

  const bucketText = buckets
    .slice(0, 5)
    .map((bucket) => `${bucket.items.length} ${bucket.label}`)
    .join(", ");

  const domainText = detectedDomains.includes("all")
    ? "general island knowledge"
    : detectedDomains.map((domain) => DOMAIN_LABELS[domain]).join(", ");

  return `Searched ${domainText}. Found ${items.length} VI Guide signal${
    items.length === 1 ? "" : "s"
  }${bucketText ? ` across ${bucketText}` : ""}.`;
}

export function queryConciergeKnowledge(input: KnowledgeQueryInput): KnowledgeResult {
  const searchQuery = [input.query, input.contextTitle].filter(Boolean).join(" ");
  const detectedDomains = input.domains?.length ? input.domains : detectDomains(searchQuery);

  const sourceInput = {
    query: searchQuery,
    island: input.island,
    contextTitle: input.contextTitle,
    limit: Math.max(input.limit || 12, 20),
    detectedDomains,
  };

  const sourceResults = conciergeKnowledgeSources
    .filter((source) => source.canHandle(sourceInput))
    .map((source) => source.search(sourceInput));

  const raw = sourceResults.flatMap((result) => result.items);

  const filtered = raw.filter((item) => domainAllowed(item, detectedDomains));

  const items = uniqueAndRankItems(
    filtered.length > 0 ? filtered : raw,
    searchQuery,
    detectedDomains,
    input.limit || 10,
  );

  const fallbackItems = items.length > 0 ? items : raw.slice(0, input.limit || 10);

  const buckets = bucketize(fallbackItems);

  return {
    items: fallbackItems,
    top: fallbackItems[0],
    buckets,
    detectedDomains,
    confidence: fallbackItems.length > 0 ? 0.86 : 0.35,
    summary: summarize({
      items: fallbackItems,
      buckets,
      detectedDomains,
    }),
  };
}
