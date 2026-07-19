export type IslandCode = "stt" | "stj" | "stx";

export type HistoricCategory =
  | "church"
  | "district"
  | "estate"
  | "fort"
  | "landmark"
  | "site"
  | (string & {});

export type CoordinateStatus = "verified" | "representative" | "unresolved";

export type CoordinateGeometry = "point" | "polygon-representative";

export type HistoricSite = {
  id: string;
  slug: string;
  name: string;
  aliases: readonly string[];
  island: IslandCode;
  category: HistoricCategory;
  description: string;
  shortDescription: string;
  heroImage: string;
  images: readonly string[];
  tags: readonly string[];
  featured: boolean;
  imageCount: number;
  sourceImageIds: readonly string[];
  location?: string;
  designation?: string;
  nrhpReferenceNumber?: string;
  nrhpListedDate?: string;
  nrhpCategory?: string;
  nrhpOtherNames: readonly string[];
  coordinateStatus: CoordinateStatus;
  coordinateGeometry?: CoordinateGeometry;
  sourceUrls: readonly string[];
  createdAt?: string;
  updatedAt?: string;
};

export type HistoricSiteFilters = {
  island?: IslandCode;
  category?: HistoricCategory;
  coordinateStatus?: CoordinateStatus;
  featured?: boolean;
  nrhpOnly?: boolean;
};

export type HistoricSearchResult = {
  site: HistoricSite;
  score: number;
  matchedFields: Array<
    "name" | "alias" | "location" | "category" | "tag" | "nrhpReferenceNumber"
  >;
};
