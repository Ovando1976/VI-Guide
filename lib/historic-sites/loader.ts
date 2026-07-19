import historicSitesData from "@/data/travel-knowledge/historic-sites.json";

import type {
  CoordinateGeometry,
  CoordinateStatus,
  HistoricCategory,
  HistoricSite,
  HistoricSiteFilters,
  IslandCode,
} from "./types";
import {
  asRecord,
  optionalBoolean,
  optionalString,
  requiredString,
  stringArray,
} from "@/lib/data-utils/parsing";

const ISLANDS = new Set<IslandCode>(["stt", "stj", "stx"]);
const COORDINATE_STATUSES = new Set<CoordinateStatus>([
  "verified",
  "representative",
  "unresolved",
]);
const COORDINATE_GEOMETRIES = new Set<CoordinateGeometry>([
  "point",
  "polygon-representative",
]);

let cachedSites: readonly HistoricSite[] | null = null;

export function getHistoricSites(
  filters: HistoricSiteFilters = {}
): readonly HistoricSite[] {
  const sites = loadHistoricSites();

  return sites.filter((site) => {
    if (filters.island && site.island !== filters.island) return false;
    if (filters.category && site.category !== filters.category) return false;
    if (
      filters.coordinateStatus &&
      site.coordinateStatus !== filters.coordinateStatus
    ) {
      return false;
    }
    if (
      typeof filters.featured === "boolean" &&
      site.featured !== filters.featured
    ) {
      return false;
    }
    if (filters.nrhpOnly && !site.nrhpReferenceNumber) return false;

    return true;
  });
}

export function getHistoricSiteBySlug(slug: string): HistoricSite | undefined {
  const normalizedSlug = normalizeSlug(slug);

  return loadHistoricSites().find(
    (site) => normalizeSlug(site.slug) === normalizedSlug
  );
}

export function getHistoricSiteById(id: string): HistoricSite | undefined {
  return loadHistoricSites().find((site) => site.id === id);
}

export function getHistoricSiteByNrhpReference(
  referenceNumber: string
): HistoricSite | undefined {
  const normalizedReference = normalizeReferenceNumber(referenceNumber);

  if (!normalizedReference) return undefined;

  return loadHistoricSites().find(
    (site) =>
      normalizeReferenceNumber(site.nrhpReferenceNumber) === normalizedReference
  );
}

export function getHistoricSiteCategories(): readonly HistoricCategory[] {
  return [...new Set(loadHistoricSites().map((site) => site.category))].sort(
    (a, b) => a.localeCompare(b)
  );
}

export function clearHistoricSitesCache(): void {
  cachedSites = null;
}

function loadHistoricSites(): readonly HistoricSite[] {
  if (cachedSites) return cachedSites;

  if (!Array.isArray(historicSitesData)) {
    throw new TypeError(
      "Historic sites catalog must contain a top-level JSON array."
    );
  }

  const ids = new Set<string>();
  const slugs = new Set<string>();
  const sites = historicSitesData.map((value, index) =>
    parseHistoricSite(value, index)
  );

  for (const site of sites) {
    if (ids.has(site.id)) {
      throw new TypeError(`Duplicate historic-site id: ${site.id}`);
    }
    if (slugs.has(site.slug)) {
      throw new TypeError(`Duplicate historic-site slug: ${site.slug}`);
    }

    ids.add(site.id);
    slugs.add(site.slug);
  }

  const frozenSites: readonly HistoricSite[] = Object.freeze(
    sites
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((site) =>
        Object.freeze({
          ...site,
          aliases: Object.freeze([...site.aliases]),
          images: Object.freeze([...site.images]),
          tags: Object.freeze([...site.tags]),
          sourceImageIds: Object.freeze([...site.sourceImageIds]),
          nrhpOtherNames: Object.freeze([...site.nrhpOtherNames]),
          sourceUrls: Object.freeze([...site.sourceUrls]),
        })
      )
  );

  cachedSites = frozenSites;

  return frozenSites;
}

function parseHistoricSite(value: unknown, index: number): HistoricSite {
  const record = asRecord(value, `historicSites[${index}]`);

  const id = requiredString(record.id, `historicSites[${index}].id`);
  const name = requiredString(record.name, `historicSites[${index}].name`);
  const slug = optionalString(record.slug) ?? normalizeSlug(name);
  const island = parseIsland(record.island, index);

  return {
    id,
    slug,
    name,
    aliases: stringArray(record.aliases),
    island,
    category:
      (optionalString(record.category) as HistoricCategory | undefined) ??
      "landmark",
    description:
      optionalString(record.description) ??
      `${name} is a historic place in the U.S. Virgin Islands.`,
    shortDescription:
      optionalString(record.shortDescription) ??
      optionalString(record.description) ??
      `${name} is a historic place in the U.S. Virgin Islands.`,
    heroImage:
      optionalString(record.heroImage) ?? "/images/historic/placeholder.svg",
    images: stringArray(record.images),
    tags: stringArray(record.tags),
    featured: optionalBoolean(record.featured) ?? false,
    imageCount:
      optionalNonNegativeInteger(record.imageCount) ??
      stringArray(record.images).length,
    sourceImageIds: stringArray(record.sourceImageIds),
    location: optionalString(record.location),
    designation: optionalString(record.designation),
    nrhpReferenceNumber: optionalString(record.nrhpReferenceNumber),
    nrhpListedDate: optionalString(record.nrhpListedDate),
    nrhpCategory: optionalString(record.nrhpCategory),
    nrhpOtherNames: stringArray(record.nrhpOtherNames),
    coordinateStatus: parseCoordinateStatus(record.coordinateStatus),
    coordinateGeometry: parseCoordinateGeometry(record.coordinateGeometry),
    sourceUrls: stringArray(record.sourceUrls),
    createdAt: optionalString(record.createdAt),
    updatedAt: optionalString(record.updatedAt),
  };
}

function parseIsland(value: unknown, index: number): IslandCode {
  if (typeof value === "string" && ISLANDS.has(value as IslandCode)) {
    return value as IslandCode;
  }

  throw new TypeError(
    `historicSites[${index}].island must be one of: stt, stj, stx`
  );
}

function parseCoordinateStatus(value: unknown): CoordinateStatus {
  if (
    typeof value === "string" &&
    COORDINATE_STATUSES.has(value as CoordinateStatus)
  ) {
    return value as CoordinateStatus;
  }

  return "unresolved";
}

function parseCoordinateGeometry(
  value: unknown
): CoordinateGeometry | undefined {
  if (
    typeof value === "string" &&
    COORDINATE_GEOMETRIES.has(value as CoordinateGeometry)
  ) {
    return value as CoordinateGeometry;
  }

  return undefined;
}

function optionalNonNegativeInteger(value: unknown): number | undefined {
  return Number.isInteger(value) && Number(value) >= 0
    ? Number(value)
    : undefined;
}

function normalizeSlug(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeReferenceNumber(value: unknown): string {
  return typeof value === "string"
    ? value.replace(/\s+/g, "").toUpperCase()
    : "";
}
