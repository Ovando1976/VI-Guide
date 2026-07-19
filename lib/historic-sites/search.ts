import { getHistoricSites } from "./loader";
import type {
  HistoricSearchResult,
  HistoricSite,
  HistoricSiteFilters,
} from "./types";

type SearchDocument = {
  site: HistoricSite;
  fields: {
    name: string;
    aliases: string;
    location: string;
    category: string;
    tags: string;
    nrhpReferenceNumber: string;
  };
  haystack: string;
};

let cachedIndex: readonly SearchDocument[] | null = null;

export function searchHistoricSites(
  query: string,
  filters: HistoricSiteFilters = {}
): HistoricSearchResult[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return getHistoricSites(filters).map((site) => ({
      site,
      score: 0,
      matchedFields: [],
    }));
  }

  const allowedIds = new Set(getHistoricSites(filters).map((site) => site.id));

  return getSearchIndex()
    .filter((document) => allowedIds.has(document.site.id))
    .map((document) => scoreDocument(document, normalizedQuery))
    .filter((result): result is HistoricSearchResult => result !== null)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.site.featured) - Number(a.site.featured) ||
        a.site.name.localeCompare(b.site.name)
    );
}

export function clearHistoricSearchCache(): void {
  cachedIndex = null;
}

function getSearchIndex(): readonly SearchDocument[] {
  if (cachedIndex) return cachedIndex;

  cachedIndex = Object.freeze(
    getHistoricSites().map((site) => {
      const fields = {
        name: normalizeSearchText(site.name),
        aliases: normalizeSearchText([
          ...site.aliases,
          ...site.nrhpOtherNames,
        ].join(" ")),
        location: normalizeSearchText(site.location ?? ""),
        category: normalizeSearchText(site.category),
        tags: normalizeSearchText(site.tags.join(" ")),
        nrhpReferenceNumber: normalizeSearchText(
          site.nrhpReferenceNumber ?? ""
        ),
      };

      return Object.freeze({
        site,
        fields,
        haystack: Object.values(fields).join(" "),
      });
    })
  );

  return cachedIndex;
}

function scoreDocument(
  document: SearchDocument,
  query: string
): HistoricSearchResult | null {
  const matchedFields: HistoricSearchResult["matchedFields"] = [];
  let score = 0;

  if (document.fields.name === query) {
    matchedFields.push("name");
    score += 100;
  } else if (document.fields.name.startsWith(query)) {
    matchedFields.push("name");
    score += 70;
  } else if (document.fields.name.includes(query)) {
    matchedFields.push("name");
    score += 50;
  }

  if (document.fields.aliases.includes(query)) {
    matchedFields.push("alias");
    score += 40;
  }

  if (document.fields.location.includes(query)) {
    matchedFields.push("location");
    score += 20;
  }

  if (document.fields.category.includes(query)) {
    matchedFields.push("category");
    score += 18;
  }

  if (document.fields.tags.includes(query)) {
    matchedFields.push("tag");
    score += 15;
  }

  if (document.fields.nrhpReferenceNumber.includes(query)) {
    matchedFields.push("nrhpReferenceNumber");
    score += 60;
  }

  if (score === 0 && document.haystack.includes(query)) {
    score = 5;
  }

  if (score === 0) return null;

  if (document.site.featured) {
    score += 2;
  }

  return {
    site: document.site,
    score,
    matchedFields,
  };
}

function normalizeSearchText(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}
