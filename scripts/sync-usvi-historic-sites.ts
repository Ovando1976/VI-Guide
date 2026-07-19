import fs from "node:fs";
import path from "node:path";

/**
 * Synchronize the public USVI National Register of Historic Places inventory.
 *
 * Sources:
 * - Current NPS National Register listed-properties CSV
 * - NPS Cultural Resources GIS point and polygon services
 *
 * Policy:
 * - Only public, unrestricted records are imported.
 * - Coordinates are never invented.
 * - Point geometry is treated as verified.
 * - Polygon geometry receives a representative bounding-box center and is
 *   marked as representative rather than exact.
 * - Existing locally curated non-NRHP records are preserved.
 *
 * Usage:
 *   npx tsx scripts/sync-usvi-historic-sites.ts
 *   npx tsx scripts/sync-usvi-historic-sites.ts --apply
 *   npx tsx scripts/sync-usvi-historic-sites.ts --debug
 */

type IslandCode = "stt" | "stj" | "stx";

type ExistingHistoricSite = {
  id: string;
  slug?: string;
  name: string;
  aliases?: string[];
  island: IslandCode;
  category?: string;
  description?: string;
  shortDescription?: string;
  heroImage?: string;
  images?: string[];
  tags?: string[];
  featured?: boolean;
  imageCount?: number;
  sourceImageIds?: string[];
  location?: string;
  designation?: string;
  nrhpReferenceNumber?: string;
  nrhpListedDate?: string;
  nrhpCategory?: string;
  nrhpOtherNames?: string[];
  coordinateStatus?: "verified" | "representative" | "unresolved";
  coordinateGeometry?: "point" | "polygon-representative";
  sourceUrls?: string[];
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

type CoordinateRecord = {
  lat: number;
  lng: number;
  provider: "google-places" | "manual" | "source-data" | "nps-nrhp";
  placeId?: string;
  formattedAddress?: string;
  matchedName?: string;
  confidence: number;
  resolvedAt: string;
  sourceUrl?: string;
  geometryType?: "point" | "polygon-representative";
  coordinateStatus?: "verified" | "representative";
  nrhpReferenceNumber?: string;
};

type CsvRow = Record<string, string>;

type ArcGisPointGeometry = {
  type: "Point";
  coordinates: [number, number];
};

type ArcGisPolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

type ArcGisMultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

type ArcGisGeometry =
  | ArcGisPointGeometry
  | ArcGisPolygonGeometry
  | ArcGisMultiPolygonGeometry
  | null;

type ArcGisFeature = {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: ArcGisGeometry;
};

type ArcGisCollection = {
  type: "FeatureCollection";
  features: ArcGisFeature[];
};

type ArcGisErrorResponse = {
  error?: {
    code?: number;
    message?: string;
    details?: string[];
  };
};

type OfficialListing = {
  refNumber: string;
  name: string;
  city: string;
  county: string;
  address: string;
  listedDate: string;
  category: string;
  otherNames: string[];
  restricted: boolean;
  externalLink?: string;
};

type SpatialMatch = {
  refNumber: string;
  name: string;
  aliases: string[];
  lat: number;
  lng: number;
  geometryType: "point" | "polygon-representative";
  coordinateStatus: "verified" | "representative";
  boundaryType?: string;
  source?: string;
};

type UnresolvedListing = {
  refNumber: string;
  name: string;
  reason: string;
};

type HistoricAudit = {
  generatedAt: string;
  sources: {
    listingsCsv: string;
    pointLayer: string;
    polygonLayer: string;
  };
  counts: {
    officialPublicListings: number;
    generatedOfficialRecords: number;
    curatedNonNrhpRecordsPreserved: number;
    totalHistoricRecords: number;
    pointLayerFeatures: number;
    polygonLayerFeatures: number;
    uniqueSpatialMatches: number;
    exactPointCoordinates: number;
    representativePolygonCoordinates: number;
    unresolvedOfficialListings: number;
  };
  unresolved: UnresolvedListing[];
};

const ROOT = process.cwd();
const APPLY = process.argv.includes("--apply");
const DEBUG = process.argv.includes("--debug");

const HISTORIC_PATH = path.join(
  ROOT,
  "data/travel-knowledge/historic-sites.json"
);
const COORDINATES_PATH = path.join(ROOT, "data/territory-coordinates.json");
const AUDIT_JSON_PATH = path.join(
  ROOT,
  "data/generated/usvi-historic-sites-audit.json"
);
const AUDIT_MD_PATH = path.join(ROOT, "reports/usvi-historic-sites-audit.md");

const NPS_DATABASE_PAGE =
  "https://www.nps.gov/subjects/nationalregister/database-research.htm";

const NRHP_MAP_SERVICE =
  "https://mapservices.nps.gov/arcgis/rest/services/cultural_resources/nrhp_locations/MapServer";

const USVI_ENVELOPE = {
  minLng: -65.2,
  minLat: 17.55,
  maxLng: -64.45,
  maxLat: 18.5,
} as const;

async function main(): Promise<void> {
  const rawExistingSites = readJson<ExistingHistoricSite[]>(HISTORIC_PATH, []);

  assertUniqueHistoricSiteIds(rawExistingSites, "Input historic-sites.json");

  const existingSites = rawExistingSites;
  const existingCoordinates = readJson<Record<string, CoordinateRecord>>(
    COORDINATES_PATH,
    {}
  );

  const coordinateRegistry = removeGeneratedNpsCoordinates(existingCoordinates);

  console.log("Discovering the current NPS National Register dataset...");

  const csvUrl = await discoverCurrentCsvUrl();

  console.log(`NPS listings CSV: ${csvUrl}`);

  const [csvText, pointData, polygonData] = await Promise.all([
    fetchText(csvUrl),
    fetchSpatialLayer(0),
    fetchSpatialLayer(1),
  ]);

  const listings = parseCsv(csvText)
    .map(toOfficialListing)
    .filter((item): item is OfficialListing => item !== null)
    .filter((item) => !item.restricted)
    .sort((a, b) => a.name.localeCompare(b.name));

  if (listings.length === 0) {
    throw new Error(
      "Safety stop: the NPS CSV produced zero public USVI listings. No files were written."
    );
  }

  const pointMatches = extractSpatialMatches(pointData, "point");
  const polygonMatches = extractSpatialMatches(
    polygonData,
    "polygon-representative"
  );
  const spatialMatches = [...pointMatches, ...polygonMatches];

  const spatialByRef = buildSpatialReferenceIndex(spatialMatches);
  const spatialByName = buildUniqueSpatialNameIndex(spatialMatches);

  console.log(
    `Spatial features: ${pointData.features.length} point, ${polygonData.features.length} polygon`
  );
  console.log(`Unique spatial matches: ${spatialByRef.size}`);

  if (DEBUG) {
    printSpatialDebug("point", pointData);
    printSpatialDebug("polygon", polygonData);
  }

  const existingByNormalizedName = new Map(
    existingSites.map((site) => [normalize(site.name), site] as const)
  );

  const existingByRef = new Map(
    existingSites
      .map(
        (site) =>
          [normalizeReferenceNumber(site.nrhpReferenceNumber), site] as const
      )
      .filter(([refNumber]) => refNumber.length > 0)
  );

  const now = new Date().toISOString();
  const generatedSites: ExistingHistoricSite[] = [];
  const unresolved: UnresolvedListing[] = [];

  let exactPoints = 0;
  let representativePoints = 0;

  for (const listing of listings) {
    const normalizedRef = normalizeReferenceNumber(listing.refNumber);

    const spatialMatch =
      spatialByRef.get(normalizedRef) ??
      findSpatialMatchByName(spatialByName, listing);

    const island = inferIsland(listing, spatialMatch);

    if (!island) {
      unresolved.push({
        refNumber: listing.refNumber,
        name: listing.name,
        reason:
          "Could not assign a USVI island from official metadata or public geometry",
      });
      continue;
    }

    const prior =
      existingByRef.get(normalizedRef) ??
      findExistingByName(existingByNormalizedName, listing);

    const slug = prior?.slug ?? slugify(listing.name);
    const id = prior?.id ?? slug;
    const category = inferCategory(listing);

    const priorAliases = Array.isArray(prior?.aliases)
      ? (prior?.aliases as string[])
      : [];

    const aliases = unique([...priorAliases, ...listing.otherNames]).filter(
      (alias) => normalize(alias) !== normalize(listing.name)
    );

    const locationLabel = [listing.address, listing.city]
      .filter(Boolean)
      .join(", ");

    const description =
      prior?.description ??
      `${
        listing.name
      } is a public National Register of Historic Places listing in ${islandName(
        island
      )}, U.S. Virgin Islands.`;

    generatedSites.push({
      ...prior,
      id,
      slug,
      name: listing.name,
      aliases,
      island,
      category,
      description,
      shortDescription:
        prior?.shortDescription ??
        `${
          listing.name
        } is a federally recognized historic ${category} in ${islandName(
          island
        )}.`,
      heroImage: prior?.heroImage ?? "/images/historic/placeholder.svg",
      images: prior?.images ?? [],
      tags: unique([
        ...(prior?.tags ?? []),
        category,
        island.toUpperCase(),
        "historic",
        "usvi",
        "nrhp",
      ]),
      featured: prior?.featured ?? false,
      imageCount: prior?.imageCount ?? prior?.images?.length ?? 0,
      sourceImageIds: prior?.sourceImageIds ?? [],
      location: locationLabel || prior?.location,
      designation: "National Register of Historic Places",
      nrhpReferenceNumber: listing.refNumber,
      nrhpListedDate: listing.listedDate || undefined,
      nrhpCategory: listing.category || undefined,
      nrhpOtherNames: aliases,
      coordinateStatus: spatialMatch?.coordinateStatus ?? "unresolved",
      coordinateGeometry: spatialMatch?.geometryType,
      sourceUrls: unique(
        [listing.externalLink, NPS_DATABASE_PAGE, NRHP_MAP_SERVICE].filter(
          (value): value is string => Boolean(value)
        )
      ),
      createdAt: prior?.createdAt ?? now,
      updatedAt: now,
    });

    if (!spatialMatch) {
      unresolved.push({
        refNumber: listing.refNumber,
        name: listing.name,
        reason: "No matching public NPS point or polygon feature was returned",
      });
      continue;
    }

    const coordinateKey = `${island}:${slug}`;
    const existingCoordinate = coordinateRegistry[coordinateKey];

    if (shouldReplaceCoordinate(existingCoordinate, spatialMatch)) {
      coordinateRegistry[coordinateKey] = {
        lat: spatialMatch.lat,
        lng: spatialMatch.lng,
        provider: "nps-nrhp",
        placeId: listing.refNumber,
        formattedAddress: locationLabel || undefined,
        matchedName: listing.name,
        confidence: spatialMatch.geometryType === "point" ? 0.96 : 0.86,
        resolvedAt: now,
        sourceUrl: `${NRHP_MAP_SERVICE}/${
          spatialMatch.geometryType === "point" ? 0 : 1
        }`,
        geometryType: spatialMatch.geometryType,
        coordinateStatus: spatialMatch.coordinateStatus,
        nrhpReferenceNumber: listing.refNumber,
      };
    }

    if (spatialMatch.geometryType === "point") {
      exactPoints += 1;
    } else {
      representativePoints += 1;
    }
  }

  const curatedOnly = existingSites.filter(
    (site) => !normalizeReferenceNumber(site.nrhpReferenceNumber)
  );

  const mergedSites = dedupeSites([...generatedSites, ...curatedOnly]).sort(
    (a, b) => a.name.localeCompare(b.name)
  );

  assertUniqueHistoricSiteIds(mergedSites, "Generated historic-sites catalog");

  const sortedCoordinates = Object.fromEntries(
    Object.entries(coordinateRegistry).sort(([a], [b]) => a.localeCompare(b))
  );

  const audit: HistoricAudit = {
    generatedAt: now,
    sources: {
      listingsCsv: csvUrl,
      pointLayer: `${NRHP_MAP_SERVICE}/0`,
      polygonLayer: `${NRHP_MAP_SERVICE}/1`,
    },
    counts: {
      officialPublicListings: listings.length,
      generatedOfficialRecords: generatedSites.length,
      curatedNonNrhpRecordsPreserved: curatedOnly.length,
      totalHistoricRecords: mergedSites.length,
      pointLayerFeatures: pointData.features.length,
      polygonLayerFeatures: polygonData.features.length,
      uniqueSpatialMatches: spatialByRef.size,
      exactPointCoordinates: exactPoints,
      representativePolygonCoordinates: representativePoints,
      unresolvedOfficialListings: unresolved.length,
    },
    unresolved: unresolved.sort((a, b) => a.name.localeCompare(b.name)),
  };

  validateSynchronizationResult(audit);
  printSummary(audit);

  if (audit.unresolved.length > 0) {
    console.log("\nUnresolved official listings:");

    for (const item of audit.unresolved) {
      console.log(`${item.refNumber} | ${item.name} | ${item.reason}`);
    }
  }

  console.log(APPLY ? "\nMode: APPLY" : "\nMode: DRY RUN");

  if (!APPLY) {
    console.log("Run again with --apply to write the catalog and audit files.");
    return;
  }

  ensureParent(HISTORIC_PATH);
  ensureParent(COORDINATES_PATH);
  ensureParent(AUDIT_JSON_PATH);
  ensureParent(AUDIT_MD_PATH);

  writeJson(HISTORIC_PATH, mergedSites);
  writeJson(COORDINATES_PATH, sortedCoordinates);
  writeJson(AUDIT_JSON_PATH, audit);
  fs.writeFileSync(AUDIT_MD_PATH, renderAuditMarkdown(audit), "utf8");

  console.log(`Updated ${path.relative(ROOT, HISTORIC_PATH)}`);
  console.log(`Updated ${path.relative(ROOT, COORDINATES_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, AUDIT_JSON_PATH)}`);
  console.log(`Wrote ${path.relative(ROOT, AUDIT_MD_PATH)}`);
}

async function discoverCurrentCsvUrl(): Promise<string> {
  const html = await fetchText(NPS_DATABASE_PAGE);

  const absoluteMatch = html.match(
    /https:\/\/www\.nps\.gov\/common\/uploads\/sortable_dataset\/nationalregister\/[^"'<>\s]+\.csv(?:\?[^"'<>\s]+)?/i
  );

  if (absoluteMatch) {
    return decodeHtml(absoluteMatch[0]);
  }

  const relativeMatch = html.match(
    /\/common\/uploads\/sortable_dataset\/nationalregister\/[^"'<>\s]+\.csv(?:\?[^"'<>\s]+)?/i
  );

  if (relativeMatch) {
    return new URL(decodeHtml(relativeMatch[0]), NPS_DATABASE_PAGE).href;
  }

  throw new Error("Could not discover the current National Register CSV URL");
}

async function fetchSpatialLayer(layerId: 0 | 1): Promise<ArcGisCollection> {
  const query = new URL(`${NRHP_MAP_SERVICE}/${layerId}/query`);

  query.searchParams.set("f", "geojson");
  query.searchParams.set("where", "STATUS='Listed'");
  query.searchParams.set(
    "geometry",
    [
      USVI_ENVELOPE.minLng,
      USVI_ENVELOPE.minLat,
      USVI_ENVELOPE.maxLng,
      USVI_ENVELOPE.maxLat,
    ].join(",")
  );
  query.searchParams.set("geometryType", "esriGeometryEnvelope");
  query.searchParams.set("inSR", "4326");
  query.searchParams.set("spatialRel", "esriSpatialRelIntersects");
  query.searchParams.set("returnGeometry", "true");
  query.searchParams.set("outFields", "*");
  query.searchParams.set("outSR", "4326");

  const data = await fetchJson<ArcGisCollection | ArcGisErrorResponse>(
    query.href
  );

  if (isArcGisError(data)) {
    const details = data.error?.details?.join("; ");

    throw new Error(
      [`ArcGIS layer ${layerId} query failed`, data.error?.message, details]
        .filter(Boolean)
        .join(": ")
    );
  }

  if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) {
    throw new Error(
      `ArcGIS layer ${layerId} returned an invalid GeoJSON response`
    );
  }

  return data;
}

function extractSpatialMatches(
  collection: ArcGisCollection,
  expectedType: "point" | "polygon-representative"
): SpatialMatch[] {
  const output: SpatialMatch[] = [];

  for (const feature of collection.features) {
    const properties = feature.properties ?? {};
    const state = normalize(clean(properties.State));
    const status = normalize(clean(properties.STATUS));

    if (
      state &&
      ![
        "vi",
        "virgin-islands",
        "u-s-virgin-islands",
        "us-virgin-islands",
        "united-states-virgin-islands",
      ].includes(state)
    ) {
      continue;
    }

    if (status && status !== "listed") {
      continue;
    }

    const refNumber = normalizeReferenceNumber(
      properties.NRIS_Refnum ?? properties.PROPERTY_ID
    );

    if (!refNumber || !feature.geometry) {
      continue;
    }

    let point: { lat: number; lng: number } | null = null;
    let geometryType: SpatialMatch["geometryType"] = expectedType;

    if (feature.geometry.type === "Point") {
      const [lng, lat] = feature.geometry.coordinates;
      point = validLatLng(lat, lng) ? { lat, lng } : null;
      geometryType = "point";
    } else {
      point = representativePoint(feature.geometry);
      geometryType = "polygon-representative";
    }

    if (!point || !insideUsvi(point.lat, point.lng)) {
      continue;
    }

    output.push({
      refNumber,
      name: clean(properties.RESNAME),
      aliases: splitAliases(clean(properties.MultiName)),
      lat: point.lat,
      lng: point.lng,
      geometryType,
      coordinateStatus:
        geometryType === "point" ? "verified" : "representative",
      boundaryType: clean(properties.BND_TYPE) || undefined,
      source: clean(properties.SOURCE) || undefined,
    });
  }

  return output;
}

function buildSpatialReferenceIndex(
  matches: SpatialMatch[]
): Map<string, SpatialMatch> {
  const index = new Map<string, SpatialMatch>();

  for (const match of matches) {
    const previous = index.get(match.refNumber);

    if (
      !previous ||
      (previous.geometryType === "polygon-representative" &&
        match.geometryType === "point")
    ) {
      index.set(match.refNumber, match);
    }
  }

  return index;
}

function buildUniqueSpatialNameIndex(
  matches: SpatialMatch[]
): Map<string, SpatialMatch> {
  const candidates = new Map<string, SpatialMatch[]>();

  for (const match of matches) {
    for (const name of unique([match.name, ...match.aliases])) {
      const normalizedName = normalize(name);

      if (!normalizedName) continue;

      const existing = candidates.get(normalizedName) ?? [];
      existing.push(match);
      candidates.set(normalizedName, existing);
    }
  }

  const uniqueIndex = new Map<string, SpatialMatch>();

  for (const [name, nameMatches] of candidates) {
    const uniqueReferences = new Set(
      nameMatches.map((match) => match.refNumber)
    );

    if (uniqueReferences.size !== 1) continue;

    const preferred =
      nameMatches.find((match) => match.geometryType === "point") ??
      nameMatches[0];

    if (preferred) uniqueIndex.set(name, preferred);
  }

  return uniqueIndex;
}

function findSpatialMatchByName(
  spatialByName: Map<string, SpatialMatch>,
  listing: OfficialListing
): SpatialMatch | undefined {
  for (const name of [listing.name, ...listing.otherNames]) {
    const match = spatialByName.get(normalize(name));
    if (match) return match;
  }

  return undefined;
}

function representativePoint(
  geometry: ArcGisPolygonGeometry | ArcGisMultiPolygonGeometry
): { lat: number; lng: number } | null {
  const pairs: Array<[number, number]> = [];

  const walk = (value: unknown): void => {
    if (
      Array.isArray(value) &&
      value.length >= 2 &&
      typeof value[0] === "number" &&
      typeof value[1] === "number"
    ) {
      pairs.push([value[0], value[1]]);
      return;
    }

    if (Array.isArray(value)) value.forEach(walk);
  };

  walk(geometry.coordinates);

  if (pairs.length === 0) return null;

  const lngs = pairs.map(([lng]) => lng);
  const lats = pairs.map(([, lat]) => lat);
  const lng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  const lat = (Math.min(...lats) + Math.max(...lats)) / 2;

  return validLatLng(lat, lng) ? { lat, lng } : null;
}

function toOfficialListing(row: CsvRow): OfficialListing | null {
  const state = normalize(
    pick(row, "State", "State/Territory", "State Territory")
  );
  const status = pick(row, "Status");

  const isUsvi = [
    "vi",
    "virgin-islands",
    "u-s-virgin-islands",
    "us-virgin-islands",
    "united-states-virgin-islands",
  ].includes(state);

  if (!isUsvi) return null;
  if (status && !/listed/i.test(status)) return null;

  const refNumber = normalizeReferenceNumber(
    pick(row, "Ref#", "Reference Number", "Ref Number")
  );
  const name = pick(row, "Property Name", "Resource Name");

  if (!refNumber || !name) return null;

  const restrictedValue = pick(row, "Restricted Address", "Restricted");
  const restricted = /^(yes|true|y|1|restricted)$/i.test(
    restrictedValue.trim()
  );

  return {
    refNumber,
    name,
    city: pick(row, "City"),
    county: pick(row, "County"),
    address: pick(row, "Street & Number", "Address"),
    listedDate: pick(row, "Listed Date"),
    category: pick(row, "Category of Property", "Resource Type"),
    otherNames: splitAliases(pick(row, "Other Names")),
    restricted,
    externalLink: pick(row, "External Link") || undefined,
  };
}

function inferIsland(
  listing: OfficialListing,
  spatial?: SpatialMatch
): IslandCode | null {
  if (spatial) {
    if (spatial.lat < 18) return "stx";
    if (spatial.lng > -64.84) return "stj";
    return "stt";
  }

  const haystack = normalize(
    [listing.name, listing.city, listing.county, listing.address].join(" ")
  );

  const stxTerms = [
    "christiansted",
    "frederiksted",
    "st-croix",
    "saint-croix",
    "salt-river",
    "coakley-bay",
    "green-kay",
  ];
  const stjTerms = [
    "cruz-bay",
    "coral-bay",
    "st-john",
    "saint-john",
    "reef-bay",
    "cinnamon-bay",
    "brown-bay",
    "dennis-bay",
    "leinster-bay",
    "hurricane-hole",
    "trunk-bay",
  ];
  const sttTerms = [
    "charlotte-amalie",
    "st-thomas",
    "saint-thomas",
    "hassel-island",
  ];

  if (stxTerms.some((term) => haystack.includes(term))) return "stx";
  if (stjTerms.some((term) => haystack.includes(term))) return "stj";
  if (sttTerms.some((term) => haystack.includes(term))) return "stt";

  return null;
}

function inferCategory(listing: OfficialListing): string {
  const value = normalize(`${listing.category} ${listing.name}`);

  if (value.includes("historic-district") || value.includes("district")) {
    return "district";
  }

  if (value.includes("fort") || value.includes("fortsberg")) {
    return "fort";
  }

  if (
    value.includes("church") ||
    value.includes("synagogue") ||
    value.includes("mission")
  ) {
    return "church";
  }

  if (value.includes("plantation") || value.includes("estate")) {
    return "estate";
  }

  if (value.includes("site")) return "site";
  return "landmark";
}

function findExistingByName(
  index: Map<string, ExistingHistoricSite>,
  listing: OfficialListing
): ExistingHistoricSite | undefined {
  const direct = index.get(normalize(listing.name));
  if (direct) return direct;

  for (const alias of listing.otherNames) {
    const match = index.get(normalize(alias));
    if (match) return match;
  }

  return undefined;
}

function scoreSite(site: ExistingHistoricSite): number {
  return (
    Number(Boolean(site.nrhpReferenceNumber)) +
    Number(Boolean(site.coordinateStatus)) +
    (site.tags?.length ?? 0) +
    (site.aliases?.length ?? 0) +
    (site.images?.length ?? 0) +
    (site.sourceUrls?.length ?? 0)
  );
}

function findDuplicateIds(sites: ExistingHistoricSite[]): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const site of sites) {
    if (seen.has(site.id)) {
      duplicates.add(site.id);
    } else {
      seen.add(site.id);
    }
  }

  return [...duplicates].sort();
}

