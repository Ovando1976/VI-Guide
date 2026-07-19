import type {
  EstateRecord,
  EstateFeature,
  EstateCollection,
  IslandCode,
  EstateDescription,
  EstateDescriptionConfidence,
  EstateDescriptionSource,
} from "@/types/usvi";

type GeoPointLike =
  | { lat: number; lng: number }
  | { latitude: number; longitude: number };

export type FirestoreEstateDoc = {
  geoid?: string;
  baseName?: string;
  basename?: string;
  fullName?: string;
  name?: string;
  normalizedName?: string;
  normalizedBasename?: string;
  estateCode?: string | null;
  island?: IslandCode | string | null;
  islandCode?: string | null;
  islandLabel?: string | null;
  county?: string | null;
  countyCode?: string | null;
  centroid?: GeoPointLike | null;
  internalPoint?: GeoPointLike | null;
  marker?: GeoPointLike | null;
  location?: GeoPointLike | null;
  geometry?: unknown | null;
  geometryJson?: string | null;
  aliases?: string[];
  historicalAliases?: string[];
  historicalNotes?: string[];
  sources?: string[];
  searchTerms?: string[];
  searchTokens?: string[];
  searchText?: string;
  descriptionShort?: string | null;
  descriptionLong?: string | null;
  descriptionSource?: EstateDescriptionSource;
  descriptionSourcePage?: number | null;
  descriptionSourceEntry?: string | null;
  descriptionConfidence?: EstateDescriptionConfidence;
  rawDictionaryEntry?: string | null;
};

export const ISLAND_META: Record<
  IslandCode,
  {
    name: string;
    heroTitle: string;
    heroSubtitle: string;
    center: [number, number];
    zoom: number;
    countyCode: string;
    pricingMultiplier: number;
  }
> = {
  stt: {
    name: "St. Thomas",
    heroTitle: "Charlotte Amalie Authority.",
    heroSubtitle: "Official Territory Registry",
    center: [18.3434, -64.9313],
    zoom: 12,
    countyCode: "030",
    pricingMultiplier: 1.2,
  },
  stj: {
    name: "St. John",
    heroTitle: "Cruz Bay Authority.",
    heroSubtitle: "Protected estates, coves, and district geography",
    center: [18.3333, -64.7938],
    zoom: 12,
    countyCode: "020",
    pricingMultiplier: 1.5,
  },
  stx: {
    name: "St. Croix",
    heroTitle: "Christiansted Authority.",
    heroSubtitle: "Historic estates and territory-scale routing",
    center: [17.7246, -64.7332],
    zoom: 11,
    countyCode: "010",
    pricingMultiplier: 1.0,
  },
};

