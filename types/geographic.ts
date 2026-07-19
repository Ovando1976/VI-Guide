export type GeographicIslandCode = "STT" | "STJ" | "STX" | "UNKNOWN";

export type GeographicFeatureType =
  | "estate"
  | "quarter"
  | "island"
  | "cay"
  | "bay"
  | "harbor"
  | "point"
  | "hill"
  | "gut"
  | "reef"
  | "shoal"
  | "district"
  | "settlement"
  | "road"
  | "landmark"
  | "other";

export type GeographicDictionaryEntry = {
  id: string;
  slug: string;

  canonicalName: string;
  normalizedName: string;

  featureType: GeographicFeatureType;
  island: GeographicIslandCode;
  quarter?: string | null;

  aliases: string[];
  linguisticEquivalents: string[];
  obsoleteNames: string[];
  variantSpellings: string[];

  description: string;
  shortDescription: string;
  rawText: string;

  coordinates?: {
    lat: number;
    lng: number;
    source: "dictionary" | "derived" | "matched";
  };

  altitudeFeet?: number | null;
  areaEnglishSqUnits?: number | null;
  bayWidthYards?: number | null;

  historicalNotes?: string | null;
  scenicNotes?: string | null;
  nameOrigin?: string | null;

  relatedEntryIds: string[];
  relatedEstateGeoids: string[];
  relatedPlaceIds: string[];
  relatedHistoricSiteIds: string[];

  searchTokens: string[];

  source: {
    title: string;
    year: number;
    pageStart?: number | null;
    pageEnd?: number | null;
  };

  parseConfidence: number;
  parseWarnings: string[];
  needsReview: boolean;

  featured?: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GeographicAliasStrength =
  | "canonical"
  | "alias"
  | "variant"
  | "obsolete"
  | "linguistic";

export type GeographicAliasIndex = {
  id: string;
  alias: string;
  normalizedAlias: string;
  entryId: string;
  canonicalName: string;
  featureType: GeographicFeatureType;
  island: GeographicIslandCode;
  strength: GeographicAliasStrength;
  updatedAt: string;
};

export type RawDictionaryEntry = {
  heading: string;
  body: string;
  pageStart: number | null;
  pageEnd: number | null;
};