function assertUniqueHistoricSiteIds(
  sites: ExistingHistoricSite[],
  label: string
): void {
  const duplicates = findDuplicateIds(sites);

  if (duplicates.length === 0) {
    return;
  }

  throw new Error(
    [
      `${label} contains duplicate historic-site ids.`,
      "",
      ...duplicates.map((id) => `  • ${id}`),
    ].join("\n")
  );
}

function dedupeSites(sites: ExistingHistoricSite[]): ExistingHistoricSite[] {
  const result = new Map<string, ExistingHistoricSite>();

  for (const site of sites) {
    const existing = result.get(site.id);

    if (!existing) {
      result.set(site.id, site);
      continue;
    }

    if (scoreSite(site) > scoreSite(existing)) {
      result.set(site.id, site);
    }
  }

  return [...result.values()];
}

function removeGeneratedNpsCoordinates(
  registry: Record<string, CoordinateRecord>
): Record<string, CoordinateRecord> {
  return Object.fromEntries(
    Object.entries(registry).filter(
      ([, record]) => record.provider !== "nps-nrhp"
    )
  );
}

function shouldReplaceCoordinate(
  existing: CoordinateRecord | undefined,
  spatial: SpatialMatch
): boolean {
  if (!existing) return true;
  if (existing.provider === "nps-nrhp") return true;
  if (existing.provider === "manual") return false;

  if (
    existing.coordinateStatus === "verified" &&
    spatial.geometryType === "polygon-representative"
  ) {
    return false;
  }

  return spatial.geometryType === "point";
}