export function countyToIsland(county: string | null | undefined): IslandCode {
  if (String(county ?? "").trim() === "030") return "stt";
  if (String(county ?? "").trim() === "020") return "stj";
  return "stx";
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeSearchText(value: string): string {
  return normalizeWhitespace(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[.,;:()[\]{}!?'"`“”’]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isIslandCode(value: unknown): value is IslandCode {
  return value === "stt" || value === "stj" || value === "stx";
}

function inferIslandFromDoc(doc: Partial<FirestoreEstateDoc>): IslandCode {
  if (isIslandCode(doc.island)) return doc.island;

  const islandCode = String(doc.islandCode ?? "")
    .trim()
    .toLowerCase();
  if (isIslandCode(islandCode)) return islandCode;
  if (islandCode === "stx" || islandCode === "st. croix") return "stx";
  if (islandCode === "stt" || islandCode === "st. thomas") return "stt";
  if (islandCode === "stj" || islandCode === "st. john") return "stj";

  const county = String(doc.county ?? doc.countyCode ?? "").trim();
  return countyToIsland(county);
}

function parsePoint(value: unknown): { lat: number; lng: number } | null {
  if (!value || typeof value !== "object") return null;

  const maybeLatLng = value as { lat?: unknown; lng?: unknown };
  if (
    typeof maybeLatLng.lat === "number" &&
    typeof maybeLatLng.lng === "number"
  ) {
    return { lat: maybeLatLng.lat, lng: maybeLatLng.lng };
  }

  const maybeLatitudeLongitude = value as {
    latitude?: unknown;
    longitude?: unknown;
  };
  if (
    typeof maybeLatitudeLongitude.latitude === "number" &&
    typeof maybeLatitudeLongitude.longitude === "number"
  ) {
    return {
      lat: maybeLatitudeLongitude.latitude,
      lng: maybeLatitudeLongitude.longitude,
    };
  }

  return null;
}

function isValidPolygonCoordinates(value: unknown): value is number[][][] {
  return (
    Array.isArray(value) &&
    value.every(
      (ring) =>
        Array.isArray(ring) &&
        ring.every(
          (pair) =>
            Array.isArray(pair) &&
            pair.length >= 2 &&
            typeof pair[0] === "number" &&
            typeof pair[1] === "number"
        )
    )
  );
}

function isValidMultiPolygonCoordinates(
  value: unknown
): value is number[][][][] {
  return (
    Array.isArray(value) &&
    value.every((polygon) => isValidPolygonCoordinates(polygon))
  );
}

function parseGeometry(
  value: unknown
): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  if (!value || typeof value !== "object") return null;

  const maybe = value as {
    type?: unknown;
    coordinates?: unknown;
  };

  if (
    maybe.type === "Polygon" &&
    isValidPolygonCoordinates(maybe.coordinates)
  ) {
    return {
      type: "Polygon",
      coordinates: maybe.coordinates,
    };
  }

  if (
    maybe.type === "MultiPolygon" &&
    isValidMultiPolygonCoordinates(maybe.coordinates)
  ) {
    return {
      type: "MultiPolygon",
      coordinates: maybe.coordinates,
    };
  }

  return null;
}

function parseGeometryFromDoc(
  doc: Partial<FirestoreEstateDoc>
): GeoJSON.Polygon | GeoJSON.MultiPolygon | null {
  const direct = parseGeometry(doc.geometry);
  if (direct) return direct;

  if (typeof doc.geometryJson === "string" && doc.geometryJson.trim()) {
    try {
      const parsed = JSON.parse(doc.geometryJson);
      return parseGeometry(parsed);
    } catch {
      return null;
    }
  }

  return null;
}

function buildEstateAliases(doc: Partial<FirestoreEstateDoc>): string[] {
  const raw = [
    doc.baseName,
    doc.basename,
    doc.fullName,
    doc.name,
    doc.normalizedName,
    doc.normalizedBasename,
    doc.estateCode,
    ...(Array.isArray(doc.aliases) ? doc.aliases : []),
    ...(Array.isArray(doc.historicalAliases) ? doc.historicalAliases : []),
    ...(Array.isArray(doc.searchTerms) ? doc.searchTerms : []),
    ...(Array.isArray(doc.searchTokens) ? doc.searchTokens : []),
  ]
    .map((value) => String(value ?? "").trim())
    .filter(Boolean);

  return [...new Set(raw)].sort((a, b) => a.localeCompare(b));
}

function emptyDescription(): EstateDescription {
  return {
    short: null,
    long: null,
    source: null,
    sourcePage: null,
    sourceEntry: null,
    confidence: null,
    rawEntry: null,
  };
}

function normalizeDescriptionFromDoc(
  doc: Partial<FirestoreEstateDoc>
): EstateDescription {
  return {
    short: normalizeNullableText(doc.descriptionShort),
    long: normalizeNullableText(doc.descriptionLong),
    source: doc.descriptionSource ?? null,
    sourcePage:
      typeof doc.descriptionSourcePage === "number"
        ? doc.descriptionSourcePage
        : null,
    sourceEntry: normalizeNullableText(doc.descriptionSourceEntry),
    confidence: doc.descriptionConfidence ?? null,
    rawEntry: normalizeNullableText(doc.rawDictionaryEntry),
  };
}

function normalizeNullableText(value: unknown): string | null {
  const text = String(value ?? "").trim();
  return text ? normalizeWhitespace(text) : null;
}

export function normalizeEstate(feature: EstateFeature): EstateRecord {
  const p = feature.properties ?? {};

  const baseName = String(p.BASENAME ?? "").trim();
  const fullName = String(p.NAME ?? baseName).trim();
  const county = String(p.COUNTY ?? "").trim();
  const island = countyToIsland(county);

  return {
    id: String(p.GEOID ?? p.ESTATE ?? crypto.randomUUID()),
    geoid: String(p.GEOID ?? ""),
    estateCode: String(p.ESTATE ?? ""),
    baseName,
    fullName,
    county,
    island,
    centroid: {
      lat: Number(p.CENTLAT ?? 0),
      lng: Number(p.CENTLON ?? 0),
    },
    internalPoint: {
      lat: Number(p.INTPTLAT ?? 0),
      lng: Number(p.INTPTLON ?? 0),
    },
    geometry: feature.geometry,
    description: emptyDescription(),
  };
}

export function normalizeEstateCollection(
  data: EstateCollection
): EstateRecord[] {
  return (data.features ?? [])
    .map(normalizeEstate)
    .filter(
      (estate) =>
        estate.baseName &&
        estate.geometry &&
        (estate.geometry.type === "Polygon" ||
          estate.geometry.type === "MultiPolygon")
    );
}

export function normalizeFirestoreEstate(
  doc: Partial<FirestoreEstateDoc>
): EstateRecord | null {
  const geoid = String(doc.geoid ?? "").trim();
  const baseName = normalizeWhitespace(
    String(doc.baseName ?? doc.basename ?? "").trim()
  );
  const fullName = normalizeWhitespace(
    String(doc.fullName ?? doc.name ?? baseName).trim()
  );
  const county = String(doc.county ?? doc.countyCode ?? "").trim();
  const estateCode =
    doc.estateCode === null || doc.estateCode === undefined
      ? ""
      : String(doc.estateCode).trim();

  if (!geoid || !baseName) return null;

  const geometry = parseGeometryFromDoc(doc);
  if (!geometry) return null;

  const centroid = parsePoint(doc.centroid) ??
    parsePoint(doc.location) ??
    parsePoint(doc.marker) ?? { lat: 0, lng: 0 };

  const internalPoint =
    parsePoint(doc.internalPoint) ??
    parsePoint(doc.marker) ??
    parsePoint(doc.location) ??
    centroid;

  return {
    id: geoid,
    geoid,
    estateCode,
    baseName,
    fullName,
    county,
    island: inferIslandFromDoc(doc),
    centroid,
    internalPoint,
    geometry,
    description: normalizeDescriptionFromDoc(doc),
  };
}

export function normalizeFirestoreEstateCollection(
  docs: Partial<FirestoreEstateDoc>[]
): EstateRecord[] {
  return docs
    .map(normalizeFirestoreEstate)
    .filter((estate): estate is EstateRecord => estate !== null)
    .sort((a, b) => a.baseName.localeCompare(b.baseName));
}

export function searchEstates(
  estates: EstateRecord[],
  query: string,
  island: IslandCode
) {
  const q = normalizeSearchText(query);

  return estates
    .filter((estate) => estate.island === island)
    .filter((estate) => {
      if (!q) return true;

      const haystack = [
        estate.baseName,
        estate.fullName,
        estate.geoid,
        estate.estateCode,
        estate.description.short ?? "",
        estate.description.long ?? "",
      ]
        .filter(Boolean)
        .map((value) => normalizeSearchText(value))
        .join(" ");

      return haystack.includes(q);
    })
    .sort((a, b) => a.baseName.localeCompare(b.baseName));
}


export function debugFirestoreEstateDoc(doc: Partial<FirestoreEstateDoc>) {
  return {
    geoid: doc.geoid,
    baseName: doc.baseName ?? doc.basename,
    hasGeometry: Boolean(doc.geometry),
    hasGeometryJson: Boolean(doc.geometryJson),
    parsedGeometryType: parseGeometryFromDoc(doc)?.type ?? null,
    island: doc.island,
    county: doc.county ?? doc.countyCode,
    aliases: buildEstateAliases(doc),
    descriptionShort: normalizeNullableText(doc.descriptionShort),
    descriptionLong: normalizeNullableText(doc.descriptionLong),
    descriptionSource: doc.descriptionSource ?? null,
    descriptionSourcePage:
      typeof doc.descriptionSourcePage === "number"
        ? doc.descriptionSourcePage
        : null,
    descriptionSourceEntry: normalizeNullableText(doc.descriptionSourceEntry),
    descriptionConfidence: doc.descriptionConfidence ?? null,
    hasRawDictionaryEntry: Boolean(
      normalizeNullableText(doc.rawDictionaryEntry)
    ),
  };
}