function validateSynchronizationResult(audit: HistoricAudit): void {
  const {
    officialPublicListings,
    generatedOfficialRecords,
    pointLayerFeatures,
    polygonLayerFeatures,
    uniqueSpatialMatches,
  } = audit.counts;

  if (generatedOfficialRecords === 0) {
    throw new Error(
      "Safety stop: no official historic records were generated. No files were written."
    );
  }

  if (generatedOfficialRecords !== officialPublicListings) {
    throw new Error(
      "Safety stop: not every public official listing could be assigned to a USVI island. No files were written."
    );
  }

  if (pointLayerFeatures === 0 && polygonLayerFeatures === 0) {
    throw new Error(
      "Safety stop: both NPS spatial layers returned zero features. No files were written."
    );
  }

  if (uniqueSpatialMatches === 0) {
    throw new Error(
      "Safety stop: NPS spatial data produced zero usable USVI matches. No files were written."
    );
  }
}

function parseCsv(text: string): CsvRow[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(field);
      field = "";
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const headers = (rows.shift() ?? []).map((header) =>
    header.replace(/^\uFEFF/, "").trim()
  );

  return rows.map((values) =>
    Object.fromEntries(
      headers.map((header, index) => [header, values[index]?.trim() ?? ""])
    )
  );
}

function renderAuditMarkdown(audit: HistoricAudit): string {
  const lines = [
    "# USVI Historic Sites Audit",
    "",
    `Generated: ${audit.generatedAt}`,
    "",
    "## Coverage",
    "",
    ...Object.entries(audit.counts).map(
      ([key, value]) => `- ${humanize(key)}: **${value}**`
    ),
    "",
    "## Coordinate policy",
    "",
    "- NPS point features are imported as verified public map coordinates.",
    "- NPS polygon features use a representative bounding-box center and are labeled representative, not exact.",
    "- Restricted records are excluded.",
    "- Records without a matching public NPS spatial feature remain unresolved rather than receiving invented coordinates.",
    "",
    "## Sources",
    "",
    ...Object.entries(audit.sources).map(
      ([key, value]) => `- ${humanize(key)}: ${value}`
    ),
    "",
    "## Unresolved official listings",
    "",
  ];

  if (audit.unresolved.length === 0) {
    lines.push("None.");
  } else {
    lines.push("| Ref # | Property | Reason |", "|---|---|---|");

    for (const item of audit.unresolved) {
      lines.push(
        `| ${escapeMarkdownCell(item.refNumber)} | ${escapeMarkdownCell(
          item.name
        )} | ${escapeMarkdownCell(item.reason)} |`
      );
    }
  }

  return `${lines.join("\n")}\n`;
}

function printSummary(audit: HistoricAudit): void {
  const counts = audit.counts;

  console.log("\nHistoric catalog synchronization complete\n");
  console.log(
    `Official NRHP listings:          ${counts.officialPublicListings}`
  );
  console.log(
    `Verified point coordinates:      ${counts.exactPointCoordinates}`
  );
  console.log(
    `Representative polygons:         ${counts.representativePolygonCoordinates}`
  );
  console.log(
    `Resolved spatial records:        ${
      counts.exactPointCoordinates + counts.representativePolygonCoordinates
    }`
  );
  console.log(
    `Unresolved listings:             ${counts.unresolvedOfficialListings}`
  );
  console.log(
    `Curated local records preserved: ${counts.curatedNonNrhpRecordsPreserved}`
  );
  console.log(
    `Total catalog records:           ${counts.totalHistoricRecords}`
  );
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "VI-Guide historic catalog sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GET ${url} failed: ${response.status} ${response.statusText}`
    );
  }

  return response.text();
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      "user-agent": "VI-Guide historic catalog sync/1.0",
    },
  });

  if (!response.ok) {
    throw new Error(
      `GET ${url} failed: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as T;
}

function isArcGisError(
  value: ArcGisCollection | ArcGisErrorResponse
): value is ArcGisErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    Boolean(value.error)
  );
}

function readJson<T>(filePath: string, fallback: T): T {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function writeJson(filePath: string, value: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function ensureParent(filePath: string): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function pick(row: CsvRow, ...names: string[]): string {
  for (const name of names) {
    const direct = row[name];
    if (direct !== undefined) return direct.trim();

    const normalizedName = normalize(name);
    const key = Object.keys(row).find(
      (candidate) => normalize(candidate) === normalizedName
    );

    if (key) return row[key].trim();
  }

  return "";
}

function splitAliases(value: string): string[] {
  return unique(
    value
      .split(/\s*;\s*|\s*\|\s*/g)
      .map((item) => item.trim())
      .filter(Boolean)
  );
}

function slugify(value: string): string {
  return normalize(value);
}

function normalize(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function normalizeReferenceNumber(value: unknown): string {
  return clean(value).replace(/\s+/g, "").toUpperCase();
}

function clean(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function validLatLng(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function insideUsvi(lat: number, lng: number): boolean {
  return (
    lat >= USVI_ENVELOPE.minLat &&
    lat <= USVI_ENVELOPE.maxLat &&
    lng >= USVI_ENVELOPE.minLng &&
    lng <= USVI_ENVELOPE.maxLng
  );
}

function islandName(island: IslandCode): string {
  if (island === "stt") return "St. Thomas";
  if (island === "stj") return "St. John";
  return "St. Croix";
}

function decodeHtml(value: string): string {
  return value.replace(/&amp;/g, "&");
}

function humanize(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[-_]/g, " ")
    .replace(/^./, (char) => char.toUpperCase());
}

function escapeMarkdownCell(value: string): string {
  return value.replace(/\|/g, "\\|").replace(/\r?\n/g, " ");
}

function printSpatialDebug(label: string, collection: ArcGisCollection): void {
  const first = collection.features[0];

  console.log(`\n${label.toUpperCase()} LAYER DEBUG`);
  console.log(`Features: ${collection.features.length}`);

  if (!first) {
    console.log("No example feature returned.");
    return;
  }

  console.log("Property keys:", Object.keys(first.properties).sort());
  console.log("Example properties:", first.properties);
  console.log("Example geometry:", first.geometry?.type ?? "none");
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);

  process.exitCode = 1;
});
